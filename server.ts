import { encode, decode } from "@msgpack/msgpack";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SOCKET_PATH = "/tmp/rust-pty.sock";
const TOKEN_PATH = "/tmp/rust-pty.token";
const PROTOCOL_VERSION = 2;
const PORT = 3000;
const HISTORY_DIR = process.env.RUST_PTY_HISTORY_DIR || "/tmp/.vibest/pty-history";
const MAX_HISTORY_BYTES = 5 * 1024 * 1024;
const MAX_ATTACH_HISTORY_BYTES = 512 * 1024;
const HISTORY_FLUSH_INTERVAL_MS = 200;
const CLEAR_SCROLLBACK_SEQUENCE = Buffer.from([0x1b, 0x5b, 0x33, 0x4a]);

mkdirSync(HISTORY_DIR, { recursive: true, mode: 0o700 });

// ============== Types ==============

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

type DaemonMessage =
  | { type: "hello"; token: string; protocol_version: number }
  | { type: "hello"; protocol_version: number; daemon_version: string; daemon_pid: number }
  | { type: "create" }
  | { type: "list" }
  | { type: "attach"; session: number }
  | { type: "detach"; session: number }
  | { type: "kill"; session: number }
  | { type: "input"; session: number; data: Uint8Array }
  | { type: "resize"; session: number; cols: number; rows: number }
  | { type: "output"; session: number; data: Uint8Array }
  | { type: "exit"; session: number; code: number }
  | { type: "ok"; seq?: number; session?: number; sessions?: SessionInfo[]; snapshot?: Snapshot; data?: any }
  | { type: "error"; seq?: number; code?: string; message: string };

type WebSocketMessage =
  | { type: "create" }
  | { type: "list" }
  | { type: "attach"; session: number }
  | { type: "kill"; session: number }
  | { type: "input"; session: number; data: string } // base64
  | { type: "resize"; session: number; cols: number; rows: number };

// ============== History Persistence ==============

interface HistoryState {
  buffer: Buffer;
  flushTimer: ReturnType<typeof setTimeout> | null;
  flushing: boolean;
  pendingFlush: boolean;
  createdAt: number;
  lastUpdatedAt: number;
}

const historyStates = new Map<number, HistoryState>();

function historyFilePath(sessionId: number): string {
  return join(HISTORY_DIR, `session-${sessionId}.bin`);
}

function historyMetaPath(sessionId: number): string {
  return join(HISTORY_DIR, `session-${sessionId}.json`);
}

function dropLeadingUtf8Continuation(buffer: Buffer): Buffer {
  let start = 0;
  while (start < buffer.length) {
    const byte = buffer[start];
    if ((byte & 0b1100_0000) !== 0b1000_0000) break;
    start++;
  }
  return start === 0 ? buffer : buffer.slice(start);
}

