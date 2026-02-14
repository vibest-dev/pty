use crate::auth;
use crate::error::Error;
use crate::protocol::{
    encode_message, FrameReader, Request, RequestEnvelope, Response, PROTOCOL_VERSION,
};
use crate::session::{manager, OutputEvent};
use std::collections::{HashSet, VecDeque};
use std::io::{self, Read, Write};
use std::os::unix::net::UnixStream;

const DAEMON_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Per-client state for the non-blocking event loop.
pub struct ClientState {
    pub stream: UnixStream,
    pub authenticated: bool,
    pub attached_sessions: HashSet<u32>,
    /// Per-session output receivers (one per attached session).
    pub session_receivers: Vec<(u32, std::sync::mpsc::Receiver<OutputEvent>)>,
    /// Frame reader for accumulating incoming data.
    frame_reader: FrameReader,
    /// Outgoing write queue.
    write_queue: VecDeque<Vec<u8>>,
    /// Position within the first buffer in write_queue.
    write_offset: usize,
    /// Total bytes queued for writing.
    write_queue_bytes: usize,
    /// Write queue size limit in bytes.
    max_write_queue_bytes: usize,
    /// Event that couldn't be queued due to backpressure.
    pending_response: Option<Response>,
    /// Whether we need to be polled for writable events.
    pub needs_write: bool,
    /// Marked for removal.
    pub dead: bool,
}

impl ClientState {
    pub fn new(stream: UnixStream) -> io::Result<Self> {
        stream.set_nonblocking(true)?;
        Ok(Self {
            stream,
            authenticated: false,
            attached_sessions: HashSet::new(),
            session_receivers: Vec::new(),
            frame_reader: FrameReader::new(),
            write_queue: VecDeque::new(),
            write_offset: 0,
            write_queue_bytes: 0,
            max_write_queue_bytes: crate::config::config().flow_max_queue_size,
            pending_response: None,
            needs_write: false,
            dead: false,
        })
    }

    fn queue_response_inner(&mut self, response: &Response, max_bytes: Option<usize>) -> bool {
        match encode_message(response) {
            Ok(buf) => {
                if let Some(limit) = max_bytes {
                    if self.write_queue_bytes.saturating_add(buf.len()) > limit {
                        return false;
                    }
                }
                self.write_queue_bytes = self.write_queue_bytes.saturating_add(buf.len());
                self.write_queue.push_back(buf);
                self.needs_write = true;
                true
            }
            Err(e) => {
                eprintln!("[handler] Failed to encode response: {}", e);
                self.dead = true;
                false
            }
        }
    }

    /// Queue a response message for sending to this client.
    pub fn queue_response(&mut self, response: &Response) {
        let _ = self.queue_response_inner(response, None);
    }

    /// Called when the socket is readable. Reads data, decodes frames,
    /// and processes requests. Queues responses internally.
    pub fn handle_readable(&mut self) {
        let mut buf = [0u8; 65536];
        match self.stream.read(&mut buf) {
            Ok(0) => {
                // EOF
                self.dead = true;
                return;
            }
            Ok(n) => {
                self.frame_reader.push(&buf[..n]);
            }
            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
                return;
            }
            Err(_) => {
                self.dead = true;
                return;
            }
        }

        // Decode and process all complete frames.
        loop {
            match self.frame_reader.try_decode::<RequestEnvelope>() {
                Ok(Some(envelope)) => {
                    if let Some(response) = handle_request(self, envelope.seq, envelope.request) {
                        self.queue_response(&response);
                    }
                }
                Ok(None) => break,
                Err(_) => {
                    self.dead = true;
                    return;
                }
            }
        }
    }

    /// Called when the socket is writable. Flushes the write queue.
    /// Returns true if there's still data to write.
    pub fn handle_writable(&mut self) -> bool {
        while let Some(front) = self.write_queue.front() {
            let front_len = front.len();
            let remaining = &front[self.write_offset..];
            match self.stream.write(remaining) {
                Ok(0) => {
                    self.dead = true;
                    return false;
                }
                Ok(n) => {
                    self.write_offset += n;
                    if self.write_offset >= front_len {
                        self.write_queue.pop_front();
                        self.write_queue_bytes = self.write_queue_bytes.saturating_sub(front_len);
                        self.write_offset = 0;
                    }
                }
                Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
                    return true;
                }
                Err(_) => {
                    self.dead = true;
                    return false;
                }
            }
        }

        self.needs_write = false;
        false
    }

    /// Drain output events from all attached session receivers and queue them.
    pub fn drain_session_output(&mut self) {
        let max_bytes = self.max_write_queue_bytes;
        if self.write_queue_bytes >= max_bytes {
            self.needs_write = true;
            return;
        }

        if let Some(response) = self.pending_response.take() {
            if !self.queue_response_inner(&response, Some(max_bytes)) {
                self.pending_response = Some(response);
                self.needs_write = true;
                return;
            }
        }

        // Temporarily take receivers to avoid borrow conflicts while queueing.
        let receivers = std::mem::take(&mut self.session_receivers);
        let mut saturated = false;
        for (session_id, rx) in &receivers {
            loop {
                if self.write_queue_bytes >= max_bytes {
                    self.needs_write = true;
                    saturated = true;
                    break;
                }

                match rx.try_recv() {
                    Ok(event) => {
                        let response = output_event_to_response(*session_id, event);
                        if !self.queue_response_inner(&response, Some(max_bytes)) {
                            self.pending_response = Some(response);
                            self.needs_write = true;
                            saturated = true;
                            break;
                        }
                    }
                    Err(std::sync::mpsc::TryRecvError::Empty) => break,
                    Err(std::sync::mpsc::TryRecvError::Disconnected) => break,
                }
            }
            if saturated {
                break;
            }
        }
        self.session_receivers = receivers;
    }

    /// Clean up on disconnect: remove all session subscriptions.
    pub fn cleanup(&mut self) {
        let mgr = manager();
        for session_id in self.attached_sessions.drain() {
            mgr.remove_session_subscriber(session_id);
        }
        self.session_receivers.clear();
    }
}

