use super::{Emulator, PtyHandle};
use crate::config::config;
use crate::error::{Error, Result};
use crate::protocol::{CreateOptions, SessionInfo, Snapshot};
use crate::session::journal::JournalStore;
use std::collections::{HashMap, VecDeque};
use std::io;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, AtomicU8, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

const INPUT_WRITE_BACKOFF_MIN_MS: u64 = 2;
const INPUT_WRITE_BACKOFF_MAX_MS: u64 = 50;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum SessionLifecycleState {
    Alive = 0,
    Terminating = 1,
    Dead = 2,
}

impl SessionLifecycleState {
    fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Alive,
            1 => Self::Terminating,
            _ => Self::Dead,
        }
    }
}

pub static MANAGER: OnceLock<Manager> = OnceLock::new();

pub fn manager() -> &'static Manager {
    MANAGER
        .get()
        .expect("Manager not initialized; call Manager::new_with_wakeup() first")
}

/// Message sent from reader threads to the main event loop.
#[derive(Debug)]
pub enum ReaderEvent {
    /// Raw PTY output data for a session.
    Data { session: u32, data: Vec<u8> },
    /// The reader thread has exited (EOF or error). The main loop
    /// should wait for the child and broadcast an Exit event.
    Eof { session: u32 },
}

/// Message sent to client subscribers.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum OutputEvent {
    Data {
        session: u32,
        data: Vec<u8>,
    },
    Exit {
        session: u32,
        code: i32,
        signal: Option<i32>,
    },
}

pub struct Session {
    pub id: u32,
    pub session_key: Option<String>,
    pub pty: PtyHandle,
    pub emulator: Mutex<Emulator>,
    pub running: AtomicBool,
    pub lifecycle: AtomicU8,
    pub reader_eof: AtomicBool,
    pub exit_status: Mutex<Option<(i32, Option<i32>)>>,
    pub input_queue: Mutex<VecDeque<Vec<u8>>>,
    pub input_queue_bytes: AtomicUsize,
    pub input_backoff_ms: AtomicU64,
    pub input_backoff_until_ms: AtomicU64,
    pub created_at: SystemTime,
    pub last_attached: AtomicU64, // nanos since epoch
    pub cwd: String,
    pub shell: Option<String>,
}

impl Session {
    pub fn lifecycle_state(&self) -> SessionLifecycleState {
        SessionLifecycleState::from_u8(self.lifecycle.load(Ordering::Relaxed))
    }

    pub fn mark_terminating(&self) {
        self.lifecycle
            .store(SessionLifecycleState::Terminating as u8, Ordering::SeqCst);
    }

    pub fn mark_dead(&self) {
        self.lifecycle
            .store(SessionLifecycleState::Dead as u8, Ordering::SeqCst);
    }

    pub fn try_mark_terminating(&self) -> Result<()> {
        match self.lifecycle.compare_exchange(
            SessionLifecycleState::Alive as u8,
            SessionLifecycleState::Terminating as u8,
            Ordering::SeqCst,
            Ordering::SeqCst,
        ) {
            Ok(_) => Ok(()),
            Err(current) => {
                let state = SessionLifecycleState::from_u8(current);
                match state {
                    SessionLifecycleState::Alive => Ok(()),
                    SessionLifecycleState::Terminating => Err(Error::Session(format!(
                        "session {} is terminating",
                        self.id
                    ))),
                    SessionLifecycleState::Dead => {
                        Err(Error::NotFound(format!("session {}", self.id)))
                    }
                }
            }
        }
    }

    pub fn is_alive(&self) -> bool {
        self.lifecycle_state() == SessionLifecycleState::Alive
            && self.running.load(Ordering::Relaxed)
    }

    pub fn snapshot(&self) -> Snapshot {
        self.emulator.lock().unwrap().snapshot()
    }

    pub fn to_info(&self) -> SessionInfo {
        let created_secs = self
            .created_at
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let last_attached_nanos = self.last_attached.load(Ordering::Relaxed);
        let last_attached_secs = last_attached_nanos / 1_000_000_000;

        SessionInfo {
            id: self.id,
            session_key: self.session_key.clone(),
            pid: self.pty.child_pid,
            pts: self.pty.pts_path.clone(),
            is_alive: self.is_alive(),
            created_at: format!("{}", created_secs),
            last_attached_at: format!("{}", last_attached_secs),
        }
    }
}

