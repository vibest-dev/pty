# PTY Daemon npm Package + TS SDK Design

Date: 2026-02-06
Owner: @vibest
Status: Draft (validated)

## Goals

- Package the Rust PTY daemon as an npm package with platform-specific subpackages.
- Provide a Node/Electron-main TS SDK to communicate with the daemon.
- Auto-select the correct macOS binary (arm64/x64) during install.
- Support both auto-starting the daemon and connecting to an already running daemon.
- Keep changes self-contained in this repo; no Electron build config changes required.

## Non-Goals

- Linux/Windows packaging (macOS only for now).
- Renderer-process usage.
- Bundling with Electron app resources.
- Backward compatibility with existing external users.

## Repository Layout (Bun Workspaces)

- `crates/daemon/`: Rust daemon crate (Cargo.toml + src)
- `packages/pty-daemon/`: TS SDK (tsdown build, ESM + CJS + types)
- `scripts/`: build/publish/postinstall (TypeScript, executed with Bun)
- `dist/`: publish artifacts (ignored)

Root `package.json` uses `workspaces: ["packages/*"]` and exposes orchestration scripts:

- `build:rust`: `cargo build --release --manifest-path crates/daemon/Cargo.toml`
- `build:sdk`: `bun run -C packages/pty-daemon build`
- `build:packages`: build platform subpackages and main package

## Architecture Overview

- Rust daemon remains a standalone binary (Unix socket, MsgPack framing).
- npm packages:
  - Main package: @vibest/pty-daemon
  - Platform packages:
    - @vibest/pty-daemon-darwin-arm64
    - @vibest/pty-daemon-darwin-x64
- Main package depends on platform packages via optionalDependencies.
- postinstall selects the correct binary and links it into the main package.
- TS SDK connects to the daemon via Unix socket, using MsgPack and framing.

## Protocol Changes (v1)

- protocol_version set to 1.
- Requests include a seq (u32) for correlation.
- Responses for ok and error include the same seq.
- output and exit remain async events without seq.

Reasoning: without seq, concurrent requests cannot safely match responses. This enables parallel request handling in the SDK.

## SDK API (Node/Electron Main)

- createClient(options): returns PtyDaemonClient
- client.connect(): connect + hello handshake
- client.create(opts)
- client.list(), client.listByWorkspace(workspaceId)
- client.attach(session), client.detach(session)
- client.kill(session), client.killAll(), client.killByWorkspace(workspaceId)
- client.input(session, data), client.resize(session, cols, rows)
- client.signal(session, signal), client.clearScrollback(session)
- client.on("output", ...), client.on("exit", ...)
- client.getInfo(): { daemonVersion, daemonPid, protocolVersion }

Auto-start behavior:
- createClient({ autoStart: true }) is default
- autoStart: false allows only connecting to an existing daemon

Path overrides:
- PTY_DAEMON_PATH: explicit binary path
- socketPath, tokenPath optional in createClient

## Binary Location Strategy

- postinstall determines platform (darwin arm64/x64)
- it resolves the installed platform package from optionalDependencies
- it links or copies the binary into main package bin/pty-daemon
- it respects PTY_DAEMON_PATH if provided at runtime

## Build and Publish

- scripts/build.ts (Bun, TypeScript):
  - builds rust targets for darwin-arm64 and darwin-x64
  - emits dist/@vibest/pty-daemon-<platform>/bin/pty-daemon
  - writes per-platform package.json with os/cpu fields
- scripts/publish.ts (Bun, TypeScript):
  - runs build
  - assembles main package (postinstall + SDK build)
  - publishes platform packages then main package
- scripts/postinstall.mjs (generated from TS or kept as .mjs):
  - chooses correct platform package
  - links/copies binary into main package bin directory

## Error Handling

- If platform package missing or binary invalid, postinstall logs a clear message and exits 0.
- SDK retries connection for a configurable timeout when autoStart is enabled.
- SDK surfaces protocol errors with structured error codes.

## Testing

All JS/TS tests use Vitest. Rust tests remain `cargo test`.

- Unit (Vitest):
  - SDK framing (length-prefix), MsgPack encode/decode
  - seq correlation and pending map behavior
  - path resolution and env overrides (PTY_DAEMON_PATH, socket/token paths)
- Integration (Vitest):
  - spawn daemon (using PTY_DAEMON_PATH)
  - hello → create → list → attach/detach → kill
  - verify seq mapping and output/exit events
- E2E (Vitest + scripts):
  - run scripts/build.ts to generate dist/
  - run postinstall against dist/ and assert bin linkage

## Open Questions

- None.
