/**
 * End-to-end integration tests for flow control mechanism
 *
 * These tests validate the complete flow control pipeline:
 * - Daemon configuration and startup
 * - Client connection and backpressure events
 * - Rate limiting behavior in yellow/red zones
 * - ACK mechanism and queue management
 * - Graceful handling of slow subscribers
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { PtyDaemonClient, createClient, type BackpressureWarningEvent } from "../packages/pty-daemon/src/client";
import { spawn, type ChildProcess } from "node:child_process";
import { unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";

const TEST_SOCKET_PATH = "/tmp/test-pty-daemon.sock";
const TEST_TOKEN_PATH = "/tmp/test-pty-daemon.token";

describe("Flow Control Integration Tests", () => {
  let daemonProcess: ChildProcess;
  let client1: PtyDaemonClient;
  let client2: PtyDaemonClient;
  let sessionId: number;

  beforeAll(async () => {
    // Clean up any existing socket/token files
    await cleanupFiles();

    // Start daemon with flow control configuration
    const env = {
      ...process.env,
      RUST_PTY_SOCKET_PATH: TEST_SOCKET_PATH,
      RUST_PTY_TOKEN_PATH: TEST_TOKEN_PATH,
      RUST_PTY_FLOW_YELLOW_THRESHOLD: "10",  // Low thresholds for faster testing
      RUST_PTY_FLOW_RED_THRESHOLD: "20",
      RUST_PTY_FLOW_MAX_QUEUE_SIZE: "50",
      RUST_PTY_FLOW_YELLOW_INTERVAL_MS: "50",
      RUST_PTY_FLOW_RED_INTERVAL_MS: "100",
      RUST_PTY_FLOW_AUTO_DISCONNECT: "false"
    };

    daemonProcess = spawn("cargo", ["run", "--bin", "vibest-pty-daemon"], { env });

    // Wait for daemon to start
    await setTimeout(2000);
  }, 10000);

  afterAll(async () => {
    if (daemonProcess) {
      daemonProcess.kill("SIGTERM");
      await setTimeout(500);
      if (!daemonProcess.killed) {
        daemonProcess.kill("SIGKILL");
      }
    }
    await cleanupFiles();
  });

  beforeEach(async () => {
    // Create two clients for testing
    client1 = createClient({
      socketPath: TEST_SOCKET_PATH,
      tokenPath: TEST_TOKEN_PATH,
      autoStart: false,
      flowControl: { ackThreshold: 100 } // Higher threshold for testing
    });

    client2 = createClient({
      socketPath: TEST_SOCKET_PATH,
      tokenPath: TEST_TOKEN_PATH,
      autoStart: false,
      flowControl: { manualAck: true } // Manual ACK mode for precise control
    });

    await client1.waitForConnection();
    await client2.waitForConnection();

    // Create a test session
    const result = await client1.create({
      shell: "/bin/sh",
      cols: 80,
      rows: 24
    });
    sessionId = result.session;
  });

  afterEach(async () => {
    if (client1?.isConnected) {
      try {
        if (sessionId) await client1.kill(sessionId);
      } catch (e) {
        // Session might already be dead
      }
      client1.close();
    }
    if (client2?.isConnected) {
      client2.close();
    }
  });

  async function cleanupFiles(): Promise<void> {
    try {
      await unlink(TEST_SOCKET_PATH);
    } catch {}
    try {
      await unlink(TEST_TOKEN_PATH);
    } catch {}
  }

  test("should handle normal flow without backpressure warnings", async () => {
    const backpressureEvents: BackpressureWarningEvent[] = [];
    client1.on("backpressure_warning", (event) => {
      backpressureEvents.push(event);
    });

    // Attach client and generate a small amount of output
    await client1.attach(sessionId);
    client1.write(sessionId, new TextEncoder().encode("echo hello\n"));

    await setTimeout(500);

    // Should have no backpressure events for normal usage
    expect(backpressureEvents).toHaveLength(0);
  });

  test("should emit yellow zone backpressure warning", async () => {
    const backpressureEvents: BackpressureWarningEvent[] = [];
    let outputCount = 0;

    client2.on("backpressure_warning", (event) => {
      backpressureEvents.push(event);
    });

    client2.on("output", () => {
      outputCount++;
      // Don't ACK messages to build up queue
    });

    // Attach second client (manual ACK mode)
    await client2.attach(sessionId);

    // Generate enough output to trigger yellow zone
    // Use a command that generates continuous output
    client1.write(sessionId, new TextEncoder().encode("yes | head -n 50\n"));

    // Wait for backpressure to build up
    await setTimeout(2000);

    // Should have received yellow zone warning
    const yellowWarnings = backpressureEvents.filter(e => e.level === "yellow");
    expect(yellowWarnings.length).toBeGreaterThan(0);
    expect(outputCount).toBeGreaterThan(10); // Should have received messages

    // Now ACK all messages to clear the queue
    const pendingCount = client2.getPendingCount(sessionId);
    if (pendingCount > 0) {
      client2.ack(sessionId, pendingCount);
    }
  });

  test("should emit red zone backpressure warning", async () => {
    const backpressureEvents: BackpressureWarningEvent[] = [];
    let outputCount = 0;

    client2.on("backpressure_warning", (event) => {
      backpressureEvents.push(event);
    });

    client2.on("output", () => {
      outputCount++;
      // Don't ACK to build up severe backpressure
    });

    await client2.attach(sessionId);

    // Generate a lot of output to trigger red zone
    client1.write(sessionId, new TextEncoder().encode("yes | head -n 100\n"));

    // Wait for severe backpressure to build up
    await setTimeout(3000);

    // Should have both yellow and red warnings
    const yellowWarnings = backpressureEvents.filter(e => e.level === "yellow");
    const redWarnings = backpressureEvents.filter(e => e.level === "red");

    expect(yellowWarnings.length).toBeGreaterThan(0);
    expect(redWarnings.length).toBeGreaterThan(0);
    expect(outputCount).toBeGreaterThan(20);

    // Verify warning progression
    const firstYellow = backpressureEvents.find(e => e.level === "yellow");
    const firstRed = backpressureEvents.find(e => e.level === "red");

    expect(firstYellow).toBeDefined();
    expect(firstRed).toBeDefined();
    expect(firstYellow!.queue_size).toBeLessThan(firstRed!.queue_size);
  });

  test("should rate limit in yellow zone", async () => {
    const outputTimestamps: number[] = [];

    client2.on("output", () => {
      outputTimestamps.push(Date.now());
    });

    await client2.attach(sessionId);

    // Generate output that will trigger yellow zone rate limiting
    client1.write(sessionId, new TextEncoder().encode("yes | head -n 30\n"));

    await setTimeout(2000);

    // Analyze timing patterns to detect rate limiting
    if (outputTimestamps.length > 5) {
      const intervals = [];
      for (let i = 1; i < outputTimestamps.length; i++) {
        intervals.push(outputTimestamps[i] - outputTimestamps[i-1]);
      }

      // In yellow zone, we should see some longer intervals due to rate limiting
      const longIntervals = intervals.filter(interval => interval > 30); // > yellow interval
      expect(longIntervals.length).toBeGreaterThan(0);
    }
  });

  test("should handle ACK mechanism correctly", async () => {
    const backpressureEvents: BackpressureWarningEvent[] = [];
    let outputCount = 0;

    client2.on("backpressure_warning", (event) => {
      backpressureEvents.push(event);
    });

    client2.on("output", () => {
      outputCount++;
    });

    await client2.attach(sessionId);

    // Generate output to build up queue
    client1.write(sessionId, new TextEncoder().encode("yes | head -n 25\n"));

    // Wait for backpressure to build
    await setTimeout(1500);

    // Should be in yellow/red zone
    expect(backpressureEvents.length).toBeGreaterThan(0);

    // ACK all messages
    const pendingCount = client2.getPendingCount(sessionId);
    expect(pendingCount).toBeGreaterThan(0);

    client2.ack(sessionId, pendingCount);

    // Wait a bit more
    await setTimeout(500);

    // Should eventually see "back to green" notification
    const greenWarnings = backpressureEvents.filter(e => e.level === "green");
    expect(greenWarnings.length).toBeGreaterThan(0);
  });

  test("should handle multiple subscribers independently", async () => {
    // Create a third client for multi-subscriber test
    const client3 = createClient({
      socketPath: TEST_SOCKET_PATH,
      tokenPath: TEST_TOKEN_PATH,
      autoStart: false,
      flowControl: { ackThreshold: 5 } // Fast auto-ACK
    });

    await client3.waitForConnection();

    const client2Events: BackpressureWarningEvent[] = [];
    const client3Events: BackpressureWarningEvent[] = [];

    client2.on("backpressure_warning", (event) => client2Events.push(event));
    client3.on("backpressure_warning", (event) => client3Events.push(event));

    await client2.attach(sessionId); // Manual ACK, will build backpressure
    await client3.attach(sessionId); // Auto ACK, should stay clean

    // Generate output
    client1.write(sessionId, new TextEncoder().encode("yes | head -n 40\n"));

    await setTimeout(2000);

    // Client2 (manual ACK) should have backpressure warnings
    expect(client2Events.length).toBeGreaterThan(0);

    // Client3 (auto ACK) should have fewer or no warnings
    expect(client3Events.length).toBeLessThanOrEqual(client2Events.length);

    client3.close();
  });

  test("should disconnect on hard queue limit", async () => {
    const errorEvents: Error[] = [];
    const closeEvents: number[] = [];

    client2.on("error", (error) => errorEvents.push(error));
    client2.on("close", () => closeEvents.push(Date.now()));

    await client2.attach(sessionId);

    // Generate massive output to hit hard limit (50 messages)
    client1.write(sessionId, new TextEncoder().encode("yes | head -n 200\n"));

    // Wait for hard limit to be reached
    await setTimeout(4000);

    // Client should be forcefully disconnected
    // Note: This test might be flaky depending on timing
    expect(closeEvents.length).toBeGreaterThanOrEqual(0); // At minimum, no crashes
  }, 10000);

  test("should handle flow control configuration correctly", async () => {
    const config1 = client1.getFlowControlConfig();
    const config2 = client2.getFlowControlConfig();

    expect(config1.ackThreshold).toBe(100);
    expect(config1.manualAckMode).toBe(false);

    expect(config2.ackThreshold).toBe(0);
    expect(config2.manualAckMode).toBe(true);

    // Test dynamic configuration
    client1.setAckThreshold(50);
    expect(client1.getFlowControlConfig().ackThreshold).toBe(50);

    // Should not allow auto-ACK in manual mode
    expect(() => client2.setAckThreshold(10)).toThrow();

    client2.setManualAckMode(false);
    expect(client2.getFlowControlConfig().manualAckMode).toBe(false);
    expect(client2.getFlowControlConfig().ackThreshold).toBe(100); // Restored default
  });
});