/// Central session manager. All methods are synchronous.
pub struct Manager {
    sessions: RwLock<HashMap<u32, Arc<Session>>>,
    key_to_session: RwLock<HashMap<String, u32>>,
    pid_to_session: RwLock<HashMap<i32, u32>>,
    next_id: AtomicU32,
    /// Session subscribers keyed by session -> subscriber id -> sender.
    /// Supports one owner and multiple observers per session.
    session_subscribers:
        RwLock<HashMap<u32, HashMap<u64, std::sync::mpsc::SyncSender<OutputEvent>>>>,
    /// Session owner map: session -> client_id.
    session_owners: RwLock<HashMap<u32, String>>,
    next_subscriber_id: AtomicU64,
    /// Channel from reader threads → main event loop.
    /// The main loop polls the receiver end to drain PTY output.
    reader_tx: std::sync::mpsc::SyncSender<ReaderEvent>,
    reader_rx: Mutex<std::sync::mpsc::Receiver<ReaderEvent>>,
    /// Pipe used by reader threads to wake up the main polling loop.
    /// The reader writes a byte here after sending on the channel.
    wakeup_write_fd: i32,
    journal: Option<JournalStore>,
}

impl Manager {
    /// Create the manager and return (manager, wakeup_read_fd).
    pub fn new_with_wakeup() -> (Self, i32) {
        let (reader_tx, reader_rx) = std::sync::mpsc::sync_channel(256);

        let mut fds = [0i32; 2];
        unsafe { libc::pipe(fds.as_mut_ptr()) };
        // Make both ends non-blocking
        unsafe {
            let flags = libc::fcntl(fds[0], libc::F_GETFL);
            libc::fcntl(fds[0], libc::F_SETFL, flags | libc::O_NONBLOCK);
            let flags = libc::fcntl(fds[1], libc::F_GETFL);
            libc::fcntl(fds[1], libc::F_SETFL, flags | libc::O_NONBLOCK);
        }

        let mgr = Self {
            sessions: RwLock::new(HashMap::new()),
            key_to_session: RwLock::new(HashMap::new()),
            pid_to_session: RwLock::new(HashMap::new()),
            next_id: AtomicU32::new(1),
            session_subscribers: RwLock::new(HashMap::new()),
            session_owners: RwLock::new(HashMap::new()),
            next_subscriber_id: AtomicU64::new(1),
            reader_tx,
            reader_rx: Mutex::new(reader_rx),
            wakeup_write_fd: fds[1],
            journal: JournalStore::open(config().journal_path.clone())
                .map_err(|e| {
                    eprintln!("[journal] failed to open journal store: {}", e);
                    e
                })
                .ok(),
        };

        (mgr, fds[0])
    }

    /// Add a subscriber for a specific session's output/exit events.
    pub fn add_session_subscriber(
        &self,
        session_id: u32,
        tx: std::sync::mpsc::SyncSender<OutputEvent>,
    ) -> Result<u64> {
        if !self.sessions.read().unwrap().contains_key(&session_id) {
            return Err(Error::NotFound(format!("session {}", session_id)));
        }

        let subscriber_id = self.next_subscriber_id.fetch_add(1, Ordering::SeqCst);
        let mut subs = self.session_subscribers.write().unwrap();
        let session_subs = subs.entry(session_id).or_default();
        session_subs.insert(subscriber_id, tx);

        if let Some(session) = self.get(session_id) {
            let now_nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos() as u64;
            session.last_attached.store(now_nanos, Ordering::Relaxed);
            if let Some(journal) = &self.journal {
                journal.touch_attached(session_id, now_nanos / 1_000_000_000);
            }
        }

        Ok(subscriber_id)
    }

    /// Remove a subscriber for a specific session.
    pub fn remove_session_subscriber(&self, session_id: u32, subscriber_id: u64) {
        let mut subs = self.session_subscribers.write().unwrap();
        if let Some(session_subs) = subs.get_mut(&session_id) {
            session_subs.remove(&subscriber_id);
            if session_subs.is_empty() {
                subs.remove(&session_id);
            }
        }
    }

