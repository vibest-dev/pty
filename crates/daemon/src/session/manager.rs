use super::{Emulator, PtyHandle};
use crate::config::config;
use crate::error::{Error, Result};
use crate::protocol::{BackpressureLevel, CreateOptions, SessionInfo, Snapshot};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub static MANAGER: OnceLock<Manager> = OnceLock::new();

pub fn manager() -> &'static Manager {
    MANAGER.get_or_init(Manager::new)
}

/// Message sent to subscribers
#[derive(Debug, Clone)]
pub enum OutputEvent {
    Data { session: u32, data: Vec<u8> },
    Exit { session: u32, code: i32, signal: Option<i32> },
    BackpressureWarning {
        session: u32,
        queue_size: usize,
        level: BackpressureLevel,
    },
}

// Simplified Session structure
pub struct Session {
    pub id: u32,
    pub pty: PtyHandle,
    pub emulator: tokio::sync::Mutex<Emulator>,
    pub running: AtomicBool,
    pub created_at: SystemTime,
    pub last_attached: AtomicU64, // nanos since epoch
}

impl Session {
    pub fn is_alive(&self) -> bool {
        self.running.load(Ordering::Relaxed)
    }

    pub async fn snapshot(&self) -> Snapshot {
        self.emulator.lock().await.snapshot()
    }

