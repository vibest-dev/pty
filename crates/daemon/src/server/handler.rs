use crate::auth;
use crate::config::config;
use crate::error::Error;
use crate::protocol::{
    read_message_async, write_message_async, Request, RequestEnvelope, Response, PROTOCOL_VERSION,
};
use crate::session::{manager, OutputEvent};
use std::collections::HashSet;
use tokio_stream::{wrappers::ReceiverStream, StreamExt, StreamMap};

const DAEMON_VERSION: &str = env!("CARGO_PKG_VERSION");

struct ClientState {
    authenticated: bool,
    /// Sessions attached by this client connection.
    attached_sessions: HashSet<u32>,
    /// Per-session output streams.
    output_streams: StreamMap<u32, ReceiverStream<OutputEvent>>,
}

impl Default for ClientState {
    fn default() -> Self {
        Self {
            authenticated: false,
            attached_sessions: HashSet::new(),
            output_streams: StreamMap::new(),
        }
    }
}

fn add_session_output_channel(
    state: &mut ClientState,
    session_id: u32,
) -> tokio::sync::mpsc::Sender<OutputEvent> {
    let (tx, rx) = tokio::sync::mpsc::channel::<OutputEvent>(config().flow_max_queue_size);
    state
        .output_streams
        .insert(session_id, ReceiverStream::new(rx));
    tx
}

fn output_event_to_response(event: OutputEvent) -> Response {
    match event {
        OutputEvent::Data { session, data } => Response::Output { session, data },
        OutputEvent::Exit {
            session,
            code,
            signal,
        } => Response::Exit {
            session,
            code,
            signal,
        },
        OutputEvent::BackpressureWarning {
            session,
            queue_size,
            level,
        } => Response::BackpressureWarning {
            session,
            queue_size,
            level,
        },
    }
}

pub async fn handle_connection(stream: tokio::net::UnixStream) {
    let mut state = ClientState::default();
    let mut stream = stream;

    loop {
        tokio::select! {
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

            output = async {
                if state.output_streams.is_empty() {
                    std::future::pending().await
                } else {
                    state.output_streams.next().await
                }
            } => {
                if let Some((_session_id, event)) = output {
                    let response = output_event_to_response(event);
                    if write_message_async::<Response>(&mut stream, &response).await.is_err() {
                        break;
                    }
                }
            }
        }
    }

    cleanup(&mut state).await;
}

async fn cleanup(state: &mut ClientState) {
    for session_id in state.attached_sessions.drain() {
        manager().remove_session_subscriber(session_id).await;
    }
    state.output_streams.clear();
}

async fn handle_request(state: &mut ClientState, seq: u32, req: Request) -> Option<Response> {
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
                let tx = add_session_output_channel(state, session);
                match mgr.add_session_subscriber(session, tx).await {
                    Ok(_) => {}
                    Err(Error::Session(msg)) if msg.contains("already attached") => {
                        state.attached_sessions.remove(&session);
                        state.output_streams.remove(&session);
                        return Some(Response::error(seq, "ALREADY_ATTACHED", msg));
                    }
                    Err(e) => {
                        state.attached_sessions.remove(&session);
                        state.output_streams.remove(&session);
                        return Some(Response::error(seq, e.code(), e.to_string()));
                    }
                }
            }

            let snapshot = sess.snapshot().await;
            Some(Response::ok_attach(seq, session, snapshot))
        }

        Request::Detach { session } => {
            if state.attached_sessions.remove(&session) {
                mgr.remove_session_subscriber(session).await;
                state.output_streams.remove(&session);
            }
            Some(Response::ok_session(seq, session))
        }

        Request::Kill { session } => match mgr.kill(session).await {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

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

        Request::Resize {
            session,
            cols,
            rows,
        } => {
            match mgr.resize(session, cols, rows).await {
                Ok(_) => None, // No response for resize
                Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
            }
        }

        Request::Signal { session, signal } => match mgr.signal(session, &signal).await {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(Error::Session(msg)) if msg.starts_with("unknown signal") => {
                Some(Response::error(seq, "INVALID_SIGNAL", msg))
            }
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::ClearScrollback { session } => match mgr.clear_scrollback(session).await {
            Ok(_) => Some(Response::ok_session(seq, session)),
            Err(e) => Some(Response::error(seq, e.code(), e.to_string())),
        },

        Request::Ack { .. } => {
            // ACK is no longer needed with tokio bounded channels
            // They handle backpressure automatically
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protocol::CreateOptions;

    #[tokio::test]
    async fn one_session_queue_full_must_not_block_other_session() {
        let mut state = ClientState::default();

        let tx1 = add_session_output_channel(&mut state, 1);
        let tx2 = add_session_output_channel(&mut state, 2);

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

    #[tokio::test]
    async fn multiple_session_channels_remain_active() {
        let mut state = ClientState::default();

        let tx1 = add_session_output_channel(&mut state, 1);
        let tx2 = add_session_output_channel(&mut state, 2);

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

        let (_first_stream, first) = state.output_streams.next().await.expect("first event");
        let (_second_stream, second) = state.output_streams.next().await.expect("second event");

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

    #[tokio::test]
    async fn second_client_cannot_attach_same_session() {
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
            .await
            .expect("create session");

        let mut owner = ClientState::default();
        owner.authenticated = true;
        let mut other = ClientState::default();
        other.authenticated = true;

        let owner_attach = handle_request(
            &mut owner,
            1,
            Request::Attach {
                session: session_id,
            },
        )
        .await
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
        .await
        .expect("other attach response");
        match other_attach {
            Response::Error { code, .. } => assert_eq!(code, "ALREADY_ATTACHED"),
            resp => panic!("expected ALREADY_ATTACHED, got {:?}", resp),
        }

        cleanup(&mut owner).await;
        cleanup(&mut other).await;
        let _ = mgr.kill(session_id).await;
    }

    #[tokio::test]
    async fn cleanup_releases_attached_sessions() {
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
            .await
            .expect("create session");

        let mut owner = ClientState::default();
        owner.authenticated = true;
        let mut other = ClientState::default();
        other.authenticated = true;

        let owner_attach = handle_request(
            &mut owner,
            1,
            Request::Attach {
                session: session_id,
            },
        )
        .await
        .expect("owner attach response");
        assert!(
            matches!(owner_attach, Response::Ok { .. }),
            "owner must attach successfully"
        );

        cleanup(&mut owner).await;

        let other_attach = handle_request(
            &mut other,
            2,
            Request::Attach {
                session: session_id,
            },
        )
        .await
        .expect("other attach response");
        assert!(
            matches!(other_attach, Response::Ok { .. }),
            "session should be attachable after cleanup"
        );

        cleanup(&mut other).await;
        let _ = mgr.kill(session_id).await;
    }
}