    pub fn ensure_owner(&self, session_id: u32, client_id: &str) {
        let mut owners = self.session_owners.write().unwrap();
        owners
            .entry(session_id)
            .or_insert_with(|| client_id.to_string());
    }

    pub fn claim_owner_if_unset_or_match(&self, session_id: u32, client_id: &str) -> bool {
        let mut owners = self.session_owners.write().unwrap();
        match owners.get(&session_id) {
            Some(owner) => owner == client_id,
            None => {
                owners.insert(session_id, client_id.to_string());
                true
            }
        }
    }

    pub fn release_owner_if_matches(&self, session_id: u32, client_id: &str) {
        let mut owners = self.session_owners.write().unwrap();
        if owners
            .get(&session_id)
            .map(|owner| owner == client_id)
            .unwrap_or(false)
        {
            owners.remove(&session_id);
        }
    }

    /// Create a new PTY session. Spawns a dedicated reader OS thread.
    pub fn create(&self, opts: CreateOptions) -> Result<u32> {
        let cfg = config();

        if self.sessions.read().unwrap().len() >= cfg.max_sessions {
            return Err(Error::LimitReached("max sessions reached".into()));
        }

        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        let cwd = opts.cwd.as_deref().unwrap_or(".");
        let shell = opts.shell.clone();
        let cols = opts.cols.unwrap_or(80);
        let rows = opts.rows.unwrap_or(24);
        validate_terminal_size(cols, rows)?;

        self.spawn_session_with_id(
            id,
            None,
            cwd,
            shell.as_deref(),
            opts.env.as_ref(),
            cols,
            rows,
        )?;

        Ok(id)
    }

    /// Create a new session for `session_key` or return an existing live one.
    pub fn create_or_attach(
        &self,
        session_key: String,
        mut opts: CreateOptions,
    ) -> Result<(u32, bool)> {
        let session_key = normalize_session_key(&session_key)?;

        if let Some(existing_id) = self.find_session_by_key(&session_key) {
            return Ok((existing_id, false));
        }

        if let Some(journal) = &self.journal {
            if let Some(previous) = journal.latest_entry_for_key(&session_key) {
                if opts.cwd.is_none() {
                    opts.cwd = Some(previous.cwd);
                }
                if opts.shell.is_none() {
                    opts.shell = previous.shell;
                }
                if opts.cols.is_none() {
                    opts.cols = Some(previous.cols);
                }
                if opts.rows.is_none() {
                    opts.rows = Some(previous.rows);
                }
            }
        }

        let cfg = config();
        if self.sessions.read().unwrap().len() >= cfg.max_sessions {
            return Err(Error::LimitReached("max sessions reached".into()));
        }

        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let cwd = opts.cwd.as_deref().unwrap_or(".");
        let shell = opts.shell.clone();
        let cols = opts.cols.unwrap_or(80);
        let rows = opts.rows.unwrap_or(24);
        validate_terminal_size(cols, rows)?;

        self.spawn_session_with_id(
            id,
            Some(&session_key),
            cwd,
            shell.as_deref(),
            opts.env.as_ref(),
            cols,
            rows,
        )?;

        Ok((id, true))
    }

    fn find_session_by_key(&self, session_key: &str) -> Option<u32> {
        let maybe_id = self
            .key_to_session
            .read()
            .unwrap()
            .get(session_key)
            .copied();

        let Some(id) = maybe_id else {
            return None;
        };

        if self.sessions.read().unwrap().contains_key(&id) {
            return Some(id);
        }

        self.key_to_session.write().unwrap().remove(session_key);
        None
    }