    pub fn to_info(&self) -> SessionInfo {
        let created_secs = self.created_at
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

// Simplified Manager
pub struct Manager {
    sessions: Arc<tokio::sync::RwLock<HashMap<u32, Arc<Session>>>>,
    next_id: AtomicU32,
    // One subscriber per session (single-client attachment model).
    session_subscribers: Arc<tokio::sync::RwLock<HashMap<u32, tokio::sync::mpsc::Sender<OutputEvent>>>>,
}

impl Manager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(tokio::sync::RwLock::new(HashMap::new())),
            next_id: AtomicU32::new(1),
            session_subscribers: Arc::new(tokio::sync::RwLock::new(HashMap::new())),
        }
    }

    /// Add a subscriber for a specific session's output/exit events
    pub async fn add_session_subscriber(
        &self,
        session_id: u32,
        tx: tokio::sync::mpsc::Sender<OutputEvent>,
    ) -> Result<()> {
        if !self.sessions.read().await.contains_key(&session_id) {
            return Err(Error::NotFound(format!("session {}", session_id)));
        }

        let mut subs = self.session_subscribers.write().await;
        if subs.contains_key(&session_id) {
            return Err(Error::Session(format!("session {} already attached", session_id)));
        }
        subs.insert(session_id, tx);
        Ok(())
    }

    /// Remove a subscriber for a specific session
    pub async fn remove_session_subscriber(&self, session_id: u32) {
        let mut subs = self.session_subscribers.write().await;
        subs.remove(&session_id);
    }

    /// Create a new PTY session
    pub async fn create(&self, opts: CreateOptions) -> Result<u32> {
        let cfg = config();

        // Check max sessions limit
        if self.sessions.read().await.len() >= cfg.max_sessions {
            return Err(Error::LimitReached("max sessions reached".into()));
        }

        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        // Spawn PTY process
        let cwd = opts.cwd.as_deref().unwrap_or(".");
        let cols = opts.cols.unwrap_or(80);
        let rows = opts.rows.unwrap_or(24);
        validate_terminal_size(cols, rows)?;

        let pty = PtyHandle::spawn(
            cwd,
            opts.shell.as_deref(),
            opts.env.as_ref(),
            cols,
            rows,
        )?;

        let now = SystemTime::now();
        let now_nanos = now.duration_since(UNIX_EPOCH).unwrap().as_nanos() as u64;

        let session = Arc::new(Session {
            id,
            pty,
            emulator: tokio::sync::Mutex::new(Emulator::new(cols, rows, cfg.scrollback_lines)),
            running: AtomicBool::new(true),
            created_at: now,
            last_attached: AtomicU64::new(now_nanos),
        });

        // Insert session
        self.sessions.write().await.insert(id, session.clone());

        // Start async PTY reader task
        let subscribers = self.session_subscribers.clone();
        tokio::spawn(async move {
            start_reader(session, subscribers).await;
        });

        Ok(id)
    }

    pub async fn get(&self, id: u32) -> Option<Arc<Session>> {
        self.sessions.read().await.get(&id).cloned()
    }

    pub async fn list(&self) -> Vec<SessionInfo> {
        self.sessions
            .read()
            .await
            .values()
            .map(|s| s.to_info())
            .collect()
    }

    pub async fn kill(&self, id: u32) -> Result<()> {
        let session = self
            .sessions
            .read()
            .await
            .get(&id)
            .cloned()
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;
        self.terminate_and_finalize(id, session).await
    }

    pub async fn kill_all(&self) -> usize {
        let sessions: Vec<(u32, Arc<Session>)> = self
            .sessions
            .read()
            .await
            .iter()
            .map(|(id, session)| (*id, session.clone()))
            .collect();
        let mut count = 0;

        for (id, session) in sessions {
            if self.terminate_and_finalize(id, session).await.is_ok() {
                count += 1;
            }
        }

        count
    }

    pub async fn signal(&self, id: u32, signal: &str) -> Result<()> {
        let sessions = self.sessions.read().await;
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        let sig = parse_signal(signal)?;
        session.pty.send_signal(sig)?;
        Ok(())
    }

    pub async fn resize(&self, id: u32, cols: u16, rows: u16) -> Result<()> {
        validate_terminal_size(cols, rows)?;

        let sessions = self.sessions.read().await;
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        session.pty.resize(cols, rows)?;
        session.emulator.lock().await.resize(cols, rows);
        Ok(())
    }

    pub async fn clear_scrollback(&self, id: u32) -> Result<()> {
        let sessions = self.sessions.read().await;
        let session = sessions
            .get(&id)
            .ok_or_else(|| Error::NotFound(format!("session {}", id)))?;

        session.emulator.lock().await.clear_scrollback();
        Ok(())
    }

    /// Clean up a finished session
    async fn finalize(&self, id: u32) {
        // Remove from sessions
        let session = self.sessions.write().await.remove(&id);

        // Remove all subscribers
        self.session_subscribers.write().await.remove(&id);

        if let Some(sess) = session {
            sess.running.store(false, Ordering::SeqCst);
        }
    }

    async fn terminate_and_finalize(&self, id: u32, session: Arc<Session>) -> Result<()> {
        // `kill` should be definitive: use SIGKILL to avoid lingering sessions.
        session.pty.send_signal(libc::SIGKILL)?;

        let (exit_code, exit_signal) = wait_for_child_with_timeout(
            session.pty.child_pid,
            Duration::from_millis(250),
        )
        .await
        .unwrap_or((128 + libc::SIGKILL, Some(libc::SIGKILL)));

        broadcast_to_subscribers(
            &self.session_subscribers,
            id,
            OutputEvent::Exit {
                session: id,
                code: exit_code,
                signal: exit_signal,
            },
        )
        .await;

        self.finalize(id).await;
        Ok(())
    }
}

