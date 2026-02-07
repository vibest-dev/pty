import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import net from "node:net";
import type { ChildProcess } from "node:child_process";
import {
  DEFAULT_TOKEN_PATH,
  ensureDaemonRunning,
  stopDaemon,
  type EnsureDaemonRunningOptions,
} from "./daemon";
import { FrameParser, FrameParserError, encodeFrame } from "./frame";
import { PendingRequests } from "./pending";

// ---------------------------------------------------------------------------
// Protocol types (aligned with Rust daemon crates/daemon/src/protocol/message.rs)
// ---------------------------------------------------------------------------

export type TerminalModes = {
  application_cursor: boolean;
  bracketed_paste: boolean;
  mouse_tracking: boolean;
  mouse_sgr: boolean;
  focus_reporting: boolean;
  alternate_screen: boolean;
  cursor_visible: boolean;
  auto_wrap: boolean;
};

export type Snapshot = {
  content: string;
  rehydrate: string;
  cols: number;
  rows: number;
  cursor_x: number;
  cursor_y: number;
  modes: TerminalModes;
  cwd?: string;
};

export type SessionInfo = {
  id: number;
  pid: number;
  pts: string;
  is_alive: boolean;
  created_at: string;
  last_attached_at: string;
};

export type CreateOptions = {
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
  shell?: string;
  initial_commands?: string[];
};

// ---------------------------------------------------------------------------
// Request / Response discriminated unions
// ---------------------------------------------------------------------------

export type Seq = number;

export type HandshakeRequest = {
  type: "handshake";
  token: string;
  protocol_version: number;
};

export type CreateRequest = { type: "create" } & CreateOptions;
export type ListRequest = { type: "list" };
export type AttachRequest = { type: "attach"; session: number };
export type DetachRequest = { type: "detach"; session: number };
export type KillRequest = { type: "kill"; session: number };
export type KillAllRequest = { type: "kill_all" };
export type InputRequest = { type: "input"; session: number; data: Uint8Array };
export type ResizeRequest = { type: "resize"; session: number; cols: number; rows: number };
export type SignalRequest = { type: "signal"; session: number; signal: string };
export type ClearScrollbackRequest = { type: "clear_scrollback"; session: number };
export type AckRequest = { type: "ack"; session: number; count: number };

export type RequestMessage =
  | HandshakeRequest
  | CreateRequest
  | ListRequest
  | AttachRequest
  | DetachRequest
  | KillRequest
  | KillAllRequest
  | InputRequest
  | ResizeRequest
  | SignalRequest
  | ClearScrollbackRequest
  | AckRequest;

type RequestNoSeq = RequestMessage;

export type HandshakeResponse = {
  type: "handshake";
  seq: Seq;
  protocol_version: number;
  daemon_version: string;
  daemon_pid: number;
};

export type DaemonOkResponse = {
  type: "ok";
  seq: Seq;
  session?: number;
  sessions?: SessionInfo[];
  snapshot?: Snapshot;
};

export type DaemonErrorResponse = {
  type: "error";
  seq: Seq;
  code: string;
  message: string;
};

type HandshakeWireResponse = Omit<HandshakeResponse, "seq"> & {
  seq?: Seq;
};

export type ReplyMessage = HandshakeResponse | DaemonOkResponse | DaemonErrorResponse;

export type BackpressureLevel = "green" | "yellow" | "red";

export type OutputEvent = { type: "output"; session: number; data: Uint8Array };
export type ExitEvent = { type: "exit"; session: number; code: number; signal?: number };
export type BackpressureWarningEvent = {
  type: "backpressure_warning";
  session: number;
  queue_size: number;
  level: BackpressureLevel;
};
export type EventMessage = OutputEvent | ExitEvent | BackpressureWarningEvent;

type RequestOptions = {
  timeoutMs?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHandshakeWireResponse(value: unknown): value is HandshakeWireResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === "handshake" &&
    typeof value.protocol_version === "number" &&
    typeof value.daemon_version === "string" &&
    typeof value.daemon_pid === "number" &&
    (typeof value.seq === "number" || typeof value.seq === "undefined")
  );
}

