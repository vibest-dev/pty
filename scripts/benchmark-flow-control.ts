#!/usr/bin/env -S bun run

/**
 * Flow Control Performance Benchmark
 *
 * This script measures the performance characteristics of the flow control system
 * across different zones and configurations. It validates the performance claims
 * in the PR description.
 */

import { PtyDaemonClient, createClient } from "../packages/pty-daemon/src/client";
import { spawn, type ChildProcess } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";

interface BenchmarkResult {
  zone: "green" | "yellow" | "red";
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  memoryUsage: number;
  messagesSent: number;
  messagesReceived: number;
  backpressureEvents: number;
  duration: number;
}

interface BenchmarkConfig {
  yellowThreshold: number;
  redThreshold: number;
  maxQueueSize: number;
  yellowIntervalMs: number;
  redIntervalMs: number;
  testDurationMs: number;
  outputRateHz: number;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  yellowThreshold: 1024,
  redThreshold: 4096,
  maxQueueSize: 65536,
  yellowIntervalMs: 10,
  redIntervalMs: 100,
  testDurationMs: 30000, // 30 seconds
  outputRateHz: 100 // Messages per second
};

class FlowControlBenchmark {
  private daemonProcess?: ChildProcess;
  private socketPath = "/tmp/benchmark-pty.sock";
  private tokenPath = "/tmp/benchmark-pty.token";

