/**
 * Flow-control integration tests aligned with the current daemon behavior.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import {
  createPtyClient,
  type BackpressureWarningEvent,
  type PtyDaemonClient,
} from "@vibest/pty-daemon";
import type { ChildProcess } from "node:child_process";
import { ensureDaemonRunning, stopDaemon } from "../packages/pty-daemon/src/daemon";

const BINARY_PATH = path.resolve(import.meta.dirname, "..", "target", "release", "vibest-pty-daemon");
const PROTOCOL_VERSION = 1;

let tempDir = "";
let socketPath = "";
let tokenPath = "";
let daemonClient: PtyDaemonClient | null = null;
let daemonProcess: ChildProcess | null = null;

let producer: PtyDaemonClient | null = null;
let slowSubscriber: PtyDaemonClient | null = null;
let fastSubscriber: PtyDaemonClient | null = null;
let sessionId = 0;

async function createAuthedClient(options: Parameters<typeof createPtyClient>[0]): Promise<PtyDaemonClient> {
  const client = createPtyClient(options);
  await client.waitForConnection();
  const handshake = await client.handshake();
  expect(handshake.type).toBe("handshake");
  return client;
}

describe("Flow Control Integration", () => {
  beforeAll(async () => {
    tempDir = mkdtempSync(path.join("/tmp", "pty-flow-e2e-"));
    socketPath = path.join(tempDir, "daemon.sock");
    tokenPath = path.join(tempDir, "daemon.token");

    daemonProcess = await ensureDaemonRunning({
      socketPath,
      tokenPath,
      binaryPath: BINARY_PATH,
      timeoutMs: 5000,
      env: {
        RUST_PTY_FLOW_THRESHOLD: "8",
        RUST_PTY_FLOW_MAX_QUEUE_SIZE: "64",
        RUST_PTY_FLOW_AUTO_DISCONNECT: "false",
      },
    });

    daemonClient = createPtyClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
    });

    await daemonClient.waitForConnection();
    const handshake = await daemonClient.handshake();
    expect(handshake.type).toBe("handshake");
  }, 10000);

  beforeEach(async () => {
    if (!daemonClient) {
      throw new Error("daemon client is not initialized");
    }

    await daemonClient.killAll();

    producer = await createAuthedClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
    });

    slowSubscriber = await createAuthedClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
    });

    fastSubscriber = await createAuthedClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
    });

    const created = await producer.create({
      shell: "/bin/sh",
      cols: 80,
      rows: 24,
    });
    sessionId = created.session;
  });

  afterAll(async () => {
    if (producer) {
      producer.close();
      producer = null;
    }
    if (slowSubscriber) {
      slowSubscriber.close();
      slowSubscriber = null;
    }
    if (fastSubscriber) {
      fastSubscriber.close();
      fastSubscriber = null;
    }

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

  test("delivers output to multiple clients across sessions under sustained load", async () => {
    if (!producer || !slowSubscriber || !fastSubscriber) {
      throw new Error("clients are not initialized");
    }

    const createdSecondary = await producer.create({
      shell: "/bin/sh",
      cols: 80,
      rows: 24,
    });
    const secondarySessionId = createdSecondary.session;

    let slowOutputs = 0;
    let fastOutputs = 0;
    const warnings: BackpressureWarningEvent[] = [];

    slowSubscriber.on("output", (event) => {
      if (event.session === sessionId) {
        slowOutputs += 1;
      }
    });
    fastSubscriber.on("output", (event) => {
      if (event.session === secondarySessionId) {
        fastOutputs += 1;
      }
    });
    slowSubscriber.on("backpressure_warning", (event) => {
      if (event.session === sessionId) {
        warnings.push(event);
      }
    });

    await slowSubscriber.attach({ id: sessionId });
    await fastSubscriber.attach({ id: secondarySessionId });

    producer.write(
      { id: sessionId },
      new TextEncoder().encode("for i in $(seq 1 4000); do echo flow-$i; done\n"),
    );
    producer.write(
      { id: secondarySessionId },
      new TextEncoder().encode("for i in $(seq 1 4000); do echo fast-$i; done\n"),
    );

    await sleep(1500);

    expect(slowOutputs).toBeGreaterThan(0);
    expect(fastOutputs).toBeGreaterThan(0);
    for (const warning of warnings) {
      expect(["yellow", "red"]).toContain(warning.level);
    }

    await producer.kill(secondarySessionId);
  }, 10000);
});