function isDaemonOkResponse(value: unknown): value is DaemonOkResponse {
  if (!isRecord(value)) {
    return false;
  }
  return value.type === "ok" && typeof value.seq === "number";
}

function isDaemonErrorResponse(value: unknown): value is DaemonErrorResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === "error" &&
    typeof value.seq === "number" &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

function isOutputEvent(value: unknown): value is OutputEvent {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === "output" &&
    typeof value.session === "number" &&
    value.data instanceof Uint8Array
  );
}

function isExitEvent(value: unknown): value is ExitEvent {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === "exit" &&
    typeof value.session === "number" &&
    typeof value.code === "number" &&
    (typeof value.signal === "number" || typeof value.signal === "undefined")
  );
}

function isBackpressureWarningEvent(value: unknown): value is BackpressureWarningEvent {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.type === "backpressure_warning" &&
    typeof value.session === "number" &&
    typeof value.queue_size === "number" &&
    typeof value.level === "string" &&
    ["green", "yellow", "red"].includes(value.level as string)
  );
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class DaemonError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "DaemonError";
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export type ClientOptions = {
  socketPath: string;
  token?: string;
  tokenPath?: string;
  protocolVersion?: number;
  autoStart?: boolean;
  requestTimeoutMs?: number;
  daemon?: Omit<EnsureDaemonRunningOptions, "socketPath" | "tokenPath">;
};

