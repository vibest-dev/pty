//! Integration tests for the PTY daemon
//!
//! Each test spawns its own daemon instance with unique socket paths

use std::io::{Read, Write};
use std::os::unix::net::UnixStream;
use std::process::{Child, Command};
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Duration;
use std::{fs, thread};

use rmp_serde::{from_slice, to_vec_named};
use serde::{Deserialize, Serialize};

// Unique counter for test isolation
static TEST_COUNTER: AtomicU32 = AtomicU32::new(0);

fn get_test_paths() -> (String, String) {
    let id = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
    let socket = format!("/tmp/rust-pty-test-{}.sock", id);
    let token = format!("/tmp/rust-pty-test-{}.token", id);
    (socket, token)
}

const PROTOCOL_VERSION: u32 = 1;

// ============== Message Types ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Request {
    Handshake {
        token: String,
        protocol_version: u32,
    },
    Create {
        #[serde(skip_serializing_if = "Option::is_none")]
        cwd: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        cols: Option<u16>,
        #[serde(skip_serializing_if = "Option::is_none")]
        rows: Option<u16>,
        #[serde(skip_serializing_if = "Option::is_none")]
        initial_commands: Option<Vec<String>>,
    },
    List,
    Attach {
        session: u32,
    },
    Detach {
        session: u32,
    },
    Input {
        session: u32,
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
    Kill {
        session: u32,
    },
    KillAll,
    Resize {
        session: u32,
        cols: u16,
        rows: u16,
    },
    Signal {
        session: u32,
        signal: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RequestEnvelope {
    seq: u32,
    #[serde(flatten)]
    request: Request,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Response {
    Handshake {
        seq: u32,
        protocol_version: u32,
        daemon_version: String,
        daemon_pid: u32,
    },
    Ok {
        seq: u32,
        session: Option<u32>,
        sessions: Option<Vec<SessionInfo>>,
        count: Option<u32>,
    },
    Error {
        seq: u32,
        code: String,
        message: String,
    },
    #[allow(dead_code)]
    Output {
        session: u32,
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
    #[allow(dead_code)]
    Exit {
        session: u32,
        code: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SessionInfo {
    id: u32,
    #[allow(dead_code)]
    pid: i32,
    #[allow(dead_code)]
    pts: String,
    is_alive: bool,
}

// ============== Test Helpers ==============

struct TestDaemon {
    child: Child,
    socket_path: String,
    token_path: String,
}

impl TestDaemon {
    fn start() -> Self {
        let (socket_path, token_path) = get_test_paths();

        // Cleanup
        let _ = fs::remove_file(&socket_path);
        let _ = fs::remove_file(&token_path);

        let child = Command::new(env!("CARGO_BIN_EXE_vibest-pty-daemon"))
            .env("RUST_PTY_SOCKET_PATH", &socket_path)
            .env("RUST_PTY_TOKEN_PATH", &token_path)
            .spawn()
            .expect("Failed to start daemon");

        // Wait for socket
        for _ in 0..50 {
            if fs::metadata(&socket_path).is_ok() {
                break;
            }
            thread::sleep(Duration::from_millis(100));
        }

        thread::sleep(Duration::from_millis(200));

        Self {
            child,
            socket_path,
            token_path,
        }
    }

    fn client(&self) -> TestClient {
        TestClient::connect(&self.socket_path, &self.token_path)
    }
}

impl Drop for TestDaemon {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
        let _ = fs::remove_file(&self.socket_path);
        let _ = fs::remove_file(&self.token_path);
        let _ = fs::remove_file(format!(
            "{}.pid",
            self.socket_path.trim_end_matches(".sock")
        ));
    }
}

struct TestClient {
    stream: UnixStream,
    token_path: String,
    next_seq: u32,
}

impl TestClient {
    fn connect(socket_path: &str, token_path: &str) -> Self {
        let stream = UnixStream::connect(socket_path).expect("Failed to connect");
        // Set blocking mode and longer timeout
        stream.set_nonblocking(false).unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(30)))
            .unwrap();
        Self {
            stream,
            token_path: token_path.to_string(),
            next_seq: 1,
        }
    }

    fn send(&mut self, req: &Request) -> u32 {
        let seq = self.next_seq;
        self.next_seq += 1;
        self.send_with_seq(req, seq)
    }

    fn send_with_seq(&mut self, req: &Request, seq: u32) -> u32 {
        let payload = to_vec_named(&RequestEnvelope {
            seq,
            request: req.clone(),
        })
        .unwrap();
        let len = (payload.len() as u32).to_be_bytes();
        self.stream.write_all(&len).unwrap();
        self.stream.write_all(&payload).unwrap();
        self.stream.flush().unwrap();
        seq
    }

    fn recv(&mut self) -> Response {
        let mut len_buf = [0u8; 4];
        self.stream.read_exact(&mut len_buf).unwrap();
        let len = u32::from_be_bytes(len_buf) as usize;

        let mut payload = vec![0u8; len];
        self.stream.read_exact(&mut payload).unwrap();

        from_slice(&payload).unwrap()
    }

    fn recv_with_timeout(&mut self, timeout: Duration) -> Option<Response> {
        self.stream.set_read_timeout(Some(timeout)).unwrap();

        let result: std::io::Result<Response> = (|| -> std::io::Result<Response> {
            let mut len_buf = [0u8; 4];
            self.stream.read_exact(&mut len_buf)?;
            let len = u32::from_be_bytes(len_buf) as usize;
            let mut payload = vec![0u8; len];
            self.stream.read_exact(&mut payload)?;
            Ok(from_slice(&payload).unwrap())
        })();

        // Restore the default timeout used by all existing integration tests.
        self.stream
            .set_read_timeout(Some(Duration::from_secs(30)))
            .unwrap();

        match result {
            Ok(response) => Some(response),
            Err(err)
                if err.kind() == std::io::ErrorKind::WouldBlock
                    || err.kind() == std::io::ErrorKind::TimedOut =>
            {
                None
            }
            Err(err) => panic!("Failed to read response: {}", err),
        }
    }

    fn try_recv(&mut self) -> Option<Response> {
        let mut len_buf = [0u8; 4];
        match self.stream.read_exact(&mut len_buf) {
            Ok(_) => {}
            Err(err) => match err.kind() {
                std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut => return None,
                _ => panic!("Failed to read frame length: {}", err),
            },
        }
        let len = u32::from_be_bytes(len_buf) as usize;

        let mut payload = vec![0u8; len];
        self.stream.read_exact(&mut payload).unwrap();

        Some(from_slice(&payload).unwrap())
    }

    fn set_read_timeout(&self, timeout: Option<Duration>) {
        self.stream.set_read_timeout(timeout).unwrap();
    }

    fn authenticate(&mut self) {
        let token = fs::read_to_string(&self.token_path)
            .expect("Cannot read token")
            .trim()
            .to_string();

        self.send(&Request::Handshake {
            token,
            protocol_version: PROTOCOL_VERSION,
        });

        match self.recv() {
            Response::Handshake { seq, .. } => {
                assert_eq!(seq, 1);
            }
            resp => panic!("Expected Handshake response, got {:?}", resp),
        }
    }
}

// ============== Unit Tests ==============

#[cfg(test)]
mod unit_tests {
    use super::*;

    #[test]
    fn test_request_serialization() {
        let req = Request::Create {
            cwd: Some("/tmp".into()),
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        };

        let bytes = to_vec_named(&req).unwrap();
        let decoded: Request = from_slice(&bytes).unwrap();

        match decoded {
            Request::Create { cwd, cols, .. } => {
                assert_eq!(cwd, Some("/tmp".into()));
                assert_eq!(cols, Some(80));
            }
            _ => panic!("Wrong type"),
        }
    }

    #[test]
    fn test_response_deserialization() {
        let resp = Response::Ok {
            seq: 1,
            session: Some(1),
            sessions: None,
            count: None,
        };

        let bytes = to_vec_named(&resp).unwrap();
        let decoded: Response = from_slice(&bytes).unwrap();

        match decoded {
            Response::Ok { session, .. } => assert_eq!(session, Some(1)),
            _ => panic!("Wrong type"),
        }
    }
}

// ============== Integration Tests ==============

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_handshake_authentication() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();

        let token = fs::read_to_string(&daemon.token_path)
            .unwrap()
            .trim()
            .to_string();
        client.send(&Request::Handshake {
            token,
            protocol_version: PROTOCOL_VERSION,
        });

        match client.recv() {
            Response::Handshake {
                seq,
                protocol_version,
                daemon_version,
                ..
            } => {
                assert_eq!(seq, 1);
                assert_eq!(protocol_version, PROTOCOL_VERSION);
                assert!(!daemon_version.is_empty());
            }
            resp => panic!("Expected Handshake, got {:?}", resp),
        }
    }

    #[test]
    fn test_invalid_token() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();

        client.send(&Request::Handshake {
            token: "invalid_token".into(),
            protocol_version: PROTOCOL_VERSION,
        });

        match client.recv() {
            Response::Error { code, .. } => {
                assert_eq!(code, "AUTH_FAILED");
            }
            resp => panic!("Expected Error, got {:?}", resp),
        }
    }

    #[test]
    fn test_protocol_version_mismatch() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();

        let token = fs::read_to_string(&daemon.token_path)
            .unwrap()
            .trim()
            .to_string();
        client.send(&Request::Handshake {
            token,
            protocol_version: 999,
        });

        match client.recv() {
            Response::Error { code, .. } => {
                assert_eq!(code, "PROTOCOL_MISMATCH");
            }
            resp => panic!("Expected Error, got {:?}", resp),
        }
    }

    #[test]
    fn test_create_session() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        client.send(&Request::Create {
            cwd: Some("/tmp".into()),
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });

        match client.recv() {
            Response::Ok { session, .. } => {
                assert!(session.is_some());
                let id = session.unwrap();
                assert!(id > 0);
            }
            resp => panic!("Expected Ok, got {:?}", resp),
        }
    }

    #[test]
    fn test_create_rejects_zero_dimensions() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        client.send(&Request::Create {
            cwd: None,
            cols: Some(0),
            rows: Some(24),
            initial_commands: None,
        });

        match client.recv() {
            Response::Error { code, .. } => {
                assert_eq!(code, "INVALID_ARGUMENT");
            }
            resp => panic!("Expected Error, got {:?}", resp),
        }
    }

    #[test]
    fn test_list_sessions() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create a session
        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let _ = client.recv();

        // List sessions
        client.send(&Request::List);

        match client.recv() {
            Response::Ok { sessions, .. } => {
                assert!(sessions.is_some());
                let list = sessions.unwrap();
                assert_eq!(list.len(), 1);
                assert!(list[0].is_alive);
            }
            resp => panic!("Expected Ok, got {:?}", resp),
        }
    }

    #[test]
    fn test_seq_roundtrip() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        let sent_seq = client.send(&Request::List);
        match client.recv() {
            Response::Ok { seq, .. } => assert_eq!(seq, sent_seq),
            resp => panic!("Expected Ok, got {:?}", resp),
        }
    }

    #[test]
    fn test_kill_session() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create
        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let session_id = match client.recv() {
            Response::Ok { session, .. } => session.unwrap(),
            _ => panic!("Create failed"),
        };

        // Kill
        client.send(&Request::Kill {
            session: session_id,
        });

        match client.recv() {
            Response::Ok { session, .. } => {
                assert_eq!(session, Some(session_id));
            }
            resp => panic!("Expected Ok, got {:?}", resp),
        }

        // Verify empty
        client.send(&Request::List);
        match client.recv() {
            Response::Ok { sessions, .. } => {
                assert!(sessions.unwrap().is_empty());
            }
            _ => panic!("List failed"),
        }
    }

    #[test]
    fn test_kill_emits_exit_event_for_attached_client() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let session_id = match client.recv() {
            Response::Ok { session, .. } => session.expect("session id"),
            resp => panic!("Create failed: {:?}", resp),
        };

        client.send(&Request::Attach {
            session: session_id,
        });
        match client.recv() {
            Response::Ok { session, .. } => assert_eq!(session, Some(session_id)),
            resp => panic!("Attach failed: {:?}", resp),
        }

        client.send(&Request::Kill {
            session: session_id,
        });
        match client.recv() {
            Response::Ok { session, .. } => assert_eq!(session, Some(session_id)),
            resp => panic!("Kill failed: {:?}", resp),
        }

        match client.recv_with_timeout(Duration::from_secs(2)) {
            Some(Response::Exit { session, .. }) => assert_eq!(session, session_id),
            other => panic!("Expected Exit event after kill, got {:?}", other),
        }
    }

    #[test]
    fn test_signal_session() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create
        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let session_id = match client.recv() {
            Response::Ok { session, .. } => session.unwrap(),
            _ => panic!("Create failed"),
        };

        // Signal
        client.send(&Request::Signal {
            session: session_id,
            signal: "SIGINT".into(),
        });

        match client.recv() {
            Response::Ok { session, .. } => {
                assert_eq!(session, Some(session_id));
            }
            resp => panic!("Expected Ok, got {:?}", resp),
        }
    }

    #[test]
    fn test_kill_all() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create multiple sessions
        for _ in 0..3 {
            client.send(&Request::Create {
                cwd: None,
                cols: Some(80),
                rows: Some(24),
                initial_commands: None,
            });
            let _ = client.recv();
        }

        // Kill all
        client.send(&Request::KillAll);
        match client.recv() {
            Response::Ok { count, .. } => {
                assert_eq!(count, Some(3)); // Killed 3
            }
            _ => panic!("Kill all failed"),
        }

        // Verify empty
        client.send(&Request::List);
        match client.recv() {
            Response::Ok { sessions, .. } => {
                assert!(sessions.unwrap().is_empty());
            }
            _ => panic!("List failed"),
        }
    }

    #[test]
    fn test_single_client_attach_multiple_sessions_receives_both_streams() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        let create_session = |client: &mut TestClient| -> u32 {
            client.send(&Request::Create {
                cwd: None,
                cols: Some(80),
                rows: Some(24),
                initial_commands: None,
            });
            match client.recv() {
                Response::Ok { session, .. } => session.expect("session id"),
                resp => panic!("Create failed: {:?}", resp),
            }
        };

        let session1 = create_session(&mut client);
        let session2 = create_session(&mut client);

        for session in [session1, session2] {
            client.send(&Request::Attach { session });
            match client.recv() {
                Response::Ok {
                    session: Some(attached),
                    ..
                } => assert_eq!(attached, session),
                resp => panic!("Attach failed: {:?}", resp),
            }
        }

        let input1_seq = client.send(&Request::Input {
            session: session1,
            data: b"printf '__S1__\\n'\n".to_vec(),
        });
        let mut buffered_outputs: Vec<(u32, String)> = vec![];
        let wait_for_input_ack = |client: &mut TestClient,
                                  expected_seq: u32,
                                  expected_session: u32,
                                  buffered_outputs: &mut Vec<(u32, String)>| {
            for _ in 0..80 {
                let Some(resp) = client.recv_with_timeout(Duration::from_millis(100)) else {
                    continue;
                };
                match resp {
                    Response::Ok { seq, session, .. } if seq == expected_seq => {
                        assert_eq!(session, Some(expected_session));
                        return;
                    }
                    Response::Output { session, data } => {
                        buffered_outputs.push((session, String::from_utf8_lossy(&data).to_string()));
                    }
                    _ => {}
                }
            }
            panic!(
                "timed out waiting for input ack seq={} session={}",
                expected_seq, expected_session
            );
        };
        wait_for_input_ack(&mut client, input1_seq, session1, &mut buffered_outputs);

        let input2_seq = client.send(&Request::Input {
            session: session2,
            data: b"printf '__S2__\\n'\n".to_vec(),
        });
        wait_for_input_ack(&mut client, input2_seq, session2, &mut buffered_outputs);

        client.set_read_timeout(Some(Duration::from_millis(300)));

        let mut saw_session1 = buffered_outputs
            .iter()
            .any(|(session, text)| *session == session1 && text.contains("__S1__"));
        let mut saw_session2 = buffered_outputs
            .iter()
            .any(|(session, text)| *session == session2 && text.contains("__S2__"));

        for _ in 0..40 {
            let Some(resp) = client.try_recv() else {
                continue;
            };
            if let Response::Output { session, data } = resp {
                let text = String::from_utf8_lossy(&data);
                if session == session1 && text.contains("__S1__") {
                    saw_session1 = true;
                }
                if session == session2 && text.contains("__S2__") {
                    saw_session2 = true;
                }
                if saw_session1 && saw_session2 {
                    break;
                }
            }
        }

        assert!(saw_session1, "missing output from session {}", session1);
        assert!(saw_session2, "missing output from session {}", session2);
    }

    #[test]
    fn test_concurrent_clients() {
        let daemon = TestDaemon::start();

        let socket_path = daemon.socket_path.clone();
        let token_path = daemon.token_path.clone();

        let handles: Vec<_> = (0..5)
            .map(|i| {
                let sp = socket_path.clone();
                let tp = token_path.clone();
                thread::spawn(move || {
                    let mut client = TestClient::connect(&sp, &tp);
                    client.authenticate();

                    // Create session
                    client.send(&Request::Create {
                        cwd: None,
                        cols: Some(80),
                        rows: Some(24),
                        initial_commands: None,
                    });

                    match client.recv() {
                        Response::Ok { session, .. } => session.unwrap(),
                        _ => panic!("Create failed in thread {}", i),
                    }
                })
            })
            .collect();

        for handle in handles {
            handle.join().unwrap();
        }

        // Verify all created
        let mut client = daemon.client();
        client.authenticate();
        client.send(&Request::List);

        match client.recv() {
            Response::Ok { sessions, .. } => {
                assert_eq!(sessions.unwrap().len(), 5);
            }
            _ => panic!("List failed"),
        }
    }

    #[test]
    fn test_session_cannot_be_attached_by_multiple_clients() {
        let daemon = TestDaemon::start();

        let mut owner = daemon.client();
        owner.authenticate();

        owner.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let session_id = match owner.recv() {
            Response::Ok { session, .. } => session.expect("session id"),
            resp => panic!("Create failed: {:?}", resp),
        };

        owner.send(&Request::Attach { session: session_id });
        match owner.recv() {
            Response::Ok {
                session: Some(attached),
                ..
            } => assert_eq!(attached, session_id),
            resp => panic!("Owner attach failed: {:?}", resp),
        }

        let mut other = daemon.client();
        other.authenticate();
        other.send(&Request::Attach { session: session_id });

        match other.recv() {
            Response::Error { code, .. } => assert_eq!(code, "ALREADY_ATTACHED"),
            resp => panic!("Expected ALREADY_ATTACHED error, got {:?}", resp),
        }
    }

    #[test]
    fn test_input_returns_ok() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let session_id = match client.recv() {
            Response::Ok { session, .. } => session.expect("session id"),
            resp => panic!("Create failed: {:?}", resp),
        };

        client.send(&Request::Input {
            session: session_id,
            data: b"echo hello\n".to_vec(),
        });
        match client.recv() {
            Response::Ok { session, .. } => assert_eq!(session, Some(session_id)),
            resp => panic!("Expected input ack, got {:?}", resp),
        }
    }

    #[test]
    fn test_resize_returns_ok() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            initial_commands: None,
        });
        let session_id = match client.recv() {
            Response::Ok { session, .. } => session.expect("session id"),
            resp => panic!("Create failed: {:?}", resp),
        };

        client.send(&Request::Resize {
            session: session_id,
            cols: 120,
            rows: 40,
        });
        match client.recv() {
            Response::Ok { session, .. } => assert_eq!(session, Some(session_id)),
            resp => panic!("Expected resize ack, got {:?}", resp),
        }
    }
}
