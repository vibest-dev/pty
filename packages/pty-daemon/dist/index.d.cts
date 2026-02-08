import { EventEmitter } from "node:events";
import { ChildProcess } from "node:child_process";

//#region src/daemon.d.ts
declare const DEFAULT_SOCKET_PATH = "/tmp/rust-pty.sock";
declare const DEFAULT_TOKEN_PATH = "/tmp/rust-pty.token";
type ResolveBinaryPathOptions = {
  env?: Record<string, string | undefined>;
  packageRoot?: string;
};
type EnsureDaemonRunningOptions = {
  binaryPath?: string;
  socketPath?: string;
  tokenPath?: string;
  timeoutMs?: number;
  env?: Record<string, string | undefined>;
};
declare function resolveBinaryPath(options?: ResolveBinaryPathOptions): string | null;
declare function isDaemonReady(socketPath: string, tokenPath: string): boolean;
declare function ensureDaemonRunning(options?: EnsureDaemonRunningOptions): Promise<ChildProcess | null>;
declare function stopDaemon(child: ChildProcess | null | undefined): Promise<void>;
//#endregion
//#region src/client.d.ts
type TerminalModes = {
  application_cursor: boolean;
  bracketed_paste: boolean;
  mouse_tracking: boolean;
  mouse_sgr: boolean;
  focus_reporting: boolean;
  alternate_screen: boolean;
  cursor_visible: boolean;
  auto_wrap: boolean;
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
type SessionInfo = {
  id: number;
  pid: number;
  pts: string;
  is_alive: boolean;
  created_at: string;
  last_attached_at: string;
};
type CreateOptions = {
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
  shell?: string;
  initial_commands?: string[];
};
type Seq = number;
type HandshakeRequest = {
  type: "handshake";
  token: string;
  protocol_version: number;
};
type CreateRequest = {
  type: "create";
} & CreateOptions;
type ListRequest = {
  type: "list";
};
type AttachRequest = {
  type: "attach";
  session: number;
};
type DetachRequest = {
  type: "detach";
  session: number;
};
type KillRequest = {
  type: "kill";
  session: number;
};
type KillAllRequest = {
  type: "kill_all";
};
type InputRequest = {
  type: "input";
  session: number;
  data: Uint8Array;
};
type ResizeRequest = {
  type: "resize";
  session: number;
  cols: number;
  rows: number;
};
type SignalRequest = {
  type: "signal";
  session: number;
  signal: string;
};
type ClearScrollbackRequest = {
  type: "clear_scrollback";
  session: number;
};
type AckRequest = {
  type: "ack";
  session: number;
  count: number;
};
type RequestMessage = HandshakeRequest | CreateRequest | ListRequest | AttachRequest | DetachRequest | KillRequest | KillAllRequest | InputRequest | ResizeRequest | SignalRequest | ClearScrollbackRequest | AckRequest;
type HandshakeResponse = {
  type: "handshake";
  seq: Seq;
  protocol_version: number;
  daemon_version: string;
  daemon_pid: number;
};
type DaemonOkResponse = {
  type: "ok";
  seq: Seq;
  session?: number;
  sessions?: SessionInfo[];
  snapshot?: Snapshot;
};
type DaemonErrorResponse = {
  type: "error";
  seq: Seq;
  code: string;
  message: string;
};
type ReplyMessage = HandshakeResponse | DaemonOkResponse | DaemonErrorResponse;
type BackpressureLevel = "green" | "yellow" | "red";
type OutputEvent = {
  type: "output";
  session: number;
  data: Uint8Array;
};
type ExitEvent = {
  type: "exit";
  session: number;
  code: number;
  signal?: number;
};
type BackpressureWarningEvent = {
  type: "backpressure_warning";
  session: number;
  queue_size: number;
  level: BackpressureLevel;
};
type EventMessage = OutputEvent | ExitEvent | BackpressureWarningEvent;
interface PtyDaemonClientEvents {
  output: [OutputEvent];
  exit: [ExitEvent];
  backpressure_warning: [BackpressureWarningEvent];
  error: [Error];
  close: [];
}
type RequestOptions = {
  timeoutMs?: number;
};
declare class DaemonError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}
type FlowControlOptions = {
  /**
   * Local flow-control counter threshold (default: 100).
   * When reached, the local processed counter is reset to 0.
   * Set to 0 to keep an ever-growing processed counter.
   */
  ackThreshold?: number;
  /**
   * Manual ACK mode.
   * When true, local counters never auto-reset.
   * Use with explicit `ack()` calls if you need protocol-level compatibility behavior.
   */
  manualAck?: boolean;
};
type ClientOptions = {
  socketPath: string;
  token?: string;
  tokenPath?: string;
  protocolVersion?: number;
  autoStart?: boolean;
  requestTimeoutMs?: number;
  daemon?: Omit<EnsureDaemonRunningOptions, "socketPath" | "tokenPath">;
  flowControl?: FlowControlOptions;
};
declare class PtyDaemonClient extends EventEmitter<PtyDaemonClientEvents> {
  private socket;
  private readonly parser;
  private readonly pending;
  private readonly socketPath;
  private token?;
  private readonly tokenPath;
  private readonly protocolVersion;
  private readonly autoStart;
  private readonly requestTimeoutMs?;
  private readonly daemonOptions;
  private startedDaemon;
  private pendingHandshakeSeq;
  private handshakeResponse;
  private handshakePromise;
  private seq;
  private closed;
  private processedCounts;
  private ackThreshold;
  private manualAckMode;
  constructor(options: ClientOptions);
  waitForConnection(): Promise<void>;
  close(): void;
  shutdown(): Promise<void>;
  get isConnected(): boolean;
  get daemonProcess(): ChildProcess | null;
  handshake(options?: RequestOptions): Promise<HandshakeResponse>;
  private performHandshake;
  create(options: CreateOptions, reqOptions?: RequestOptions): Promise<{
    session: number;
  }>;
  list(reqOptions?: RequestOptions): Promise<SessionInfo[]>;
  attach(session: number, reqOptions?: RequestOptions): Promise<{
    session: number;
    snapshot: Snapshot;
  }>;
  detach(session: number, reqOptions?: RequestOptions): Promise<void>;
  kill(session: number, reqOptions?: RequestOptions): Promise<void>;
  killAll(reqOptions?: RequestOptions): Promise<number>;
  input(session: number, data: Uint8Array): void;
  write(session: number, data: Uint8Array): void;
  resize(session: number, cols: number, rows: number): void;
  signal(session: number, signal: string, reqOptions?: RequestOptions): Promise<void>;
  clearScrollback(session: number, reqOptions?: RequestOptions): Promise<void>;
  /**
   * Send protocol-level ACK (currently compatibility/no-op on daemon side).
   */
  ack(session: number, count: number): void;
  /**
   * Set local counter reset threshold (default: 100 messages).
   * Set to 0 to disable automatic local reset.
   */
  setAckThreshold(threshold: number): void;
  /**
   * Enable or disable manual ACK mode
   */
  setManualAckMode(enabled: boolean): void;
  /**
   * Get current flow control configuration
   */
  getFlowControlConfig(): {
    ackThreshold: number;
    manualAckMode: boolean;
    pendingCounts: Map<number, number>;
  };
  /**
   * Get pending message count for a specific session
   */
  getPendingCount(sessionId: number): number;
  private unwrapOk;
  private requireSession;
  private requireSessions;
  private requireSnapshot;
  private requestRaw;
  private notifyRaw;
  private onData;
  private handleSocketError;
  private handleSocketClose;
  private nextSeq;
  private takePendingHandshakeSeq;
  private readTokenFromFile;
}
declare function createClient(options: ClientOptions): PtyDaemonClient;
//#endregion
//#region src/server.d.ts
type CreatePtyOptions = Omit<ClientOptions, "socketPath" | "tokenPath"> & {
  socketPath?: string;
  tokenPath?: string;
};
type PtyDaemon = {
  readonly process: ChildProcess | null;
  readonly socketPath: string;
  readonly tokenPath: string;
  close(): Promise<void>;
};
type PtyInstance = {
  readonly client: PtyDaemonClient;
  readonly daemon: PtyDaemon;
  close(): Promise<void>;
  shutdown(): Promise<void>;
};
declare function createPtyClient(options: ClientOptions): PtyDaemonClient;
declare function createPty(options?: CreatePtyOptions): Promise<PtyInstance>;
//#endregion
//#region src/frame.d.ts
declare const DEFAULT_MAX_FRAME_SIZE: number;
declare const DEFAULT_MAX_BUFFER_SIZE: number;
declare class FrameParserError extends Error {
  constructor(message: string);
}
declare function encodeFrame(message: unknown): Uint8Array;
type FrameParserOptions = {
  maxFrameSize?: number;
  maxBufferSize?: number;
};
declare class FrameParser {
  private buffer;
  private readonly maxFrameSize;
  private readonly maxBufferSize;
  constructor(options?: FrameParserOptions);
  push(chunk: Uint8Array): unknown[];
  reset(): void;
}
//#endregion
//#region src/pending.d.ts
type SeqResponse = {
  type: "ok" | "error" | "handshake";
  seq: number;
};
type PendingEntry<TResponse extends SeqResponse> = {
  resolve: (response: TResponse) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};