fn output_event_to_response(session_id: u32, event: OutputEvent) -> Response {
    match event {
        OutputEvent::Data { data, .. } => Response::Output {
            session: session_id,
            data,
        },
        OutputEvent::Exit { code, signal, .. } => Response::Exit {
            session: session_id,
            code,
            signal,
        },
    }
}

fn handle_request(state: &mut ClientState, seq: u32, req: Request) -> Option<Response> {
    // Require authentication first
    if !state.authenticated {
        return match req {
            Request::Handshake {
                token,
                protocol_version,
            } => {
                if protocol_version != PROTOCOL_VERSION {
                    return Some(Response::error(
                        seq,
                        "PROTOCOL_MISMATCH",
                        format!(
                            "Protocol version mismatch: expected {}, got {}",
                            PROTOCOL_VERSION, protocol_version
                        ),
                    ));
                }

                if !auth::validate(&token) {
                    return Some(Response::error(seq, "AUTH_FAILED", "Invalid token"));
                }

                state.authenticated = true;

                Some(Response::Handshake {
                    seq,
                    protocol_version: PROTOCOL_VERSION,
                    daemon_version: DAEMON_VERSION.into(),
                    daemon_pid: std::process::id(),
                })
            }
            _ => Some(Response::error(
                seq,
                "NOT_AUTHENTICATED",
                "Send Handshake first",
            )),
        };
    }

    let mgr = manager();

    match req {
        Request::Handshake { .. } => Some(Response::error(
            seq,
            "ALREADY_AUTHENTICATED",
            "Already authenticated",
        )),

        Request::Create { options } => match mgr.create(options) {
            Ok(id) => Some(Response::ok_session(seq, id)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::List => Some(Response::ok_sessions(seq, mgr.list())),

        Request::Attach { session } => {
            let Some(sess) = mgr.get(session) else {
                return Some(Response::error(
                    seq,
                    "NOT_FOUND",
                    format!("Session {} not found", session),
                ));
            };

            if state.attached_sessions.insert(session) {
                let (tx, rx) = std::sync::mpsc::sync_channel::<OutputEvent>(
                    crate::config::config().flow_max_queue_size,
                );
                match mgr.add_session_subscriber(session, tx) {
                    Ok(_) => {
                        state.session_receivers.push((session, rx));
                    }
                    Err(Error::Session(msg)) if msg.contains("already attached") => {
                        state.attached_sessions.remove(&session);
                        return Some(Response::error(seq, "ALREADY_ATTACHED", msg));
                    }
                    Err(e) => {
                        state.attached_sessions.remove(&session);
                        return Some(Response::error(seq, e.code(), e.to_string()));
                    }
                }
            }

            let snapshot = sess.snapshot();
            Some(Response::ok_attach(seq, session, snapshot))
        }

        Request::Detach { session } => {
            if state.attached_sessions.remove(&session) {
                mgr.remove_session_subscriber(session);
                state.session_receivers.retain(|(id, _)| *id != session);
            }
            Some(Response::ok_session(seq, session))
        }

        Request::Kill { session } => match mgr.kill(session) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::KillAll => {
            let count = mgr.kill_all();
            Some(Response::ok_count(seq, count))
        }

        Request::Input { session, data } => match mgr.get(session) {
            Some(sess) => match sess.pty.write(&data) {
                Ok(_) => Some(Response::ok_session(seq, session)),
                Err(e) => Some(Response::error(
                    seq,
                    "PTY_WRITE_FAILED",
                    format!("Failed to write to PTY: {}", e),
                )),
            },
            None => Some(Response::error(
                seq,
                "NOT_FOUND",
                format!("Session {} not found", session),
            )),
        },

        Request::Resize {
            session,
            cols,
            rows,
        } => match mgr.resize(session, cols, rows) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::Signal { session, signal } => match mgr.signal(session, &signal) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(Error::Session(msg)) if msg.starts_with("unknown signal") => {
                Some(Response::error(seq, "INVALID_SIGNAL", msg))
            }
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::ClearScrollback { session } => match mgr.clear_scrollback(session) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::config;
    use crate::protocol::CreateOptions;
    use crate::session::manager::MANAGER;
    use crate::session::Manager;

    fn ensure_manager_initialized() {
        let _ = MANAGER.get_or_init(|| {
            let (mgr, _wakeup_fd) = Manager::new_with_wakeup();
            mgr
        });
    }

    #[test]
    fn one_session_queue_full_must_not_block_other_session() {
        let (tx1, _rx1) =
            std::sync::mpsc::sync_channel::<OutputEvent>(config().flow_max_queue_size);
        let (tx2, _rx2) =
            std::sync::mpsc::sync_channel::<OutputEvent>(config().flow_max_queue_size);

        for _ in 0..config().flow_max_queue_size {
            tx1.try_send(OutputEvent::Data {
                session: 1,
                data: b"x".to_vec(),
            })
            .expect("session 1 queue should accept filler event");
        }

        assert!(
            tx2.try_send(OutputEvent::Data {
                session: 2,
                data: b"y".to_vec(),
            })
            .is_ok(),
            "session 2 queue must stay writable even if session 1 queue is full"
        );
    }

    #[test]
    fn multiple_session_channels_remain_active() {
        let (tx1, rx1) = std::sync::mpsc::sync_channel::<OutputEvent>(16);
        let (tx2, rx2) = std::sync::mpsc::sync_channel::<OutputEvent>(16);

        let event1 = OutputEvent::Data {
            session: 1,
            data: b"first".to_vec(),
        };
        let event2 = OutputEvent::Data {
            session: 2,
            data: b"second".to_vec(),
        };

        assert!(
            tx1.try_send(event1).is_ok(),
            "session 1 sender should stay connected"
        );
        assert!(
            tx2.try_send(event2).is_ok(),
            "session 2 sender should stay connected"
        );

        let first = rx1.recv().expect("first event");
        let second = rx2.recv().expect("second event");

        let mut sessions = vec![];
        for event in [first, second] {
            match event {
                OutputEvent::Data { session, .. } => sessions.push(session),
                _ => panic!("unexpected event type"),
            }
        }
        sessions.sort_unstable();
        assert_eq!(sessions, vec![1, 2]);
    }

    #[test]
    fn second_client_cannot_attach_same_session() {
        ensure_manager_initialized();
        let mgr = manager();
        let session_id = mgr
            .create(CreateOptions {
                cwd: None,
                env: None,
                shell: None,
                cols: Some(80),
                rows: Some(24),
                initial_commands: None,
            })
            .expect("create session");

        // Create dummy socket pairs for the clients.
        let (s1, _) = UnixStream::pair().unwrap();
        let (s2, _) = UnixStream::pair().unwrap();
        let mut owner = ClientState::new(s1).unwrap();
        owner.authenticated = true;
        let mut other = ClientState::new(s2).unwrap();
        other.authenticated = true;

        let owner_attach = handle_request(
            &mut owner,
            1,
            Request::Attach {
                session: session_id,
            },
        )
        .expect("owner attach response");
        assert!(
            matches!(owner_attach, Response::Ok { .. }),
            "owner must attach successfully"
        );

        let other_attach = handle_request(
            &mut other,
            2,
            Request::Attach {
                session: session_id,
            },
        )
        .expect("other attach response");
        match other_attach {
            Response::Error { code, .. } => assert_eq!(code, "ALREADY_ATTACHED"),
            resp => panic!("expected ALREADY_ATTACHED, got {:?}", resp),
        }

        owner.cleanup();
        other.cleanup();
        let _ = mgr.kill(session_id);
    }

    #[test]
    fn cleanup_releases_attached_sessions() {
        ensure_manager_initialized();
        let mgr = manager();
        let session_id = mgr
            .create(CreateOptions {
                cwd: None,
                env: None,
                shell: None,
                cols: Some(80),
                rows: Some(24),
                initial_commands: None,
            })
            .expect("create session");

        let (s1, _) = UnixStream::pair().unwrap();
        let (s2, _) = UnixStream::pair().unwrap();
        let mut owner = ClientState::new(s1).unwrap();
        owner.authenticated = true;
        let mut other = ClientState::new(s2).unwrap();
        other.authenticated = true;

        let owner_attach = handle_request(
            &mut owner,
            1,
            Request::Attach {
                session: session_id,
            },
        )
        .expect("owner attach response");
        assert!(
            matches!(owner_attach, Response::Ok { .. }),
            "owner must attach successfully"
        );

        owner.cleanup();

        let other_attach = handle_request(
            &mut other,
            2,
            Request::Attach {
                session: session_id,
            },
        )
        .expect("other attach response");
        assert!(
            matches!(other_attach, Response::Ok { .. }),
            "session should be attachable after cleanup"
        );

        other.cleanup();
        let _ = mgr.kill(session_id);
    }
}
