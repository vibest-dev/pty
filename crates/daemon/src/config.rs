use std::sync::OnceLock;

pub struct Config {
    pub socket_path: String,
    pub token_path: String,
    pub pid_path: String,
    pub max_connections: u32,
    pub max_sessions: usize,
    pub scrollback_lines: usize,
    pub session_event_queue_capacity: usize,
    pub client_write_queue_bytes: usize,
    pub input_queue_max_bytes: usize,
    pub coalesce_delay_ms: u64,
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

        // Legacy compatibility knob from older builds. Keep accepted, but
        // split queue sizing by unit (events vs bytes) in newer settings.
        let legacy_flow_max_queue_size = std::env::var("RUST_PTY_FLOW_MAX_QUEUE_SIZE")
            .ok()
            .and_then(|v| v.parse().ok())
            .filter(|v: &usize| *v > 0);

        let session_event_queue_capacity = std::env::var("RUST_PTY_SESSION_EVENT_QUEUE_CAPACITY")
            .ok()
            .and_then(|v| v.parse().ok())
            .filter(|v: &usize| *v > 0)
            .or(legacy_flow_max_queue_size)
            .unwrap_or(1024);

        let client_write_queue_bytes = std::env::var("RUST_PTY_CLIENT_MAX_WRITE_QUEUE_BYTES")
            .ok()
            .and_then(|v| v.parse().ok())
            .filter(|v: &usize| *v > 0)
            .or(legacy_flow_max_queue_size)
            .unwrap_or(2_000_000);

        let input_queue_max_bytes = std::env::var("RUST_PTY_INPUT_QUEUE_MAX_BYTES")
            .ok()
            .and_then(|v| v.parse().ok())
            .filter(|v: &usize| *v > 0)
            .unwrap_or(2_000_000);

        let coalesce_delay_ms = std::env::var("RUST_PTY_COALESCE_DELAY_MS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3);

        if session_event_queue_capacity == 0 {
            panic!("Invalid config: session event queue capacity must be > 0");
        }

        if client_write_queue_bytes == 0 {
            panic!("Invalid config: client write queue bytes must be > 0");
        }

        if input_queue_max_bytes == 0 {
            panic!("Invalid config: input queue max bytes must be > 0");
        }

        Self {
            socket_path,
            token_path,
            pid_path,
            max_connections,
            max_sessions,
            scrollback_lines,
            session_event_queue_capacity,
            client_write_queue_bytes,
            input_queue_max_bytes,
            coalesce_delay_ms,
        }
    }
}

static CONFIG: OnceLock<Config> = OnceLock::new();

pub fn config() -> &'static Config {
    CONFIG.get_or_init(Config::from_env)
}
