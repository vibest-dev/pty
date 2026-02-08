/**
 * Flow-control integration tests aligned with the current daemon behavior.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import {
  createClient,
  type BackpressureWarningEvent,
  type PtyDaemonClient,
} from "@vibest/pty-daemon";

const BINARY_PATH = path.resolve(import.meta.dirname, "..", "target", "release", "vibest-pty-daemon");
const PROTOCOL_VERSION = 1;

let tempDir = "";
let socketPath = "";
let tokenPath = "";
let daemonClient: PtyDaemonClient | null = null;

let producer: PtyDaemonClient | null = null;
let slowSubscriber: PtyDaemonClient | null = null;
let fastSubscriber: PtyDaemonClient | null = null;
let sessionId = 0;

async function createAuthedClient(options: Parameters<typeof createClient>[0]): Promise<PtyDaemonClient> {
  const client = createClient(options);
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

    daemonClient = createClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
      autoStart: true,
      daemon: {
        binaryPath: BINARY_PATH,
        timeoutMs: 5000,
        env: {
          RUST_PTY_FLOW_THRESHOLD: "8",
          RUST_PTY_FLOW_MAX_QUEUE_SIZE: "64",
          RUST_PTY_FLOW_AUTO_DISCONNECT: "false",
        },
      },
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
      autoStart: false,
    });

    slowSubscriber = await createAuthedClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
      autoStart: false,
      flowControl: { manualAck: true },
    });

    fastSubscriber = await createAuthedClient({
      socketPath,
      tokenPath,
      protocolVersion: PROTOCOL_VERSION,
      autoStart: false,
      flowControl: { ackThreshold: 5 },
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
      await daemonClient.shutdown();
      daemonClient = null;
    }

    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("delivers output to multiple subscribers under sustained load", async () => {
    if (!producer || !slowSubscriber || !fastSubscriber) {
      throw new Error("clients are not initialized");
    }

    let slowOutputs = 0;
    let fastOutputs = 0;
    const warnings: BackpressureWarningEvent[] = [];

    slowSubscriber.on("output", () => {
      slowOutputs += 1;
    });
    fastSubscriber.on("output", () => {
      fastOutputs += 1;
    });
    slowSubscriber.on("backpressure_warning", (event) => {
      warnings.push(event);
    });

    await slowSubscriber.attach(sessionId);
    await fastSubscriber.attach(sessionId);

    producer.write(
      sessionId,
      new TextEncoder().encode("for i in $(seq 1 4000); do echo flow-$i; done\n"),
    );

    await sleep(1500);

    expect(slowOutputs).toBeGreaterThan(0);
    expect(fastOutputs).toBeGreaterThan(0);
    for (const warning of warnings) {
      expect(["yellow", "red"]).toContain(warning.level);
    }
  }, 10000);

  test("exposes manual ACK flow-control state for slow consumers", async () => {
    if (!producer || !slowSubscriber) {
      throw new Error("clients are not initialized");
    }

    const initial = slowSubscriber.getFlowControlConfig();
    expect(initial.manualAckMode).toBe(true);
    expect(initial.ackThreshold).toBe(0);

    await slowSubscriber.attach(sessionId);

    producer.write(
      sessionId,
      new TextEncoder().encode("for i in $(seq 1 2000); do echo ack-$i; done\n"),
    );

    await sleep(1200);

    const pending = slowSubscriber.getPendingCount(sessionId);
    expect(pending).toBeGreaterThan(0);

    // Manual ACK should be callable and should not throw.
    slowSubscriber.ack(sessionId, pending);

    slowSubscriber.setManualAckMode(false);
    const updated = slowSubscriber.getFlowControlConfig();
    expect(updated.manualAckMode).toBe(false);
    expect(updated.ackThreshold).toBe(100);
  }, 10000);
});
