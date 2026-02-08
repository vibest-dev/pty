mod auth;
mod config;
mod error;
mod protocol;
mod server;
mod session;

use config::config;
use server::handle_connection;
use std::fs;
use std::os::unix::fs::{FileTypeExt, PermissionsExt};
use std::path::Path;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;

#[tokio::main]
async fn main() {
    let cfg = config();

    eprintln!(
        "[daemon] Rust PTY Daemon v{} starting...",
        env!("CARGO_PKG_VERSION")
    );

    // Initialize auth
    if let Err(e) = auth::init() {
        eprintln!("[daemon] Failed to init auth: {}", e);
        return;
    }

    // Prepare socket
    if let Err(e) = prepare_socket(&cfg.socket_path) {
        eprintln!("[daemon] Failed to prepare socket: {}", e);
        return;
    }

    // Bind using std::os::unix::net::UnixListener (for prepare_socket compatibility)
    let listener = match std::os::unix::net::UnixListener::bind(&cfg.socket_path) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[daemon] Failed to bind socket: {}", e);
            return;
        }
    };
    if let Err(e) = listener.set_nonblocking(true) {
        eprintln!("[daemon] Failed to set listener nonblocking: {}", e);
        return;
    }

    if let Err(e) = fs::set_permissions(&cfg.socket_path, fs::Permissions::from_mode(0o600)) {
        eprintln!("[daemon] Warning: failed to set socket permissions: {}", e);
    }

    // Write PID
    if let Err(e) = fs::write(&cfg.pid_path, std::process::id().to_string()) {
        eprintln!("[daemon] Warning: failed to write PID file: {}", e);
    }

    use tokio::signal::unix::{signal, SignalKind};
    let mut sigint = signal(SignalKind::interrupt()).expect("Failed to install SIGINT handler");
    let mut sigterm = signal(SignalKind::terminate()).expect("Failed to install SIGTERM handler");
    let mut sighup = signal(SignalKind::hangup()).expect("Failed to install SIGHUP handler");

    eprintln!("[daemon] Listening on {}", cfg.socket_path);
    eprintln!("[daemon] PID: {}", std::process::id());

    let active = Arc::new(AtomicU32::new(0));

    // Convert to tokio UnixListener
    let listener = tokio::net::UnixListener::from_std(listener).expect("Failed to convert listener");

    // Async accept loop - no polling needed!
    loop {
        tokio::select! {
            result = listener.accept() => {
                match result {
                    Ok((stream, _)) => {
                        let count = active.fetch_add(1, Ordering::SeqCst) + 1;

                        if count > cfg.max_connections {
                            active.fetch_sub(1, Ordering::SeqCst);
                            eprintln!("[daemon] Connection limit reached, rejecting");
                            continue;
                        }

                        let active = Arc::clone(&active);
                        tokio::spawn(async move {
                            handle_connection(stream).await;
                            active.fetch_sub(1, Ordering::SeqCst);
                        });
                    }
                    Err(e) => {
                        eprintln!("[daemon] Accept error: {}", e);
                    }
                }
            }
            _ = sigint.recv() => {
                eprintln!("[daemon] Received SIGINT, shutting down...");
                break;
            }
            _ = sigterm.recv() => {
                eprintln!("[daemon] Received SIGTERM, shutting down...");
                break;
            }
            _ = sighup.recv() => {
                eprintln!("[daemon] Received SIGHUP, shutting down...");
                break;
            }
        }
    }

    eprintln!("[daemon] Shutting down...");
    cleanup();
}

fn prepare_socket(path: &str) -> std::io::Result<()> {
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent)?;
        let _ = fs::set_permissions(parent, fs::Permissions::from_mode(0o700));
    }

    match fs::metadata(path) {
        Ok(meta) => {
            if meta.file_type().is_socket() {
                fs::remove_file(path)?;
            } else {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::AlreadyExists,
                    "path exists and is not a socket",
                ));
            }
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => return Err(e),
    }
    Ok(())
}

fn cleanup() {
    let cfg = config();
    let _ = fs::remove_file(&cfg.socket_path);
    let _ = fs::remove_file(&cfg.pid_path);
    auth::cleanup();
}
