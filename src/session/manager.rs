use super::{Emulator, PtyHandle};
use crate::config::config;
use crate::error::{Error, Result};
use crate::protocol::{CreateOptions, SessionInfo, Snapshot};
use chrono::{DateTime, Utc};
use rustix::event::{poll, PollFd, PollFlags};
use rustix::fd::BorrowedFd;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{self, SyncSender};
use std::sync::{Arc, Mutex, OnceLock, RwLock};
use std::thread::{self, JoinHandle};
use std::time::Duration;

pub static MANAGER: OnceLock<Manager> = OnceLock::new();

pub fn manager() -> &'static Manager {
    MANAGER.get_or_init(Manager::new)
}

/// Message sent to global subscribers
#[derive(Debug, Clone)]
pub enum OutputEvent {
    Data { session: u32, data: Vec<u8> },
    Exit { session: u32, code: i32, signal: Option<i32> },
}

struct SessionSubscriber {
    id: u64,
    tx: SyncSender<OutputEvent>,
}

pub struct Session {
    pub id: u32,
    pub pty: PtyHandle,
    pub emulator: Mutex<Emulator>,
    pub running: AtomicBool,
    pub exit_code: Mutex<Option<i32>>,
    pub exit_signal: Mutex<Option<i32>>,
    // Metadata
    pub workspace_id: Option<String>,
    pub pane_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_attached: RwLock<DateTime<Utc>>,
}

impl Session {
    pub fn is_alive(&self) -> bool {
        self.running.load(Ordering::Relaxed)
    }

    pub fn snapshot(&self) -> Snapshot {
        self.emulator.lock().unwrap().snapshot()
    }

    pub fn to_info(&self) -> SessionInfo {
        SessionInfo {
            id: self.id,
            pid: self.pty.child_pid,
            pts: self.pty.pts_path.clone(),
            is_alive: self.is_alive(),
            created_at: self.created_at.to_rfc3339(),
            last_attached_at: self.last_attached.read().unwrap().to_rfc3339(),
            workspace_id: self.workspace_id.clone(),
            pane_id: self.pane_id.clone(),
        }
    }
}

pub struct Manager {
    sessions: RwLock<HashMap<u32, Arc<Session>>>,
    next_id: AtomicU32,
    next_sub_id: AtomicU32,
    reader_handles: Mutex<HashMap<u32, JoinHandle<()>>>,
    cleanup_tx: mpsc::Sender<u32>,
    /// Subscribers keyed by session id
    session_subscribers: RwLock<HashMap<u32, Vec<SessionSubscriber>>>,
}

impl Manager {
    pub fn new() -> Self {
        let (cleanup_tx, cleanup_rx) = mpsc::channel::<u32>();

        // Background cleanup thread
        thread::spawn(move || {
            for session_id in cleanup_rx {
                if let Some(m) = MANAGER.get() {
                    m.finalize(session_id, false);
                }
            }
        });

        Self {
            sessions: RwLock::new(HashMap::new()),
            next_id: AtomicU32::new(1),
            next_sub_id: AtomicU32::new(1),
            reader_handles: Mutex::new(HashMap::new()),
            cleanup_tx,
            session_subscribers: RwLock::new(HashMap::new()),
        }
    }

    /// Add a subscriber for a specific session's output/exit events
    pub fn add_session_subscriber(
        &self,
        session_id: u32,
        tx: SyncSender<OutputEvent>,
    ) -> Result<u64> {
        if !self.sessions.read().unwrap().contains_key(&session_id) {
            return Err(Error::NotFound(format!("session {}", session_id)));
        }

        let id = self.next_sub_id.fetch_add(1, Ordering::SeqCst) as u64;
        let mut subs = self.session_subscribers.write().unwrap();
        subs.entry(session_id)
            .or_default()
            .push(SessionSubscriber { id, tx });
        Ok(id)
    }

    /// Remove a subscriber for a specific session
    pub fn remove_session_subscriber(&self, session_id: u32, id: u64) {
        let mut subs = self.session_subscribers.write().unwrap();
        if let Some(list) = subs.get_mut(&session_id) {
            list.retain(|s| s.id != id);
            if list.is_empty() {
                subs.remove(&session_id);
            }
        }
    }

