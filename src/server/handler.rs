use crate::auth;
use crate::error::Error;
use crate::protocol::{read_message, write_message, Request, Response, PROTOCOL_VERSION};
use crate::session::{manager, OutputEvent};
use std::collections::{HashMap, HashSet};
use std::os::unix::net::UnixStream;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use std::time::Duration;

const DAEMON_VERSION: &str = env!("CARGO_PKG_VERSION");

struct ClientState {
    authenticated: bool,
    /// Sessions this client is attached to
    attached_sessions: HashSet<u32>,
    /// Session subscriber IDs
    session_sub_ids: HashMap<u32, u64>,
    /// Output forwarder thread
    output_thread: Option<JoinHandle<()>>,
    stop_flag: Arc<AtomicBool>,
    output_tx: Option<mpsc::SyncSender<OutputEvent>>,
}

impl Default for ClientState {
    fn default() -> Self {
        Self {
            authenticated: false,
            attached_sessions: HashSet::new(),
            session_sub_ids: HashMap::new(),
            output_thread: None,
            stop_flag: Arc::new(AtomicBool::new(false)),
            output_tx: None,
        }
    }
}

pub fn serve(mut stream: UnixStream) {
    let mut state = ClientState::default();

    loop {
        let request: Request = match read_message(&mut stream) {
            Ok(req) => req,
            Err(_) => break,
        };

        let response = handle(&mut stream, &mut state, request);

        if let Some(resp) = response {
            if write_message(&mut stream, &resp).is_err() {
                break;
            }
        }
    }

    cleanup(&mut state);
}

fn cleanup(state: &mut ClientState) {
    for (session_id, sub_id) in state.session_sub_ids.drain() {
        manager().remove_session_subscriber(session_id, sub_id);
    }

    state.stop_flag.store(true, Ordering::SeqCst);
    state.output_tx.take();
    state.attached_sessions.clear();

    if let Some(handle) = state.output_thread.take() {
        let _ = handle.join();
    }
}

fn ensure_output_thread(
    state: &mut ClientState,
    stream: &mut UnixStream,
) -> Result<mpsc::SyncSender<OutputEvent>, String> {
    if let Some(tx) = state.output_tx.clone() {
        return Ok(tx);
    }

    let (tx, rx) = mpsc::sync_channel::<OutputEvent>(256);
    state.output_tx = Some(tx.clone());

    let stop_flag = Arc::clone(&state.stop_flag);
    let mut stream_clone = stream.try_clone().map_err(|e| e.to_string())?;

    state.output_thread = Some(thread::spawn(move || {
        loop {
            if stop_flag.load(Ordering::Relaxed) {
                break;
            }

            match rx.recv_timeout(Duration::from_millis(100)) {
                Ok(event) => {
                    let response = match event {
                        OutputEvent::Data { session, data } => Response::Output { session, data },
                        OutputEvent::Exit { session, code, signal } => {
                            Response::Exit { session, code, signal }
                        }
                    };
                    if write_message(&mut stream_clone, &response).is_err() {
                        break;
                    }
                }
                Err(RecvTimeoutError::Timeout) => continue,
                Err(RecvTimeoutError::Disconnected) => break,
            }
        }
    }));

    Ok(tx)
}

fn handle(stream: &mut UnixStream, state: &mut ClientState, req: Request) -> Option<Response> {
    println!("[handler] Received request: {:?}", req);
    
    // Require authentication first
    if !state.authenticated {
        return match req {
            Request::Hello { token, protocol_version } => {
                println!("[handler] Hello: protocol_version={}, token_len={}", protocol_version, token.len());
                if protocol_version != PROTOCOL_VERSION {
                    return Some(Response::error(
                        "PROTOCOL_MISMATCH",
                        format!(
                            "Protocol version mismatch: expected {}, got {}",
                            PROTOCOL_VERSION, protocol_version
                        ),
                    ));
                }

                if !auth::validate(&token) {
                    println!("[handler] Auth failed for token");
                    return Some(Response::error("AUTH_FAILED", "Invalid token"));
                }

                println!("[handler] Auth succeeded");
                state.authenticated = true;

                Some(Response::Hello {
                    protocol_version: PROTOCOL_VERSION,
                    daemon_version: DAEMON_VERSION.into(),
                    daemon_pid: std::process::id(),
                })
            }
            _ => Some(Response::error("NOT_AUTHENTICATED", "Send Hello first")),
        };
    }

    let mgr = manager();

    match req {
        Request::Hello { .. } => {
            Some(Response::error("ALREADY_AUTHENTICATED", "Already authenticated"))
        }

        Request::Create { options } => match mgr.create(options) {
            Ok(id) => Some(Response::ok_session(id)),
            Err(e) => Some(Response::error(e.code(), e.to_string())),
        },

        Request::List => Some(Response::ok_sessions(mgr.list())),

        Request::Attach { session } => {
            let Some(sess) = mgr.get(session) else {
                return Some(Response::error("NOT_FOUND", format!("Session {} not found", session)));
            };

            if state.attached_sessions.insert(session) {
                let tx = match ensure_output_thread(state, stream) {
                    Ok(tx) => tx,
                    Err(e) => return Some(Response::error("SUBSCRIBE_FAILED", e)),
                };
                match mgr.add_session_subscriber(session, tx) {
                    Ok(sub_id) => {
                        state.session_sub_ids.insert(session, sub_id);
                    }
                    Err(e) => return Some(Response::error(e.code(), e.to_string())),
                }
            }

            let snapshot = sess.snapshot();
            Some(Response::ok_attach(session, snapshot))
        }

        Request::Detach { session } => {
            if state.attached_sessions.remove(&session) {
                if let Some(sub_id) = state.session_sub_ids.remove(&session) {
                    mgr.remove_session_subscriber(session, sub_id);
                }
            }
            Some(Response::ok_session(session))
        }

        Request::Kill { session } => {
            match mgr.kill(session) {
                Ok(_) => Some(Response::ok_session(session)),
                Err(e) => Some(Response::error(e.code(), e.to_string())),
            }
        }

        Request::KillAll => {
            let count = mgr.kill_all();
            Some(Response::ok_count(count))
        }

        Request::ListByWorkspace { workspace_id } => {
            Some(Response::ok_sessions(mgr.list_by_workspace(&workspace_id)))
        }

        Request::KillByWorkspace { workspace_id } => {
            let count = mgr.kill_by_workspace(&workspace_id);
            Some(Response::ok_count(count))
        }

        Request::Input { session, data } => {
            match mgr.get(session) {
                Some(sess) => {
                    let _ = sess.pty.write(&data);
                    None // No response for input
                }
                None => Some(Response::error("NOT_FOUND", format!("Session {} not found", session))),
            }
        }

        Request::Resize { session, cols, rows } => {
            match mgr.resize(session, cols, rows) {
                Ok(_) => None, // No response for resize
                Err(e) => Some(Response::error(e.code(), e.to_string())),
            }
        }

        Request::Signal { session, signal } => {
            match mgr.signal(session, &signal) {
                Ok(_) => Some(Response::ok_session(session)),
                Err(Error::Session(msg)) if msg.starts_with("unknown signal") => {
                    Some(Response::error("INVALID_SIGNAL", msg))
                }
                Err(e) => Some(Response::error(e.code(), e.to_string())),
            }
        }

        Request::ClearScrollback { session } => {
            match mgr.clear_scrollback(session) {
                Ok(_) => Some(Response::ok_session(session)),
                Err(e) => Some(Response::error(e.code(), e.to_string())),
            }
        }
    }
}
