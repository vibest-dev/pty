import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPtyClient } from "../src/client";
import { FrameParser, encodeFrame } from "../src/frame";

const sockets: string[] = [];
type HandshakeRequest = {
  type: "handshake";
  seq: number;
  token: string;
  protocol_version: number;
};

function isHandshakeRequest(value: unknown): value is HandshakeRequest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === "handshake" &&
    typeof candidate.seq === "number" &&
    typeof candidate.token === "string" &&
    typeof candidate.protocol_version === "number"
  );
}

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

describe("PtyDaemonClient handshake", () => {
  it("connects and completes handshake", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        if (messages.length === 0) {
          return;
        }

        const handshake = messages[0];
        if (!isHandshakeRequest(handshake)) {
          throw new Error("Expected a handshake request frame");
        }
        expect(handshake.type).toBe("handshake");
        expect(handshake.seq).toBe(1);
        expect(handshake.token).toBe("token-1");
        expect(handshake.protocol_version).toBe(1);

        socket.write(
          Buffer.from(
            encodeFrame({
              type: "handshake",
              seq: handshake.seq,
              protocol_version: 1,
              daemon_version: "test",
              daemon_pid: 4242,
            })
          )
        );
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
    });

    await client.waitForConnection();
    const handshake = await client.handshake();

    expect(handshake.type).toBe("handshake");
    expect(handshake.protocol_version).toBe(1);

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("accepts handshake response without seq", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        if (messages.length === 0) {
          return;
        }

        const handshake = messages[0];
        if (!isHandshakeRequest(handshake)) {
          throw new Error("Expected a handshake request frame");
        }

        socket.write(
          Buffer.from(
            encodeFrame({
              type: "handshake",
              protocol_version: 1,
              daemon_version: "test-no-seq",
              daemon_pid: 5252,
            }),
          ),
        );
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
    const handshake = await client.handshake();

    expect(handshake.type).toBe("handshake");
    expect(handshake.protocol_version).toBe(1);
    expect(handshake.daemon_version).toBe("test-no-seq");

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
