import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPtyClient } from "../src/client";
import { FrameParser, encodeFrame } from "../src/frame";

type RequestMessage = {
  type: string;
  seq: number;
  [key: string]: unknown;
};

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
  const name = `pty-daemon-sdk-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sock`;
  const socketPath = path.join(os.tmpdir(), name);
  sockets.push(socketPath);
  return socketPath;
}

function isRequestMessage(value: unknown): value is RequestMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.type === "string" && typeof candidate.seq === "number";
}

describe("PtyDaemonClient protocol assertions", () => {
  it("throws when list response is missing sessions", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!isRequestMessage(message)) {
            continue;
          }

          if (message.type === "handshake") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "handshake",
                  seq: message.seq,
                  protocol_version: 1,
                  daemon_version: "test",
                  daemon_pid: 1000,
                }),
              ),
            );
            continue;
          }

          if (message.type === "list") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: message.seq,
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
    await client.handshake();
    await expect(client.list()).rejects.toThrow("Protocol error: missing ok.sessions");

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("throws when killAll response is missing session count", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!isRequestMessage(message)) {
            continue;
          }

          if (message.type === "handshake") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "handshake",
                  seq: message.seq,
                  protocol_version: 1,
                  daemon_version: "test",
                  daemon_pid: 1001,
                }),
              ),
            );
            continue;
          }

          if (message.type === "kill_all") {
            socket.write(
              Buffer.from(
                encodeFrame({
                  type: "ok",
                  seq: message.seq,
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
    await client.handshake();
    await expect(client.killAll()).rejects.toThrow("Protocol error: missing ok.count");

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("emits error and closes on invalid msgpack frame", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!isRequestMessage(message)) {
            continue;
          }

          if (message.type !== "handshake") {
            continue;
          }

          socket.write(
            Buffer.from(
              encodeFrame({
                type: "handshake",
                seq: message.seq,
                protocol_version: 1,
                daemon_version: "test",
                daemon_pid: 1002,
              }),
            ),
          );

          setTimeout(() => {
            // 4-byte length prefix + invalid msgpack payload (0xC1 is never used)
            socket.write(Buffer.from([0x00, 0x00, 0x00, 0x01, 0xc1]));
          }, 20);
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

    const errorPromise = new Promise<Error>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timed out waiting for client error")), 1000);
      client.once("error", (err) => {
        clearTimeout(timer);
        resolve(err);
      });
    });

    const closePromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timed out waiting for client close")), 1000);
      client.once("close", () => {
        clearTimeout(timer);
        resolve();
      });
    });

    await client.waitForConnection();
    await expect(errorPromise).resolves.toBeInstanceOf(Error);
    await expect(closePromise).resolves.toBeUndefined();

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
