# Critical Fixes Required for Flow Control

## Issue #1: Add BackpressureWarning to OutputEvent

**File:** `crates/daemon/src/session/manager.rs`

Change the `OutputEvent` enum to include warnings:

```rust
#[derive(Debug, Clone)]
pub enum OutputEvent {
    Data { session: u32, data: Vec<u8> },
    Exit { session: u32, code: i32, signal: Option<i32> },
    BackpressureWarning {
        session: u32,
        queue_size: usize,
        level: BackpressureLevel
    },
}
```

Import `BackpressureLevel`:
```rust
use crate::protocol::BackpressureLevel;
```

---

## Issue #2: Fix broadcast_event Implementation

**File:** `crates/daemon/src/session/manager.rs`

Replace the current `broadcast_event` implementation with this fixed version:

```rust
/// Broadcast event to subscribers of the session with flow control
fn broadcast_event(&self, event: OutputEvent) {
    let session_id = match event {
        OutputEvent::Data { session, .. } => session,
        OutputEvent::Exit { session, .. } => session,
        OutputEvent::BackpressureWarning { session, .. } => session,
    };

    let cfg = config();
    let mut subs = self.session_subscribers.write().unwrap();

    let remove = match subs.get_mut(&session_id) {
        Some(list) => {
            let mut disconnected = Vec::new();

            for (idx, sub) in list.iter().enumerate() {
                // Increment pending BEFORE checking level to avoid race
                let new_pending = sub.pending_count.fetch_add(1, Ordering::Release);

                // Determine backpressure level based on NEW count
                let level = if new_pending < cfg.flow_yellow_threshold {
                    0 // Green
                } else if new_pending < cfg.flow_red_threshold {
                    1 // Yellow
                } else {
                    2 // Red
                };

                // Check hard limit
                const MAX_QUEUE_SIZE: usize = 65536;
                if new_pending > MAX_QUEUE_SIZE {
                    log::error!(
                        "Force disconnecting session {} subscriber {} due to queue overflow ({} messages)",
                        session_id, sub.id, new_pending
                    );
                    disconnected.push(idx);
                    sub.pending_count.fetch_sub(1, Ordering::Release);  // Rollback increment
                    continue;
                }

                let should_send = match level {
                    0 => {
                        // Green zone: send immediately
                        true
                    }
                    1 => {
                        // Yellow zone: rate limit to flow_yellow_interval_ms
                        let now = Instant::now();
                        let last = *sub.last_sent_time.lock().unwrap();
                        now.duration_since(last).as_millis() >= cfg.flow_yellow_interval_ms as u128
                    }
                    2 => {
                        // Red zone: severe rate limit or disconnect
                        if cfg.flow_auto_disconnect {
                            log::warn!(
                                "Auto-disconnecting session {} subscriber {} due to red zone backpressure",
                                session_id, sub.id
                            );
                            disconnected.push(idx);
                            sub.pending_count.fetch_sub(1, Ordering::Release);  // Rollback increment
                            false
                        } else {
                            let now = Instant::now();
                            let last = *sub.last_sent_time.lock().unwrap();
                            now.duration_since(last).as_millis() >= cfg.flow_red_interval_ms as u128
                        }
                    }
                    _ => false,
                };

                if should_send {
                    if sub.tx.send(event.clone()).is_ok() {
                        *sub.last_sent_time.lock().unwrap() = Instant::now();

                        // Send backpressure warning on level change (with deduplication)
                        let prev_level = sub.last_warning_level.load(Ordering::Acquire);
                        if level > 0 && level != prev_level as usize {
                            let warning = OutputEvent::BackpressureWarning {
                                session: session_id,
                                queue_size: new_pending,
                                level: match level {
                                    1 => BackpressureLevel::Yellow,
                                    2 => BackpressureLevel::Red,
                                    _ => BackpressureLevel::Green,
                                },
                            };
                            let _ = sub.tx.send(warning);
                            sub.last_warning_level.store(level as u8, Ordering::Release);

                            log::warn!(
                                "Session {} subscriber {} entered {:?} zone with {} pending messages",
                                session_id, sub.id,
                                if level == 1 { "yellow" } else { "red" },
                                new_pending
                            );
                        } else if level == 0 && prev_level > 0 {
                            // Send "back to green" notification
                            let warning = OutputEvent::BackpressureWarning {
                                session: session_id,
                                queue_size: new_pending,
                                level: BackpressureLevel::Green,
                            };
                            let _ = sub.tx.send(warning);
                            sub.last_warning_level.store(0, Ordering::Release);

                            log::info!(
                                "Session {} subscriber {} returned to green zone ({} pending)",
                                session_id, sub.id, new_pending
                            );
                        }
                    } else {
                        // Disconnected
                        disconnected.push(idx);
                        sub.pending_count.fetch_sub(1, Ordering::Release);  // Rollback increment
                    }
                } else {
                    // Didn't send, rollback the increment
                    sub.pending_count.fetch_sub(1, Ordering::Release);
                }
            }

            // Remove disconnected subscribers in reverse order to maintain indices
            for idx in disconnected.iter().rev() {
                list.remove(*idx);
            }

            list.is_empty()
        }
        None => return,
    };

    if remove {
        subs.remove(&session_id);
    }
}
```

