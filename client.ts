import { encode, decode } from "@msgpack/msgpack";
import { readFileSync } from "fs";

const SOCKET_PATH = process.env.RUST_PTY_SOCKET_PATH || "/tmp/rust-pty.sock";
const TOKEN_PATH = process.env.RUST_PTY_TOKEN_PATH || "/tmp/rust-pty.token";
const PROTOCOL_VERSION = 2;

// ============== Types ==============

interface CreateOptions {
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
  shell?: string;
  workspace_id?: string;
  pane_id?: string;
  initial_commands?: string[];
}

interface SessionInfo {
  id: number;
  pid: number;
  pts: string;
  is_alive: boolean;
  created_at: string;
  last_attached_at: string;
  workspace_id?: string;
  pane_id?: string;
}

interface Snapshot {
  content: string;
  rehydrate: string;
  cols: number;
  rows: number;
  cursor_x: number;
  cursor_y: number;
  modes: Record<string, boolean>;
  cwd?: string;
}

type Request =
  | { type: "hello"; token: string; protocol_version: number }
  | { type: "create"; cwd?: string; cols?: number; rows?: number; env?: Record<string, string>; shell?: string; workspace_id?: string; pane_id?: string; initial_commands?: string[] }
  | { type: "list" }
  | { type: "list_by_workspace"; workspace_id: string }
  | { type: "attach"; session: number }
  | { type: "detach"; session: number }
  | { type: "kill"; session: number }
  | { type: "kill_all" }
  | { type: "kill_by_workspace"; workspace_id: string }
  | { type: "input"; session: number; data: Uint8Array }
  | { type: "resize"; session: number; cols: number; rows: number }
  | { type: "signal"; session: number; signal: string }
  | { type: "clear_scrollback"; session: number };

type Response =
  | { type: "hello"; protocol_version: number; daemon_version: string; daemon_pid: number }
  | { type: "ok"; session?: number; sessions?: SessionInfo[]; snapshot?: Snapshot }
  | { type: "error"; code: string; message: string }
  | { type: "output"; session: number; data: Uint8Array }
  | { type: "exit"; session: number; code: number; signal?: number };

// ============== Protocol ==============

function encodeMessage(msg: Request): Uint8Array {
  const payload = encode(msg);
  const frame = new Uint8Array(4 + payload.length);
  const view = new DataView(frame.buffer);
  view.setUint32(0, payload.length, false);
  frame.set(payload, 4);
  return frame;
}

class MessageParser {
  private buffer = new Uint8Array(0);

  push(data: Uint8Array): Response[] {
    const newBuf = new Uint8Array(this.buffer.length + data.length);
    newBuf.set(this.buffer);
    newBuf.set(data, this.buffer.length);
    this.buffer = newBuf;

    const messages: Response[] = [];
    while (this.buffer.length >= 4) {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset);
      const len = view.getUint32(0, false);
      if (this.buffer.length < 4 + len) break;
      const payload = this.buffer.slice(4, 4 + len);
      messages.push(decode(payload) as Response);
      this.buffer = this.buffer.slice(4 + len);
    }
    return messages;
  }
}

// ============== Client ==============

