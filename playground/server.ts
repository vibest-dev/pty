import {
  createPty,
  type PtyDaemonClient,
  type SessionInfo,
} from "@vibest/pty-daemon";
import { decode, encode } from "@msgpack/msgpack";
import { existsSync } from "fs";
import { resolve } from "path";

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

const DEFAULT_BASE_DIR = `${process.env.HOME || "/tmp"}/.vibest/pty`;
const SOCKET_PATH = process.env.RUST_PTY_SOCKET_PATH || `${DEFAULT_BASE_DIR}/socket`;
const TOKEN_PATH = process.env.RUST_PTY_TOKEN_PATH || `${DEFAULT_BASE_DIR}/token`;
const LOCAL_DAEMON_BINARY_PATH = resolve(import.meta.dir, "..", "target", "release", "vibest-pty-daemon");
const DAEMON_BINARY_PATH =
  process.env.PTY_DAEMON_PATH ||
  (existsSync(LOCAL_DAEMON_BINARY_PATH) ? LOCAL_DAEMON_BINARY_PATH : undefined);
const PROTOCOL_VERSION = 1;
const PORT = Number(process.env.PORT || 3000);
const MAX_HISTORY_BYTES = 5 * 1024 * 1024;
const MAX_ATTACH_HISTORY_BYTES = 512 * 1024;
const MAX_TOTAL_HISTORY_BYTES = parsePositiveIntEnv("RUST_PTY_MAX_TOTAL_HISTORY_BYTES", 128 * 1024 * 1024);
const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 45_000;
const CLEAR_SCROLLBACK_SEQUENCE = Buffer.from([0x1b, 0x5b, 0x33, 0x4a]);

type WebSocketMessage =
  | { type: "create" }
  | { type: "list" }
  | { type: "attach"; session: number; lastSeq?: number }
  | { type: "ack"; session: number; seq: number }
  | { type: "pong"; ts?: number }
  | { type: "kill"; session: number }
  | { type: "input"; session: number; data: Uint8Array }
  | { type: "resize"; session: number; cols: number; rows: number };

interface HistoryChunk {
  startSeq: number;
  endSeq: number;
  data: Buffer;
}

interface HistoryState {
  chunks: HistoryChunk[];
  totalBytes: number;
  nextSeq: number;
  createdAt: number;
  lastUpdatedAt: number;
}

interface AttachReplay {
  history: Buffer | null;
  seq: number;
  reset: boolean;
}

interface ClientContext {
  attachedSessions: Set<number>;
  deliveredSeqBySession: Map<number, number>;
  ackedSeqBySession: Map<number, number>;
  lastSeenAt: number;
}

const historyStates = new Map<number, HistoryState>();
const clients = new Map<any, ClientContext>();
let totalHistoryBytes = 0;
let sharedPty: ReturnType<typeof createPty> | null = null;

function sendFrame(ws: any, frame: object): void {
  ws.send(encode(frame));
}

function sendError(ws: any, message: string): void {
  sendFrame(ws, { type: "error", message });
}

function decodeWebSocketMessage(message: string | Buffer | Uint8Array | ArrayBuffer): WebSocketMessage {
  if (typeof message === "string") {
    throw new Error("text frame is not supported; use binary MessagePack frames");
  }
  if (message instanceof ArrayBuffer) {
    return decode(new Uint8Array(message)) as WebSocketMessage;
  }

  return decode(new Uint8Array(message)) as WebSocketMessage;
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
    chunks: [],
    totalBytes: 0,
    nextSeq: 0,
    createdAt: now,
    lastUpdatedAt: now,
  };

  historyStates.set(sessionId, state);
  return state;
}

function isSessionAttached(sessionId: number): boolean {
  for (const ctx of clients.values()) {
    if (ctx.attachedSessions.has(sessionId)) {
      return true;
    }
  }

  return false;
}

function discardHistoryData(state: HistoryState): void {
  if (state.totalBytes <= 0) {
    return;
  }

  totalHistoryBytes = Math.max(0, totalHistoryBytes - state.totalBytes);
  state.chunks = [];
  state.totalBytes = 0;
  state.lastUpdatedAt = Date.now();
}

function evictHistoryIfNeeded(preferredSessionId?: number): void {
  while (totalHistoryBytes > MAX_TOTAL_HISTORY_BYTES) {
    let bestId: number | undefined;
    let bestState: HistoryState | undefined;

    for (const [id, state] of historyStates) {
      if (state.totalBytes === 0 || id === preferredSessionId || isSessionAttached(id)) {
        continue;
      }

      if (!bestState || state.lastUpdatedAt < bestState.lastUpdatedAt) {
        bestId = id;
        bestState = state;
      }
    }

    if (!bestState) {
      for (const [id, state] of historyStates) {
        if (state.totalBytes === 0 || id === preferredSessionId) {
          continue;
        }

        if (!bestState || state.lastUpdatedAt < bestState.lastUpdatedAt) {
          bestId = id;
          bestState = state;
        }
      }
    }

    if (!bestState || bestId === undefined) {
      break;
    }

    discardHistoryData(bestState);
    console.warn(`[history] Evicted in-memory history for session ${bestId} due to global memory pressure`);
  }
}