/// Async PTY reader task (replaces the blocking thread)
async fn start_reader(
    session: Arc<Session>,
    subscribers: Arc<tokio::sync::RwLock<HashMap<u32, tokio::sync::mpsc::Sender<OutputEvent>>>>,
) {
    let master_fd = session.pty.master_fd;
    let session_id = session.id;

    // Create async file from raw fd
    let std_file = unsafe {
        use std::os::fd::FromRawFd;
        std::fs::File::from_raw_fd(master_fd)
    };

    // Convert to tokio file for async operations
    let mut file = tokio::fs::File::from_std(std_file);

    let mut buf = [0u8; 8192];

    while session.running.load(Ordering::Relaxed) {
        use tokio::io::AsyncReadExt;

        match file.read(&mut buf).await {
            Ok(0) => {
                // EOF - PTY closed
                break;
            }
            Ok(n) => {
                let data = buf[..n].to_vec();

                // Update emulator
                if let Ok(mut emulator) = session.emulator.try_lock() {
                    for &byte in &data {
                        emulator.process_byte(byte);
                    }
                }

                // Broadcast to subscribers
                let event = OutputEvent::Data {
                    session: session_id,
                    data,
                };
                broadcast_to_subscribers(&subscribers, session_id, event).await;
            }
            Err(e) => {
                eprintln!("[reader] Error reading PTY: {}", e);
                break;
            }
        }
    }

    // Mark session as not running
    session.running.store(false, Ordering::SeqCst);

    // Get exit status
    let (exit_code, exit_signal) = wait_for_child(session.pty.child_pid).await;

    // Send exit event
    let exit_event = OutputEvent::Exit {
        session: session_id,
        code: exit_code,
        signal: exit_signal,
    };
    broadcast_to_subscribers(&subscribers, session_id, exit_event).await;

    // Clean up session
    if let Some(mgr) = MANAGER.get() {
        mgr.finalize(session_id).await;
    }
}

/// Helper to broadcast events
async fn broadcast_to_subscribers(
    subscribers: &Arc<tokio::sync::RwLock<HashMap<u32, tokio::sync::mpsc::Sender<OutputEvent>>>>,
    session_id: u32,
    event: OutputEvent,
) {
    let subs = subscribers.read().await;
    let Some(tx) = subs.get(&session_id) else {
        return;
    };

    let cfg = config();

    match tx.try_send(event) {
        Ok(_) => {
            let remaining = tx.capacity();
            if remaining < cfg.flow_threshold {
                let queue_size = cfg.flow_max_queue_size - remaining;
                let warning = OutputEvent::BackpressureWarning {
                    session: session_id,
                    queue_size,
                    level: BackpressureLevel::Yellow,
                };
                let _ = tx.try_send(warning);
            }
        }
        Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
            if !cfg.flow_auto_disconnect {
                let warning = OutputEvent::BackpressureWarning {
                    session: session_id,
                    queue_size: cfg.flow_max_queue_size,
                    level: BackpressureLevel::Red,
                };
                let _ = tx.try_send(warning);
            }
        }
        Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => {
            // Subscriber disconnected
        }
    }
}

/// Parse signal name to signal number
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

/// Wait for child process to exit and return its real exit status.
async fn wait_for_child(pid: i32) -> (i32, Option<i32>) {
    tokio::task::spawn_blocking(move || wait_for_child_blocking(pid))
        .await
        .unwrap_or((0, None))
}

async fn wait_for_child_with_timeout(pid: i32, timeout: Duration) -> Option<(i32, Option<i32>)> {
    let deadline = tokio::time::Instant::now() + timeout;

    loop {
        if let Some(status) = try_wait_for_child(pid) {
            return Some(status);
        }
        if tokio::time::Instant::now() >= deadline {
            return None;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
}

fn try_wait_for_child(pid: i32) -> Option<(i32, Option<i32>)> {
    let mut status: libc::c_int = 0;
    let result = unsafe { libc::waitpid(pid, &mut status as *mut libc::c_int, libc::WNOHANG) };

    if result == 0 {
        return None;
    }
    if result < 0 {
        return Some((0, None));
    }
    Some(decode_wait_status(status))
}

fn wait_for_child_blocking(pid: i32) -> (i32, Option<i32>) {
    let mut status: libc::c_int = 0;
    let result = unsafe { libc::waitpid(pid, &mut status as *mut libc::c_int, 0) };

    if result < 0 {
        return (0, None);
    }

    decode_wait_status(status)
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
