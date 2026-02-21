# @vibest/pty-daemon

TypeScript SDK for the vibest PTY daemon (Node.js / Electron main process).

## Install

```bash
npm install @vibest/pty-daemon
```

## Runtime Model

- One global daemon per user environment.
- `autoStart` has been removed.
- `createPty()` is the default synchronous entry.
- `createPty()` prewarms daemon startup in background by default.
- `pty.daemon.connect()` is the readiness barrier that guarantees usable connection.
- Default paths:
  - socket: `$HOME/.vibest/pty/socket`
  - token: `$HOME/.vibest/pty/token`

## Quick Start

```ts
import { createPty } from "@vibest/pty-daemon";

const pty = createPty();
await pty.daemon.connect();

const session = await pty.client.session.create({ cols: 80, rows: 24 });
await pty.client.attach({ id: session.id });

pty.client.on("output", (e) => {
  process.stdout.write(Buffer.from(e.data));
});

pty.client.write({ id: session.id }, new TextEncoder().encode("echo hello\n"));
pty.client.resize({ id: session.id }, 120, 36);
await pty.client.kill(session.id);
pty.client.close();
```

## Main APIs

```ts
createPty(options?: CreatePtyOptions): PtyInstance
createPtyClient(options: ClientOptions): PtyDaemonClient
```

`createPty()` returns:

```ts
type PtyInstance = {
  readonly client: PtyDaemonClient;
  readonly daemon: {
    readonly process: ChildProcess | null;
    readonly socketPath: string;
    readonly tokenPath: string;
    connect(): Promise<void>;
  };
};
```

`connect()` is an idempotent connectivity guard:

- waits for background daemon warmup
- ensures client socket + handshake are ready

## CreatePtyOptions

```ts
type CreatePtyOptions = {
  socketPath?: string;
  tokenPath?: string;
  token?: string;
  protocolVersion?: number; // default: 1
  requestTimeoutMs?: number;
  daemon?: {
    binaryPath?: string;
    timeoutMs?: number;
    env?: Record<string, string | undefined>;
  };
};
```

## ClientOptions

```ts
type ClientOptions = {
  socketPath?: string; // default: $HOME/.vibest/pty/socket
  token?: string; // direct handshake token
  tokenPath?: string; // default: $HOME/.vibest/pty/token
  protocolVersion?: number; // default: 1
  clientId?: string; // default: generated UUID
  role?: "control" | "stream"; // default: "control"
  requestTimeoutMs?: number;
};
```

## Breaking v1 Handshake Contract

- Handshake now requires `client_id` and `role` in addition to token and protocol version.
- Older clients that do not send these fields fail handshake decoding and are disconnected.
- `role: "stream"` is read-only and cannot run mutating operations.
- Mutating session operations require ownership; non-owner clients receive `OWNER_REQUIRED`.

`session.create({ shell })` is optional; daemon defaults to `$SHELL` (fallback `/bin/sh`).

## Convenience

- `client.session.create(options)` returns `{ id }` where `id` is the daemon-assigned unique session id.
- `client.attach({ id })`, `client.write({ id }, data)`, `client.resize({ id }, cols, rows)` use object-first session arguments.
- `client.createAndAttach(options)` is shorthand for `session.create(options)` then `attach({ id: session.id })`.

## Security Notes

- Socket access alone is not enough; handshake still requires token.
- If the token file is readable by another process, that process can connect.
- Keep filesystem permissions strict:
  - parent dir: `0700`
  - token file: `0600`
  - socket file: `0600`

## Publishing (Maintainers)

```bash
bun run build
npm publish --access public
```
