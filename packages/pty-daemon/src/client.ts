import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import net from "node:net";
import { DEFAULT_SOCKET_PATH, DEFAULT_TOKEN_PATH } from "./daemon";
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

export type Session = {
  id: number;
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
  | ClearScrollbackRequest;

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
  count?: number;
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

// Type-safe event map for the client EventEmitter
export interface PtyDaemonClientEvents {
  output: [OutputEvent];
  exit: [ExitEvent];
  backpressure_warning: [BackpressureWarningEvent];
  error: [Error];
  close: [];
}

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
  socketPath?: string;
  token?: string;
  tokenPath?: string;
  protocolVersion?: number;
  requestTimeoutMs?: number;
};

export class PtyDaemonClient extends EventEmitter<PtyDaemonClientEvents> {
  private socket: net.Socket | null = null;
  private readonly parser = new FrameParser();
  private readonly pending = new PendingRequests<ReplyMessage>();
  private readonly socketPath: string;
  private token?: string;
  private readonly tokenPath: string;
  private readonly protocolVersion: number;
  private readonly requestTimeoutMs?: number;
  private pendingHandshakeSeq: Seq | null = null;
  private handshakeResponse: HandshakeResponse | null = null;
  private handshakePromise: Promise<HandshakeResponse> | null = null;
  private seq = 1;
  private closed = false;

  readonly session = {
    create: async (options: CreateOptions, reqOptions?: RequestOptions): Promise<Session> => {
      const created = await this.create(options, reqOptions);
      return { id: created.session };
    },
  };

  constructor(options: ClientOptions) {
    super();
    this.socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
    this.token = options.token;
    this.tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
    this.protocolVersion = options.protocolVersion ?? 1;
    this.requestTimeoutMs = options.requestTimeoutMs;
  }

  // ---- Connection lifecycle ------------------------------------------------

  async waitForConnection(): Promise<void> {
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

  get isConnected(): boolean {
    return this.socket !== null && !this.closed;
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
    session: Session,
    reqOptions?: RequestOptions,
  ): Promise<{ session: number; snapshot: Snapshot }> {
    const ok = this.unwrapOk(await this.requestRaw({ type: "attach", session: session.id }, reqOptions));
    return { session: this.requireSession(ok), snapshot: this.requireSnapshot(ok) };
  }

  async createAndAttach(
    options: CreateOptions,
    reqOptions?: RequestOptions,
  ): Promise<{ session: number; snapshot: Snapshot }> {
    const session = await this.session.create(options, reqOptions);
    return await this.attach(session, reqOptions);
  }

  async detach(session: number, reqOptions?: RequestOptions): Promise<void> {
    this.unwrapOk(await this.requestRaw({ type: "detach", session }, reqOptions));
  }

  async kill(session: number, reqOptions?: RequestOptions): Promise<void> {
    this.unwrapOk(await this.requestRaw({ type: "kill", session }, reqOptions));
  }

  async killAll(reqOptions?: RequestOptions): Promise<number> {
    const ok = this.unwrapOk(await this.requestRaw({ type: "kill_all" }, reqOptions));
    return this.requireCount(ok);
  }

  write(session: Session, data: Uint8Array): void {
    this.notifyRaw({ type: "input", session: session.id, data });
  }

  resize(session: Session, cols: number, rows: number): void {
    this.notifyRaw({ type: "resize", session: session.id, cols, rows });
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

  private requireCount(ok: DaemonOkResponse): number {
    if (typeof ok.count !== "number") {
      throw new Error("Protocol error: missing ok.count");
    }
    return ok.count;
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
          continue;
        }

        if (isExitEvent(message)) {
          this.emit(message.type, message);
          continue;
        }

        if (isBackpressureWarningEvent(message)) {
          this.emit("backpressure_warning", message);
        }
      }
    } catch (err) {
      const error =
        err instanceof FrameParserError
          ? err
          : err instanceof Error
            ? err
            : new Error(String(err));
      this.emit("error", error);
      this.close();
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

export function createPtyClient(options: ClientOptions): PtyDaemonClient {
  return new PtyDaemonClient(options);
}