    fn spawn_session_with_id(
        &self,
        id: u32,
        session_key: Option<&str>,
        cwd: &str,
        shell: Option<&str>,
        env: Option<&HashMap<String, String>>,
        cols: u16,
        rows: u16,
    ) -> Result<Arc<Session>> {
        let cfg = config();
        let pty = PtyHandle::spawn(cwd, shell, env, cols, rows)?;
        let master_fd = pty.master_fd;

        let now = SystemTime::now();
        let now_nanos = now.duration_since(UNIX_EPOCH).unwrap().as_nanos() as u64;
        let session_key_owned = session_key.map(|value| value.to_string());

        let session = Arc::new(Session {
            id,
            session_key: session_key_owned.clone(),
            pty,
            emulator: Mutex::new(Emulator::new(cols, rows, cfg.scrollback_lines)),
            running: AtomicBool::new(true),
            lifecycle: AtomicU8::new(SessionLifecycleState::Alive as u8),
            reader_eof: AtomicBool::new(false),
            exit_status: Mutex::new(None),
            input_queue: Mutex::new(VecDeque::new()),
            input_queue_bytes: AtomicUsize::new(0),
            input_backoff_ms: AtomicU64::new(0),
            input_backoff_until_ms: AtomicU64::new(0),
            created_at: now,
            last_attached: AtomicU64::new(now_nanos),
            cwd: cwd.to_string(),
            shell: shell.map(|s| s.to_string()),
        });

        self.sessions.write().unwrap().insert(id, session.clone());
        self.pid_to_session
            .write()
            .unwrap()
            .insert(session.pty.child_pid, id);

        if let Some(session_key) = session_key_owned.as_ref() {
            self.key_to_session
                .write()
                .unwrap()
                .insert(session_key.clone(), id);
        }

        if let Some(journal) = &self.journal {
            journal.upsert_running(
                id,
                session_key_owned,
                session.pty.child_pid,
                session.pty.pts_path.clone(),
                session.cwd.clone(),
                session.shell.clone(),
                cols,
                rows,
                session
                    .created_at
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
                now_nanos / 1_000_000_000,
            );
        }

        let tx = self.reader_tx.clone();
        let wakeup_fd = self.wakeup_write_fd;
        let session_clone = session.clone();
        std::thread::Builder::new()
            .name(format!("pty-reader-{}", id))
            .spawn(move || {
                reader_thread(id, master_fd, tx, wakeup_fd, &session_clone.running);
            })
            .map_err(|e| Error::Session(format!("failed to spawn reader thread: {}", e)))?;

        Ok(session)
    }

    pub fn get(&self, id: u32) -> Option<Arc<Session>> {
        self.sessions.read().unwrap().get(&id).cloned()
    }

    pub fn list(&self) -> Vec<SessionInfo> {
        self.sessions
            .read()
            .unwrap()
            .values()
            .map(|s| s.to_info())
            .collect()
    }

    pub fn kill(&self, id: u32) -> Result<()> {
        let session = self
            .sessions
            .read()
            .unwrap()
            .get(&id)
            .cloned()
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;
        self.terminate_and_finalize_nonblocking(id, session)
    }

    pub fn kill_all(&self) -> usize {
        let sessions: Vec<(u32, Arc<Session>)> = self
            .sessions
            .read()
            .unwrap()
            .iter()
            .map(|(id, session)| (*id, session.clone()))
            .collect();
        let mut count = 0;

        for (id, session) in sessions {
            if self.terminate_and_finalize_nonblocking(id, session).is_ok() {
                count += 1;
            } else {
                eprintln!("[manager] Failed to terminate session {}", id);
            }
        }

        count
    }

    pub fn signal(&self, id: u32, signal: &str) -> Result<()> {
        let sessions = self.sessions.read().unwrap();
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        if session.lifecycle_state() != SessionLifecycleState::Alive {
            return Err(Error::Session(format!("session {} is terminating", id)));
        }

        let sig = parse_signal(signal)?;
        session.pty.send_signal(sig)?;
        Ok(())
    }

    pub fn resize(&self, id: u32, cols: u16, rows: u16) -> Result<()> {
        validate_terminal_size(cols, rows)?;

        let sessions = self.sessions.read().unwrap();
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        if session.lifecycle_state() != SessionLifecycleState::Alive {
            return Err(Error::Session(format!("session {} is terminating", id)));
        }

        session.pty.resize(cols, rows)?;
        session.emulator.lock().unwrap().resize(cols, rows);
        Ok(())
    }

    pub fn clear_scrollback(&self, id: u32) -> Result<()> {
        let sessions = self.sessions.read().unwrap();
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        if session.lifecycle_state() != SessionLifecycleState::Alive {
            return Err(Error::Session(format!("session {} is terminating", id)));
        }

        session.emulator.lock().unwrap().clear_scrollback();
        Ok(())
    }