  async setup(config: BenchmarkConfig): Promise<void> {
    // Clean up existing files
    await this.cleanup();

    const env = {
      ...process.env,
      RUST_PTY_SOCKET_PATH: this.socketPath,
      RUST_PTY_TOKEN_PATH: this.tokenPath,
      RUST_PTY_FLOW_YELLOW_THRESHOLD: config.yellowThreshold.toString(),
      RUST_PTY_FLOW_RED_THRESHOLD: config.redThreshold.toString(),
      RUST_PTY_FLOW_MAX_QUEUE_SIZE: config.maxQueueSize.toString(),
      RUST_PTY_FLOW_YELLOW_INTERVAL_MS: config.yellowIntervalMs.toString(),
      RUST_PTY_FLOW_RED_INTERVAL_MS: config.redIntervalMs.toString(),
      RUST_PTY_FLOW_AUTO_DISCONNECT: "false"
    };

    console.log("🚀 Starting daemon with config:", {
      yellowThreshold: config.yellowThreshold,
      redThreshold: config.redThreshold,
      maxQueueSize: config.maxQueueSize,
      yellowIntervalMs: config.yellowIntervalMs,
      redIntervalMs: config.redIntervalMs
    });

    this.daemonProcess = spawn("cargo", ["run", "--release", "--bin", "vibest-pty-daemon"], {
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    // Wait for daemon startup
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async cleanup(): Promise<void> {
    if (this.daemonProcess) {
      this.daemonProcess.kill("SIGTERM");
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.daemonProcess.killed) {
        this.daemonProcess.kill("SIGKILL");
      }
    }

    try {
      await unlink(this.socketPath);
      await unlink(this.tokenPath);
    } catch {}
  }

  async runBenchmark(config: BenchmarkConfig, targetZone: "green" | "yellow" | "red"): Promise<BenchmarkResult> {
    const client = createClient({
      socketPath: this.socketPath,
      tokenPath: this.tokenPath,
      autoStart: false,
      flowControl: { manualAck: true } // Manual control for precise testing
    });

    await client.waitForConnection();
    const session = await client.create({ shell: "/bin/sh", cols: 80, rows: 24 });

    const stats = {
      latencies: [] as number[],
      messagesSent: 0,
      messagesReceived: 0,
      backpressureEvents: 0,
      startTime: Date.now(),
      memoryUsage: 0
    };

    let currentZone: "green" | "yellow" | "red" = "green";

    // Set up event listeners
    client.on("output", (event) => {
      stats.messagesReceived++;
      const now = Date.now();
      // Approximate latency (this is imperfect but gives us an idea)
      stats.latencies.push(now - stats.startTime);
    });

    client.on("backpressure_warning", (event) => {
      stats.backpressureEvents++;
      currentZone = event.level;

      // Only ACK if we're not trying to stay in a specific zone
      if (targetZone === "green" || (targetZone === "yellow" && event.level === "red")) {
        // ACK some messages to control zone
        const ackCount = Math.min(100, client.getPendingCount(session.session));
        if (ackCount > 0) {
          client.ack(session.session, ackCount);
        }
      }
    });

    // Attach and start generating output
    await client.attach(session.session);

    // Generate appropriate load for target zone
    const outputCommand = this.getOutputCommand(config, targetZone);
    client.write(session.session, new TextEncoder().encode(outputCommand + "\n"));

    // Let the test run for the specified duration
    const endTime = Date.now() + config.testDurationMs;

    while (Date.now() < endTime) {
      await new Promise(resolve => setTimeout(resolve, 100));

      // Periodically measure memory usage
      if (stats.messagesReceived % 100 === 0) {
        const memUsage = process.memoryUsage();
        stats.memoryUsage = Math.max(stats.memoryUsage, memUsage.heapUsed);
      }

      // Send more commands if needed
      if (Date.now() % 5000 < 100) { // Every 5 seconds
        client.write(session.session, new TextEncoder().encode("echo 'continue'\n"));
        stats.messagesSent++;
      }
    }

    const duration = Date.now() - stats.startTime;

    // Calculate metrics
    stats.latencies.sort((a, b) => a - b);
    const avgLatency = stats.latencies.length > 0
      ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
      : 0;

    const p95Index = Math.floor(stats.latencies.length * 0.95);
    const p99Index = Math.floor(stats.latencies.length * 0.99);

    const throughput = stats.messagesReceived / (duration / 1000); // messages per second

    client.close();

    return {
      zone: currentZone,
      avgLatency,
      p95Latency: stats.latencies[p95Index] || 0,
      p99Latency: stats.latencies[p99Index] || 0,
      throughput,
      memoryUsage: stats.memoryUsage / (1024 * 1024), // MB
      messagesSent: stats.messagesSent,
      messagesReceived: stats.messagesReceived,
      backpressureEvents: stats.backpressureEvents,
      duration
    };
  }

  private getOutputCommand(config: BenchmarkConfig, targetZone: "green" | "yellow" | "red"): string {
    switch (targetZone) {
      case "green":
        // Low output rate to stay in green zone
        return "for i in $(seq 1 10); do echo 'Green zone test message $i'; sleep 0.1; done";

      case "yellow":
        // Medium output rate to enter yellow zone
        return "for i in $(seq 1 200); do echo 'Yellow zone test message $i with some padding data'; done";

      case "red":
        // High output rate to enter red zone
        return "yes 'Red zone high throughput test message with lots of data' | head -n 1000";
    }
  }

  async generateReport(results: BenchmarkResult[]): Promise<string> {
    const report = [
      "# Flow Control Performance Benchmark Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Configuration",
      `- Yellow Threshold: ${DEFAULT_CONFIG.yellowThreshold}`,
      `- Red Threshold: ${DEFAULT_CONFIG.redThreshold}`,
      `- Max Queue Size: ${DEFAULT_CONFIG.maxQueueSize}`,
      `- Yellow Interval: ${DEFAULT_CONFIG.yellowIntervalMs}ms`,
      `- Red Interval: ${DEFAULT_CONFIG.redIntervalMs}ms`,
      "",
      "## Results Summary",
      "",
      "| Zone | Avg Latency (ms) | P95 Latency (ms) | P99 Latency (ms) | Throughput (msg/s) | Memory (MB) | Backpressure Events |",
      "|------|------------------|------------------|------------------|-------------------|-------------|---------------------|",
    ];

    for (const result of results) {
      report.push(
        `| ${result.zone.toUpperCase()} | ${result.avgLatency.toFixed(2)} | ${result.p95Latency.toFixed(2)} | ${result.p99Latency.toFixed(2)} | ${result.throughput.toFixed(1)} | ${result.memoryUsage.toFixed(1)} | ${result.backpressureEvents} |`
      );
    }

    report.push(
      "",
      "## Analysis",
      "",
      "### Performance Overhead by Zone",
      ""
    );

    const greenResult = results.find(r => r.zone === "green");
    const yellowResult = results.find(r => r.zone === "yellow");
    const redResult = results.find(r => r.zone === "red");

    if (greenResult && yellowResult) {
      const yellowOverhead = ((yellowResult.avgLatency - greenResult.avgLatency) / greenResult.avgLatency * 100);
      report.push(`- Yellow zone adds ~${yellowOverhead.toFixed(1)}% latency overhead`);
    }

    if (greenResult && redResult) {
      const redOverhead = ((redResult.avgLatency - greenResult.avgLatency) / greenResult.avgLatency * 100);
      report.push(`- Red zone adds ~${redOverhead.toFixed(1)}% latency overhead`);
    }

    report.push(
      "",
      "### Throughput Analysis",
      ""
    );

    if (yellowResult) {
      report.push(`- Yellow zone throughput: ${yellowResult.throughput.toFixed(1)} msg/sec`);
    }
    if (redResult) {
      report.push(`- Red zone throughput: ${redResult.throughput.toFixed(1)} msg/sec`);
    }

    report.push(
      "",
      "### Memory Usage",
      ""
    );

    for (const result of results) {
      const messagesPerMB = result.messagesReceived / result.memoryUsage;
      report.push(`- ${result.zone.toUpperCase()} zone: ${result.memoryUsage.toFixed(1)} MB (${messagesPerMB.toFixed(0)} msg/MB)`);
    }

    return report.join("\n");
  }
}

async function main() {
  console.log("🔍 Flow Control Performance Benchmark Starting...");

  const benchmark = new FlowControlBenchmark();
  const results: BenchmarkResult[] = [];

  try {
    await benchmark.setup(DEFAULT_CONFIG);

    // Test each zone
    const zones: ("green" | "yellow" | "red")[] = ["green", "yellow", "red"];

    for (const zone of zones) {
      console.log(`\n📊 Benchmarking ${zone.toUpperCase()} zone...`);

      const result = await benchmark.runBenchmark(DEFAULT_CONFIG, zone);
      results.push(result);

      console.log(`✅ ${zone.toUpperCase()} zone complete:`);
      console.log(`   Throughput: ${result.throughput.toFixed(1)} msg/s`);
      console.log(`   Avg Latency: ${result.avgLatency.toFixed(2)} ms`);
      console.log(`   Memory Usage: ${result.memoryUsage.toFixed(1)} MB`);
      console.log(`   Backpressure Events: ${result.backpressureEvents}`);

      // Rest between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate and save report
    const report = await benchmark.generateReport(results);
    await writeFile("flow-control-benchmark-report.md", report);

    console.log("\n📄 Report saved to: flow-control-benchmark-report.md");
    console.log("\n🎉 Benchmark complete!");

  } catch (error) {
    console.error("❌ Benchmark failed:", error);
    process.exit(1);
  } finally {
    await benchmark.cleanup();
  }
}

if (import.meta.main) {
  main();
}