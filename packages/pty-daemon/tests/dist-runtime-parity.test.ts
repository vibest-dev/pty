import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FrameParser, createClient, encodeFrame } from "../dist/index.mjs";

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
  const name = `pty-daemon-dist-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sock`;
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

describe("built dist runtime parity", () => {
  it("supports flow-control API and emits backpressure warning events", async () => {
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
                daemon_version: "test-dist",
                daemon_pid: 1010,
              }),
            ),
          );

          socket.write(
            Buffer.from(
              encodeFrame({
                type: "backpressure_warning",
                session: 7,
                queue_size: 12,
                level: "yellow",
              }),
            ),
          );
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, resolve);
    });

    const client = createClient({
      socketPath,
      token: "token-1",
      protocolVersion: 1,
      requestTimeoutMs: 200,
    });

    expect(typeof client.getFlowControlConfig).toBe("function");

    const warningPromise = new Promise<{ level: string; session: number; queue_size: number }>(
      (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timed out waiting for backpressure warning")), 1000);
        client.once("backpressure_warning", (event) => {
          clearTimeout(timer);
          resolve(event);
        });
      },
    );

    await client.waitForConnection();
    await client.handshake();

    await expect(warningPromise).resolves.toMatchObject({
      session: 7,
      queue_size: 12,
      level: "yellow",
    });

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