class PtyClient {
  private socket: any;
  private parser = new MessageParser();
  private currentSession: number | null = null;
  private pendingResolve: ((msg: Response) => void) | null = null;
  private authenticated = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      Bun.connect({
        unix: SOCKET_PATH,
        socket: {
          data: (socket, data) => this.onData(new Uint8Array(data)),
          open: (socket) => {
            this.socket = socket;
            resolve();
          },
          close: () => this.onClose(),
          error: (socket, error) => reject(error),
        },
      }).catch(reject);
    });
  }

  private send(msg: Request): void {
    this.socket.write(encodeMessage(msg));
  }

  private async sendAndWait(msg: Request): Promise<Response> {
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.send(msg);
    });
  }

  private onData(data: Uint8Array): void {
    const messages = this.parser.push(data);
    for (const msg of messages) {
      if (msg.type === "output" && msg.session === this.currentSession) {
        process.stdout.write(Buffer.from(msg.data));
      } else if (msg.type === "exit") {
        const sig = msg.signal ? ` (signal ${msg.signal})` : "";
        console.log(`\n[Session ${msg.session} exited with code ${msg.code}${sig}]`);
        if (msg.session === this.currentSession) {
          this.currentSession = null;
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.exit(msg.code);
        }
      } else if (msg.type === "hello" || msg.type === "ok" || msg.type === "error") {
        if (this.pendingResolve) {
          this.pendingResolve(msg);
          this.pendingResolve = null;
        }
      }
    }
  }

  private onClose(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.exit(0);
  }

  async authenticate(): Promise<void> {
    if (this.authenticated) return;

    let token: string;
    try {
      token = readFileSync(TOKEN_PATH, "utf-8").trim();
    } catch {
      throw new Error(`Cannot read token from ${TOKEN_PATH}. Is the daemon running?`);
    }

    const resp = await this.sendAndWait({
      type: "hello",
      token,
      protocol_version: PROTOCOL_VERSION,
    });

    if (resp.type === "error") {
      throw new Error(`Auth failed: ${resp.message}`);
    }

    if (resp.type === "hello") {
      console.log(`Connected to daemon v${resp.daemon_version} (PID: ${resp.daemon_pid})`);
      this.authenticated = true;
    }
  }

  async create(options: CreateOptions = {}): Promise<{ id: number; snapshot?: Snapshot }> {
    await this.authenticate();

    const resp = await this.sendAndWait({
      type: "create",
      cols: options.cols || process.stdout.columns || 80,
      rows: options.rows || process.stdout.rows || 24,
      ...options,
    });

    if (resp.type === "ok" && resp.session !== undefined) {
      return { id: resp.session, snapshot: resp.snapshot };
    }
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
    throw new Error("Unexpected response");
  }

  async list(): Promise<SessionInfo[]> {
    await this.authenticate();

    const resp = await this.sendAndWait({ type: "list" });
    if (resp.type === "ok") {
      return resp.sessions || [];
    }
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
    throw new Error("Unexpected response");
  }

  async attach(session: number): Promise<Snapshot | undefined> {
    await this.authenticate();

    const resp = await this.sendAndWait({ type: "attach", session });
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }

    if (resp.type !== "ok") {
      throw new Error("Unexpected response");
    }

    this.currentSession = session;

    // Replay snapshot content
    if (resp.snapshot?.content) {
      process.stdout.write(resp.snapshot.content);
    }

    // Send initial size
    this.send({
      type: "resize",
      session,
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
    });

    // Handle resize
    process.on("SIGWINCH", () => {
      if (this.currentSession !== null) {
        this.send({
          type: "resize",
          session: this.currentSession,
          cols: process.stdout.columns || 80,
          rows: process.stdout.rows || 24,
        });
      }
    });

    // Raw mode and stdin forwarding
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.on("data", (data: Buffer) => {
      if (this.currentSession !== null) {
        this.send({
          type: "input",
          session: this.currentSession,
          data: new Uint8Array(data),
        });
      }
    });

    return resp.snapshot;
  }

  async detach(session: number): Promise<void> {
    const resp = await this.sendAndWait({ type: "detach", session });
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
    this.currentSession = null;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  }

  async kill(session: number): Promise<void> {
    await this.authenticate();

    const resp = await this.sendAndWait({ type: "kill", session });
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
  }

  async killAll(): Promise<number> {
    await this.authenticate();

    const resp = await this.sendAndWait({ type: "kill_all" });
    if (resp.type === "ok") {
      return resp.session || 0; // session field contains count
    }
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
    throw new Error("Unexpected response");
  }

  async signal(session: number, signal: string): Promise<void> {
    await this.authenticate();

    const resp = await this.sendAndWait({ type: "signal", session, signal });
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
  }

  async clearScrollback(session: number): Promise<void> {
    await this.authenticate();

    const resp = await this.sendAndWait({ type: "clear_scrollback", session });
    if (resp.type === "error") {
      throw new Error(`${resp.code}: ${resp.message}`);
    }
  }
}

// ============== Main ==============

async function main() {
  const client = new PtyClient();

  try {
    await client.connect();
  } catch (e) {
    console.error(`Failed to connect to daemon at ${SOCKET_PATH}`);
    console.error("Is the daemon running? Start with: ./target/release/rust-daemon");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const cmd = args[0];

  try {
    switch (cmd) {
      case "create": {
        const { id } = await client.create({
          initial_commands: args.slice(1).length > 0 ? args.slice(1) : undefined,
        });
        console.log(`Created session ${id}`);
        process.exit(0);
      }

      case "list": {
        const sessions = await client.list();
        if (sessions.length === 0) {
          console.log("No sessions");
        } else {
          console.log("Sessions:");
          for (const s of sessions) {
            const alive = s.is_alive ? "✓" : "✗";
            console.log(`  ${s.id}: [${alive}] PID ${s.pid} (${s.pts})`);
            if (s.workspace_id) console.log(`      workspace: ${s.workspace_id}`);
          }
        }
        process.exit(0);
      }

      case "attach": {
        const session = parseInt(args[1], 10);
        if (isNaN(session)) {
          console.error("Usage: attach <session_id>");
          process.exit(1);
        }
        await client.attach(session);
        break;
      }

      case "kill": {
        const session = parseInt(args[1], 10);
        if (isNaN(session)) {
          console.error("Usage: kill <session_id>");
          process.exit(1);
        }
        await client.kill(session);
        console.log(`Killed session ${session}`);
        process.exit(0);
      }

      case "kill-all": {
        const count = await client.killAll();
        console.log(`Killed ${count} session(s)`);
        process.exit(0);
      }

      case "signal": {
        const session = parseInt(args[1], 10);
        const signal = args[2] || "SIGINT";
        if (isNaN(session)) {
          console.error("Usage: signal <session_id> [SIGNAL]");
          process.exit(1);
        }
        await client.signal(session, signal);
        console.log(`Sent ${signal} to session ${session}`);
        process.exit(0);
      }

      case "help":
      case "--help":
      case "-h": {
        console.log(`
Usage: bun client.ts [command] [args]

Commands:
  (no args)              Create and attach to new session
  create [cmd...]        Create session, optionally run initial commands
  list                   List all sessions
  attach <id>            Attach to existing session
  kill <id>              Kill session
  kill-all               Kill all sessions
  signal <id> [SIG]      Send signal (default: SIGINT)
  help                   Show this help
`);
        process.exit(0);
      }

      default: {
        // Default: create and attach
        const { id } = await client.create();
        console.log(`[Attached to session ${id}]`);
        await client.attach(id);
      }
    }
  } catch (e) {
    console.error(`Error: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

main();