function trimHistoryState(state: HistoryState): void {
  let overflow = state.totalBytes - MAX_HISTORY_BYTES;
  while (overflow > 0 && state.chunks.length > 0) {
    const first = state.chunks[0];
    const len = first.data.length;

    if (len <= overflow) {
      state.chunks.shift();
      state.totalBytes -= len;
      overflow -= len;
      continue;
    }

    const rawSliced = first.data.slice(overflow);
    const sliced = dropLeadingUtf8Continuation(rawSliced);
    const dropped = first.data.length - sliced.length;

    first.data = sliced;
    first.startSeq += dropped;
    state.totalBytes -= dropped;
    overflow = 0;

    if (first.data.length === 0) {
      state.chunks.shift();
    }
  }
}

function historyBounds(state: HistoryState): { headSeq: number; tailSeq: number } {
  if (state.chunks.length === 0) {
    return { headSeq: state.nextSeq, tailSeq: state.nextSeq };
  }

  return { headSeq: state.chunks[0].startSeq, tailSeq: state.nextSeq };
}

function appendHistory(sessionId: number, data: Uint8Array): number {
  const state = getHistoryState(sessionId);
  const beforeBytes = state.totalBytes;

  if (data.length === 0) {
    return state.nextSeq;
  }

  let chunk = Buffer.from(data);

  const clearIndex = findLastSequence(chunk, CLEAR_SCROLLBACK_SEQUENCE);
  if (clearIndex >= 0) {
    chunk = chunk.slice(clearIndex + CLEAR_SCROLLBACK_SEQUENCE.length);
    state.chunks = [];
    state.totalBytes = 0;
  }

  if (chunk.length === 0) {
    return state.nextSeq;
  }

  const startSeq = state.nextSeq;
  const endSeq = startSeq + chunk.length;
  state.chunks.push({ startSeq, endSeq, data: chunk });
  state.totalBytes += chunk.length;
  state.nextSeq = endSeq;
  state.lastUpdatedAt = Date.now();

  trimHistoryState(state);
  totalHistoryBytes += state.totalBytes - beforeBytes;
  evictHistoryIfNeeded(sessionId);

  return state.nextSeq;
}

function collectHistorySince(state: HistoryState, fromSeq: number): Buffer | null {
  const parts: Buffer[] = [];
  let size = 0;

  for (const chunk of state.chunks) {
    if (chunk.endSeq <= fromSeq) {
      continue;
    }

    let part = chunk.data;
    if (chunk.startSeq < fromSeq) {
      const offset = fromSeq - chunk.startSeq;
      part = chunk.data.slice(offset);
    }

    if (part.length === 0) {
      continue;
    }

    parts.push(part);
    size += part.length;
  }

  if (size === 0) {
    return null;
  }

  let out = parts.length === 1 ? parts[0] : Buffer.concat(parts, size);
  if (out.length > MAX_ATTACH_HISTORY_BYTES) {
    out = dropLeadingUtf8Continuation(out.slice(out.length - MAX_ATTACH_HISTORY_BYTES));
  }

  return out.length > 0 ? out : null;
}

function readHistoryTail(sessionId: number): Buffer | null {
  const state = historyStates.get(sessionId);
  if (!state || state.totalBytes === 0) {
    return null;
  }

  const { tailSeq } = historyBounds(state);
  const fromSeq = Math.max(0, tailSeq - MAX_ATTACH_HISTORY_BYTES);
  return collectHistorySince(state, fromSeq);
}

function readAttachReplay(sessionId: number, lastSeq?: number): AttachReplay {
  const state = historyStates.get(sessionId);
  if (!state) {
    return { history: null, seq: 0, reset: lastSeq !== undefined && lastSeq > 0 };
  }

  const { headSeq, tailSeq } = historyBounds(state);

  if (lastSeq === undefined) {
    return { history: readHistoryTail(sessionId), seq: tailSeq, reset: true };
  }

  if (lastSeq < headSeq || lastSeq > tailSeq) {
    return { history: readHistoryTail(sessionId), seq: tailSeq, reset: true };
  }

  if (lastSeq === tailSeq) {
    return { history: null, seq: tailSeq, reset: false };
  }

  return {
    history: collectHistorySince(state, lastSeq),
    seq: tailSeq,
    reset: false,
  };
}

function clearHistory(sessionId: number): void {
  const state = historyStates.get(sessionId);
  if (!state) {
    return;
  }

  discardHistoryData(state);
  historyStates.delete(sessionId);
}

function broadcastOutput(session: number, data: Uint8Array): void {
  const seq = appendHistory(session, data);

  for (const [ws, ctx] of clients) {
    if (!ctx.attachedSessions.has(session)) {
      continue;
    }

    sendFrame(ws, { type: "output", session, data, seq });
    ctx.deliveredSeqBySession.set(session, seq);
  }
}