    pub fn enqueue_input(&self, id: u32, data: Vec<u8>) -> Result<()> {
        let session = self
            .sessions
            .read()
            .unwrap()
            .get(&id)
            .cloned()
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        if session.lifecycle_state() != SessionLifecycleState::Alive {
            return Err(Error::Session(format!("session {} is terminating", id)));
        }

        let limit = config().input_queue_max_bytes;
        let incoming = data.len();
        let current = session.input_queue_bytes.load(Ordering::Relaxed);
        let next = current.saturating_add(incoming);
        if next > limit {
            return Err(Error::LimitReached(format!(
                "input queue limit exceeded for session {} ({} > {})",
                id, next, limit
            )));
        }

        let mut queue = session.input_queue.lock().unwrap();
        queue.push_back(data);
        session
            .input_queue_bytes
            .store(queue.iter().map(Vec::len).sum(), Ordering::Relaxed);

        Ok(())
    }

    pub fn flush_input_queues(&self) {
        let now_ms = epoch_millis();
        let sessions: Vec<Arc<Session>> = self.sessions.read().unwrap().values().cloned().collect();

        for session in sessions {
            if session.lifecycle_state() != SessionLifecycleState::Alive {
                continue;
            }

            let retry_at = session.input_backoff_until_ms.load(Ordering::Relaxed);
            if retry_at > now_ms {
                continue;
            }

            self.flush_session_input(&session, now_ms);
        }
    }

    fn flush_session_input(&self, session: &Arc<Session>, now_ms: u64) {
        loop {
            if session.lifecycle_state() != SessionLifecycleState::Alive {
                return;
            }

            let mut queue = session.input_queue.lock().unwrap();
            let Some(front) = queue.front_mut() else {
                session.input_queue_bytes.store(0, Ordering::Relaxed);
                session.input_backoff_ms.store(0, Ordering::Relaxed);
                session.input_backoff_until_ms.store(0, Ordering::Relaxed);
                return;
            };

            match session.pty.write(front) {
                Ok(0) => {
                    let backoff = next_backoff_ms(&session);
                    session
                        .input_backoff_until_ms
                        .store(now_ms.saturating_add(backoff), Ordering::Relaxed);
                    return;
                }
                Ok(written) => {
                    if written >= front.len() {
                        let consumed = front.len();
                        queue.pop_front();
                        let remaining = session
                            .input_queue_bytes
                            .load(Ordering::Relaxed)
                            .saturating_sub(consumed);
                        session
                            .input_queue_bytes
                            .store(remaining, Ordering::Relaxed);
                    } else {
                        front.drain(..written);
                        let remaining = session
                            .input_queue_bytes
                            .load(Ordering::Relaxed)
                            .saturating_sub(written);
                        session
                            .input_queue_bytes
                            .store(remaining, Ordering::Relaxed);
                    }

                    session.input_backoff_ms.store(0, Ordering::Relaxed);
                    session.input_backoff_until_ms.store(0, Ordering::Relaxed);
                }
                Err(err) if err.kind() == io::ErrorKind::Interrupted => {
                    continue;
                }
                Err(err)
                    if err.kind() == io::ErrorKind::WouldBlock
                        || err.raw_os_error() == Some(libc::EAGAIN)
                        || err.raw_os_error() == Some(libc::EWOULDBLOCK)
                        || err.raw_os_error() == Some(libc::EIO)
                        || err.raw_os_error() == Some(libc::ENXIO) =>
                {
                    let backoff = next_backoff_ms(&session);
                    session
                        .input_backoff_until_ms
                        .store(now_ms.saturating_add(backoff), Ordering::Relaxed);
                    return;
                }
                Err(err) => {
                    eprintln!(
                        "[manager] Failed writing queued PTY input for session {}: {}",
                        session.id, err
                    );
                    queue.clear();
                    session.input_queue_bytes.store(0, Ordering::Relaxed);
                    session.input_backoff_ms.store(0, Ordering::Relaxed);
                    session.input_backoff_until_ms.store(0, Ordering::Relaxed);
                    return;
                }
            }
        }
    }

