use std::sync::OnceLock;

#[allow(dead_code)]
pub struct Config {
    pub socket_path: String,
    pub token_path: String,
    pub pid_path: String,
    pub max_connections: u32,
    pub max_sessions: usize,
    pub scrollback_lines: usize,
    // Simplified flow control settings
    pub flow_threshold: usize,          // Warning threshold (default 4096)
    pub flow_max_queue_size: usize,     // Channel capacity (default 16384)
    pub flow_auto_disconnect: bool,     // Disconnect on full (default false)
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

        // Simplified flow control configuration
        let flow_threshold = std::env::var("RUST_PTY_FLOW_THRESHOLD")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(4096);

        let flow_max_queue_size = std::env::var("RUST_PTY_FLOW_MAX_QUEUE_SIZE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(16384);

        let flow_auto_disconnect = std::env::var("RUST_PTY_FLOW_AUTO_DISCONNECT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(false);

        // Validation
        if flow_threshold >= flow_max_queue_size {
            panic!(
                "Invalid flow control config: threshold ({}) must be < max queue size ({})",
                flow_threshold, flow_max_queue_size
            );
        }

        if flow_threshold == 0 {
            panic!("Invalid flow control config: threshold must be > 0");
        }

        if flow_max_queue_size == 0 {
            panic!("Invalid flow control config: max queue size must be > 0");
        }

        Self {
            socket_path,
            token_path,
            pid_path,
            max_connections,
            max_sessions,
            scrollback_lines,
            flow_threshold,
            flow_max_queue_size,
            flow_auto_disconnect,
        }
    }
}

static CONFIG: OnceLock<Config> = OnceLock::new();

pub fn config() -> &'static Config {
    CONFIG.get_or_init(Config::from_env)
}