declare class PendingRequests<TResponse extends SeqResponse = SeqResponse> {
  private readonly pending;
  register(seq: number, timeoutMs?: number): Promise<TResponse>;
  resolve(response: TResponse): void;
  rejectAll(error: Error): void;
  get size(): number;
}
//#endregion
export { AckRequest, AttachRequest, BackpressureLevel, BackpressureWarningEvent, ClearScrollbackRequest, ClientOptions, CreateOptions, CreatePtyOptions, CreateRequest, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_MAX_FRAME_SIZE, DEFAULT_SOCKET_PATH, DEFAULT_TOKEN_PATH, DaemonError, DaemonErrorResponse, DaemonOkResponse, DetachRequest, EnsureDaemonRunningOptions, EventMessage, ExitEvent, FlowControlOptions, FrameParser, FrameParserError, FrameParserOptions, HandshakeRequest, HandshakeResponse, InputRequest, KillAllRequest, KillRequest, ListRequest, OutputEvent, PendingEntry, PendingRequests, PtyDaemon, PtyDaemonClient, PtyDaemonClientEvents, PtyInstance, ReplyMessage, RequestMessage, ResizeRequest, ResolveBinaryPathOptions, Seq, SeqResponse, SessionInfo, SignalRequest, Snapshot, TerminalModes, createClient, createPty, createPtyClient, encodeFrame, ensureDaemonRunning, isDaemonReady, resolveBinaryPath, stopDaemon };
//# sourceMappingURL=index.d.cts.map