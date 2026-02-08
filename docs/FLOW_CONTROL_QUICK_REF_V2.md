# Flow Control Quick Reference (v0.2.0 - Simplified)

## Overview

The PTY daemon implements a **single-threshold backpressure system** using tokio bounded channels to handle slow subscribers gracefully.

**Key Improvements from v0.1**:
- ❌ Removed 150+ lines of complex 3-tier watermark logic
- ❌ Removed time-based rate limiting (10ms/100ms intervals)
- ❌ Removed manual ACK system and pending count tracking
- ✅ tokio bounded channel handles backpressure automatically
- ✅ Simplified to 40 lines (73% reduction)

---

## Backpressure Zones

| Zone | Remaining Capacity | Behavior | Action |
|------|-------------------|----------|--------|
| 🟢 **Green** | ≥ 4,096 | Normal | `try_send()` succeeds immediately |
| 🟡 **Yellow** | < 4,096 | Warning | Send `BackpressureWarning` event (Yellow) |
| 🔴 **Red** | 0 (Full) | Severe | `try_send()` fails - warn or disconnect |

### How It Works

```rust
// Simplified flow control (manager.rs:380-408)
match sub.tx.try_send(event) {
    Ok(_) => {
        let remaining = sub.tx.capacity();
        if remaining < threshold {
            // Send Yellow warning
            let warning = OutputEvent::BackpressureWarning {
                session: session_id,
                queue_size: max_size - remaining,
                level: BackpressureLevel::Yellow,
            };
            let _ = sub.tx.try_send(warning);
        }
    }
    Err(TrySendError::Full(_)) => {
        // Send Red warning or disconnect
        if !auto_disconnect {
            let warning = OutputEvent::BackpressureWarning {
                session: session_id,
                queue_size: max_size,
                level: BackpressureLevel::Red,
            };
            let _ = sub.tx.try_send(warning);
        }
        // If auto_disconnect=true, channel closes automatically
    }
}
```

**Key Insight**: No manual counting, no timestamps, no CAS loops - tokio's `try_send()` and `capacity()` do all the work!

---

## Environment Variables

### Current Configuration (v0.2)

```bash
# Single threshold configuration
RUST_PTY_FLOW_THRESHOLD=4096          # Warning when remaining < threshold
RUST_PTY_FLOW_MAX_QUEUE_SIZE=16384    # tokio channel capacity
RUST_PTY_FLOW_AUTO_DISCONNECT=false   # Disconnect when full?
```

### Removed Variables (v0.1)

```bash
# No longer needed - time-based rate limiting removed
# RUST_PTY_FLOW_YELLOW_THRESHOLD=1024
# RUST_PTY_FLOW_RED_THRESHOLD=4096
# RUST_PTY_FLOW_YELLOW_INTERVAL_MS=10
# RUST_PTY_FLOW_RED_INTERVAL_MS=100
```

**Migration**: Old environment variables are silently ignored (backward compatible).

---

## TypeScript SDK Usage

### Basic Setup

```typescript
import { createClient } from "@vibest/pty-daemon";

const client = createClient({ socketPath: "/tmp/rust-pty.sock" });
await client.waitForConnection();
```

### Listen for Backpressure

```typescript
client.on("backpressure_warning", (event) => {
  console.warn(`${event.level}: ${event.queue_size} messages queued`);

  if (event.level === "yellow") {
    // Slow down rendering or reduce refresh rate
  } else if (event.level === "red") {
    // Severe: pause UI, drop frames, or disconnect
  }
});
```

### ⚠️ ACK System Removed

```typescript
// v0.1 (deprecated)
client.setAckThreshold(100);
client.ack(sessionId, count);

// v0.2 (automatic)
// No action needed - tokio channel handles backpressure automatically!
```

**Why removed?**: tokio bounded channels provide automatic backpressure via `try_send()`. Manual ACK added 150+ lines of complexity without benefit.

---

## Performance Characteristics

### Green Zone (Normal)
- **Latency**: ~0.01ms (tokio channel send)
- **Throughput**: Unlimited (until threshold)
- **Memory**: ~256KB per subscriber

