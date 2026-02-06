import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createClient } from "../src/client";

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pty-client-test-"));
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

describe("PtyDaemonClient autoStart", () => {
  it("starts daemon automatically and performs handshake", async () => {
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
      "utf8"
    );
    fs.chmodSync(scriptPath, 0o755);

    const client = createClient({
      socketPath,
      tokenPath,
      autoStart: true,
      daemon: {
        binaryPath: scriptPath,
        timeoutMs: 3000,
      },
      protocolVersion: 1,
    });

    await client.waitForConnection();
    const handshake = await client.handshake();

    expect(handshake.type).toBe("handshake");
    expect(handshake.daemon_version).toBe("fake");

    await client.shutdown();
  });
});