    /// Drain all pending reader events from the channel.
    /// Called by the main event loop after the wakeup pipe becomes readable.
    /// Also drains the wakeup pipe.
    pub fn drain_reader_events(&self, wakeup_read_fd: i32) -> Vec<ReaderEvent> {
        // Drain the wakeup pipe so it doesn't keep firing.
        let mut drain_buf = [0u8; 256];
        loop {
            let n = unsafe {
                libc::read(
                    wakeup_read_fd,
                    drain_buf.as_mut_ptr().cast(),
                    drain_buf.len(),
                )
            };
            if n <= 0 {
                break;
            }
        }

        let rx = self.reader_rx.lock().unwrap();
        let mut events = Vec::new();
        while let Ok(event) = rx.try_recv() {
            events.push(event);
        }
        events
    }

    /// Process a batch of reader events: feed emulator, broadcast to subscribers.
    /// Returns a list of (session_id, data) pairs that need to be sent to clients.
    pub fn process_reader_events(&self, events: Vec<ReaderEvent>) -> Vec<(u32, OutputEvent)> {
        // Group data events by session for coalescing.
        let mut session_data: HashMap<u32, Vec<Vec<u8>>> = HashMap::new();
        let mut eof_sessions: Vec<u32> = Vec::new();

        for event in events {
            match event {
                ReaderEvent::Data { session, data } => {
                    session_data.entry(session).or_default().push(data);
                }
                ReaderEvent::Eof { session } => {
                    eof_sessions.push(session);
                }
            }
        }

        let mut output = Vec::new();

        // Process data events: coalesce per-session, feed emulator, broadcast.
        for (session_id, chunks) in session_data {
            // Coalesce all chunks for this session into one.
            let total_len: usize = chunks.iter().map(|c| c.len()).sum();
            let mut coalesced = Vec::with_capacity(total_len);
            for chunk in chunks {
                coalesced.extend_from_slice(&chunk);
            }

            // Feed emulator and drain write-backs.
            if let Some(session) = self.get(session_id) {
                if let Ok(mut emulator) = session.emulator.lock() {
                    emulator.process_bytes(&coalesced);
                    for response in emulator.drain_pty_writes() {
                        let _ = session.pty.write(response.as_bytes());
                    }
                }
            }

            output.push((
                session_id,
                OutputEvent::Data {
                    session: session_id,
                    data: coalesced,
                },
            ));
        }

        // Process EOF events.
        for session_id in eof_sessions {
            if let Some(session) = self.get(session_id) {
                session.running.store(false, Ordering::SeqCst);
                session.mark_terminating();
                session.reader_eof.store(true, Ordering::SeqCst);
                if let Some(exit_event) = self.maybe_finalize_session(session_id) {
                    output.push(exit_event);
                }
            }
        }

        output
    }

    /// Reap all exited children without blocking.
    /// Call this on SIGCHLD and periodically in the main loop.
    pub fn reap_exited_children(&self) -> Vec<(u32, OutputEvent)> {
        let mut output = Vec::new();

        loop {
            let mut status: libc::c_int = 0;
            let pid = unsafe { libc::waitpid(-1, &mut status as *mut libc::c_int, libc::WNOHANG) };

            if pid == 0 {
                break;
            }

            if pid < 0 {
                let err = io::Error::last_os_error();
                if err.kind() == io::ErrorKind::Interrupted {
                    continue;
                }
                break;
            }

            let exit_status = decode_wait_status(status);
            let session_id = self.pid_to_session.read().unwrap().get(&pid).copied();

            if let Some(session_id) = session_id {
                if let Some(session) = self.get(session_id) {
                    session.mark_terminating();
                    *session.exit_status.lock().unwrap() = Some(exit_status);
                    if let Some(exit_event) = self.maybe_finalize_session(session_id) {
                        output.push(exit_event);
                    }
                }
            }
        }

        output
    }

    /// Broadcast an output event to the subscriber for a session (if any).
    pub fn broadcast_event(&self, session_id: u32, event: &OutputEvent) {
        let mut stale = Vec::new();
        {
            let subs = self.session_subscribers.read().unwrap();
            if let Some(session_subs) = subs.get(&session_id) {
                for (subscriber_id, tx) in session_subs {
                    if tx.try_send(event.clone()).is_err() {
                        stale.push(*subscriber_id);
                    }
                }
            }
        }

        if !stale.is_empty() {
            let mut subs = self.session_subscribers.write().unwrap();
            if let Some(session_subs) = subs.get_mut(&session_id) {
                for subscriber_id in stale {
                    session_subs.remove(&subscriber_id);
                }
                if session_subs.is_empty() {
                    subs.remove(&session_id);
                }
            }
        }
    }