---

## Issue #3: Update SessionSubscriber Structure

**File:** `crates/daemon/src/session/manager.rs`

Add warning tracking:

```rust
struct SessionSubscriber {
    id: u64,
    tx: Sender<OutputEvent>,
    pending_count: Arc<AtomicUsize>,
    last_sent_time: Arc<Mutex<Instant>>,
    last_warning_level: Arc<AtomicU8>,  // NEW: Track last warning level for deduplication
}
```

Update `add_session_subscriber`:

```rust
pub fn add_session_subscriber(
    &self,
    session_id: u32,
    tx: Sender<OutputEvent>,
) -> Result<u64> {
    if !self.sessions.read().unwrap().contains_key(&session_id) {
        return Err(Error::NotFound(format!("session {}", session_id)));
    }

    let id = self.next_sub_id.fetch_add(1, Ordering::SeqCst) as u64;
    let mut subs = self.session_subscribers.write().unwrap();
    subs.entry(session_id).or_default().push(SessionSubscriber {
        id,
        tx,
        pending_count: Arc::new(AtomicUsize::new(0)),
        last_sent_time: Arc::new(Mutex::new(Instant::now())),
        last_warning_level: Arc::new(AtomicU8::new(0)),  // NEW
    });
    Ok(id)
}
```

---

## Issue #4: Fix ACK Implementation

**File:** `crates/daemon/src/session/manager.rs`

Use atomic compare-exchange for safety:

```rust
pub fn ack_messages(&self, session_id: u32, subscriber_id: u64, count: usize) {
    let subs = self.session_subscribers.read().unwrap();
    if let Some(list) = subs.get(&session_id) {
        if let Some(sub) = list.iter().find(|s| s.id == subscriber_id) {
            // Use atomic compare-exchange loop for safe decrement
            let mut current = sub.pending_count.load(Ordering::Acquire);
            loop {
                let new_val = current.saturating_sub(count);
                match sub.pending_count.compare_exchange_weak(
                    current,
                    new_val,
                    Ordering::Release,
                    Ordering::Acquire,
                ) {
                    Ok(_) => {
                        log::debug!(
                            "Session {} subscriber {} ACKed {} messages (pending: {} -> {})",
                            session_id, subscriber_id, count, current, new_val
                        );
                        break;
                    }
                    Err(x) => current = x,
                }
            }
        }
    }
}
```

---

## Issue #5: Add Config Validation

**File:** `crates/daemon/src/config.rs`

Add validation in `from_env()`:

```rust
fn from_env() -> Self {
    // ... existing parsing code ...

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
            "Warning: yellow interval ({} ms) >= red interval ({} ms). Red zone will not be more restrictive.",
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
```

---

## Issue #6: Update Handler to Handle BackpressureWarning

**File:** `crates/daemon/src/server/handler.rs`

Update `ensure_output_thread` to convert `BackpressureWarning`:

```rust
match rx.recv_timeout(Duration::from_millis(100)) {
    Ok(event) => {
        let response = match event {
            OutputEvent::Data { session, data } => Response::Output { session, data },
            OutputEvent::Exit { session, code, signal } => {
                Response::Exit { session, code, signal }
            }
            OutputEvent::BackpressureWarning { session, queue_size, level } => {
                Response::BackpressureWarning { session, queue_size, level }
            }
        };
        if write_message(&mut stream_clone, &response).is_err() {
            break;
        }
        processed_count.fetch_add(1, Ordering::Relaxed);
    }
    // ...
}
```

---

## Issue #7: Add AtomicU8 Import

**File:** `crates/daemon/src/session/manager.rs`

Update imports:

```rust
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicUsize, AtomicU8, Ordering};
```

---

## Issue #8: Add Logging Dependency

**File:** `crates/daemon/Cargo.toml`

Add log crate:

```toml
[dependencies]
# ... existing dependencies ...
log = "0.4"
env_logger = "0.11"  # For initialization in main.rs
```

**File:** `crates/daemon/src/main.rs`

Initialize logger:

```rust
fn main() {
    env_logger::init();
    // ... rest of main
}
```

---

## Testing Checklist

After applying fixes:

- [ ] Code compiles without warnings
- [ ] Unit tests pass
- [ ] BackpressureWarning events are received by clients
- [ ] Warning deduplication works (only on level change)
- [ ] Hard limit prevents OOM
- [ ] Config validation catches invalid settings
- [ ] Logging shows backpressure state changes
- [ ] ACK properly decrements pending count
- [ ] No race conditions under concurrent load

---

## Performance Regression Test

Verify no performance degradation:

```bash
# Before and after, measure:
# 1. Throughput in green zone
seq 1 100000 | time vibest-pty-daemon

# 2. Memory usage under load
# Monitor RSS with `top` during high output

# 3. CPU overhead
# Check CPU% with slow client
```

Expected results:
- Green zone: No measurable overhead
- Yellow/Red zone: <5% CPU increase
- Memory: Stays within configured limits
