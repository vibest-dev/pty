import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureDaemonRunning, stopDaemon } from "../src/daemon";

type Cleanup = () => void;
const cleanups: Cleanup[] = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    if (!cleanup) {
      continue;
    }
    await cleanup();
  }
});

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pty-daemon-test-"));
  cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

describe("ensureDaemonRunning", () => {
  it("starts binary and waits for socket/token", async () => {
    const dir = makeTempDir();
    const socketPath = path.join(dir, "daemon.sock");
    const tokenPath = path.join(dir, "daemon.token");
    const binaryPath = path.join(dir, "fake-daemon.cjs");

    fs.writeFileSync(
      binaryPath,
      [
        "#!/usr/bin/env node",
        "const fs = require('node:fs');",
        "const net = require('node:net');",
        "const socketPath = process.env.RUST_PTY_SOCKET_PATH;",
        "const tokenPath = process.env.RUST_PTY_TOKEN_PATH;",
        "try { fs.unlinkSync(socketPath); } catch {}",
        "fs.writeFileSync(tokenPath, 'token-1\\n', 'utf8');",
        "const server = net.createServer(() => {});",
        "server.listen(socketPath);",
        "process.on('SIGTERM', () => server.close(() => process.exit(0)));",
        "setInterval(() => {}, 1000);",
      ].join("\n"),
      "utf8"
    );
    fs.chmodSync(binaryPath, 0o755);

    const child = await ensureDaemonRunning({
      binaryPath,
      socketPath,
      tokenPath,
      timeoutMs: 3000,
    });

    cleanups.push(async () => {
      await stopDaemon(child);
      try {
        fs.unlinkSync(socketPath);
      } catch {}
      try {
        fs.unlinkSync(tokenPath);
      } catch {}
    });

    expect(child.pid).toBeTypeOf("number");
    expect(fs.existsSync(socketPath)).toBe(true);
    expect(fs.existsSync(tokenPath)).toBe(true);
  });
});
