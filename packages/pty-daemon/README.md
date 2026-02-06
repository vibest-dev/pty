# @vibest/pty-daemon API Usage

## High-Level API

```ts
import { createPty } from "@vibest/pty-daemon";

const pty = await createPty({
  socketPath: "/tmp/rust-pty.sock",
  tokenPath: "/tmp/rust-pty.token",
  protocolVersion: 1,
  autoStart: true,
});

// pty.client: PtyDaemonClient
// pty.daemon.process: ChildProcess | null
// pty.daemon.close(): Promise<void>
// pty.close(): Promise<void>
// pty.shutdown(): Promise<void>
```

## Create Client

```ts
import { createPtyClient } from "@vibest/pty-daemon";

const client = createPtyClient({
  socketPath: "/tmp/rust-pty.sock",
  tokenPath: "/tmp/rust-pty.token",
  protocolVersion: 1, // default: 1
  autoStart: true, // default: true
  requestTimeoutMs: 5000,
  daemon: {
    binaryPath: "/absolute/path/to/vibest-pty-daemon",
    timeoutMs: 5000,
    env: {},
  },
});
```

`await client.waitForConnection()` 会自动完成 `handshake()`。

## Core Flow

```ts
await client.waitForConnection();

const { session } = await client.create({ cols: 80, rows: 24 });
const sessions = await client.list();
const { snapshot } = await client.attach(session);

await client.signal(session, "SIGCONT");
await client.input(session, new TextEncoder().encode("ls -la\n"));
client.resize(session, 120, 40);

await client.detach(session);
await client.kill(session);
const killedCount = await client.killAll();

await client.shutdown();
```

## API Signatures

```ts
// lifecycle
waitForConnection(): Promise<void>
close(): void
shutdown(): Promise<void>
readonly isConnected: boolean
handshake(options?: { timeoutMs?: number }): Promise<HandshakeResponse>

// session
create(options: CreateOptions, reqOptions?: { timeoutMs?: number }): Promise<{ session: number }>
list(reqOptions?: { timeoutMs?: number }): Promise<SessionInfo[]>
attach(session: number, reqOptions?: { timeoutMs?: number }): Promise<{ session: number; snapshot: Snapshot }>
detach(session: number, reqOptions?: { timeoutMs?: number }): Promise<void>
kill(session: number, reqOptions?: { timeoutMs?: number }): Promise<void>
killAll(reqOptions?: { timeoutMs?: number }): Promise<number>

// io / control
input(session: number, data: Uint8Array): void
write(session: number, data: Uint8Array): void // alias of input
resize(session: number, cols: number, rows: number): void
signal(session: number, signal: string, reqOptions?: { timeoutMs?: number }): Promise<void>
clearScrollback(session: number, reqOptions?: { timeoutMs?: number }): Promise<void>

// high-level
createPty(options?: CreatePtyOptions): Promise<PtyInstance>
createPtyClient(options: ClientOptions): PtyDaemonClient
```

## Types You Will Use

```ts
type CreateOptions = {
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
  shell?: string;
  initial_commands?: string[];
};

type SessionInfo = {
  id: number;
  pid: number;
  pts: string;
  is_alive: boolean;
  created_at: string;
  last_attached_at: string;
};

type Snapshot = {
  content: string;
  rehydrate: string;
  cols: number;
  rows: number;
  cursor_x: number;
  cursor_y: number;
  modes: TerminalModes;
  cwd?: string;
};
```

## Events

```ts
client.on("output", (e) => {
  // e: { type: "output"; session: number; data: Uint8Array }
  process.stdout.write(Buffer.from(e.data));
});

client.on("exit", (e) => {
  // e: { type: "exit"; session: number; code: number; signal?: number }
  console.log("exit:", e.session, e.code, e.signal);
});

client.on("error", (err) => {
  console.error(err);
});

client.on("close", () => {
  console.log("socket closed");
});
```

## Error Handling

```ts
import { DaemonError } from "@vibest/pty-daemon";

try {
  await client.waitForConnection();
} catch (err) {
  if (err instanceof DaemonError) {
    console.error(err.code, err.message);
  }
}
```
