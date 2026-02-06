use std::sync::OnceLock;

#[allow(dead_code)]
pub struct Config {
    pub socket_path: String,
    pub token_path: String,
    pub pid_path: String,
    pub max_connections: u32,
    pub max_sessions: usize,
    pub scrollback_lines: usize,
}

impl Config {
    fn from_env() -> Self {
        let socket_path = std::env::var("RUST_PTY_SOCKET_PATH")
            .unwrap_or_else(|_| "/tmp/rust-pty.sock".into());

        let token_path = std::env::var("RUST_PTY_TOKEN_PATH")
            .unwrap_or_else(|_| "/tmp/rust-pty.token".into());

        let pid_path = format!(
            "{}.pid",
            socket_path.trim_end_matches(".sock")
        );

        let max_connections = std::env::var("RUST_PTY_MAX_CONNECTIONS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(128);

        let max_sessions = std::env::var("RUST_PTY_MAX_SESSIONS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(64);

        let scrollback_lines = std::env::var("RUST_PTY_SCROLLBACK_LINES")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(10000);

        Self {
            socket_path,
            token_path,
            pid_path,
            max_connections,
            max_sessions,
            scrollback_lines,
        }
    }
}

static CONFIG: OnceLock<Config> = OnceLock::new();

pub fn config() -> &'static Config {
    CONFIG.get_or_init(Config::from_env)
}
