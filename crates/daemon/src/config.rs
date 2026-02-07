use std::sync::OnceLock;

#[allow(dead_code)]
pub struct Config {
    pub socket_path: String,
    pub token_path: String,
    pub pid_path: String,
    pub max_connections: u32,
    pub max_sessions: usize,
    pub scrollback_lines: usize,
    // Flow control settings
    pub flow_yellow_threshold: usize,
    pub flow_red_threshold: usize,
    pub flow_yellow_interval_ms: u64,
    pub flow_red_interval_ms: u64,
    pub flow_auto_disconnect: bool,
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

        let flow_yellow_threshold = std::env::var("RUST_PTY_FLOW_YELLOW_THRESHOLD")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(1024);

        let flow_red_threshold = std::env::var("RUST_PTY_FLOW_RED_THRESHOLD")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(4096);

        let flow_yellow_interval_ms = std::env::var("RUST_PTY_FLOW_YELLOW_INTERVAL_MS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(10);

        let flow_red_interval_ms = std::env::var("RUST_PTY_FLOW_RED_INTERVAL_MS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(100);

        let flow_auto_disconnect = std::env::var("RUST_PTY_FLOW_AUTO_DISCONNECT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(false);

        // Validation
        if flow_yellow_threshold >= flow_red_threshold {
            panic!(
                "Invalid flow control config: yellow threshold ({}) must be < red threshold ({})",
                flow_yellow_threshold, flow_red_threshold
            );
        }

        if flow_yellow_threshold == 0 {
            panic!("Invalid flow control config: yellow threshold must be > 0");
        }

        if flow_yellow_interval_ms == 0 || flow_red_interval_ms == 0 {
            panic!("Invalid flow control config: intervals must be > 0");
        }

        if flow_yellow_interval_ms >= flow_red_interval_ms {
            eprintln!(
                "[WARN] Yellow interval ({} ms) >= red interval ({} ms). Red zone will not be more restrictive.",
                flow_yellow_interval_ms, flow_red_interval_ms
            );
        }

        Self {
            socket_path,
            token_path,
            pid_path,
            max_connections,
            max_sessions,
            scrollback_lines,
            flow_yellow_threshold,
            flow_red_threshold,
            flow_yellow_interval_ms,
            flow_red_interval_ms,
            flow_auto_disconnect,
        }
    }
}

static CONFIG: OnceLock<Config> = OnceLock::new();

pub fn config() -> &'static Config {
    CONFIG.get_or_init(Config::from_env)
}
