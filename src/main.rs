mod auth;
mod config;
mod error;
mod protocol;
mod server;
mod session;

use config::config;
use server::serve;
use std::fs;
use std::os::unix::fs::{FileTypeExt, PermissionsExt};
use std::os::unix::net::UnixListener;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;

static SHUTDOWN: AtomicBool = AtomicBool::new(false);

fn main() {
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

    // Bind
    let listener = match UnixListener::bind(&cfg.socket_path) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("[daemon] Failed to bind socket: {}", e);
            return;
        }
    };

    if let Err(e) = fs::set_permissions(&cfg.socket_path, fs::Permissions::from_mode(0o600)) {
        eprintln!("[daemon] Warning: failed to set socket permissions: {}", e);
    }

    // Write PID
    if let Err(e) = fs::write(&cfg.pid_path, std::process::id().to_string()) {
        eprintln!("[daemon] Warning: failed to write PID file: {}", e);
    }

    install_signal_handlers();
    listener.set_nonblocking(true).ok();

    eprintln!("[daemon] Listening on {}", cfg.socket_path);
    eprintln!("[daemon] PID: {}", std::process::id());

    let active = Arc::new(AtomicU32::new(0));

    // Accept loop
    while !SHUTDOWN.load(Ordering::Relaxed) {
        match listener.accept() {
            Ok((stream, _)) => {
                let count = active.fetch_add(1, Ordering::SeqCst) + 1;

                if count > cfg.max_connections {
                    active.fetch_sub(1, Ordering::SeqCst);
                    eprintln!("[daemon] Connection limit reached, rejecting");
                    continue;
                }

                // Set stream to blocking mode for the handler thread
                stream.set_nonblocking(false).ok();
                
                let active = Arc::clone(&active);
                std::thread::spawn(move || {
                    serve(stream);
                    active.fetch_sub(1, Ordering::SeqCst);
                });
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            Err(e) => {
                eprintln!("[daemon] Accept error: {}", e);
            }
        }
    }

    eprintln!("[daemon] Shutting down...");
    cleanup();
}

fn prepare_socket(path: &str) -> std::io::Result<()> {
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

fn install_signal_handlers() {
    unsafe {
        libc::signal(libc::SIGINT, handle_signal as libc::sighandler_t);
        libc::signal(libc::SIGTERM, handle_signal as libc::sighandler_t);
        libc::signal(libc::SIGHUP, handle_signal as libc::sighandler_t);
    }
}

extern "C" fn handle_signal(_: libc::c_int) {
    SHUTDOWN.store(true, Ordering::SeqCst);
}

fn cleanup() {
    let cfg = config();
    let _ = fs::remove_file(&cfg.socket_path);
    let _ = fs::remove_file(&cfg.pid_path);
    auth::cleanup();
}
