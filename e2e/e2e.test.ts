/**
 * E2E tests for PTY daemon through the SDK client.
 *
 * Run with: bun test e2e.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import {
  createPtyClient,
  DaemonError,
  type PtyDaemonClient,
} from "@vibest/pty-daemon";
import type { ChildProcess } from "node:child_process";
import { ensureDaemonRunning, stopDaemon } from "../packages/pty-daemon/src/daemon";

const BINARY_PATH = path.resolve(import.meta.dir, "..", "target", "release", "vibest-pty-daemon");
const PROTOCOL_VERSION = 1;

let tempDir = "";
let socketPath = "";
let tokenPath = "";
let daemonClient: PtyDaemonClient | null = null;
let daemonProcess: ChildProcess | null = null;

async function createAuthedClient(): Promise<PtyDaemonClient> {
  const client = createPtyClient({
    socketPath,
    tokenPath,
    protocolVersion: PROTOCOL_VERSION,
  });

  await client.waitForConnection();
  const handshake = await client.handshake();
  expect(handshake.type).toBe("handshake");
  expect(handshake.protocol_version).toBe(PROTOCOL_VERSION);

  return client;
}

describe("PTY Daemon E2E via SDK", () => {
  beforeAll(async () => {
    tempDir = mkdtempSync(path.join("/tmp", "pty-sdk-e2e-"));
    socketPath = path.join(tempDir, "daemon.sock");
    tokenPath = path.join(tempDir, "daemon.token");

    daemonProcess = await ensureDaemonRunning({
      socketPath,
      tokenPath,
      binaryPath: BINARY_PATH,
      timeoutMs: 5000,
    });

    daemonClient = createPtyClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
    });

    await daemonClient.waitForConnection();
    const handshake = await daemonClient.handshake();
    expect(handshake.type).toBe("handshake");
  });

  beforeEach(async () => {
    if (!daemonClient) {
      throw new Error("daemon client not initialized");
    }

    const killedCount = await daemonClient.killAll();
    expect(typeof killedCount).toBe("number");
  });

  afterAll(async () => {
    if (daemonClient) {
      daemonClient.close();
      daemonClient = null;
    }
    await stopDaemon(daemonProcess);
    daemonProcess = null;

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs create -> list -> attach -> signal -> kill through SDK", async () => {
    const client = await createAuthedClient();

    try {
      const created = await client.create({
        cols: 80,
        rows: 24,
        initial_commands: ["echo sdk-flow"],
      });

      const sessionId = created.session;
      expect(sessionId).toBeGreaterThan(0);

      const sessions = await client.list();
      const createdSession = sessions.find((session) => session.id === sessionId);
      expect(createdSession).toBeTruthy();

      const attached = await client.attach({ id: sessionId });
      const snapshot = attached.snapshot;
      expect(snapshot.cols).toBe(80);
      expect(snapshot.rows).toBe(24);
      expect(typeof snapshot.content).toBe("string");

      await client.signal(sessionId, "SIGCONT");
      await client.kill(sessionId);

      const sessionsAfterKill = await client.list();
      expect(sessionsAfterKill.some((session) => session.id === sessionId)).toBe(false);
    } finally {
      client.close();
    }
  });

  it("supports killAll through SDK typed method", async () => {
    const client = await createAuthedClient();

    try {
      for (let i = 0; i < 2; i += 1) {
        await client.create({
          cols: 80,
          rows: 24,
        });
      }

      const sessionsBeforeKill = await client.list();
      expect(sessionsBeforeKill.length).toBe(2);

      const killedCount = await client.killAll();
      expect(killedCount).toBe(2);

      const sessionsAfterKill = await client.list();
      expect(sessionsAfterKill).toEqual([]);
    } finally {
      client.close();
    }
  });

  it("surfaces auth/protocol handshake errors via SDK handshake", async () => {
    const invalidTokenClient = createPtyClient({
      socketPath,
      token: "invalid-token",
      protocolVersion: PROTOCOL_VERSION,
    });
    try {
      await invalidTokenClient.waitForConnection();
      throw new Error("Expected connection with invalid token to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(DaemonError);
      if (error instanceof DaemonError) {
        expect(error.code).toBe("AUTH_FAILED");
      }
    } finally {
      invalidTokenClient.close();
    }

    const protocolMismatchClient = createPtyClient({
      socketPath,
      tokenPath,
      protocolVersion: 999,
    });
    try {
      await protocolMismatchClient.waitForConnection();
      throw new Error("Expected protocol mismatch connection to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(DaemonError);
      if (error instanceof DaemonError) {
        expect(error.code).toBe("PROTOCOL_MISMATCH");
      }
    } finally {
      protocolMismatchClient.close();
    }
  });
});
