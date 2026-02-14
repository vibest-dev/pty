mod auth;
mod config;
mod error;
mod protocol;
mod server;
mod session;

use config::config;
use polling::{Event, Events, Poller};
use server::ClientState;
use session::manager::{Manager, MANAGER};
use std::collections::HashMap;
use std::fs;
use std::io;
use std::os::unix::fs::{FileTypeExt, PermissionsExt};
use std::os::unix::io::AsRawFd;
use std::os::unix::net::UnixListener;
use std::path::Path;
use std::time::Duration;

// Poller key assignments:
// 0            = Unix listener (accept)
// 1            = Shutdown signal pipe (SIGINT/SIGTERM/SIGHUP)
// 2            = SIGCHLD signal pipe
// 3            = Wakeup pipe (PTY reader data available)
// 100+         = Client connections (key = 100 + client_id)
const KEY_LISTENER: usize = 0;
const KEY_SIGNAL: usize = 1;
const KEY_SIGCHLD: usize = 2;
const KEY_WAKEUP: usize = 3;
const KEY_CLIENT_BASE: usize = 100;

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

    // Bind Unix listener
    let listener = match UnixListener::bind(&cfg.socket_path) {
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

    // Set up signal handling via self-pipe trick.
    let (signal_read, signal_write) = match std::os::unix::net::UnixStream::pair() {
        Ok(pair) => pair,
        Err(e) => {
            eprintln!("[daemon] Failed to create shutdown signal pipe: {}", e);
            return;
        }
    };
    let (sigchld_read, sigchld_write) = match std::os::unix::net::UnixStream::pair() {
        Ok(pair) => pair,
        Err(e) => {
            eprintln!("[daemon] Failed to create SIGCHLD signal pipe: {}", e);
            return;
        }
    };
    signal_read.set_nonblocking(true).unwrap();
    signal_write.set_nonblocking(true).unwrap();
    sigchld_read.set_nonblocking(true).unwrap();
    sigchld_write.set_nonblocking(true).unwrap();

    let signal_write_fd = signal_write.as_raw_fd();
    let sigchld_write_fd = sigchld_write.as_raw_fd();
    // register_raw uses the raw fd without taking ownership, so the writers stay alive.
    if let Err(e) = signal_hook::low_level::pipe::register_raw(libc::SIGINT, signal_write_fd) {
        eprintln!("[daemon] Failed to register SIGINT handler: {}", e);
        return;
    }
    if let Err(e) = signal_hook::low_level::pipe::register_raw(libc::SIGTERM, signal_write_fd) {
        eprintln!("[daemon] Failed to register SIGTERM handler: {}", e);
        return;
    }
    if let Err(e) = signal_hook::low_level::pipe::register_raw(libc::SIGHUP, signal_write_fd) {
        eprintln!("[daemon] Failed to register SIGHUP handler: {}", e);
        return;
    }
    if let Err(e) = signal_hook::low_level::pipe::register_raw(libc::SIGCHLD, sigchld_write_fd) {
        eprintln!("[daemon] Failed to register SIGCHLD handler: {}", e);
        return;
    }

    // Create the manager with its wakeup pipe.
    let (mgr, wakeup_read_fd) = Manager::new_with_wakeup();
    if MANAGER.set(mgr).is_err() {
        eprintln!("[daemon] Failed to set MANAGER (already initialized)");
        return;
    }

    // Create the poller.
    let poller = match Poller::new() {
        Ok(p) => p,
        Err(e) => {
            eprintln!("[daemon] Failed to create poller: {}", e);
            return;
        }
    };

    // Register the listener for accept events.
    unsafe {
        if let Err(e) = poller.add(listener.as_raw_fd(), Event::readable(KEY_LISTENER)) {
            eprintln!("[daemon] Failed to register listener: {}", e);
            return;
        }
    }

    // Register shutdown signal pipe for readable events.
    unsafe {
        if let Err(e) = poller.add(signal_read.as_raw_fd(), Event::readable(KEY_SIGNAL)) {
            eprintln!("[daemon] Failed to register shutdown signal pipe: {}", e);
            return;
        }
    }

    // Register SIGCHLD signal pipe for readable events.
    unsafe {
        if let Err(e) = poller.add(sigchld_read.as_raw_fd(), Event::readable(KEY_SIGCHLD)) {
            eprintln!("[daemon] Failed to register SIGCHLD pipe: {}", e);
            return;
        }
    }

    // Register the wakeup pipe for readable events.
    unsafe {
        if let Err(e) = poller.add(wakeup_read_fd, Event::readable(KEY_WAKEUP)) {
            eprintln!("[daemon] Failed to register wakeup pipe: {}", e);
            return;
        }
    }

    eprintln!("[daemon] Listening on {}", cfg.socket_path);
    eprintln!("[daemon] PID: {}", std::process::id());

    let mut events = Events::new();
    let mut clients: HashMap<usize, ClientState> = HashMap::new();
    let mut next_client_id: usize = 0;
    let mut active_connections: u32 = 0;

    let coalesce_timeout = Duration::from_millis(cfg.coalesce_delay_ms);

    // Main event loop
    'main: loop {
        let mgr = session::manager::manager();
        events.clear();

        // Poll with the coalesce delay as timeout. This serves double duty:
        // it's the maximum time between checking for PTY output and also
        // prevents busy-waiting when idle.
        if let Err(e) = poller.wait(&mut events, Some(coalesce_timeout)) {
            if e.kind() == io::ErrorKind::Interrupted {
                continue;
            }
            eprintln!("[daemon] Poll error: {}", e);
            break;
        }

        for event in events.iter() {
            match event.key {
                KEY_LISTENER => {
                    // Accept new connections
                    loop {
                        match listener.accept() {
                            Ok((stream, _)) => {
                                if active_connections >= cfg.max_connections {
                                    eprintln!("[daemon] Connection limit reached, rejecting");
                                    drop(stream);
                                    continue;
                                }

                                let client_id = next_client_id;
                                next_client_id += 1;
                                let key = KEY_CLIENT_BASE + client_id;

                                match ClientState::new(stream) {
                                    Ok(client) => {
                                        unsafe {
                                            if let Err(e) = poller.add(
                                                client.stream.as_raw_fd(),
                                                Event::readable(key),
                                            ) {
                                                eprintln!(
                                                    "[daemon] Failed to register client: {}",
                                                    e
                                                );
                                                continue;
                                            }
                                        }
                                        clients.insert(client_id, client);
                                        active_connections += 1;
                                    }
                                    Err(e) => {
                                        eprintln!("[daemon] Failed to create client state: {}", e);
                                    }
                                }
                            }
                            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => break,
                            Err(e) => {
                                eprintln!("[daemon] Accept error: {}", e);
                                break;
                            }
                        }
                    }

                    // Re-register listener for next event (oneshot mode).
                    if let Err(e) = poller.modify(&listener, Event::readable(KEY_LISTENER)) {
                        eprintln!("[daemon] Failed to re-register listener: {}", e);
                        break 'main;
                    }
                }

                KEY_SIGNAL => {
                    // Drain shutdown signal pipe and exit.
                    let mut buf = [0u8; 64];
                    loop {
                        let n = unsafe {
                            libc::read(signal_read.as_raw_fd(), buf.as_mut_ptr().cast(), buf.len())
                        };

                        if n < 0 {
                            let err = io::Error::last_os_error();
                            if err.kind() == io::ErrorKind::Interrupted {
                                continue;
                            }
                            if err.kind() == io::ErrorKind::WouldBlock {
                                break;
                            }
                            eprintln!("[daemon] Shutdown signal pipe read error: {}", err);
                            break;
                        }
                        if n == 0 {
                            break;
                        }
                    }

                    if let Err(e) = poller.modify(&signal_read, Event::readable(KEY_SIGNAL)) {
                        eprintln!("[daemon] Failed to re-register signal pipe: {}", e);
                        break 'main;
                    }

                    eprintln!("[daemon] Received shutdown signal, shutting down...");
                    break 'main;
                }

                KEY_SIGCHLD => {
                    // Drain SIGCHLD pipe and reap children without blocking.
                    let mut buf = [0u8; 64];
                    loop {
                        let n = unsafe {
                            libc::read(sigchld_read.as_raw_fd(), buf.as_mut_ptr().cast(), buf.len())
                        };
                        if n < 0 {
                            let err = io::Error::last_os_error();
                            if err.kind() == io::ErrorKind::Interrupted {
                                continue;
                            }
                            if err.kind() == io::ErrorKind::WouldBlock {
                                break;
                            }
                            eprintln!("[daemon] SIGCHLD pipe read error: {}", err);
                            break;
                        }
                        if n == 0 {
                            break;
                        }
                    }

                    for (session_id, event) in mgr.reap_exited_children() {
                        mgr.broadcast_event(session_id, &event);
                    }

                    if let Err(e) = poller.modify(&sigchld_read, Event::readable(KEY_SIGCHLD)) {
                        eprintln!("[daemon] Failed to re-register SIGCHLD pipe: {}", e);
                        break 'main;
                    }
                }

                KEY_WAKEUP => {
                    // PTY reader data available — handled below after event processing.
                    // Re-register wakeup pipe.
                    let _ = poller.modify(
                        unsafe { std::os::unix::io::BorrowedFd::borrow_raw(wakeup_read_fd) },
                        Event::readable(KEY_WAKEUP),
                    );
                }

                key if key >= KEY_CLIENT_BASE => {
                    let client_id = key - KEY_CLIENT_BASE;

                    if let Some(client) = clients.get_mut(&client_id) {
                        if event.readable {
                            client.handle_readable();
                        }
                        if event.writable {
                            client.handle_writable();
                        }
                    }
                }

                _ => {}
            }
        }

        // Drain PTY reader events and process them (coalescing).
        let reader_events = mgr.drain_reader_events(wakeup_read_fd);
        if !reader_events.is_empty() {
            let output_events = mgr.process_reader_events(reader_events);
            for (session_id, event) in &output_events {
                mgr.broadcast_event(*session_id, event);
            }
        }
        // Reap any exited children in a non-blocking way. This is cheap when
        // there are no state changes and prevents missed SIGCHLD races.
        for (session_id, event) in mgr.reap_exited_children() {
            mgr.broadcast_event(session_id, &event);
        }

        // Drain session output channels to client write queues.
        for client in clients.values_mut() {
            client.drain_session_output();
        }

        // Update poller registrations and remove dead clients.
        let mut dead_ids = Vec::new();
        for (&client_id, client) in clients.iter_mut() {
            if client.dead {
                dead_ids.push(client_id);
                continue;
            }

            let key = KEY_CLIENT_BASE + client_id;
            let interest = if client.needs_write {
                Event::all(key)
            } else {
                Event::readable(key)
            };

            if let Err(e) = poller.modify(&client.stream, interest) {
                eprintln!("[daemon] Failed to modify client {}: {}", client_id, e);
                dead_ids.push(client_id);
            }
        }

        for client_id in dead_ids {
            if let Some(mut client) = clients.remove(&client_id) {
                let _ = poller.delete(&client.stream);
                client.cleanup();
                active_connections -= 1;
            }
        }
    }

    // Shutdown: clean up all clients.
    for (_, mut client) in clients.drain() {
        let _ = poller.delete(&client.stream);
        client.cleanup();
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