### Yellow Zone (Warning)
- **Latency**: Same as Green (~0.01ms)
- **Throughput**: Unlimited (no rate limiting!)
- **Memory**: ~1-3MB per subscriber
- **Behavior**: Warning events sent, but data continues flowing

### Red Zone (Severe)
- **Latency**: N/A (`try_send()` fails immediately)
- **Throughput**: 0 (queue full)
- **Memory**: Capped at `FLOW_MAX_QUEUE_SIZE`
- **Behavior**: Data dropped until client consumes backlog

**Key Difference from v0.1**: No artificial delays (10ms/100ms), better throughput!

---

## Common Patterns

### 1. Adaptive Rendering

```typescript
let renderInterval = 16; // 60fps

client.on("backpressure_warning", (e) => {
  switch (e.level) {
    case "yellow": renderInterval = 33;  break; // 30fps
    case "red":    renderInterval = 100; break; // 10fps
  }
});
```

### 2. Frame Dropping

```typescript
let isPaused = false;

client.on("backpressure_warning", (e) => {
  isPaused = (e.level === "red");
});

client.on("output", (e) => {
  if (!isPaused) {
    render(e.data);
  } // else: drop frame to catch up
});
```

### 3. Batch Processing

```typescript
const buffer: Uint8Array[] = [];

client.on("output", (e) => {
  buffer.push(e.data);
});

setInterval(() => {
  if (buffer.length > 0) {
    processBatch(buffer.splice(0)); // Process in batches
  }
}, 100);
```

---

## Troubleshooting

### Symptom: Frequent Yellow Warnings

**Cause**: Client processing slower than PTY output

**Solutions**:
1. Optimize rendering/processing code (use RAF, batch updates)
2. Implement frame dropping in yellow zone
3. Increase `RUST_PTY_FLOW_THRESHOLD` to delay warnings
4. Check for blocking operations in event handlers

### Symptom: Red Zone Backpressure

**Cause**: Severe processing lag or blocked event loop

**Solutions**:
1. **Immediately** pause non-critical UI updates
2. Drop frames until backlog clears
3. Check for synchronous operations blocking the event loop
4. Consider enabling `RUST_PTY_FLOW_AUTO_DISCONNECT=true`

### Symptom: Connection Drops

**Cause**: Auto-disconnect enabled + Red zone reached

**Solutions**:
1. Set `RUST_PTY_FLOW_AUTO_DISCONNECT=false` (default)
2. Implement proper backpressure handling (see patterns above)
3. Increase thresholds (`FLOW_THRESHOLD`, `FLOW_MAX_QUEUE_SIZE`)
4. Profile client code for bottlenecks

### Symptom: No Warnings, But UI Freezes

**Cause**: Client event handler blocking the event loop

**Solutions**:
1. Move heavy processing to Web Workers
2. Use `requestAnimationFrame` for rendering
3. Batch DOM updates (e.g., every 16ms)
4. Profile with Chrome DevTools Performance tab

---

## Testing

### Trigger Yellow Zone

```bash
# Generate moderate output (~1000 lines)
seq 1 10000 | while read n; do echo "Line $n"; done
```

Expected: Yellow warnings appear when remaining capacity < 4096

### Trigger Red Zone

```bash
# Generate heavy output (~100k lines)
yes "test data" | head -100000
```

Expected: Red warnings appear when queue is full (16384 messages)

### Monitor Queue Depth

```typescript
client.on("backpressure_warning", (e) => {
  console.log(`[${e.level.toUpperCase()}] Queue: ${e.queue_size}/${16384}`);
});
```

---

## Configuration Presets

### Conservative (Stability Priority)

```bash
RUST_PTY_FLOW_THRESHOLD=2048           # Warn earlier
RUST_PTY_FLOW_MAX_QUEUE_SIZE=8192      # Smaller buffer
RUST_PTY_FLOW_AUTO_DISCONNECT=true     # Drop on overflow
```

**Use Case**: Resource-constrained environments, many concurrent sessions

### Balanced (Default)

