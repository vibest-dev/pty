import {
  createPtyClient,
  type PtyDaemonClient,
  type SessionInfo,
} from "@vibest/pty-daemon";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const SOCKET_PATH = process.env.RUST_PTY_SOCKET_PATH || "/tmp/rust-pty.sock";
const TOKEN_PATH = process.env.RUST_PTY_TOKEN_PATH || "/tmp/rust-pty.token";
const PROTOCOL_VERSION = 1;
const PORT = Number(process.env.PORT || 3000);
const HISTORY_DIR = process.env.RUST_PTY_HISTORY_DIR || "/tmp/.vibest/pty-history";
const MAX_HISTORY_BYTES = 5 * 1024 * 1024;
const MAX_ATTACH_HISTORY_BYTES = 512 * 1024;
const HISTORY_FLUSH_INTERVAL_MS = 200;
const CLEAR_SCROLLBACK_SEQUENCE = Buffer.from([0x1b, 0x5b, 0x33, 0x4a]);
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_DAEMON_BINARY = join(REPO_ROOT, "target", "release", "vibest-pty-daemon");
const AUTO_START_DAEMON = process.env.PTY_DAEMON_AUTOSTART !== "0";

mkdirSync(HISTORY_DIR, { recursive: true, mode: 0o700 });

type WebSocketMessage =
  | { type: "create" }
  | { type: "list" }
  | { type: "attach"; session: number }
  | { type: "kill"; session: number }
  | { type: "input"; session: number; data: string }
  | { type: "resize"; session: number; cols: number; rows: number };

interface HistoryState {
  buffer: Buffer;
  flushTimer: ReturnType<typeof setTimeout> | null;
  flushing: boolean;
  pendingFlush: boolean;
  createdAt: number;
  lastUpdatedAt: number;
}

const historyStates = new Map<number, HistoryState>();

function resolveDaemonBinaryPath(): string | undefined {
  if (process.env.PTY_DAEMON_PATH) {
    return process.env.PTY_DAEMON_PATH;
  }

  if (existsSync(LOCAL_DAEMON_BINARY)) {
    return LOCAL_DAEMON_BINARY;
  }

  return undefined;
}

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
    if ((byte & 0b1100_0000) !== 0b1000_0000) {
      break;
    }
    start++;
  }
  return start === 0 ? buffer : buffer.slice(start);
}

