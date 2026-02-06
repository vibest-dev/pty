import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Unicode11Addon } from "@xterm/addon-unicode11";

// ============== Types ==============

interface Session {
  id: number;
  terminal: Terminal;
  fitAddon: FitAddon;
  webglAddon?: WebglAddon;
  container: HTMLDivElement;
  tabEl: HTMLDivElement;
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

interface ServerMessage {
  type: string;
  session?: number;
  sessions?: Array<{ id: number; pid: number; pts: string }>;
  snapshot?: Snapshot;
  history?: string;
  data?: string;
  code?: number;
  message?: string;
}

// ============== State ==============

let ws: WebSocket | null = null;
const sessions = new Map<number, Session>();
let activeSession: number | null = null;

const STORAGE_KEYS = {
  sessions: "rust-daemon:session-ids",
  activeSession: "rust-daemon:active-session",
};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function loadStoredSessionIds(): number[] {
  const raw = safeGetItem(STORAGE_KEYS.sessions);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

function saveStoredSessionIds(ids: number[]): void {
  safeSetItem(STORAGE_KEYS.sessions, JSON.stringify(ids));
}

function loadStoredActiveSession(): number | null {
  const raw = safeGetItem(STORAGE_KEYS.activeSession);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function saveStoredActiveSession(id: number | null): void {
  if (id === null) {
    safeRemoveItem(STORAGE_KEYS.activeSession);
    return;
  }
  safeSetItem(STORAGE_KEYS.activeSession, String(id));
}

const storedSessionIds = new Set<number>(loadStoredSessionIds());
let storedActiveSession = loadStoredActiveSession();

function persistStoredSessionIds(): void {
  saveStoredSessionIds(Array.from(storedSessionIds));
}

function addStoredSessionId(id: number): void {
  if (!storedSessionIds.has(id)) {
    storedSessionIds.add(id);
    persistStoredSessionIds();
  }
}

function removeStoredSessionId(id: number): void {
  if (storedSessionIds.delete(id)) {
    persistStoredSessionIds();
  }
}

function setStoredActiveSession(id: number | null): void {
  storedActiveSession = id;
  saveStoredActiveSession(id);
}

const tabsEl = document.getElementById("tabs")!;
const terminalsEl = document.getElementById("terminals")!;
const statusEl = document.getElementById("status")!;
const newTabBtn = document.getElementById("new-tab")!;

// 防抖函数
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// ============== WebSocket ==============

function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    setStatus("Connected");
  };

  ws.onclose = () => {
    setStatus("Disconnected - Reconnecting...");
    setTimeout(connect, 2000);
  };

  ws.onerror = () => {
    setStatus("Connection error");
  };

  ws.onmessage = (event) => {
    const msg: ServerMessage = JSON.parse(event.data);
    handleMessage(msg);
  };
}

function send(msg: object) {
  console.log("[ui] Sending:", msg);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error("[ui] WebSocket not connected, readyState:", ws?.readyState);
    return;
  }
  ws.send(JSON.stringify(msg));
}

// ============== Message Handlers ==============

function handleMessage(msg: ServerMessage) {
  switch (msg.type) {
    case "sessions":
      // Initial session list - restore existing sessions
      if (msg.sessions && msg.sessions.length > 0) {
        const availableIds = new Set(msg.sessions.map((s) => s.id));
        let targetIds: number[] = [];

        if (storedSessionIds.size > 0) {
          let changed = false;
          for (const id of Array.from(storedSessionIds)) {
            if (!availableIds.has(id)) {
              storedSessionIds.delete(id);
              changed = true;
            }
          }
          if (storedActiveSession !== null && !availableIds.has(storedActiveSession)) {
            setStoredActiveSession(null);
          }
          if (changed) {
            persistStoredSessionIds();
          }
          targetIds = Array.from(storedSessionIds).filter((id) => availableIds.has(id));
        } else {
          targetIds = msg.sessions.map((s) => s.id);
          for (const id of targetIds) {
            storedSessionIds.add(id);
          }
          persistStoredSessionIds();
        }

        for (const id of targetIds) {
          if (!sessions.has(id)) {
            createSessionUI(id);
            send({ type: "attach", session: id });
          }
        }

        if (storedActiveSession !== null && targetIds.includes(storedActiveSession)) {
          switchToSession(storedActiveSession);
        }
      }
      break;

    case "created":
      if (msg.session !== undefined) {
        addStoredSessionId(msg.session);
        setStoredActiveSession(msg.session);
        createSessionUI(msg.session);
        send({ type: "attach", session: msg.session });
        switchToSession(msg.session);
      }
      break;

    case "attached":
      if (msg.session !== undefined) {
        const session = sessions.get(msg.session);
        if (session) {
          if (msg.history) {
            const historyBytes = Uint8Array.from(atob(msg.history), (c) => c.charCodeAt(0));
            session.terminal.write(historyBytes);
          } else if (msg.snapshot) {
            const { rehydrate, content } = msg.snapshot;
            if (rehydrate) {
              session.terminal.write(rehydrate + (content ?? ""));
            } else if (content) {
              session.terminal.write(content);
            }
          }
          // Send initial resize
          sendResize(msg.session, session);
        }
      }
      break;

    case "output":
      if (msg.session !== undefined && msg.data) {
        const session = sessions.get(msg.session);
        if (session) {
          // Decode base64 to Uint8Array, then write directly
          const binary = Uint8Array.from(atob(msg.data), c => c.charCodeAt(0));
          session.terminal.write(binary);
        }
      }
      break;

    case "exit":
      if (msg.session !== undefined) {
        const session = sessions.get(msg.session);
        if (session) {
          session.terminal.write(`\r\n[Process exited with code ${msg.code}]\r\n`);
          session.tabEl.classList.add("opacity-50");
        }
      }
      break;

    case "killed":
      if (msg.session !== undefined) {
        removeSession(msg.session);
      }
      break;

    case "error":
      console.error("Server error:", msg.message);
      setStatus(`Error: ${msg.message}`);
      break;
  }
}

