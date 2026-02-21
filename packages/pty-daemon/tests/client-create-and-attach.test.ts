import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPtyClient } from "../src/client";
import { FrameParser, encodeFrame } from "../src/frame";

const sockets: string[] = [];

afterEach(() => {
  for (const socketPath of sockets.splice(0)) {
    try {
      fs.unlinkSync(socketPath);
    } catch {
      // no-op
    }
  }
});

function nextSocketPath(): string {
  const name = `pty-ca-${process.pid}-${Math.random().toString(16).slice(2, 8)}.sock`;
  const socketPath = path.join(os.tmpdir(), name);
  sockets.push(socketPath);
  return socketPath;
}

describe("PtyDaemonClient createAndAttach", () => {
  it("creates a session then attaches and returns snapshot", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();
    const requests: string[] = [];

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!message || typeof message !== "object") {
            continue;
          }
          const frame = message as Record<string, unknown>;
          if (typeof frame.type !== "string" || typeof frame.seq !== "number") {
            continue;
          }

          requests.push(frame.type);

          if (frame.type === "handshake") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "handshake",
                  seq: frame.seq,
                  protocol_version: 1,
                  daemon_version: "test",
                  daemon_pid: 1003,
                }),
              ),
            );
            continue;
          }

          if (frame.type === "create") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: frame.seq,
                  session: 42,
                }),
              ),
            );
            continue;
          }

          if (frame.type === "attach") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: frame.seq,
                  session: 42,
                  snapshot: {
                    content: "",
                    rehydrate: "",
                    cols: 80,
                    rows: 24,
                    cursor_x: 0,
                    cursor_y: 0,
                    modes: {
                      application_cursor: false,
                      bracketed_paste: false,
                      mouse_tracking: false,
                      mouse_sgr: false,
                      focus_reporting: false,
                      alternate_screen: false,
                      cursor_visible: true,
                      auto_wrap: true,
                    },
                  },
                }),
              ),
            );
          }
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });

    const client = createPtyClient({
      socketPath,
      token: "token-1",
      protocolVersion: 1,
      requestTimeoutMs: 200,
    });

    await client.waitForConnection();
    const result = await client.createAndAttach({ cols: 80, rows: 24 });

    expect(result.session).toBe(42);
    expect(result.snapshot.cols).toBe(80);
    expect(result.snapshot.rows).toBe(24);
    expect(requests).toEqual(["handshake", "create", "attach"]);

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("createOrAttachAndAttach reuses stable session key", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();
    const requests: string[] = [];
    const seenSessionKeys: string[] = [];

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!message || typeof message !== "object") {
            continue;
          }
          const frame = message as Record<string, unknown>;
          if (typeof frame.type !== "string" || typeof frame.seq !== "number") {
            continue;
          }

          requests.push(frame.type);

          if (frame.type === "handshake") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "handshake",
                  seq: frame.seq,
                  protocol_version: 1,
                  daemon_version: "test",
                  daemon_pid: 2003,
                }),
              ),
            );
            continue;
          }

          if (frame.type === "create_or_attach") {
            if (typeof frame.session_key === "string") {
              seenSessionKeys.push(frame.session_key);
            }
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: frame.seq,
                  session: 123,
                }),
              ),
            );
            continue;
          }

          if (frame.type === "attach") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: frame.seq,
                  session: 123,
                  snapshot: {
                    content: "",
                    rehydrate: "",
                    cols: 90,
                    rows: 28,
                    cursor_x: 0,
                    cursor_y: 0,
                    modes: {
                      application_cursor: false,
                      bracketed_paste: false,
                      mouse_tracking: false,
                      mouse_sgr: false,
                      focus_reporting: false,
                      alternate_screen: false,
                      cursor_visible: true,
                      auto_wrap: true,
                    },
                  },
                }),
              ),
            );
          }
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });

    const client = createPtyClient({
      socketPath,
      token: "token-1",
      protocolVersion: 1,
      requestTimeoutMs: 200,
    });

    await client.waitForConnection();
    const result = await client.createOrAttachAndAttach("workspace-pane-1", {
      cols: 90,
      rows: 28,
    });

    expect(result.session).toBe(123);
    expect(result.snapshot.cols).toBe(90);
    expect(result.snapshot.rows).toBe(28);
    expect(seenSessionKeys).toEqual(["workspace-pane-1"]);
    expect(requests).toEqual(["handshake", "create_or_attach", "attach"]);

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("creates session handle with stable id via session.create", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();
    const requests: string[] = [];
    let nextSessionId = 77;

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!message || typeof message !== "object") {
            continue;
          }
          const frame = message as Record<string, unknown>;
          if (typeof frame.type !== "string" || typeof frame.seq !== "number") {
            continue;
          }

          requests.push(frame.type);

          if (frame.type === "handshake") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "handshake",
                  seq: frame.seq,
                  protocol_version: 1,
                  daemon_version: "test",
                  daemon_pid: 2001,
                }),
              ),
            );
            continue;
          }

          if (frame.type === "create") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: frame.seq,
                  session: nextSessionId++,
                }),
              ),
            );
          }
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });

    const client = createPtyClient({
      socketPath,
      token: "token-1",
      protocolVersion: 1,
      requestTimeoutMs: 200,
    });

    await client.waitForConnection();
    const firstSession = await client.session.create({ cols: 100, rows: 30 });
    const secondSession = await client.session.create({ cols: 100, rows: 30 });

    expect(firstSession.id).toBe(77);
    expect(secondSession.id).toBe(78);
    expect(firstSession.id).not.toBe(secondSession.id);
    expect(requests).toEqual(["handshake", "create", "create"]);

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
