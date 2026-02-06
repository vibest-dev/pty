use std::fmt;

#[derive(Debug)]
#[allow(dead_code)]
pub enum Error {
    Io(std::io::Error),
    Protocol(String),
    Auth(String),
    Session(String),
    NotFound(String),
    LimitReached(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(e) => write!(f, "IO error: {}", e),
            Self::Protocol(msg) => write!(f, "Protocol error: {}", msg),
            Self::Auth(msg) => write!(f, "Auth error: {}", msg),
            Self::Session(msg) => write!(f, "Session error: {}", msg),
            Self::NotFound(msg) => write!(f, "Not found: {}", msg),
            Self::LimitReached(msg) => write!(f, "Limit reached: {}", msg),
        }
    }
}

impl std::error::Error for Error {}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Self {
        Self::Io(e)
    }
}

impl Error {
    pub fn code(&self) -> &'static str {
        match self {
            Self::Io(_) => "IO_ERROR",
            Self::Protocol(_) => "PROTOCOL_ERROR",
            Self::Auth(_) => "AUTH_FAILED",
            Self::Session(_) => "SESSION_ERROR",
            Self::NotFound(_) => "NOT_FOUND",
            Self::LimitReached(_) => "LIMIT_REACHED",
        }
    }
}

pub type Result<T> = std::result::Result<T, Error>;
