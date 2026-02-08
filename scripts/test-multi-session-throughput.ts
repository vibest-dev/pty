#!/usr/bin/env bun

/**
 * 测试多会话并发场景下的吞吐量和延迟
 *
 * 场景:
 * - 会话 1: 高频输出 (yes "data")
 * - 会话 2: 低频交互 (bash)
 * - 会话 3: 中频输出 (ping)
 *
 * 验证是否存在队头阻塞或公平性问题
 */

import { createPtyClient } from "../packages/pty-daemon/src/client";

interface SessionStats {
  id: number;
  name: string;
  messageCount: number;
  firstMessage: number | null;
  lastMessage: number | null;
  latencies: number[];
}

async function testMultiSessionThroughput() {
  const client = createPtyClient({
    socketPath: "/tmp/rust-pty.sock",
    tokenPath: "/tmp/rust-pty.token",
  });

  console.log("Connecting to daemon...");
  await client.waitForConnection();

  // 创建 3 个会话
  console.log("\nCreating sessions...");

  const session1 = await client.create({
    shell: "/bin/bash",
    cols: 80,
    rows: 24,
  });
  console.log(`✓ Session 1 (high-freq): ${session1.session}`);

  const session2 = await client.create({
    shell: "/bin/bash",
    cols: 80,
    rows: 24,
  });
  console.log(`✓ Session 2 (low-freq):  ${session2.session}`);

  const session3 = await client.create({
    shell: "/bin/bash",
    cols: 80,
    rows: 24,
  });
  console.log(`✓ Session 3 (mid-freq):  ${session3.session}`);

  // 附加到所有会话
  await client.attach({ id: session1.session });
  await client.attach({ id: session2.session });
  await client.attach({ id: session3.session });

  // 统计数据
  const stats: Map<number, SessionStats> = new Map([
    [session1.session, { id: session1.session, name: "high-freq", messageCount: 0, firstMessage: null, lastMessage: null, latencies: [] }],
    [session2.session, { id: session2.session, name: "low-freq", messageCount: 0, firstMessage: null, lastMessage: null, latencies: [] }],
    [session3.session, { id: session3.session, name: "mid-freq", messageCount: 0, firstMessage: null, lastMessage: null, latencies: [] }],
  ]);

  let backpressureWarnings = 0;
  let startTime = Date.now();

  // 监听输出
  client.on("output", (event) => {
    const now = Date.now();
    const stat = stats.get(event.session);

    if (stat) {
      if (stat.firstMessage === null) {
        stat.firstMessage = now;
      }
      stat.lastMessage = now;
      stat.messageCount++;

      // 计算延迟（从测试开始到现在）
      stat.latencies.push(now - startTime);
    }
  });

  client.on("backpressure_warning", (event) => {
    backpressureWarnings++;
    console.warn(`⚠️  Backpressure [${event.level}] on session ${event.session}: ${event.queue_size} messages`);
  });

  console.log("\n🚀 Starting test (10 seconds)...\n");
  startTime = Date.now();

  // 会话 1: 高频输出
  client.write({ id: session1.session }, new TextEncoder().encode("yes 'DATA-SESSION-1' | head -1000\n"));

  // 会话 2: 低频交互（手动输入）
  setTimeout(() => client.write({ id: session2.session }, new TextEncoder().encode("echo 'test from session 2'\n")), 1000);
  setTimeout(() => client.write({ id: session2.session }, new TextEncoder().encode("echo 'another message'\n")), 3000);
  setTimeout(() => client.write({ id: session2.session }, new TextEncoder().encode("echo 'final message'\n")), 5000);

  // 会话 3: 中频输出
  client.write(
    { id: session3.session },
    new TextEncoder().encode("for i in {1..100}; do echo \"Message $i from session 3\"; sleep 0.1; done\n"),
  );

  // 等待 10 秒
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 停止高频会话
  client.write({ id: session1.session }, new TextEncoder().encode("\x03")); // Ctrl+C
  client.write({ id: session3.session }, new TextEncoder().encode("\x03"));

  // 等待最后的输出
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 打印结果
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results");
  console.log("=".repeat(60));

  const totalMessages = Array.from(stats.values()).reduce((sum, s) => sum + s.messageCount, 0);

  for (const [sessionId, stat] of stats) {
    console.log(`\nSession ${stat.id} (${stat.name}):`);
    console.log(`  Messages:        ${stat.messageCount} (${(stat.messageCount / totalMessages * 100).toFixed(1)}%)`);

    if (stat.messageCount > 0 && stat.firstMessage && stat.lastMessage) {
      const duration = (stat.lastMessage - stat.firstMessage) / 1000;
      const throughput = stat.messageCount / duration;
      console.log(`  Duration:        ${duration.toFixed(2)}s`);
      console.log(`  Throughput:      ${throughput.toFixed(2)} msg/s`);

      // 延迟统计
      stat.latencies.sort((a, b) => a - b);
      const p50 = stat.latencies[Math.floor(stat.latencies.length * 0.5)];
      const p95 = stat.latencies[Math.floor(stat.latencies.length * 0.95)];
      const p99 = stat.latencies[Math.floor(stat.latencies.length * 0.99)];

      console.log(`  Latency (p50):   ${p50}ms`);
      console.log(`  Latency (p95):   ${p95}ms`);
      console.log(`  Latency (p99):   ${p99}ms`);
    }
  }

  console.log(`\n⚠️  Backpressure warnings: ${backpressureWarnings}`);
  console.log(`📦 Total messages: ${totalMessages}`);
  console.log(`⏱️  Total duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

  // 清理
  console.log("\n🧹 Cleaning up...");
  await client.kill(session1.session);
  await client.kill(session2.session);
  await client.kill(session3.session);

  console.log("✅ Test complete!");
  process.exit(0);
}

testMultiSessionThroughput().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
