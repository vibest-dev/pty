use crate::config::config;
use crate::error::Result;
use rand::Rng;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::path::Path;
use std::sync::OnceLock;

static TOKEN: OnceLock<String> = OnceLock::new();

pub fn init() -> Result<()> {
    let _ = get_token()?;
    Ok(())
}

pub fn validate(token: &str) -> bool {
    TOKEN
        .get()
        .map(|expected| constant_time_eq(token.as_bytes(), expected.as_bytes()))
        .unwrap_or(false)
}

pub fn cleanup() {
    let _ = fs::remove_file(&config().token_path);
}

fn get_token() -> Result<&'static str> {
    if TOKEN.get().is_none() {
        let token = load_or_create()?;
        let _ = TOKEN.set(token);
    }
    Ok(TOKEN.get().unwrap())
}

fn load_or_create() -> Result<String> {
    let path = &config().token_path;
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent)?;
        let _ = fs::set_permissions(parent, fs::Permissions::from_mode(0o700));
    }

    // Try existing token
    if Path::new(path).exists() {
        if let Ok(token) = fs::read_to_string(path) {
            let token = token.trim().to_string();
            if token.len() == 64 {
                return Ok(token);
            }
        }
    }

    // Generate new
    let token: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(64)
        .map(char::from)
        .collect();

    fs::write(path, &token)?;
    fs::set_permissions(path, fs::Permissions::from_mode(0o600))?;

    eprintln!("[auth] Generated new token at {}", path);
    Ok(token)
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}
