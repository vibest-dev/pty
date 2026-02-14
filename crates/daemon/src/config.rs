use std::sync::OnceLock;

pub struct Config {
    pub socket_path: String,
    pub token_path: String,
    pub pid_path: String,
    pub max_connections: u32,
    pub max_sessions: usize,
    pub scrollback_lines: usize,
    pub flow_max_queue_size: usize, // Channel capacity (default 16384)
    pub coalesce_delay_ms: u64,     // Output coalescing window (default 3ms)
}

fn default_base_dir() -> String {
    std::env::var("HOME")
        .map(|home| format!("{}/.vibest/pty", home))
        .unwrap_or_else(|_| "/tmp/.vibest/pty".into())
}

impl Config {
    fn from_env() -> Self {
        let base_dir = default_base_dir();
        let socket_path = std::env::var("RUST_PTY_SOCKET_PATH")
            .unwrap_or_else(|_| format!("{}/socket", base_dir));

        let token_path =
            std::env::var("RUST_PTY_TOKEN_PATH").unwrap_or_else(|_| format!("{}/token", base_dir));

        let pid_path = format!("{}.pid", socket_path.trim_end_matches(".sock"));

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

        let flow_max_queue_size = std::env::var("RUST_PTY_FLOW_MAX_QUEUE_SIZE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(16384);

        let coalesce_delay_ms = std::env::var("RUST_PTY_COALESCE_DELAY_MS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3);

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
            flow_max_queue_size,
            coalesce_delay_ms,
        }
    }
}

static CONFIG: OnceLock<Config> = OnceLock::new();

pub fn config() -> &'static Config {
    CONFIG.get_or_init(Config::from_env)
}