    /// Clean up a finished session.
    pub fn finalize(&self, id: u32) {
        let session = self.sessions.write().unwrap().remove(&id);
        self.session_subscribers.write().unwrap().remove(&id);
        self.session_owners.write().unwrap().remove(&id);

        if let Some(sess) = session {
            if let Some(session_key) = &sess.session_key {
                self.key_to_session.write().unwrap().remove(session_key);
            }
            sess.running.store(false, Ordering::SeqCst);
            sess.mark_dead();
            self.pid_to_session
                .write()
                .unwrap()
                .remove(&sess.pty.child_pid);
        }
    }

    fn terminate_nonblocking(&self, session: Arc<Session>) -> Result<()> {
        session.try_mark_terminating()?;

        if let Err(err) = session.pty.send_signal(libc::SIGKILL) {
            // Process may have already exited between lookup and kill.
            if err.raw_os_error() != Some(libc::ESRCH) {
                return Err(err.into());
            }
        }
        session.running.store(false, Ordering::SeqCst);
        Ok(())
    }

    fn terminate_and_finalize_nonblocking(&self, id: u32, session: Arc<Session>) -> Result<()> {
        self.terminate_nonblocking(session)?;

        if let Some(journal) = &self.journal {
            journal.mark_exit(id, 128 + libc::SIGKILL, Some(libc::SIGKILL));
        }

        self.broadcast_event(
            id,
            &OutputEvent::Exit {
                session: id,
                code: 128 + libc::SIGKILL,
                signal: Some(libc::SIGKILL),
            },
        );
        self.finalize(id);
        Ok(())
    }

    fn maybe_finalize_session(&self, session_id: u32) -> Option<(u32, OutputEvent)> {
        let session = self.get(session_id)?;
        if session.lifecycle_state() == SessionLifecycleState::Dead {
            return None;
        }
        if !session.reader_eof.load(Ordering::SeqCst) {
            return None;
        }

        let (code, signal) = (*session.exit_status.lock().unwrap())?;
        if let Some(journal) = &self.journal {
            journal.mark_exit(session_id, code, signal);
        }
        self.finalize(session_id);
        Some((
            session_id,
            OutputEvent::Exit {
                session: session_id,
                code,
                signal,
            },
        ))
    }

    pub fn reconcile_journal(&self) {
        let Some(journal) = &self.journal else {
            return;
        };

        let running = journal.running_entries();
        if running.is_empty() {
            return;
        }

        let mut marked_unrecoverable = 0usize;
        let mut restored = 0usize;

        for entry in running {
            let process_alive = is_pid_alive(entry.pid);
            if process_alive {
                journal.mark_unrecoverable(entry.id, "live_process_recovery_not_supported");
                marked_unrecoverable += 1;
                continue;
            }

            if self.sessions.read().unwrap().contains_key(&entry.id) {
                journal.mark_unrecoverable(entry.id, "session_id_conflict_on_restore");
                marked_unrecoverable += 1;
                continue;
            }

            match self.spawn_session_with_id(
                entry.id,
                entry.session_key.as_deref(),
                &entry.cwd,
                entry.shell.as_deref(),
                None,
                entry.cols,
                entry.rows,
            ) {
                Ok(_) => {
                    self.bump_next_id(entry.id);
                    restored += 1;
                }
                Err(err) => {
                    let reason = format!("cold_restore_failed:{}", err.code());
                    journal.mark_unrecoverable(entry.id, reason);
                    marked_unrecoverable += 1;
                }
            }
        }

        if restored > 0 {
            eprintln!("[journal] reconcile restored {} sessions", restored);
        }

        if marked_unrecoverable > 0 {
            eprintln!(
                "[journal] reconcile marked {} sessions unrecoverable",
                marked_unrecoverable
            );
        }
    }

    fn bump_next_id(&self, restored_id: u32) {
        let mut current = self.next_id.load(Ordering::SeqCst);
        while current <= restored_id {
            match self.next_id.compare_exchange(
                current,
                restored_id + 1,
                Ordering::SeqCst,
                Ordering::SeqCst,
            ) {
                Ok(_) => break,
                Err(next) => current = next,
            }
        }
    }
}