function findLastSequence(buffer: Buffer, sequence: Buffer): number {
  if (buffer.length < sequence.length) return -1;
  for (let i = buffer.length - sequence.length; i >= 0; i--) {
    let matched = true;
    for (let j = 0; j < sequence.length; j++) {
      if (buffer[i + j] !== sequence[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return i;
  }
  return -1;
}

function getHistoryState(sessionId: number): HistoryState {
  const existing = historyStates.get(sessionId);
  if (existing) return existing;
  const now = Date.now();
  const state: HistoryState = {
    buffer: Buffer.alloc(0),
    flushTimer: null,
    flushing: false,
    pendingFlush: false,
    createdAt: now,
    lastUpdatedAt: now,
  };
  historyStates.set(sessionId, state);
  return state;
}

function scheduleHistoryFlush(sessionId: number, state: HistoryState): void {
  if (state.flushTimer) return;
  state.flushTimer = setTimeout(() => {
    state.flushTimer = null;
    void flushHistory(sessionId);
  }, HISTORY_FLUSH_INTERVAL_MS);
}

async function flushHistory(sessionId: number): Promise<void> {
  const state = historyStates.get(sessionId);
  if (!state) return;
  if (state.flushing) {
    state.pendingFlush = true;
    return;
  }
  state.flushing = true;

  const buffer = state.buffer;
  try {
    await writeFile(historyFilePath(sessionId), buffer);
    await writeFile(
      historyMetaPath(sessionId),
      JSON.stringify({
        sessionId,
        createdAt: new Date(state.createdAt).toISOString(),
        updatedAt: new Date(state.lastUpdatedAt).toISOString(),
        size: buffer.length,
      })
    );
  } catch (e: any) {
    console.error(`[history] Failed to flush session ${sessionId}:`, e?.message || e);
  } finally {
    state.flushing = false;
  }

  if (state.pendingFlush) {
    state.pendingFlush = false;
    scheduleHistoryFlush(sessionId, state);
  }
}

function appendHistory(sessionId: number, data: Uint8Array): void {
  if (data.length === 0) return;
  const state = getHistoryState(sessionId);
  let chunk = Buffer.from(data);

  const clearIndex = findLastSequence(chunk, CLEAR_SCROLLBACK_SEQUENCE);
  if (clearIndex >= 0) {
    chunk = chunk.slice(clearIndex + CLEAR_SCROLLBACK_SEQUENCE.length);
    state.buffer = Buffer.alloc(0);
  }

  if (chunk.length === 0) return;

  const combined = Buffer.concat([state.buffer, chunk], state.buffer.length + chunk.length);
  if (combined.length > MAX_HISTORY_BYTES) {
    const sliced = combined.slice(combined.length - MAX_HISTORY_BYTES);
    state.buffer = dropLeadingUtf8Continuation(sliced);
  } else {
    state.buffer = combined;
  }

  state.lastUpdatedAt = Date.now();
  scheduleHistoryFlush(sessionId, state);
}

async function readHistoryTail(sessionId: number): Promise<Buffer | null> {
  try {
    const data = await readFile(historyFilePath(sessionId));
    if (!data.length) return null;
    let tail = data;
    if (data.length > MAX_ATTACH_HISTORY_BYTES) {
      tail = data.slice(data.length - MAX_ATTACH_HISTORY_BYTES);
    }
    tail = dropLeadingUtf8Continuation(tail);
    return tail.length > 0 ? tail : null;
  } catch {
    return null;
  }
}

function clearHistory(sessionId: number): void {
  const state = historyStates.get(sessionId);
  if (state?.flushTimer) {
    clearTimeout(state.flushTimer);
  }
  historyStates.delete(sessionId);

  const binPath = historyFilePath(sessionId);
  if (existsSync(binPath)) {
    try {
      unlinkSync(binPath);
    } catch (e) {
      console.warn(`[history] Failed to remove ${binPath}:`, e);
    }
  }

  const metaPath = historyMetaPath(sessionId);
  if (existsSync(metaPath)) {
    try {
      unlinkSync(metaPath);
    } catch (e) {
      console.warn(`[history] Failed to remove ${metaPath}:`, e);
    }
  }
}

// ============== Protocol ==============

function encodeMessage(msg: DaemonMessage): Uint8Array {
  const payload = encode(msg);
  const frame = new Uint8Array(4 + payload.length);
  const view = new DataView(frame.buffer);
  view.setUint32(0, payload.length, false);
  frame.set(payload, 4);
  return frame;
}

class MessageParser {
  private buffer = new Uint8Array(0);

  push(data: Uint8Array): DaemonMessage[] {
    const newBuf = new Uint8Array(this.buffer.length + data.length);
    newBuf.set(this.buffer);
    newBuf.set(data, this.buffer.length);
    this.buffer = newBuf;

    const messages: DaemonMessage[] = [];
    while (this.buffer.length >= 4) {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset);
      const len = view.getUint32(0, false);
      if (this.buffer.length < 4 + len) break;
      const payload = this.buffer.slice(4, 4 + len);
      messages.push(decode(payload) as DaemonMessage);
      this.buffer = this.buffer.slice(4 + len);
    }
    return messages;
  }
}

// ============== Daemon Client ==============

class DaemonClient {
  private socket: any;
  private parser = new MessageParser();
  private pendingResolves = new Map<string, (msg: DaemonMessage) => void>();
  private onOutput?: (session: number, data: Uint8Array) => void;
  private onExit?: (session: number, code: number) => void;
  private connected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      Bun.connect({
        unix: SOCKET_PATH,
        socket: {
          data: (_socket, data) => this.onData(new Uint8Array(data)),
          open: async (socket) => {
            this.socket = socket;
            this.connected = true;
            // Read token and send Hello handshake
            const token = await Bun.file(TOKEN_PATH).text();
            const resp = await this.sendAndWait({ 
              type: "hello", 
              token: token.trim(),
              protocol_version: PROTOCOL_VERSION 
            }, "hello");
            if (resp.type === "hello") {
              resolve();
            } else {
              reject(new Error(`Handshake failed: ${resp.message || resp.type}`));
            }
          },
          close: () => {
            this.connected = false;
          },
          error: (_socket, error) => reject(error),
        },
      }).catch(reject);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  setOutputHandler(handler: (session: number, data: Uint8Array) => void) {
    this.onOutput = handler;
  }

  setExitHandler(handler: (session: number, code: number) => void) {
    this.onExit = handler;
  }

  private send(msg: DaemonMessage): void {
    this.socket.write(encodeMessage(msg));
  }

  private async sendAndWait(msg: DaemonMessage, key: string): Promise<DaemonMessage> {
    return new Promise((resolve) => {
      this.pendingResolves.set(key, resolve);
      this.send(msg);
    });
  }

  private onData(data: Uint8Array): void {
    const messages = this.parser.push(data);
    for (const msg of messages) {
      if (msg.type === "output") {
        this.onOutput?.(msg.session, msg.data);
      } else if (msg.type === "exit") {
        this.onExit?.(msg.session, msg.code);
      } else {
        // Resolve any pending request (ok, error, hello, etc.)
        const resolver = this.pendingResolves.values().next().value;
        if (resolver) {
          this.pendingResolves.clear();
          resolver(msg);
        }
      }
    }
  }

  async create(): Promise<number> {
    const resp = await this.sendAndWait({ type: "create" }, "create");
    if (resp.type === "ok" && resp.session !== undefined) {
      return resp.session;
    }
    throw new Error(resp.type === "error" ? resp.message : "Unknown error");
  }

  async list(): Promise<SessionInfo[]> {
    const resp = await this.sendAndWait({ type: "list" }, "list");
    if (resp.type === "ok") {
      return resp.sessions || resp.data || [];
    }
    throw new Error(resp.type === "error" ? resp.message : "Unknown error");
  }

  async attach(session: number): Promise<Snapshot | undefined> {
    const resp = await this.sendAndWait({ type: "attach", session }, "attach");
    if (resp.type === "error") {
      throw new Error(resp.message);
    }
    if (resp.type === "ok") {
      return resp.snapshot;
    }
  }

  async detach(session: number): Promise<void> {
    const resp = await this.sendAndWait({ type: "detach", session }, "detach");
    if (resp.type === "error") {
      throw new Error(resp.message);
    }
  }

  async kill(session: number): Promise<void> {
    const resp = await this.sendAndWait({ type: "kill", session }, "kill");
    if (resp.type === "error") {
      throw new Error(resp.message);
    }
  }

  sendInput(session: number, data: Uint8Array): void {
    this.send({ type: "input", session, data });
  }

  sendResize(session: number, cols: number, rows: number): void {
    this.send({ type: "resize", session, cols, rows });
  }
}

// ============== WebSocket Server ==============

// Singleton daemon client
let sharedDaemon: DaemonClient | null = null;

async function getSharedDaemon(): Promise<DaemonClient> {
  if (sharedDaemon && sharedDaemon.isConnected()) {
    return sharedDaemon;
  }
  
  sharedDaemon = new DaemonClient();
  await sharedDaemon.connect();
  console.log("[daemon] Shared daemon client connected");
  return sharedDaemon;
}

interface ClientContext {
  attachedSessions: Set<number>;
}

const clients = new Map<any, ClientContext>();

// Broadcast output to clients that have this session attached
function broadcastOutput(session: number, data: Uint8Array) {
  appendHistory(session, data);
  const base64 = Buffer.from(data).toString("base64");
  for (const [ws, ctx] of clients) {
    if (ctx.attachedSessions.has(session)) {
      ws.send(JSON.stringify({ type: "output", session, data: base64 }));
    }
  }
}

function broadcastExit(session: number, code: number) {
  void flushHistory(session);
  for (const [ws, ctx] of clients) {
    if (ctx.attachedSessions.has(session)) {
      ctx.attachedSessions.delete(session);
      ws.send(JSON.stringify({ type: "exit", session, code }));
    }
  }
}

async function handleWebSocketMessage(ws: any, ctx: ClientContext, msg: WebSocketMessage) {
  console.log("[ws] Received message:", msg.type, msg);
  try {
    const daemon = await getSharedDaemon();
    
    switch (msg.type) {
      case "create": {
        console.log("[ws] Creating new session...");
        const id = await daemon.create();
        console.log("[ws] Session created:", id);
        clearHistory(id);
        ws.send(JSON.stringify({ type: "created", session: id }));
        break;
      }
      case "list": {
        const sessions = await daemon.list();
        ws.send(JSON.stringify({ type: "sessions", sessions }));
        break;
      }
      case "attach": {
        const snapshot = await daemon.attach(msg.session);
        const history = await readHistoryTail(msg.session);
        const historyBase64 = history ? history.toString("base64") : undefined;
        ctx.attachedSessions.add(msg.session);
        ws.send(JSON.stringify({ type: "attached", session: msg.session, snapshot, history: historyBase64 }));
        break;
      }
      case "kill": {
        await daemon.kill(msg.session);
        ctx.attachedSessions.delete(msg.session);
        clearHistory(msg.session);
        ws.send(JSON.stringify({ type: "killed", session: msg.session }));
        break;
      }
      case "input": {
        const data = Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0));
        daemon.sendInput(msg.session, data);
        break;
      }
      case "resize": {
        daemon.sendResize(msg.session, msg.cols, msg.rows);
        break;
      }
    }
  } catch (e: any) {
    ws.send(JSON.stringify({ type: "error", message: e.message }));
  }
}