function findLastSequence(buffer: Buffer, sequence: Buffer): number {
  if (buffer.length < sequence.length) {
    return -1;
  }

  for (let i = buffer.length - sequence.length; i >= 0; i--) {
    let matched = true;
    for (let j = 0; j < sequence.length; j++) {
      if (buffer[i + j] !== sequence[j]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return i;
    }
  }

  return -1;
}

function getHistoryState(sessionId: number): HistoryState {
  const existing = historyStates.get(sessionId);
  if (existing) {
    return existing;
  }

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
  if (state.flushTimer) {
    return;
  }

  state.flushTimer = setTimeout(() => {
    state.flushTimer = null;
    void flushHistory(sessionId);
  }, HISTORY_FLUSH_INTERVAL_MS);
}

async function flushHistory(sessionId: number): Promise<void> {
  const state = historyStates.get(sessionId);
  if (!state) {
    return;
  }

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
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[history] Failed to flush session ${sessionId}: ${message}`);
  } finally {
    state.flushing = false;
  }

  if (state.pendingFlush) {
    state.pendingFlush = false;
    scheduleHistoryFlush(sessionId, state);
  }
}

function appendHistory(sessionId: number, data: Uint8Array): void {
  if (data.length === 0) {
    return;
  }

  const state = getHistoryState(sessionId);
  let chunk = Buffer.from(data);

  const clearIndex = findLastSequence(chunk, CLEAR_SCROLLBACK_SEQUENCE);
  if (clearIndex >= 0) {
    chunk = chunk.slice(clearIndex + CLEAR_SCROLLBACK_SEQUENCE.length);
    state.buffer = Buffer.alloc(0);
  }

  if (chunk.length === 0) {
    return;
  }

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
    if (!data.length) {
      return null;
    }

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
    } catch (error) {
      console.warn(`[history] Failed to remove ${binPath}:`, error);
    }
  }

  const metaPath = historyMetaPath(sessionId);
  if (existsSync(metaPath)) {
    try {
      unlinkSync(metaPath);
    } catch (error) {
      console.warn(`[history] Failed to remove ${metaPath}:`, error);
    }
  }
}

interface ClientContext {
  attachedSessions: Set<number>;
}

const clients = new Map<any, ClientContext>();
let sharedDaemon: PtyDaemonClient | null = null;

function broadcastOutput(session: number, data: Uint8Array): void {
  appendHistory(session, data);
  const base64 = Buffer.from(data).toString("base64");

  for (const [ws, ctx] of clients) {
    if (ctx.attachedSessions.has(session)) {
      ws.send(JSON.stringify({ type: "output", session, data: base64 }));
    }
  }
}

function broadcastExit(session: number, code: number): void {
  void flushHistory(session);

  for (const [ws, ctx] of clients) {
    if (ctx.attachedSessions.has(session)) {
      ctx.attachedSessions.delete(session);
      ws.send(JSON.stringify({ type: "exit", session, code }));
    }
  }
}

function wireDaemonEvents(daemon: PtyDaemonClient): void {
  daemon.on("output", (event) => {
    broadcastOutput(event.session, event.data);
  });

  daemon.on("exit", (event) => {
    broadcastExit(event.session, event.code);
  });

  daemon.on("error", (error) => {
    console.error("[daemon] SDK client error:", error);
  });

  daemon.on("close", () => {
    if (sharedDaemon === daemon) {
      sharedDaemon = null;
    }
  });
}

async function getSharedDaemon(): Promise<PtyDaemonClient> {
  if (sharedDaemon?.isConnected) {
    return sharedDaemon;
  }

  if (sharedDaemon) {
    sharedDaemon.removeAllListeners();
    sharedDaemon.close();
    sharedDaemon = null;
  }

  const binaryPath = resolveDaemonBinaryPath();
  const daemon = createPtyClient({
    socketPath: SOCKET_PATH,
    tokenPath: TOKEN_PATH,
    protocolVersion: PROTOCOL_VERSION,
    autoStart: AUTO_START_DAEMON,
    daemon: {
      ...(binaryPath ? { binaryPath } : {}),
      timeoutMs: 5000,
    },
  });

  await daemon.waitForConnection();
  wireDaemonEvents(daemon);
  sharedDaemon = daemon;
  return daemon;
}

async function handleWebSocketMessage(ws: any, ctx: ClientContext, msg: WebSocketMessage): Promise<void> {
  try {
    const daemon = await getSharedDaemon();

    switch (msg.type) {
      case "create": {
        const { session } = await daemon.create();
        clearHistory(session);
        ws.send(JSON.stringify({ type: "created", session }));
        break;
      }

      case "list": {
        const sessions: SessionInfo[] = await daemon.list();
        ws.send(JSON.stringify({ type: "sessions", sessions }));
        break;
      }

      case "attach": {
        const { snapshot } = await daemon.attach(msg.session);
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
        const data = Uint8Array.from(Buffer.from(msg.data, "base64"));
        daemon.input(msg.session, data);
        break;
      }

      case "resize": {
        daemon.resize(msg.session, msg.cols, msg.rows);
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ws.send(JSON.stringify({ type: "error", message }));
  }
}

Bun.serve({
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;

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
      try {
        const daemon = await getSharedDaemon();
        const ctx: ClientContext = {
          attachedSessions: new Set(),
        };
        clients.set(ws, ctx);

        const sessions = await daemon.list();
        ws.send(JSON.stringify({ type: "sessions", sessions }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[ws] Failed to connect to daemon:", error);
        ws.send(JSON.stringify({ type: "error", message: `Failed to connect to PTY daemon: ${message}` }));
        ws.close();
      }
    },

    message(ws, message) {
      const ctx = clients.get(ws);
      if (!ctx) {
        return;
      }

      try {
        const msg = JSON.parse(message.toString()) as WebSocketMessage;
        void handleWebSocketMessage(ws, ctx, msg);
      } catch (error) {
        console.error("Invalid message:", error);
      }
    },

    close(ws) {
      clients.delete(ws);
    },
  },
});

console.log(`Server running at http://localhost:${PORT}`);
