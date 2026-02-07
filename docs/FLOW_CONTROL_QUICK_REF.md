# Flow Control Quick Reference

## Overview

The PTY daemon implements a three-tier watermark system to handle slow subscribers gracefully.

## Watermark Zones

| Zone | Queue Depth | Behavior | Action |
|------|-------------|----------|--------|
| 🟢 **Green** | 0 - 1,024 | Normal | Send immediately |
| 🟡 **Yellow** | 1,024 - 4,096 | Warning | Rate limit to 10ms intervals |
| 🔴 **Red** | 4,096+ | Severe | Rate limit to 100ms or disconnect |

## Environment Variables

```bash
# Thresholds (messages)
RUST_PTY_FLOW_YELLOW_THRESHOLD=1024    # Green → Yellow
RUST_PTY_FLOW_RED_THRESHOLD=4096       # Yellow → Red

# Rate limits (milliseconds)
RUST_PTY_FLOW_YELLOW_INTERVAL_MS=10    # Yellow zone delay
RUST_PTY_FLOW_RED_INTERVAL_MS=100      # Red zone delay

# Behavior
RUST_PTY_FLOW_AUTO_DISCONNECT=false    # Disconnect in red zone?
```

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

  if (event.level === "red") {
    // Take action: pause UI, reduce refresh rate, etc.
  }
});
```

### Configure Auto-ACK

```typescript
// Default: ACK every 100 messages
client.setAckThreshold(100);

// More aggressive: ACK every 50 messages
client.setAckThreshold(50);

// Disable auto-ACK
client.setAckThreshold(0);
```

### Manual ACK

```typescript
let pendingAck = 0;

client.on("output", (event) => {
  processOutput(event.data);

  pendingAck++;
  if (pendingAck >= 50) {
    client.ack(event.session, pendingAck);
    pendingAck = 0;
  }
});
```

## Performance Profiles

### Green Zone (Normal)
- **Latency**: ~0.1ms (atomic increment)
- **Throughput**: Unlimited
- **Memory**: ~256KB per subscriber

### Yellow Zone (Warning)
- **Latency**: ~10ms (rate limit)
- **Throughput**: 100 msg/sec
- **Memory**: ~1MB per subscriber

### Red Zone (Severe)
- **Latency**: ~100ms (severe rate limit)
- **Throughput**: 10 msg/sec
- **Memory**: Grows unbounded (risk)

## Common Patterns

### 1. Adaptive Rendering

```typescript
let renderInterval = 16; // 60fps

client.on("backpressure_warning", (e) => {
  switch (e.level) {
    case "green":  renderInterval = 16;  break; // 60fps
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
  } // else: drop frame
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
    processBatch(buffer.splice(0));
  }
}, 100);
```

## Troubleshooting

### Symptom: Frequent Yellow Warnings

**Cause**: Client processing slower than PTY output

**Solutions**:
1. Increase `setAckThreshold()` to ACK more frequently
2. Optimize rendering/processing code
3. Implement frame dropping in red zone
4. Increase `RUST_PTY_FLOW_YELLOW_THRESHOLD`

### Symptom: Red Zone Backpressure

**Cause**: Severe processing lag or blocked I/O

**Solutions**:
1. Pause non-critical UI updates
2. Drop frames to catch up
3. Check for blocking operations
4. Consider enabling `RUST_PTY_FLOW_AUTO_DISCONNECT=true`

### Symptom: Connection Drops

**Cause**: Auto-disconnect enabled in red zone

**Solutions**:
1. Set `RUST_PTY_FLOW_AUTO_DISCONNECT=false`
2. Implement backpressure handling
3. Increase red threshold
4. Optimize client processing

### Symptom: High Memory Usage

**Cause**: Queue growing in yellow/red zone without ACK

**Solutions**:
1. Verify auto-ACK is enabled
2. Reduce `setAckThreshold()` value
3. Implement manual ACK
4. Check for processing bottlenecks

## Testing

### Trigger Yellow Zone

```bash
# Generate moderate output
seq 1 10000 | while read n; do echo "Line $n"; done
```

### Trigger Red Zone

```bash
# Generate heavy output
yes "test data" | head -100000
```

### Monitor Queue Depth

```typescript
client.on("backpressure_warning", (e) => {
  console.log(`Queue: ${e.queue_size}, Level: ${e.level}`);
});
```

## Best Practices

1. ✅ **Always listen** for `backpressure_warning` events
2. ✅ **Use auto-ACK** for most cases (default: 100 messages)
3. ✅ **Implement adaptive rendering** in high-throughput apps
4. ✅ **Drop frames** in red zone to recover
5. ✅ **Test with high-output** commands (e.g., `seq`, `yes`)
6. ❌ **Don't block** in output event handler
7. ❌ **Don't disable ACK** unless manually managing
8. ❌ **Don't ignore** red zone warnings

## Configuration Presets

### Conservative (Stability Priority)

```bash
RUST_PTY_FLOW_YELLOW_THRESHOLD=512
RUST_PTY_FLOW_RED_THRESHOLD=2048
RUST_PTY_FLOW_AUTO_DISCONNECT=true
```

### Balanced (Default)

```bash
RUST_PTY_FLOW_YELLOW_THRESHOLD=1024
RUST_PTY_FLOW_RED_THRESHOLD=4096
RUST_PTY_FLOW_AUTO_DISCONNECT=false
```

### Aggressive (Throughput Priority)

```bash
RUST_PTY_FLOW_YELLOW_THRESHOLD=4096
RUST_PTY_FLOW_RED_THRESHOLD=16384
RUST_PTY_FLOW_YELLOW_INTERVAL_MS=5
RUST_PTY_FLOW_RED_INTERVAL_MS=50
```

## Related Documentation

- [Full Documentation](flow-control.md)
- [Example Code](examples/flow-control-example.ts)
- [Implementation Details](../FLOW_CONTROL_IMPLEMENTATION.md)
- [Changelog](../CHANGELOG_FLOW_CONTROL.md)
