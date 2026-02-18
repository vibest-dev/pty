use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const PROTOCOL_VERSION: u32 = 1;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionRole {
    Control,
    Stream,
}

impl Default for ConnectionRole {
    fn default() -> Self {
        Self::Control
    }
}

/// Client -> Server messages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Request {
    Handshake {
        token: String,
        protocol_version: u32,
        #[serde(default)]
        client_id: Option<String>,
        #[serde(default)]
        role: Option<ConnectionRole>,
    },
    Create {
        #[serde(flatten)]
        options: CreateOptions,
    },
    List,
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
    Input {
        session: u32,
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
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
    ClearScrollback {
        session: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestEnvelope {
    pub seq: u32,
    #[serde(flatten)]
    pub request: Request,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CreateOptions {
    #[serde(default)]
    pub cwd: Option<String>,
    #[serde(default)]
    pub cols: Option<u16>,
    #[serde(default)]
    pub rows: Option<u16>,
    #[serde(default)]
    pub env: Option<HashMap<String, String>>,
    #[serde(default)]
    pub shell: Option<String>,
    #[serde(default)]
    pub initial_commands: Option<Vec<String>>,
}

/// Server -> Client messages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Response {
    Handshake {
        seq: u32,
        protocol_version: u32,
        daemon_version: String,
        daemon_pid: u32,
    },
    Ok {
        seq: u32,
        #[serde(skip_serializing_if = "Option::is_none")]
        session: Option<u32>,
        #[serde(skip_serializing_if = "Option::is_none")]
        sessions: Option<Vec<SessionInfo>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        snapshot: Option<Snapshot>,
        #[serde(skip_serializing_if = "Option::is_none")]
        count: Option<u32>,
    },
    Error {
        seq: u32,
        code: String,
        message: String,
    },
    Output {
        session: u32,
        #[serde(with = "serde_bytes")]
        data: Vec<u8>,
    },
    Exit {
        session: u32,
        code: i32,
        #[serde(skip_serializing_if = "Option::is_none")]
        signal: Option<i32>,
    },
}

impl Response {
    pub fn ok_session(seq: u32, id: u32) -> Self {
        Self::Ok {
            seq,
            session: Some(id),
            sessions: None,
            snapshot: None,
            count: None,
        }
    }

    pub fn ok_sessions(seq: u32, list: Vec<SessionInfo>) -> Self {
        Self::Ok {
            seq,
            session: None,
            sessions: Some(list),
            snapshot: None,
            count: None,
        }
    }

    pub fn ok_attach(seq: u32, id: u32, snapshot: Snapshot) -> Self {
        Self::Ok {
            seq,
            session: Some(id),
            sessions: None,
            snapshot: Some(snapshot),
            count: None,
        }
    }

    pub fn error(seq: u32, code: impl Into<String>, message: impl Into<String>) -> Self {
        Self::Error {
            seq,
            code: code.into(),
            message: message.into(),
        }
    }

    pub fn ok_count(seq: u32, count: usize) -> Self {
        Self::Ok {
            seq,
            session: None,
            sessions: None,
            snapshot: None,
            count: Some(count as u32),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: u32,
    pub pid: i32,
    pub pts: String,
    pub is_alive: bool,
    pub created_at: String,
    pub last_attached_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub content: String,
    pub rehydrate: String,
    pub cols: u16,
    pub rows: u16,
    pub cursor_x: usize,
    pub cursor_y: usize,
    pub modes: TerminalModes,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cwd: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TerminalModes {
    #[serde(default)]
    pub application_cursor: bool,
    #[serde(default)]
    pub bracketed_paste: bool,
    #[serde(default)]
    pub mouse_tracking: bool,
    #[serde(default)]
    pub mouse_sgr: bool,
    #[serde(default)]
    pub focus_reporting: bool,
    #[serde(default)]
    pub alternate_screen: bool,
    #[serde(default)]
    pub cursor_visible: bool,
    #[serde(default)]
    pub auto_wrap: bool,
}

impl TerminalModes {
    pub fn to_rehydrate_sequence(&self) -> String {
        let mut seq = String::new();
        if self.application_cursor {
            seq.push_str("\x1b[?1h");
        }
        if self.bracketed_paste {
            seq.push_str("\x1b[?2004h");
        }
        if self.mouse_tracking {
            seq.push_str("\x1b[?1000h");
        }
        if self.mouse_sgr {
            seq.push_str("\x1b[?1006h");
        }
        if self.focus_reporting {
            seq.push_str("\x1b[?1004h");
        }
        if !self.cursor_visible {
            seq.push_str("\x1b[?25l");
        }
        if !self.auto_wrap {
            seq.push_str("\x1b[?7l");
        }
        seq
    }
}
