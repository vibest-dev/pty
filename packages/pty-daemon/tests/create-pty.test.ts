import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPty, createPtyClient } from "../src";
import { FrameParser, encodeFrame } from "../src/frame";

type Cleanup = () => Promise<void> | void;
const cleanups: Cleanup[] = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    if (cleanup) {
      await cleanup();
    }
  }
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pty-create-test-"));
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

describe("createPty", () => {
  it("returns connected client and daemon when autoStart is true", async () => {
    const dir = tempDir();
    const socketPath = path.join(dir, "daemon.sock");
    const tokenPath = path.join(dir, "daemon.token");
    const scriptPath = path.join(dir, "fake-daemon.cjs");

    const msgpackPath = require.resolve("@msgpack/msgpack");
    fs.writeFileSync(
      scriptPath,
      [
        "#!/usr/bin/env node",
        "const fs = require('node:fs');",
        "const net = require('node:net');",
        `const { decode, encode } = require(${JSON.stringify(msgpackPath)});`,
        "const socketPath = process.env.RUST_PTY_SOCKET_PATH;",
        "const tokenPath = process.env.RUST_PTY_TOKEN_PATH;",
        "try { fs.unlinkSync(socketPath); } catch {}",
        "fs.writeFileSync(tokenPath, 'token-auto\\n', 'utf8');",
        "function encodeFrame(msg) {",
        "  const payload = encode(msg);",
        "  const frame = new Uint8Array(4 + payload.length);",
        "  const view = new DataView(frame.buffer);",
        "  view.setUint32(0, payload.length, false);",
        "  frame.set(payload, 4);",
        "  return Buffer.from(frame);",
        "}",
        "const server = net.createServer((socket) => {",
        "  socket.on('data', (chunk) => {",
        "    const len = chunk.readUInt32BE(0);",
        "    const payload = chunk.slice(4, 4 + len);",
        "    const msg = decode(payload);",
        "    socket.write(encodeFrame({",
        "      type: 'handshake',",
        "      seq: msg.seq,",
        "      protocol_version: 1,",
        "      daemon_version: 'fake',",
        "      daemon_pid: 1,",
        "    }));",
        "  });",
        "});",
        "server.listen(socketPath);",
        "process.on('SIGTERM', () => server.close(() => process.exit(0)));",
        "setInterval(() => {}, 1000);",
      ].join("\n"),
      "utf8",
    );
    fs.chmodSync(scriptPath, 0o755);

    const pty = await createPty({
      socketPath,
      tokenPath,
      autoStart: true,
      daemon: {
        binaryPath: scriptPath,
        timeoutMs: 3000,
      },
      protocolVersion: 1,
    });
    cleanups.push(() => pty.shutdown());

    expect(pty.client.isConnected).toBe(true);
    expect(pty.daemon.process?.pid).toBeTypeOf("number");
    expect(pty.daemon.socketPath).toBe(socketPath);
    expect(pty.daemon.tokenPath).toBe(tokenPath);
    expect((await pty.client.handshake()).type).toBe("handshake");
  });

  it("returns daemon=null when autoStart is false", async () => {
    const socketPath = path.join(
      os.tmpdir(),
      `pty-create-test-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sock`,
    );
    cleanups.push(() => {
      try {
        fs.unlinkSync(socketPath);
      } catch {
        // no-op
      }
    });

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
                daemon_version: "manual",
                daemon_pid: 2,
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
    cleanups.push(() => new Promise<void>((resolve) => server.close(() => resolve())));

    const pty = await createPty({
      socketPath,
      token: "token-manual",
      autoStart: false,
      protocolVersion: 1,
    });
    cleanups.push(() => pty.shutdown());

    expect(pty.client.isConnected).toBe(true);
    expect(pty.daemon.process).toBeNull();
  });
});

describe("createPtyClient", () => {
  it("creates client instance without connecting", () => {
    const client = createPtyClient({
      socketPath: "/tmp/does-not-matter.sock",
      autoStart: false,
    });

    expect(client.isConnected).toBe(false);
    client.close();
  });
});
