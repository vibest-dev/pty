import fs from "node:fs";
import net from "node:net";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPty, createPtyClient } from "../src";
import { stopDaemon } from "../src/daemon";
import { FrameParser, encodeFrame } from "../src/frame";

type Cleanup = () => Promise<void> | void;
const cleanups: Cleanup[] = [];
const require = createRequire(import.meta.url);

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    if (cleanup) {
      await cleanup();
    }
  }
});

function nextSocketPath(): string {
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
  return socketPath;
}

function nextTempDir(prefix = "pty-create-test-"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

async function waitFor(
  predicate: () => boolean,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    errorMessage?: string;
  } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 1500;
  const intervalMs = options.intervalMs ?? 25;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(options.errorMessage ?? "waitFor timeout");
}

describe("createPty", () => {
  it("prewarms daemon in background and connects on daemon.connect", async () => {
    const dir = nextTempDir("pty-create-daemon-");
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

    const prevDaemonPath = process.env.PTY_DAEMON_PATH;
    process.env.PTY_DAEMON_PATH = scriptPath;
    cleanups.push(() => {
      if (typeof prevDaemonPath === "undefined") {
        delete process.env.PTY_DAEMON_PATH;
      } else {
        process.env.PTY_DAEMON_PATH = prevDaemonPath;
      }
    });

    const pty = createPty({
      socketPath,
      tokenPath,
      protocolVersion: 1,
    });

    expect(pty.client.isConnected).toBe(false);
    await waitFor(() => pty.daemon.process !== null, {
      timeoutMs: 3000,
      errorMessage: "expected daemon process to be prewarmed in background",
    });
    expect(pty.daemon.process?.pid).toBeTypeOf("number");

    await expect(pty.daemon.connect()).resolves.toBeUndefined();

    cleanups.push(async () => {
      pty.client.close();
      await stopDaemon(pty.daemon.process);
    });

    expect(pty.client.isConnected).toBe(true);
    expect((await pty.client.handshake()).daemon_version).toBe("fake");
    await expect(pty.daemon.connect()).resolves.toBeUndefined();
  });

  it("connects to an existing daemon without spawning new process", async () => {
    const dir = nextTempDir("pty-create-existing-");
    const socketPath = path.join(dir, "daemon.sock");
    const tokenPath = path.join(dir, "daemon.token");
    fs.writeFileSync(tokenPath, "token-existing\n", "utf8");
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

    const pty = createPty({
      socketPath,
      tokenPath,
      token: "token-manual",
      protocolVersion: 1,
    });

    expect(pty.client.isConnected).toBe(false);
    expect(pty.daemon.process).toBeNull();
    expect(pty.daemon.socketPath).toBe(socketPath);

    await expect(pty.daemon.connect()).resolves.toBeUndefined();
    cleanups.push(() => pty.client.close());

    expect(pty.client.isConnected).toBe(true);
    expect((await pty.client.handshake()).type).toBe("handshake");
  });

  it("surfaces daemon bootstrap failures via daemon.connect", async () => {
    const dir = nextTempDir("pty-create-no-ensure-");
    const socketPath = path.join(dir, "daemon.sock");
    const tokenPath = path.join(dir, "daemon.token");
    const failingBinaryPath = path.join(dir, "failing-daemon.sh");
    fs.writeFileSync(failingBinaryPath, "#!/bin/sh\nexit 1\n", "utf8");
    fs.chmodSync(failingBinaryPath, 0o755);

    const pty = createPty({
      socketPath,
      tokenPath,
      daemon: {
        binaryPath: failingBinaryPath,
      },
      protocolVersion: 1,
    });
    cleanups.push(() => pty.client.close());

    expect(pty.client.isConnected).toBe(false);
    await expect(pty.daemon.connect()).rejects.toThrow(/daemon exited early|startup timeout/i);
  });
});

describe("createPtyClient", () => {
  it("creates client instance without connecting", () => {
    const client = createPtyClient({
      socketPath: "/tmp/does-not-matter.sock",
    });

    expect(client.isConnected).toBe(false);
    client.close();
  });
});
