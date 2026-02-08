use crate::auth;
use crate::error::Error;
use crate::protocol::{read_message_async, write_message_async, Request, RequestEnvelope, Response, PROTOCOL_VERSION};
use crate::session::{manager, OutputEvent};
use std::collections::{HashMap, HashSet};

const DAEMON_VERSION: &str = env!("CARGO_PKG_VERSION");

struct ClientState {
    authenticated: bool,
    /// Sessions this client is attached to
    attached_sessions: HashSet<u32>,
    /// Session subscriber IDs
    session_sub_ids: HashMap<u32, u64>,
    /// Output receiver for subscribed sessions
    output_rx: Option<tokio::sync::mpsc::Receiver<OutputEvent>>,
}

impl Default for ClientState {
    fn default() -> Self {
        Self {
            authenticated: false,
            attached_sessions: HashSet::new(),
            session_sub_ids: HashMap::new(),
            output_rx: None,
        }
    }
}

pub async fn handle_connection(mut stream: tokio::net::UnixStream) {
    let mut state = ClientState::default();

    loop {
        tokio::select! {
            // Handle incoming requests
            result = read_message_async::<RequestEnvelope>(&mut stream) => {
                let Ok(envelope) = result else {
                    break;
                };

                if let Some(response) = handle_request(&mut state, envelope.seq, envelope.request).await {
                    if write_message_async::<Response>(&mut stream, &response).await.is_err() {
                        break;
                    }
                }
            }

            // Forward output events (if attached to any session)
            Some(event) = async {
                match state.output_rx.as_mut() {
                    Some(rx) => rx.recv().await,
                    None => std::future::pending().await, // Never resolves if no receiver
                }
            } => {
                let response = match event {
                    OutputEvent::Data { session, data } => Response::Output { session, data },
                    OutputEvent::Exit { session, code, signal } => {
                        Response::Exit { session, code, signal }
                    }
                    OutputEvent::BackpressureWarning { session, queue_size, level } => {
                        Response::BackpressureWarning { session, queue_size, level }
                    }
                };

                if write_message_async::<Response>(&mut stream, &response).await.is_err() {
                    break;
                }
            }
        }
    }

    cleanup(&mut state).await;
}

async fn cleanup(state: &mut ClientState) {
    for (session_id, sub_id) in state.session_sub_ids.drain() {
        manager().remove_session_subscriber(session_id, sub_id).await;
    }
    state.attached_sessions.clear();
    state.output_rx.take();
}

async fn ensure_output_channel(
    state: &mut ClientState,
) -> Result<tokio::sync::mpsc::Sender<OutputEvent>, String> {
    if state.output_rx.is_none() {
        let (tx, rx) = tokio::sync::mpsc::channel::<OutputEvent>(16384); // Use config value
        state.output_rx = Some(rx);
        return Ok(tx);
    }

    // Return a cloned sender (we need to get it from manager or store it)
    // For simplicity, recreate channel each time - manager will handle multiple subscribers
    let (tx, rx) = tokio::sync::mpsc::channel::<OutputEvent>(16384);
    state.output_rx = Some(rx);
    Ok(tx)
}

async fn handle_request(state: &mut ClientState, seq: u32, req: Request) -> Option<Response> {
    println!("[handler] Received request: {:?}", req);

    // Require authentication first
    if !state.authenticated {
        return match req {
            Request::Handshake { token, protocol_version } => {
                println!("[handler] Handshake: protocol_version={}, token_len={}", protocol_version, token.len());
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
                    println!("[handler] Auth failed for token");
                    return Some(Response::error(seq, "AUTH_FAILED", "Invalid token"));
                }

                println!("[handler] Auth succeeded");
                state.authenticated = true;

                Some(Response::Handshake {
                    protocol_version: PROTOCOL_VERSION,
                    daemon_version: DAEMON_VERSION.into(),
                    daemon_pid: std::process::id(),
                })
            }
            _ => Some(Response::error(seq, "NOT_AUTHENTICATED", "Send Handshake first")),
        };
    }

    let mgr = manager();

    match req {
        Request::Handshake { .. } => {
            Some(Response::error(seq, "ALREADY_AUTHENTICATED", "Already authenticated"))
        }

        Request::Create { options } => match mgr.create(options).await {
            Ok(id) => Some(Response::ok_session(seq, id)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::List => Some(Response::ok_sessions(seq, mgr.list().await)),

        Request::Attach { session } => {
            let Some(sess) = mgr.get(session).await else {
                return Some(Response::error(
                    seq,
                    "NOT_FOUND",
                    format!("Session {} not found", session),
                ));
            };

            if state.attached_sessions.insert(session) {
                let tx = match ensure_output_channel(state).await {
                    Ok(tx) => tx,
                    Err(e) => return Some(Response::error(seq, "SUBSCRIBE_FAILED", e)),
                };
                match mgr.add_session_subscriber(session, tx).await {
                    Ok(sub_id) => {
                        state.session_sub_ids.insert(session, sub_id);
                    }
                    Err(e) => return Some(Response::error(seq, e.code(), e.to_string())),
                }
            }

            let snapshot = sess.snapshot().await;
            Some(Response::ok_attach(seq, session, snapshot))
        }

        Request::Detach { session } => {
            if state.attached_sessions.remove(&session) {
                if let Some(sub_id) = state.session_sub_ids.remove(&session) {
                    mgr.remove_session_subscriber(session, sub_id).await;
                }
            }
            Some(Response::ok_session(seq, session))
        }

        Request::Kill { session } => {
            match mgr.kill(session).await {
                Ok(_) => Some(Response::ok_session(seq, session)),
                Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
            }
        }

        Request::KillAll => {
            let count = mgr.kill_all().await;
            Some(Response::ok_count(seq, count))
        }

        Request::Input { session, data } => {
            match mgr.get(session).await {
                Some(sess) => {
                    let _ = sess.pty.write(&data);
                    None // No response for input
                }
                None => Some(Response::error(
                    seq,
                    "NOT_FOUND",
                    format!("Session {} not found", session),
                )),
            }
        }

        Request::Resize { session, cols, rows } => {
            match mgr.resize(session, cols, rows).await {
                Ok(_) => None, // No response for resize
                Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
            }
        }

        Request::Signal { session, signal } => {
            match mgr.signal(session, &signal).await {
                Ok(_) => Some(Response::ok_session(seq, session)),
                Err(Error::Session(msg)) if msg.starts_with("unknown signal") => {
                    Some(Response::error(seq, "INVALID_SIGNAL", msg))
                }
                Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
            }
        }

        Request::ClearScrollback { session } => {
            match mgr.clear_scrollback(session).await {
                Ok(_) => Some(Response::ok_session(seq, session)),
                Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
            }
        }

        Request::Ack { .. } => {
            // ACK is no longer needed with tokio bounded channels
            // They handle backpressure automatically
            None
        }
    }
}