fn is_pid_alive(pid: i32) -> bool {
    if pid <= 0 {
        return false;
    }
    let rc = unsafe { libc::kill(pid, 0) };
    if rc == 0 {
        return true;
    }
    let err = io::Error::last_os_error();
    err.raw_os_error() != Some(libc::ESRCH)
}

fn normalize_session_key(raw: &str) -> Result<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(Error::InvalidArgument(
            "session_key must be non-empty".into(),
        ));
    }
    if trimmed.len() > 256 {
        return Err(Error::InvalidArgument(
            "session_key must be <= 256 characters".into(),
        ));
    }
    Ok(trimmed.to_string())
}

/// Dedicated OS thread that reads from a PTY master fd.
/// Sends data chunks to the main event loop via a sync channel.
fn reader_thread(
    session_id: u32,
    master_fd: i32,
    tx: std::sync::mpsc::SyncSender<ReaderEvent>,
    wakeup_fd: i32,
    running: &AtomicBool,
) {
    let mut buf = [0u8; 65536];

    while running.load(Ordering::Relaxed) {
        let n = unsafe { libc::read(master_fd, buf.as_mut_ptr().cast(), buf.len()) };

        if n < 0 {
            let err = io::Error::last_os_error();
            if err.kind() == io::ErrorKind::Interrupted {
                continue;
            }
            if err.kind() == io::ErrorKind::WouldBlock {
                continue;
            }
            break;
        }

        if n == 0 {
            // EOF — PTY closed.
            break;
        }

        let data = buf[..n as usize].to_vec();
        if tx
            .send(ReaderEvent::Data {
                session: session_id,
                data,
            })
            .is_err()
        {
            break;
        }

        // Wake up the main polling loop.
        let byte = [1u8];
        unsafe { libc::write(wakeup_fd, byte.as_ptr().cast(), 1) };
    }

    // Notify main loop that this reader is done.
    let _ = tx.send(ReaderEvent::Eof {
        session: session_id,
    });
    let byte = [1u8];
    unsafe { libc::write(wakeup_fd, byte.as_ptr().cast(), 1) };
}

fn epoch_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn next_backoff_ms(session: &Session) -> u64 {
    let current = session.input_backoff_ms.load(Ordering::Relaxed);
    let next = if current == 0 {
        INPUT_WRITE_BACKOFF_MIN_MS
    } else {
        (current.saturating_mul(2)).min(INPUT_WRITE_BACKOFF_MAX_MS)
    };
    session.input_backoff_ms.store(next, Ordering::Relaxed);
    next
}

fn parse_signal(name: &str) -> Result<i32> {
    match name.to_uppercase().as_str() {
        "HUP" | "SIGHUP" => Ok(libc::SIGHUP),
        "INT" | "SIGINT" => Ok(libc::SIGINT),
        "QUIT" | "SIGQUIT" => Ok(libc::SIGQUIT),
        "TERM" | "SIGTERM" => Ok(libc::SIGTERM),
        "KILL" | "SIGKILL" => Ok(libc::SIGKILL),
        "USR1" | "SIGUSR1" => Ok(libc::SIGUSR1),
        "USR2" | "SIGUSR2" => Ok(libc::SIGUSR2),
        "CONT" | "SIGCONT" => Ok(libc::SIGCONT),
        "STOP" | "SIGSTOP" => Ok(libc::SIGSTOP),
        "TSTP" | "SIGTSTP" => Ok(libc::SIGTSTP),
        "WINCH" | "SIGWINCH" => Ok(libc::SIGWINCH),
        _ => Err(Error::Session(format!("unknown signal: {}", name))),
    }
}

fn decode_wait_status(status: libc::c_int) -> (i32, Option<i32>) {
    if libc::WIFEXITED(status) {
        let code = libc::WEXITSTATUS(status) as i32;
        return (code, None);
    }
    if libc::WIFSIGNALED(status) {
        let sig = libc::WTERMSIG(status) as i32;
        return (128 + sig, Some(sig));
    }
    (0, None)
}

fn validate_terminal_size(cols: u16, rows: u16) -> Result<()> {
    if cols == 0 || rows == 0 {
        return Err(Error::InvalidArgument(
            "terminal size must have cols > 0 and rows > 0".into(),
        ));
    }
    Ok(())
}