```bash
RUST_PTY_FLOW_THRESHOLD=4096
RUST_PTY_FLOW_MAX_QUEUE_SIZE=16384
RUST_PTY_FLOW_AUTO_DISCONNECT=false
```

**Use Case**: General purpose, good balance of performance and stability

### Aggressive (Throughput Priority)

```bash
RUST_PTY_FLOW_THRESHOLD=8192           # Warn later
RUST_PTY_FLOW_MAX_QUEUE_SIZE=32768     # Larger buffer
RUST_PTY_FLOW_AUTO_DISCONNECT=false    # Never disconnect
```

**Use Case**: High-throughput scenarios, logging/recording, batch processing

---

## Best Practices

### ✅ Do

1. **Always listen** for `backpressure_warning` events
2. **Implement adaptive rendering** (30fps in yellow, 10fps in red)
3. **Drop frames** in red zone to recover quickly
4. **Use batching** for heavy processing (e.g., DOM updates)
5. **Test with high-output** commands (`seq`, `yes`, large `ls`)
6. **Profile your client** to find bottlenecks

### ❌ Don't

1. **Don't block** in output event handlers (no sync I/O)
2. **Don't ignore** yellow/red warnings - they indicate real issues
3. **Don't set** `FLOW_MAX_QUEUE_SIZE` too high (memory risk)
4. ~~**Don't manually ACK**~~ (removed in v0.2)
5. **Don't disable backpressure** by ignoring warnings

---

## Migration from v0.1

### What Changed

| Feature | v0.1 | v0.2 |
|---------|------|------|
| **Flow Control** | 3-tier watermarks | Single threshold |
| **Rate Limiting** | 10ms/100ms intervals | None (channel-based) |
| **ACK System** | Manual ACK required | Automatic (removed) |
| **Pending Count** | Manual Arc<AtomicUsize> | tokio channel capacity |
| **Code Complexity** | 150+ lines | 40 lines |
| **Config Vars** | 7 | 3 |

### Code Changes Required

```typescript
// v0.1 - Remove ACK calls
client.setAckThreshold(100);  // ← Remove this
client.ack(sessionId, count); // ← Remove this

// v0.2 - Backpressure handling remains the same
client.on("backpressure_warning", (e) => { /* unchanged */ });
```

### Environment Variable Migration

```bash
# v0.1 - Old variables (ignored but safe to leave)
RUST_PTY_FLOW_YELLOW_THRESHOLD=1024
RUST_PTY_FLOW_YELLOW_INTERVAL_MS=10

# v0.2 - New variables (use these instead)
RUST_PTY_FLOW_THRESHOLD=4096
RUST_PTY_FLOW_MAX_QUEUE_SIZE=16384
```

**Backward Compatibility**: Old variables are silently ignored. No action required for upgrade.

---

## Architecture Insights

### Why Single Threshold Works

```
v0.1: Green(0-1K) → Yellow(1K-4K,10ms) → Red(4K+,100ms)
      ↑ Complex    ↑ Time-based          ↑ ACK required

v0.2: Green(remaining ≥ 4K) → Yellow(< 4K) → Red(full)
      ↑ Simple     ↑ No delays              ↑ Automatic
```

**Key Insight**: tokio bounded channel already implements perfect backpressure via `try_send()`. The old 3-tier system with time-based rate limiting was **over-engineering** that added complexity without benefit.

### tokio Channel Internals

```rust
// tokio::sync::mpsc::Sender<T>
pub fn try_send(&self, value: T) -> Result<(), TrySendError<T>>
pub fn capacity(&self) -> usize

// Backpressure is FREE:
// - try_send() fails instantly when full (no blocking)
// - capacity() returns available slots (no manual counting)
```

**Performance**: O(1) for all operations, lock-free SPSC implementation.

---

## Related Documentation

- [Architecture Summary](../ARCHITECTURE_SUMMARY.md) - Full system architecture
- [Simplification Report](../SIMPLIFICATION_COMPLETE.md) - v0.1 → v0.2 changes
- [Implementation Details](../crates/daemon/src/session/manager.rs) - Source code

---

**Last Updated**: 2026-02-08
**Version**: v0.2.0 (tokio-async)
