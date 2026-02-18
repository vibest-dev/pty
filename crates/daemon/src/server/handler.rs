use crate::auth;
use crate::error::Error;
use crate::protocol::{
    encode_message, ConnectionRole, FrameReader, Request, RequestEnvelope, Response,
    PROTOCOL_VERSION,
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
    pub client_id: Option<String>,
    pub role: ConnectionRole,
    role_explicit: bool,
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
    /// Round-robin cursor used to pick the first receiver each drain cycle.
    drain_start_index: usize,
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
            client_id: None,
            role: ConnectionRole::Control,
            role_explicit: false,
            attached_sessions: HashSet::new(),
            session_receivers: Vec::new(),
            frame_reader: FrameReader::new(),
            write_queue: VecDeque::new(),
            write_offset: 0,
            write_queue_bytes: 0,
            max_write_queue_bytes: crate::config::config().client_write_queue_bytes,
            pending_response: None,
            drain_start_index: 0,
            needs_write: false,
            dead: false,
        })
    }

    pub fn uses_explicit_role(&self) -> bool {
        self.role_explicit
    }

    fn queue_response_inner(&mut self, response: &Response, max_bytes: Option<usize>) -> bool {
        match encode_message(response) {
            Ok(buf) => {
                if let Some(limit) = max_bytes {
                    let next_size = self.write_queue_bytes.saturating_add(buf.len());
                    // Permit one oversized frame when the queue is otherwise empty.
                    // Without this, a single large output frame can become permanently
                    // undeliverable because it can never fit under the byte cap.
                    let allow_single_oversized = self.write_queue_bytes == 0 && buf.len() > limit;
                    if next_size > limit && !allow_single_oversized {
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

    /// Called when the socket is readable. Reads data into the frame buffer.
    pub fn read_from_stream(&mut self) {
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
    }

    /// Decode and drain all complete request envelopes currently buffered.
    pub fn drain_requests(&mut self) -> Vec<RequestEnvelope> {
        let mut requests = Vec::new();
        loop {
            match self.frame_reader.try_decode::<RequestEnvelope>() {
                Ok(Some(envelope)) => {
                    requests.push(envelope);
                }
                Ok(None) => break,
                Err(_) => {
                    self.dead = true;
                    break;
                }
            }
        }

        requests
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
        let receiver_count = receivers.len();

        if receiver_count > 0 {
            let mut saturated = false;
            let mut next_start = self.drain_start_index % receiver_count;

            loop {
                if self.write_queue_bytes >= max_bytes {
                    self.needs_write = true;
                    break;
                }

                let pass_start = next_start;
                let mut progressed = false;

                for offset in 0..receiver_count {
                    if self.write_queue_bytes >= max_bytes {
                        self.needs_write = true;
                        saturated = true;
                        break;
                    }

                    let idx = (pass_start + offset) % receiver_count;
                    let (session_id, rx) = &receivers[idx];
                    next_start = (idx + 1) % receiver_count;

                    match rx.try_recv() {
                        Ok(event) => {
                            let response = output_event_to_response(*session_id, event);
                            if !self.queue_response_inner(&response, Some(max_bytes)) {
                                self.pending_response = Some(response);
                                self.needs_write = true;
                                saturated = true;
                                break;
                            }
                            progressed = true;
                        }
                        Err(std::sync::mpsc::TryRecvError::Empty) => {}
                        Err(std::sync::mpsc::TryRecvError::Disconnected) => {}
                    }
                }

                if saturated || !progressed {
                    break;
                }
            }

            self.drain_start_index = next_start;
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

pub(crate) fn handle_request(state: &mut ClientState, seq: u32, req: Request) -> Option<Response> {
    // Require authentication first
    if !state.authenticated {
        return match req {
            Request::Handshake {
                token,
                protocol_version,
                client_id,
                role,
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

                if role.is_some() && client_id.is_none() {
                    return Some(Response::error(
                        seq,
                        "INVALID_HANDSHAKE",
                        "client_id is required when role is provided",
                    ));
                }

                state.authenticated = true;
                state.role_explicit = role.is_some();
                state.role = role.unwrap_or(ConnectionRole::Control);
                state.client_id = client_id;

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

    if state.role_explicit
        && state.role == ConnectionRole::Stream
        && !matches!(req, Request::Attach { .. } | Request::Detach { .. })
    {
        return Some(Response::error(
            seq,
            "WRONG_CHANNEL",
            "request must use control channel",
        ));
    }

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

            if !sess.is_alive() {
                return Some(Response::error(
                    seq,
                    "SESSION_TERMINATING",
                    format!("Session {} is terminating", session),
                ));
            }

            if state.attached_sessions.insert(session) {
                let (tx, rx) = std::sync::mpsc::sync_channel::<OutputEvent>(
                    crate::config::config().session_event_queue_capacity,
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
            Err(Error::Session(msg)) if msg.contains("terminating") => {
                Some(Response::error(seq, "SESSION_TERMINATING", msg))
            }
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::KillAll => {
            let count = mgr.kill_all();
            Some(Response::ok_count(seq, count))
        }

        Request::Input { session, data } => match mgr.enqueue_input(session, data) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(Error::LimitReached(msg)) => Some(Response::error(seq, "LIMIT_REACHED", msg)),
            Err(Error::Session(msg)) if msg.contains("terminating") => {
                Some(Response::error(seq, "SESSION_TERMINATING", msg))
            }
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::Resize {
            session,
            cols,
            rows,
        } => match mgr.resize(session, cols, rows) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(Error::Session(msg)) if msg.contains("terminating") => {
                Some(Response::error(seq, "SESSION_TERMINATING", msg))
            }
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::Signal { session, signal } => match mgr.signal(session, &signal) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(Error::Session(msg)) if msg.contains("terminating") => {
                Some(Response::error(seq, "SESSION_TERMINATING", msg))
            }
            Err(Error::Session(msg)) if msg.starts_with("unknown signal") => {
                Some(Response::error(seq, "INVALID_SIGNAL", msg))
            }
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::ClearScrollback { session } => match mgr.clear_scrollback(session) {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(Error::Session(msg)) if msg.contains("terminating") => {
                Some(Response::error(seq, "SESSION_TERMINATING", msg))
            }
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

    fn clear_write_queue(state: &mut ClientState) {
        state.write_queue.clear();
        state.write_offset = 0;
        state.write_queue_bytes = 0;
        state.needs_write = false;
    }

    #[test]
    fn one_session_queue_full_must_not_block_other_session() {
        let queue_cap = config().session_event_queue_capacity;
        let (tx1, _rx1) = std::sync::mpsc::sync_channel::<OutputEvent>(queue_cap);
        let (tx2, _rx2) = std::sync::mpsc::sync_channel::<OutputEvent>(queue_cap);

        for _ in 0..queue_cap {
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
    fn oversized_output_frame_is_eventually_queued() {
        let (s, _peer) = UnixStream::pair().unwrap();
        let mut state = ClientState::new(s).unwrap();
        state.max_write_queue_bytes = 128;

        let (tx, rx) = std::sync::mpsc::sync_channel::<OutputEvent>(4);
        state.session_receivers.push((1, rx));

        // Pre-fill some queued bytes so the first attempt cannot fit.
        state.write_queue.push_back(vec![0u8; 64]);
        state.write_queue_bytes = 64;

        tx.try_send(OutputEvent::Data {
            session: 1,
            data: vec![b'x'; 4096],
        })
        .expect("must queue oversized output event");

        state.drain_session_output();
        assert!(
            state.pending_response.is_some(),
            "oversized response should be retained as pending when queue is not empty"
        );

        clear_write_queue(&mut state);
        state.drain_session_output();

        assert!(
            state.pending_response.is_none(),
            "pending oversized response should be queued once queue drains"
        );
        assert_eq!(
            state.write_queue.len(),
            1,
            "oversized response should be enqueued as a single frame"
        );
        assert!(
            state.write_queue_bytes > state.max_write_queue_bytes,
            "single oversized frame is allowed to exceed byte limit when queue is otherwise empty"
        );
    }

    #[test]
    fn drain_rotates_start_session_to_avoid_starvation() {
        let (s, _peer) = UnixStream::pair().unwrap();
        let mut state = ClientState::new(s).unwrap();

        let sample_len = encode_message(&Response::Output {
            session: 1,
            data: vec![b'x'],
        })
        .expect("encode sample output")
        .len();
        state.max_write_queue_bytes = sample_len;

        let (tx1, rx1) = std::sync::mpsc::sync_channel::<OutputEvent>(8);
        let (tx2, rx2) = std::sync::mpsc::sync_channel::<OutputEvent>(1);
        state.session_receivers.push((1, rx1));
        state.session_receivers.push((2, rx2));

        for _ in 0..4 {
            tx1.try_send(OutputEvent::Data {
                session: 1,
                data: vec![b'a'],
            })
            .expect("session 1 should have backlog");
        }
        tx2.try_send(OutputEvent::Data {
            session: 2,
            data: vec![b'b'],
        })
        .expect("session 2 should have one event");

        state.drain_session_output();
        clear_write_queue(&mut state);
        state.drain_session_output();

        assert!(
            tx2.try_send(OutputEvent::Data {
                session: 2,
                data: vec![b'c'],
            })
            .is_ok(),
            "second drain should have consumed session 2 event instead of starving behind session 1 backlog"
        );
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

    #[test]
    fn attach_rejected_when_session_not_alive() {
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

        let session = mgr.get(session_id).expect("session exists");
        session
            .running
            .store(false, std::sync::atomic::Ordering::SeqCst);

        let (s, _) = UnixStream::pair().unwrap();
        let mut client = ClientState::new(s).unwrap();
        client.authenticated = true;

        let response = handle_request(
            &mut client,
            1,
            Request::Attach {
                session: session_id,
            },
        )
        .expect("attach response");

        match response {
            Response::Error { code, .. } => assert_eq!(code, "SESSION_TERMINATING"),
            other => panic!("expected SESSION_TERMINATING, got {:?}", other),
        }

        let _ = mgr.kill(session_id);
    }
}
