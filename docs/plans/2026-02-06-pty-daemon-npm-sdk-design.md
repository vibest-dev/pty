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

- scripts/build.ts:
  - builds rust targets for darwin-arm64 and darwin-x64
  - emits dist/@vibest/pty-daemon-<platform>/bin/pty-daemon
  - writes per-platform package.json with os/cpu fields
- scripts/publish.ts:
  - runs build
  - assembles main package (postinstall + SDK build)
  - publishes platform packages then main package
- scripts/postinstall.mjs:
  - chooses correct platform package
  - links/copies binary into main package bin directory

## Error Handling

- If platform package missing or binary invalid, postinstall logs a clear message and exits 0.
- SDK retries connection for a configurable timeout when autoStart is enabled.
- SDK surfaces protocol errors with structured error codes.

## Testing

- Node e2e script:
  - spawn daemon
  - connect + hello
  - create session
  - list sessions
  - kill session
  - shutdown
- Protocol unit test for seq correlation.

## Open Questions

- None.