export class PtyDaemonClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private readonly parser = new FrameParser();
  private readonly pending = new PendingRequests<ReplyMessage>();
  private readonly socketPath: string;
  private token?: string;
  private readonly tokenPath: string;
  private readonly protocolVersion: number;
  private readonly autoStart: boolean;
  private readonly requestTimeoutMs?: number;
  private readonly daemonOptions: Omit<EnsureDaemonRunningOptions, "socketPath" | "tokenPath">;
  private startedDaemon: ChildProcess | null = null;
  private pendingHandshakeSeq: Seq | null = null;
  private handshakeResponse: HandshakeResponse | null = null;
  private handshakePromise: Promise<HandshakeResponse> | null = null;
  private seq = 1;
  private closed = false;
  private processedCounts: Map<number, number> = new Map();
  private ackThreshold = 100;

  constructor(options: ClientOptions) {
    super();
    this.socketPath = options.socketPath;
    this.token = options.token;
    this.tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
    this.protocolVersion = options.protocolVersion ?? 1;
    this.autoStart = options.autoStart ?? true;
    this.requestTimeoutMs = options.requestTimeoutMs;
    this.daemonOptions = options.daemon ?? {};
  }

  // ---- Connection lifecycle ------------------------------------------------

  async waitForConnection(): Promise<void> {
    if (this.autoStart) {
      this.startedDaemon = await ensureDaemonRunning({
        ...this.daemonOptions,
        socketPath: this.socketPath,
        tokenPath: this.tokenPath,
      });
    }

    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(this.socketPath, () => {
        this.socket = socket;
        resolve();
      });

      socket.once("error", (err) => {
        if (!this.socket) {
          reject(err);
        } else {
          this.handleSocketError(err);
        }
      });
      socket.on("data", (buf) => this.onData(buf));
      socket.on("close", () => this.handleSocketClose());
    });

    await this.handshake();
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.pendingHandshakeSeq = null;
    this.handshakeResponse = null;
    this.handshakePromise = null;
    this.pending.rejectAll(new Error("Client closed"));
    this.socket?.end();
    this.socket = null;
  }

  async shutdown(): Promise<void> {
    this.close();
    await stopDaemon(this.startedDaemon);
    this.startedDaemon = null;
  }

  get isConnected(): boolean {
    return this.socket !== null && !this.closed;
  }

  get daemonProcess(): ChildProcess | null {
    return this.startedDaemon;
  }

  // ---- Typed public API ----------------------------------------------------

  async handshake(options?: RequestOptions): Promise<HandshakeResponse> {
    if (this.handshakeResponse) {
      return this.handshakeResponse;
    }
    if (this.handshakePromise) {
      return this.handshakePromise;
    }

    this.handshakePromise = this.performHandshake(options);
    try {
      const reply = await this.handshakePromise;
      this.handshakeResponse = reply;
      return reply;
    } finally {
      this.handshakePromise = null;
    }
  }

  private async performHandshake(options?: RequestOptions): Promise<HandshakeResponse> {
    const token = this.token ?? (await this.readTokenFromFile());
    this.token = token;
    const reply = await this.requestRaw(
      { type: "handshake", token, protocol_version: this.protocolVersion },
      options,
    );
    if (reply.type === "error") throw new DaemonError(reply.code, reply.message);
    if (reply.type !== "handshake") throw new Error(`Expected handshake, got ${reply.type}`);
    return reply;
  }

  async create(
    options: CreateOptions,
    reqOptions?: RequestOptions,
  ): Promise<{ session: number }> {
    const ok = this.unwrapOk(await this.requestRaw({ type: "create", ...options }, reqOptions));
    return { session: this.requireSession(ok) };
  }

  async list(reqOptions?: RequestOptions): Promise<SessionInfo[]> {
    const ok = this.unwrapOk(await this.requestRaw({ type: "list" }, reqOptions));
    return this.requireSessions(ok);
  }

  async attach(
    session: number,
    reqOptions?: RequestOptions,
  ): Promise<{ session: number; snapshot: Snapshot }> {
    const ok = this.unwrapOk(await this.requestRaw({ type: "attach", session }, reqOptions));
    return { session: this.requireSession(ok), snapshot: this.requireSnapshot(ok) };
  }

  async detach(session: number, reqOptions?: RequestOptions): Promise<void> {
    this.unwrapOk(await this.requestRaw({ type: "detach", session }, reqOptions));
  }

  async kill(session: number, reqOptions?: RequestOptions): Promise<void> {
    this.unwrapOk(await this.requestRaw({ type: "kill", session }, reqOptions));
  }

  async killAll(reqOptions?: RequestOptions): Promise<number> {
    const ok = this.unwrapOk(await this.requestRaw({ type: "kill_all" }, reqOptions));
    return this.requireSession(ok);
  }

  input(session: number, data: Uint8Array): void {
    this.notifyRaw({ type: "input", session, data });
  }

  write(session: number, data: Uint8Array): void {
    this.input(session, data);
  }

  resize(session: number, cols: number, rows: number): void {
    this.notifyRaw({ type: "resize", session, cols, rows });
  }

  async signal(
    session: number,
    signal: string,
    reqOptions?: RequestOptions,
  ): Promise<void> {
    this.unwrapOk(await this.requestRaw({ type: "signal", session, signal }, reqOptions));
  }

  async clearScrollback(session: number, reqOptions?: RequestOptions): Promise<void> {
    this.unwrapOk(await this.requestRaw({ type: "clear_scrollback", session }, reqOptions));
  }

  /**
   * Acknowledge processed messages for flow control
   * This helps the daemon track backpressure and prevent disconnections
   */
  ack(session: number, count: number): void {
    this.notifyRaw({ type: "ack", session, count });
  }

  /**
   * Set the threshold for automatic ACKs (default: 100 messages)
   * Set to 0 to disable automatic ACKs
   */
  setAckThreshold(threshold: number): void {
    this.ackThreshold = threshold;
  }

  // ---- Internal helpers ----------------------------------------------------

  private unwrapOk(reply: ReplyMessage): DaemonOkResponse {
    if (reply.type === "error") throw new DaemonError(reply.code, reply.message);
    if (reply.type !== "ok") throw new Error(`Expected ok, got ${reply.type}`);
    return reply;
  }

  private requireSession(ok: DaemonOkResponse): number {
    if (typeof ok.session !== "number") {
      throw new Error("Protocol error: missing ok.session");
    }
    return ok.session;
  }

  private requireSessions(ok: DaemonOkResponse): SessionInfo[] {
    if (!Array.isArray(ok.sessions)) {
      throw new Error("Protocol error: missing ok.sessions");
    }
    return ok.sessions;
  }

  private requireSnapshot(ok: DaemonOkResponse): Snapshot {
    if (!ok.snapshot) {
      throw new Error("Protocol error: missing ok.snapshot");
    }
    return ok.snapshot;
  }

  private async requestRaw(request: RequestNoSeq, options?: RequestOptions): Promise<ReplyMessage> {
    if (!this.socket || this.closed) {
      throw new Error("Socket is not connected");
    }

    const seq = this.nextSeq();
    const timeoutMs = options?.timeoutMs ?? this.requestTimeoutMs;

    if (request.type === "handshake") {
      this.pendingHandshakeSeq = seq;
    }

    const pendingPromise = this.pending.register(seq, timeoutMs);
    const payload = { ...request, seq };
    this.socket.write(Buffer.from(encodeFrame(payload)));

    try {
      return await pendingPromise;
    } finally {
      if (request.type === "handshake") {
        this.pendingHandshakeSeq = null;
      }
    }
  }

  private notifyRaw(request: RequestNoSeq): void {
    if (!this.socket || this.closed) {
      throw new Error("Socket is not connected");
    }

    const seq = this.nextSeq();
    const payload = { ...request, seq };
    this.socket.write(Buffer.from(encodeFrame(payload)));
  }

  private onData(buf: Buffer): void {
    try {
      const messages = this.parser.push(new Uint8Array(buf));
      for (const message of messages) {
        if (isHandshakeWireResponse(message)) {
          const seq = typeof message.seq === "number" ? message.seq : this.takePendingHandshakeSeq();
          if (typeof seq !== "number") {
            this.emit("error", new Error("Protocol error: handshake response missing seq"));
            continue;
          }
          const reply: HandshakeResponse = { ...message, seq };
          this.pending.resolve(reply);
          continue;
        }

        if (isDaemonOkResponse(message) || isDaemonErrorResponse(message)) {
          this.pending.resolve(message);
          continue;
        }

        if (isOutputEvent(message)) {
          this.emit(message.type, message);
          // Auto-ACK if enabled
          if (this.ackThreshold > 0) {
            const session = message.session;
            const count = (this.processedCounts.get(session) ?? 0) + 1;
            this.processedCounts.set(session, count);
            if (count >= this.ackThreshold) {
              this.ack(session, count);
              this.processedCounts.set(session, 0);
            }
          }
          continue;
        }

        if (isExitEvent(message)) {
          this.emit(message.type, message);
          // Clean up processed counts for this session
          this.processedCounts.delete(message.session);
          continue;
        }

        if (isBackpressureWarningEvent(message)) {
          this.emit("backpressure_warning", message);
        }
      }
    } catch (err) {
      if (err instanceof FrameParserError) {
        this.emit("error", err);
        this.close();
      } else {
        throw err;
      }
    }
  }

  private handleSocketError(err: Error): void {
    this.pendingHandshakeSeq = null;
    this.handshakeResponse = null;
    this.handshakePromise = null;
    this.pending.rejectAll(err);
    this.parser.reset();
    this.emit("error", err);
  }

  private handleSocketClose(): void {
    this.pendingHandshakeSeq = null;
    this.handshakeResponse = null;
    this.handshakePromise = null;
    if (!this.closed) {
      this.pending.rejectAll(new Error("Socket closed unexpectedly"));
    }
    this.parser.reset();
    this.socket = null;
    this.emit("close");
  }

  private nextSeq(): number {
    return this.seq++;
  }

  private takePendingHandshakeSeq(): Seq | undefined {
    const seq = this.pendingHandshakeSeq ?? undefined;
    this.pendingHandshakeSeq = null;
    return seq;
  }

  private async readTokenFromFile(): Promise<string> {
    const token = await readFile(this.tokenPath, "utf8");
    return token.trim();
  }
}

export function createClient(options: ClientOptions): PtyDaemonClient {
  return new PtyDaemonClient(options);
}
