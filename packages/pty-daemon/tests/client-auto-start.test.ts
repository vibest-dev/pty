import fs from "node:fs";
import net from "node:net";
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
  const name = `ptyc-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sock`;
  const socketPath = path.join("/tmp", name);
  sockets.push(socketPath);
  return socketPath;
}

describe("PtyDaemonClient connection mode", () => {
  it("connects to an existing daemon", async () => {
    const socketPath = nextSocketPath();
    const parser = new FrameParser();

    const server = net.createServer((socket) => {
      socket.on("data", (chunk) => {
        const messages = parser.push(new Uint8Array(chunk));
        for (const message of messages) {
          if (!message || typeof message !== "object") {
            continue;
          }
          const frame = message as Record<string, unknown>;
          if (frame.type !== "handshake" || typeof frame.seq !== "number") {
            continue;
          }
          socket.write(
            Buffer.from(
              encodeFrame({
                type: "handshake",
                seq: frame.seq,
                protocol_version: 1,
                daemon_version: "existing",
                daemon_pid: 1,
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
    });

    await client.waitForConnection();
    const handshake = await client.handshake();

    expect(handshake.type).toBe("handshake");
    expect(handshake.daemon_version).toBe("existing");

    client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