// ============== HTTP Server ==============

const server = Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Serve static files from public/
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    
    // Try serving from public/dist first (bundled JS), then public/
    const distFile = Bun.file(`./public/dist${filePath}`);
    if (await distFile.exists()) {
      return new Response(distFile);
    }
    
    const publicFile = Bun.file(`./public${filePath}`);
    if (await publicFile.exists()) {
      return new Response(publicFile);
    }

    return new Response("Not found", { status: 404 });
  },

  websocket: {
    async open(ws) {
      console.log("[ws] WebSocket client connected");
      
      try {
        const daemon = await getSharedDaemon();
        
        // Set up handlers on first connection
        if (clients.size === 0) {
          daemon.setOutputHandler(broadcastOutput);
          daemon.setExitHandler(broadcastExit);
        }

        const ctx: ClientContext = {
          attachedSessions: new Set(),
        };
        clients.set(ws, ctx);
        
        // Send initial session list
        console.log("[ws] Fetching session list...");
        const sessions = await daemon.list();
        console.log("[ws] Sessions:", sessions);
        ws.send(JSON.stringify({ type: "sessions", sessions }));
      } catch (e) {
        console.error("[ws] Failed to connect to daemon:", e);
        ws.send(JSON.stringify({ type: "error", message: "Failed to connect to PTY daemon" }));
        ws.close();
      }
    },

    message(ws, message) {
      const ctx = clients.get(ws);
      if (!ctx) return;

      try {
        const msg = JSON.parse(message.toString()) as WebSocketMessage;
        handleWebSocketMessage(ws, ctx, msg);
      } catch (e) {
        console.error("Invalid message:", e);
      }
    },

    close(ws) {
      console.log("WebSocket client disconnected");
      clients.delete(ws);
    },
  },
});

console.log(`Server running at http://localhost:${PORT}`);
