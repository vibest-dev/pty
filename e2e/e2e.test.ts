/**
 * E2E tests for PTY daemon through the SDK client.
 *
 * Run with: bun test e2e.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createClient,
  DaemonError,
  type PtyDaemonClient,
} from "@vibest/pty-daemon";

const BINARY_PATH = path.resolve(import.meta.dir, "..", "target", "release", "vibest-pty-daemon");
const PROTOCOL_VERSION = 1;

let tempDir = "";
let socketPath = "";
let tokenPath = "";
let daemonClient: PtyDaemonClient | null = null;

async function createAuthedClient(): Promise<PtyDaemonClient> {
  const client = createClient({
    socketPath,
    tokenPath,
    protocolVersion: PROTOCOL_VERSION,
    autoStart: false,
  });

  await client.waitForConnection();
  const handshake = await client.handshake();
  expect(handshake.type).toBe("handshake");
  expect(handshake.protocol_version).toBe(PROTOCOL_VERSION);

  return client;
}

describe("PTY Daemon E2E via SDK", () => {
  beforeAll(async () => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "pty-sdk-e2e-"));
    socketPath = path.join(tempDir, "daemon.sock");
    tokenPath = path.join(tempDir, "daemon.token");

    daemonClient = createClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
      autoStart: true,
      daemon: {
        binaryPath: BINARY_PATH,
        timeoutMs: 5000,
      },
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
      await daemonClient.shutdown();
      daemonClient = null;
    }

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

      const attached = await client.attach(sessionId);
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
    const invalidTokenClient = createClient({
      socketPath,
      token: "invalid-token",
      autoStart: false,
      protocolVersion: PROTOCOL_VERSION,
    });
    await invalidTokenClient.waitForConnection();
    try {
      await invalidTokenClient.handshake();
      throw new Error("Expected handshake with invalid token to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(DaemonError);
      if (error instanceof DaemonError) {
        expect(error.code).toBe("AUTH_FAILED");
      }
    } finally {
      invalidTokenClient.close();
    }

    const protocolMismatchClient = createClient({
      socketPath,
      tokenPath,
      autoStart: false,
      protocolVersion: 999,
    });
    await protocolMismatchClient.waitForConnection();
    try {
      await protocolMismatchClient.handshake();
      throw new Error("Expected protocol mismatch handshake to fail");
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
