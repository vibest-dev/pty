import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { decode, encode } from "@msgpack/msgpack";
import { afterEach, describe, expect, it } from "vitest";
import { createPtyClient } from "../dist/index.mjs";

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

function encodeFrame(message: unknown): Uint8Array {
  const payload = encode(message);
  const frame = new Uint8Array(4 + payload.length);
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  view.setUint32(0, payload.length, false);
  frame.set(payload, 4);
  return frame;
}

describe("built dist runtime parity", () => {
  it("emits backpressure warning events", async () => {
    const socketPath = nextSocketPath();
    let buffer = Buffer.alloc(0);

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const messages: unknown[] = [];

        while (buffer.length >= 4) {
          const len = buffer.readUInt32BE(0);
          if (len <= 0 || buffer.length < 4 + len) {
            break;
          }
          const payload = buffer.subarray(4, 4 + len);
          messages.push(decode(payload));
          buffer = buffer.subarray(4 + len);
        }

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

    const client = createPtyClient({
      socketPath,
      token: "token-1",
      protocolVersion: 1,
      requestTimeoutMs: 200,
    });

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
