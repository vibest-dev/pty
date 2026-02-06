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
type RequestMessage = HandshakeRequest | CreateRequest | ListRequest | AttachRequest | DetachRequest | KillRequest | KillAllRequest | InputRequest | ResizeRequest | SignalRequest | ClearScrollbackRequest;
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
type EventMessage = OutputEvent | ExitEvent;
type RequestOptions = {
  timeoutMs?: number;
};
declare class DaemonError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}
type ClientOptions = {
  socketPath: string;
  token?: string;
  tokenPath?: string;
  protocolVersion?: number;
  autoStart?: boolean;
  requestTimeoutMs?: number;
  daemon?: Omit<EnsureDaemonRunningOptions, "socketPath" | "tokenPath">;
};
declare class PtyDaemonClient extends EventEmitter {
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
export { AttachRequest, ClearScrollbackRequest, ClientOptions, CreateOptions, CreatePtyOptions, CreateRequest, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_MAX_FRAME_SIZE, DEFAULT_SOCKET_PATH, DEFAULT_TOKEN_PATH, DaemonError, DaemonErrorResponse, DaemonOkResponse, DetachRequest, EnsureDaemonRunningOptions, EventMessage, ExitEvent, FrameParser, FrameParserError, FrameParserOptions, HandshakeRequest, HandshakeResponse, InputRequest, KillAllRequest, KillRequest, ListRequest, OutputEvent, PendingEntry, PendingRequests, PtyDaemon, PtyDaemonClient, PtyInstance, ReplyMessage, RequestMessage, ResizeRequest, ResolveBinaryPathOptions, Seq, SeqResponse, SessionInfo, SignalRequest, Snapshot, TerminalModes, createClient, createPty, createPtyClient, encodeFrame, ensureDaemonRunning, isDaemonReady, resolveBinaryPath, stopDaemon };
//# sourceMappingURL=index.d.mts.map