// ============== Session Management ==============

function createSessionUI(id: number) {
  // Create terminal container
  const container = document.createElement("div");
  container.className = "terminal-container";
  container.id = `terminal-${id}`;
  terminalsEl.appendChild(container);

  // Create terminal
  const terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    allowProposedApi: true,
    theme: {
      background: "#1a1a1a",
      foreground: "#d4d4d4",
      cursor: "#d4d4d4",
    },
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  // Unicode11 支持中文宽字符
  const unicode11Addon = new Unicode11Addon();
  terminal.loadAddon(unicode11Addon);
  terminal.unicode.activeVersion = "11";

  terminal.open(container);

  // WebGL 渲染优化
  let webglAddon: WebglAddon | undefined;
  try {
    webglAddon = new WebglAddon();
    webglAddon.onContextLoss(() => {
      webglAddon?.dispose();
      webglAddon = undefined;
    });
    terminal.loadAddon(webglAddon);
  } catch (e) {
    console.warn("WebGL addon failed to load, falling back to canvas renderer", e);
    webglAddon = undefined;
  }

  fitAddon.fit();

  // Handle input - 使用 TextEncoder 正确处理中文
  terminal.onData((data) => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const base64 = btoa(String.fromCharCode(...bytes));
    send({
      type: "input",
      session: id,
      data: base64,
    });
  });

  // Create tab
  const tabEl = document.createElement("div");
  tabEl.className = "flex items-center gap-1 px-3 py-1 rounded cursor-pointer text-sm bg-gray-700 text-gray-300 hover:bg-gray-600";
  tabEl.innerHTML = `
    <span class="tab-title">Terminal ${id}</span>
    <button class="close-btn text-gray-500 hover:text-red-400 ml-1">×</button>
  `;
  tabEl.querySelector(".tab-title")!.addEventListener("click", () => switchToSession(id));
  tabEl.querySelector(".close-btn")!.addEventListener("click", (e) => {
    e.stopPropagation();
    send({ type: "kill", session: id });
  });
  tabsEl.appendChild(tabEl);

  // Store session
  const session: Session = { id, terminal, fitAddon, webglAddon, container, tabEl };
  sessions.set(id, session);

  // Handle resize with debounce
  const handleResize = debounce(() => {
    if (activeSession === id && session.container.offsetWidth > 0) {
      fitAddon.fit();
      sendResize(id, session);
    }
  }, 50);
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  // If this is the first session, switch to it
  if (sessions.size === 1) {
    switchToSession(id);
  }

  updateStatus();
}

function removeSession(id: number) {
  const session = sessions.get(id);
  if (!session) return;

  removeStoredSessionId(id);

  // Dispose WebGL addon first to avoid errors
  try {
    session.webglAddon?.dispose();
  } catch (e) {
    // Ignore WebGL dispose errors
  }
  session.terminal.dispose();
  session.container.remove();
  session.tabEl.remove();
  sessions.delete(id);

  // Switch to another session if this was active
  if (activeSession === id) {
    const remaining = Array.from(sessions.keys());
    if (remaining.length > 0) {
      switchToSession(remaining[0]);
    } else {
      activeSession = null;
    }
  }

  if (activeSession === null) {
    setStoredActiveSession(null);
  }

  updateStatus();
}

function switchToSession(id: number) {
  // Hide all containers and deactivate all tabs
  for (const [sessionId, session] of sessions) {
    session.container.classList.remove("active");
    session.tabEl.classList.remove("bg-gray-600", "text-white");
    session.tabEl.classList.add("bg-gray-700", "text-gray-300");
  }

  // Show selected container and activate tab
  const session = sessions.get(id);
  if (session) {
    session.container.classList.add("active");
    session.tabEl.classList.remove("bg-gray-700", "text-gray-300");
    session.tabEl.classList.add("bg-gray-600", "text-white");
    activeSession = id;
    setStoredActiveSession(id);

    // Fit and focus
    setTimeout(() => {
      session.fitAddon.fit();
      session.terminal.focus();
      sendResize(id, session);
    }, 0);
  }

  updateStatus();
}

function sendResize(id: number, session: Session) {
  const { cols, rows } = session.terminal;
  send({ type: "resize", session: id, cols, rows });
}

// ============== UI ==============

function setStatus(text: string) {
  statusEl.textContent = text;
}

function updateStatus() {
  const count = sessions.size;
  const active = activeSession !== null ? ` | Active: ${activeSession}` : "";
  setStatus(`Sessions: ${count}${active}`);
}

// ============== Init ==============

newTabBtn.addEventListener("click", () => {
  console.log("[ui] New tab clicked, sending create...");
  send({ type: "create" });
});

// Handle window resize with debounce
const handleWindowResize = debounce(() => {
  if (activeSession !== null) {
    const session = sessions.get(activeSession);
    if (session && session.container.offsetWidth > 0) {
      session.fitAddon.fit();
      sendResize(activeSession, session);
    }
  }
}, 50);
window.addEventListener("resize", handleWindowResize);

connect();
