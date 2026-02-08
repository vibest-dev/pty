# PTY Daemon Flow Control

## Current Behavior (as implemented)

The daemon uses bounded `tokio::mpsc` channels for per-connection output forwarding.
When a client is slow, the daemon emits backpressure warnings instead of blocking the PTY reader.

Key points:

1. Output forwarding is non-blocking (`try_send`).
2. Queue depth below threshold: normal delivery.
3. Queue depth near/full: warning events are emitted.
4. If queue is full, output can be dropped.
5. `Ack` requests are accepted for protocol compatibility but do not currently drive daemon-side flow control.

## Why this exists

Without flow control signals, a slow subscriber can silently lag while terminal output keeps arriving.
The daemon surfaces warning events so clients can react (reduce rendering work, detach, etc.).

## Daemon Configuration

Environment variables:

- `RUST_PTY_FLOW_THRESHOLD` (default `4096`)
- `RUST_PTY_FLOW_MAX_QUEUE_SIZE` (default `16384`)
- `RUST_PTY_FLOW_AUTO_DISCONNECT` (default `false`)

Validation rules:

- `flow_threshold > 0`
- `flow_max_queue_size > 0`
- `flow_threshold < flow_max_queue_size`

## Protocol Surface

### Request

```rust
Request::Ack { session, count }
```

`Ack` is currently a no-op in the daemon request handler.
It is kept for protocol compatibility.

### Event

```rust
Response::BackpressureWarning {
  session: u32,
  queue_size: usize,
  level: BackpressureLevel,
}
```

`level` values:

- `yellow`: queue depth crossed warning threshold
- `red`: queue is full (or effectively at capacity)

## SDK Notes

The TypeScript SDK exposes:

- `client.on("backpressure_warning", ...)`
- `client.getFlowControlConfig()`
- `client.getPendingCount(sessionId)`
- `client.ack(sessionId, count)`

The SDK tracks pending counts locally for application-level visibility.
Do not assume `ack()` changes daemon queue state at this time.

## Recommended Client Strategy

1. Listen for `backpressure_warning`.
2. On `yellow`, reduce non-essential UI work.
3. On `red`, pause expensive rendering and/or detach idle views.
4. Prefer bounded UI buffers and drop-oldest render policies for heavy output workloads.

## Testing

Rust unit/integration coverage:

```bash
cargo test -p vibest-pty-daemon
```

SDK + E2E coverage:

```bash
bun run test
bun run test:e2e
```