    /// Broadcast event to subscribers of the session
    fn broadcast_event(&self, event: OutputEvent) {
        let session_id = match event {
            OutputEvent::Data { session, .. } => session,
            OutputEvent::Exit { session, .. } => session,
        };

        let mut subs = self.session_subscribers.write().unwrap();
        let remove = match subs.get_mut(&session_id) {
            Some(list) => {
                list.retain(|sub| sub.tx.try_send(event.clone()).is_ok());
                list.is_empty()
            }
            None => return,
        };

        if remove {
            subs.remove(&session_id);
        }
    }

    pub fn create(&self, opts: CreateOptions) -> Result<u32> {
        let sessions = self.sessions.read().unwrap();
        if sessions.len() >= config().max_sessions {
            return Err(Error::LimitReached("session limit reached".into()));
        }
        drop(sessions);

        let cols = opts.cols.unwrap_or(80);
        let rows = opts.rows.unwrap_or(24);
        let cwd = opts.cwd.unwrap_or_else(|| {
            std::env::var("HOME").unwrap_or_else(|_| "/".into())
        });

        let pty = PtyHandle::spawn(&cwd, opts.shell.as_deref(), opts.env.as_ref(), cols, rows)?;
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        let mut emulator = Emulator::new(cols, rows, config().scrollback_lines);
        emulator.set_cwd(cwd);

        let now = Utc::now();
        let session = Arc::new(Session {
            id,
            pty,
            emulator: Mutex::new(emulator),
            running: AtomicBool::new(true),
            exit_code: Mutex::new(None),
            exit_signal: Mutex::new(None),
            workspace_id: opts.workspace_id,
            pane_id: opts.pane_id,
            created_at: now,
            last_attached: RwLock::new(now),
        });

        // Start reader thread
        let handle = self.start_reader(Arc::clone(&session));
        self.reader_handles.lock().unwrap().insert(id, handle);
        self.sessions.write().unwrap().insert(id, session.clone());

        // Initial commands
        if let Some(commands) = opts.initial_commands {
            if !commands.is_empty() {
                let cmd = format!("{}\n", commands.join(" && "));
                let _ = session.pty.write(cmd.as_bytes());
            }
        }

        Ok(id)
    }

