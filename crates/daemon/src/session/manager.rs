use super::{Emulator, PtyHandle};
use crate::config::config;
use crate::error::{Error, Result};
use crate::protocol::{CreateOptions, SessionInfo, Snapshot};
use std::collections::HashMap;
use std::io;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

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
    pub pty: PtyHandle,
    pub emulator: Mutex<Emulator>,
    pub running: AtomicBool,
    pub reader_eof: AtomicBool,
    pub exit_status: Mutex<Option<(i32, Option<i32>)>>,
    pub created_at: SystemTime,
    pub last_attached: AtomicU64, // nanos since epoch
}

impl Session {
    pub fn is_alive(&self) -> bool {
        self.running.load(Ordering::Relaxed)
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
    pid_to_session: RwLock<HashMap<i32, u32>>,
    next_id: AtomicU32,
    /// One subscriber per session (single-client attachment model).
    /// The value is a bounded sender that the main loop reads from
    /// via the paired receiver stored in the client state.
    session_subscribers: RwLock<HashMap<u32, std::sync::mpsc::SyncSender<OutputEvent>>>,
    /// Channel from reader threads → main event loop.
    /// The main loop polls the receiver end to drain PTY output.
    reader_tx: std::sync::mpsc::SyncSender<ReaderEvent>,
    reader_rx: Mutex<std::sync::mpsc::Receiver<ReaderEvent>>,
    /// Pipe used by reader threads to wake up the main polling loop.
    /// The reader writes a byte here after sending on the channel.
    wakeup_write_fd: i32,
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
            pid_to_session: RwLock::new(HashMap::new()),
            next_id: AtomicU32::new(1),
            session_subscribers: RwLock::new(HashMap::new()),
            reader_tx,
            reader_rx: Mutex::new(reader_rx),
            wakeup_write_fd: fds[1],
        };

        (mgr, fds[0])
    }

    /// Add a subscriber for a specific session's output/exit events.
    pub fn add_session_subscriber(
        &self,
        session_id: u32,
        tx: std::sync::mpsc::SyncSender<OutputEvent>,
    ) -> Result<()> {
        if !self.sessions.read().unwrap().contains_key(&session_id) {
            return Err(Error::NotFound(format!("session {}", session_id)));
        }

        let mut subs = self.session_subscribers.write().unwrap();
        if subs.contains_key(&session_id) {
            return Err(Error::Session(format!(
                "session {} already attached",
                session_id
            )));
        }
        subs.insert(session_id, tx);
        Ok(())
    }

    /// Remove a subscriber for a specific session.
    pub fn remove_session_subscriber(&self, session_id: u32) {
        let mut subs = self.session_subscribers.write().unwrap();
        subs.remove(&session_id);
    }

    /// Create a new PTY session. Spawns a dedicated reader OS thread.
    pub fn create(&self, opts: CreateOptions) -> Result<u32> {
        let cfg = config();

        if self.sessions.read().unwrap().len() >= cfg.max_sessions {
            return Err(Error::LimitReached("max sessions reached".into()));
        }

        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        let cwd = opts.cwd.as_deref().unwrap_or(".");
        let cols = opts.cols.unwrap_or(80);
        let rows = opts.rows.unwrap_or(24);
        validate_terminal_size(cols, rows)?;

        let pty = PtyHandle::spawn(cwd, opts.shell.as_deref(), opts.env.as_ref(), cols, rows)?;

        let master_fd = pty.master_fd;

        let now = SystemTime::now();
        let now_nanos = now.duration_since(UNIX_EPOCH).unwrap().as_nanos() as u64;

        let session = Arc::new(Session {
            id,
            pty,
            emulator: Mutex::new(Emulator::new(cols, rows, cfg.scrollback_lines)),
            running: AtomicBool::new(true),
            reader_eof: AtomicBool::new(false),
            exit_status: Mutex::new(None),
            created_at: now,
            last_attached: AtomicU64::new(now_nanos),
        });

        self.sessions.write().unwrap().insert(id, session.clone());
        self.pid_to_session
            .write()
            .unwrap()
            .insert(session.pty.child_pid, id);

        // Spawn a dedicated OS reader thread for this session's PTY.
        let tx = self.reader_tx.clone();
        let wakeup_fd = self.wakeup_write_fd;
        let session_clone = session.clone();
        std::thread::Builder::new()
            .name(format!("pty-reader-{}", id))
            .spawn(move || {
                reader_thread(id, master_fd, tx, wakeup_fd, &session_clone.running);
            })
            .map_err(|e| Error::Session(format!("failed to spawn reader thread: {}", e)))?;

        Ok(id)
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

        session.pty.resize(cols, rows)?;
        session.emulator.lock().unwrap().resize(cols, rows);
        Ok(())
    }

    pub fn clear_scrollback(&self, id: u32) -> Result<()> {
        let sessions = self.sessions.read().unwrap();
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        session.emulator.lock().unwrap().clear_scrollback();
        Ok(())
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
        let subs = self.session_subscribers.read().unwrap();
        if let Some(tx) = subs.get(&session_id) {
            let _ = tx.try_send(event.clone());
        }
    }

    /// Clean up a finished session.
    pub fn finalize(&self, id: u32) {
        let session = self.sessions.write().unwrap().remove(&id);
        self.session_subscribers.write().unwrap().remove(&id);

        if let Some(sess) = session {
            sess.running.store(false, Ordering::SeqCst);
            self.pid_to_session
                .write()
                .unwrap()
                .remove(&sess.pty.child_pid);
        }
    }

    fn terminate_nonblocking(&self, session: Arc<Session>) -> Result<()> {
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
        if !session.reader_eof.load(Ordering::SeqCst) {
            return None;
        }

        let (code, signal) = (*session.exit_status.lock().unwrap())?;
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
