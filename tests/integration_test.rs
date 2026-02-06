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

const PROTOCOL_VERSION: u32 = 2;

// ============== Message Types ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Request {
    Hello {
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
        workspace_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        pane_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        initial_commands: Option<Vec<String>>,
    },
    List,
    ListByWorkspace {
        workspace_id: String,
    },
    Attach {
        session: u32,
    },
    Detach {
        session: u32,
    },
    Kill {
        session: u32,
    },
    KillAll,
    KillByWorkspace {
        workspace_id: String,
    },
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
#[serde(tag = "type", rename_all = "snake_case")]
enum Response {
    Hello {
        protocol_version: u32,
        daemon_version: String,
        daemon_pid: u32,
    },
    Ok {
        session: Option<u32>,
        sessions: Option<Vec<SessionInfo>>,
    },
    Error {
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
    workspace_id: Option<String>,
    #[allow(dead_code)]
    pane_id: Option<String>,
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

        let child = Command::new(env!("CARGO_BIN_EXE_rust-daemon"))
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
        }
    }

    fn send(&mut self, req: &Request) {
        let payload = to_vec_named(req).unwrap();
        let len = (payload.len() as u32).to_be_bytes();
        self.stream.write_all(&len).unwrap();
        self.stream.write_all(&payload).unwrap();
        self.stream.flush().unwrap();
    }

    fn recv(&mut self) -> Response {
        let mut len_buf = [0u8; 4];
        self.stream.read_exact(&mut len_buf).unwrap();
        let len = u32::from_be_bytes(len_buf) as usize;

        let mut payload = vec![0u8; len];
        self.stream.read_exact(&mut payload).unwrap();

        from_slice(&payload).unwrap()
    }

    fn authenticate(&mut self) {
        let token = fs::read_to_string(&self.token_path)
            .expect("Cannot read token")
            .trim()
            .to_string();

        self.send(&Request::Hello {
            token,
            protocol_version: PROTOCOL_VERSION,
        });

        match self.recv() {
            Response::Hello { .. } => {}
            resp => panic!("Expected Hello response, got {:?}", resp),
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
            workspace_id: Some("ws1".into()),
            pane_id: None,
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
            session: Some(1),
            sessions: None,
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
    fn test_hello_authentication() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();

        let token = fs::read_to_string(&daemon.token_path)
            .unwrap()
            .trim()
            .to_string();
        client.send(&Request::Hello {
            token,
            protocol_version: PROTOCOL_VERSION,
        });

        match client.recv() {
            Response::Hello {
                protocol_version,
                daemon_version,
                ..
            } => {
                assert_eq!(protocol_version, PROTOCOL_VERSION);
                assert!(!daemon_version.is_empty());
            }
            resp => panic!("Expected Hello, got {:?}", resp),
        }
    }

    #[test]
    fn test_invalid_token() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();

        client.send(&Request::Hello {
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
        client.send(&Request::Hello {
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
            workspace_id: None,
            pane_id: None,
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
    fn test_list_sessions() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create a session
        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            workspace_id: None,
            pane_id: None,
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
    fn test_kill_session() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create
        client.send(&Request::Create {
            cwd: None,
            cols: Some(80),
            rows: Some(24),
            workspace_id: None,
            pane_id: None,
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
    fn test_multiple_workspaces() {
        let daemon = TestDaemon::start();
        let mut client = daemon.client();
        client.authenticate();

        // Create sessions in workspace A
        for _ in 0..2 {
            client.send(&Request::Create {
                cwd: Some("/tmp".into()),
                cols: Some(80),
                rows: Some(24),
                workspace_id: Some("workspace-a".into()),
                pane_id: None,
                initial_commands: None,
            });
            let _ = client.recv();
        }

        // Create sessions in workspace B
        for _ in 0..3 {
            client.send(&Request::Create {
                cwd: Some("/var".into()),
                cols: Some(80),
                rows: Some(24),
                workspace_id: Some("workspace-b".into()),
                pane_id: None,
                initial_commands: None,
            });
            let _ = client.recv();
        }

        // List all
        client.send(&Request::List);
        match client.recv() {
            Response::Ok { sessions, .. } => {
                assert_eq!(sessions.unwrap().len(), 5);
            }
            _ => panic!("List failed"),
        }

        // List workspace A
        client.send(&Request::ListByWorkspace {
            workspace_id: "workspace-a".into(),
        });
        match client.recv() {
            Response::Ok { sessions, .. } => {
                let list = sessions.unwrap();
                assert_eq!(list.len(), 2);
                for s in &list {
                    assert_eq!(s.workspace_id.as_deref(), Some("workspace-a"));
                }
            }
            _ => panic!("List by workspace failed"),
        }

        // Kill workspace B
        client.send(&Request::KillByWorkspace {
            workspace_id: "workspace-b".into(),
        });
        match client.recv() {
            Response::Ok { session, .. } => {
                assert_eq!(session, Some(3)); // Killed 3 sessions
            }
            _ => panic!("Kill by workspace failed"),
        }

        // Verify only workspace A remains
        client.send(&Request::List);
        match client.recv() {
            Response::Ok { sessions, .. } => {
                let list = sessions.unwrap();
                assert_eq!(list.len(), 2);
                for s in &list {
                    assert_eq!(s.workspace_id.as_deref(), Some("workspace-a"));
                }
            }
            _ => panic!("Final list failed"),
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
            workspace_id: None,
            pane_id: None,
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
                workspace_id: None,
                pane_id: None,
                initial_commands: None,
            });
            let _ = client.recv();
        }

        // Kill all
        client.send(&Request::KillAll);
        match client.recv() {
            Response::Ok { session, .. } => {
                assert_eq!(session, Some(3)); // Killed 3
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
                        workspace_id: Some(format!("worker-{}", i)),
                        pane_id: None,
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
}