    fn start_reader(&self, session: Arc<Session>) -> JoinHandle<()> {
        let cleanup_tx = self.cleanup_tx.clone();
        let id = session.id;
        let master_fd = session.pty.master_fd;

        thread::spawn(move || {
            let mut buf = [0u8; 8192];

            while session.running.load(Ordering::Relaxed) {
                let fd = unsafe { BorrowedFd::borrow_raw(master_fd) };
                let mut poll_fds = [PollFd::new(&fd, PollFlags::IN)];

                match poll(&mut poll_fds, 100) {
                    Ok(0) => continue,
                    Ok(_) => {
                        let revents = poll_fds[0].revents();

                        if revents.contains(PollFlags::IN) {
                            match rustix::io::read(fd, &mut buf) {
                                Ok(0) => break,
                                Ok(n) => {
                                    let data = buf[..n].to_vec();
                                    session.emulator.lock().unwrap().write(&data);

                                    // Notify global subscribers
                                    if let Some(mgr) = MANAGER.get() {
                                        mgr.broadcast_event(OutputEvent::Data { session: id, data });
                                    }
                                }
                                Err(_) => break,
                            }
                        }

                        if revents.contains(PollFlags::HUP | PollFlags::ERR) {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }

            let _ = cleanup_tx.send(id);
        })
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

    pub fn list_by_workspace(&self, workspace_id: &str) -> Vec<SessionInfo> {
        self.sessions
            .read()
            .unwrap()
            .values()
            .filter(|s| s.workspace_id.as_deref() == Some(workspace_id))
            .map(|s| s.to_info())
            .collect()
    }

    pub fn kill_by_workspace(&self, workspace_id: &str) -> usize {
        let ids: Vec<u32> = self
            .sessions
            .read()
            .unwrap()
            .values()
            .filter(|s| s.workspace_id.as_deref() == Some(workspace_id))
            .map(|s| s.id)
            .collect();
        ids.iter().filter(|&&id| self.finalize(id, true)).count()
    }

    pub fn kill(&self, id: u32) -> Result<()> {
        if self.finalize(id, true) {
            Ok(())
        } else {
            Err(Error::NotFound(format!("session {}", id)))
        }
    }

    pub fn kill_all(&self) -> usize {
        let ids: Vec<u32> = self.sessions.read().unwrap().keys().copied().collect();
        ids.iter().filter(|&&id| self.finalize(id, true)).count()
    }

    pub fn signal(&self, id: u32, signal: &str) -> Result<()> {
        let session = self.get(id).ok_or_else(|| Error::NotFound(format!("session {}", id)))?;
        let sig = super::pty::parse_signal(signal)
            .ok_or_else(|| Error::Session(format!("unknown signal: {}", signal)))?;
        session.pty.send_signal(sig)?;
        Ok(())
    }

    pub fn resize(&self, id: u32, cols: u16, rows: u16) -> Result<()> {
        let session = self.get(id).ok_or_else(|| Error::NotFound(format!("session {}", id)))?;
        session.pty.resize(cols, rows)?;
        session.emulator.lock().unwrap().resize(cols, rows);
        Ok(())
    }

    pub fn clear_scrollback(&self, id: u32) -> Result<()> {
        let session = self.get(id).ok_or_else(|| Error::NotFound(format!("session {}", id)))?;
        session.emulator.lock().unwrap().clear_scrollback();
        Ok(())
    }

    fn finalize(&self, id: u32, send_term: bool) -> bool {
        let session = self.sessions.write().unwrap().remove(&id);
        let Some(session) = session else { return false };

        session.running.store(false, Ordering::SeqCst);

        // Join reader thread
        if let Some(handle) = self.reader_handles.lock().unwrap().remove(&id) {
            if thread::current().id() != handle.thread().id() {
                let _ = handle.join();
            }
        }

        if send_term {
            let _ = session.pty.send_signal(libc::SIGTERM);
        }

        session.pty.close();

        // Reap child
        self.reap_child(&session, send_term);

        // Notify subscribers of exit
        let code = session.exit_code.lock().unwrap().unwrap_or(0);
        let signal = *session.exit_signal.lock().unwrap();
        self.broadcast_event(OutputEvent::Exit { session: id, code, signal });

        self.session_subscribers.write().unwrap().remove(&id);

        true
    }

    fn reap_child(&self, session: &Session, wait: bool) {
        let pid = session.pty.child_pid;

        let try_wait = || -> Option<(i32, Option<i32>)> {
            let mut status: libc::c_int = 0;
            let result = unsafe { libc::waitpid(pid, &mut status, libc::WNOHANG) };

            if result > 0 {
                let (code, sig) = if libc::WIFEXITED(status) {
                    (libc::WEXITSTATUS(status), None)
                } else if libc::WIFSIGNALED(status) {
                    let s = libc::WTERMSIG(status);
                    (128 + s, Some(s))
                } else {
                    (-1, None)
                };
                Some((code, sig))
            } else {
                None
            }
        };

        if let Some((code, sig)) = try_wait() {
            *session.exit_code.lock().unwrap() = Some(code);
            *session.exit_signal.lock().unwrap() = sig;
            return;
        }

        if wait {
            // Try with timeout
            for _ in 0..40 {
                thread::sleep(Duration::from_millis(50));
                if let Some((code, sig)) = try_wait() {
                    *session.exit_code.lock().unwrap() = Some(code);
                    *session.exit_signal.lock().unwrap() = sig;
                    return;
                }
            }

            // Force kill
            unsafe { libc::kill(pid, libc::SIGKILL) };

            for _ in 0..20 {
                thread::sleep(Duration::from_millis(50));
                if let Some((code, sig)) = try_wait() {
                    *session.exit_code.lock().unwrap() = Some(code);
                    *session.exit_signal.lock().unwrap() = sig;
                    return;
                }
            }
        }
    }
}