function broadcastExit(session: number, code: number): void {
  for (const [ws, ctx] of clients) {
    if (!ctx.attachedSessions.has(session)) {
      continue;
    }

    ctx.attachedSessions.delete(session);
    ctx.deliveredSeqBySession.delete(session);
    ctx.ackedSeqBySession.delete(session);
    sendFrame(ws, { type: "exit", session, code });
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
    if (sharedPty?.client === daemon) {
      sharedPty = null;
    }
  });
}

async function getSharedDaemon(): Promise<PtyDaemonClient> {
  if (!sharedPty) {
    const pty = createPty({
      socketPath: SOCKET_PATH,
      tokenPath: TOKEN_PATH,
      protocolVersion: PROTOCOL_VERSION,
      daemon: {
        binaryPath: DAEMON_BINARY_PATH,
      },
    });
    wireDaemonEvents(pty.client);
    sharedPty = pty;
  }

  try {
    await sharedPty.daemon.connect();
  } catch (error) {
    sharedPty.client.removeAllListeners();
    sharedPty.client.close();
    sharedPty = null;
    throw error;
  }

  return sharedPty.client;
}

async function handleWebSocketMessage(ws: any, ctx: ClientContext, msg: WebSocketMessage): Promise<void> {
  try {
    const daemon = await getSharedDaemon();

    switch (msg.type) {
      case "create": {
        const { session } = await daemon.create();
        clearHistory(session);
        sendFrame(ws, { type: "created", session });
        break;
      }

      case "list": {
        const sessions: SessionInfo[] = await daemon.list();
        sendFrame(ws, { type: "sessions", sessions });
        break;
      }

      case "attach": {
        const { snapshot } = await daemon.attach({ id: msg.session });

        const explicitLastSeq =
          typeof msg.lastSeq === "number" && Number.isFinite(msg.lastSeq)
            ? Math.max(0, Math.floor(msg.lastSeq))
            : undefined;
        const effectiveLastSeq =
          explicitLastSeq ?? ctx.ackedSeqBySession.get(msg.session) ?? ctx.deliveredSeqBySession.get(msg.session);
        const replay = readAttachReplay(msg.session, effectiveLastSeq);

        ctx.attachedSessions.add(msg.session);
        ctx.deliveredSeqBySession.set(msg.session, replay.seq);

        sendFrame(ws, {
          type: "attached",
          session: msg.session,
          snapshot: replay.reset ? snapshot : undefined,
          history: replay.history ?? undefined,
          seq: replay.seq,
          reset: replay.reset,
        });
        break;
      }

      case "ack": {
        const seq = Number.isFinite(msg.seq) ? Math.max(0, Math.floor(msg.seq)) : undefined;
        if (seq !== undefined) {
          const prev = ctx.ackedSeqBySession.get(msg.session);
          if (prev === undefined || seq > prev) {
            ctx.ackedSeqBySession.set(msg.session, seq);
          }
        }
        break;
      }

      case "pong": {
        ctx.lastSeenAt = Date.now();
        break;
      }

      case "kill": {
        await daemon.kill(msg.session);
        ctx.attachedSessions.delete(msg.session);
        ctx.deliveredSeqBySession.delete(msg.session);
        ctx.ackedSeqBySession.delete(msg.session);
        clearHistory(msg.session);
        sendFrame(ws, { type: "killed", session: msg.session });
        break;
      }

      case "input": {
        daemon.write({ id: msg.session }, msg.data);
        break;
      }

      case "resize": {
        daemon.resize({ id: msg.session }, msg.cols, msg.rows);
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendError(ws, message);
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
          deliveredSeqBySession: new Map(),
          ackedSeqBySession: new Map(),
          lastSeenAt: Date.now(),
        };
        clients.set(ws, ctx);

        const sessions = await daemon.list();
        sendFrame(ws, { type: "sessions", sessions });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[ws] Failed to connect to daemon:", error);
        sendError(ws, `Failed to connect to PTY daemon: ${message}`);
        ws.close();
      }
    },

    message(ws, message) {
      const ctx = clients.get(ws);
      if (!ctx) {
        return;
      }

      ctx.lastSeenAt = Date.now();

      try {
        const msg = decodeWebSocketMessage(message as string | Buffer | Uint8Array | ArrayBuffer);
        void handleWebSocketMessage(ws, ctx, msg);
      } catch (error) {
        console.error("Invalid message:", error);
      }
    },

    close(ws) {
      const ctx = clients.get(ws);
      if (ctx && ctx.attachedSessions.size > 0 && sharedPty) {
        for (const session of ctx.attachedSessions) {
          sharedPty.client.detach(session).catch(() => {});
        }
      }
      clients.delete(ws);
    },
  },
});

setInterval(() => {
  const now = Date.now();
  for (const [ws, ctx] of clients) {
    if (now - ctx.lastSeenAt > HEARTBEAT_TIMEOUT_MS) {
      ws.close();
      continue;
    }

    sendFrame(ws, { type: "ping", ts: now });
  }
}, HEARTBEAT_INTERVAL_MS);

console.log(`Server running at http://localhost:${PORT}`);
