/**
 * Flow Control Example
 *
 * This example demonstrates how to use the PTY daemon's flow control features:
 * 1. Monitoring backpressure warnings
 * 2. Adjusting application behavior based on queue depth
 * 3. Manual ACK management
 */

import { createClient, type BackpressureWarningEvent } from "@vibest/pty-daemon";

async function main() {
  const client = createClient({
    socketPath: "/tmp/rust-pty.sock",
    autoStart: true,
  });

  // Track backpressure state
  let currentBackpressure: "green" | "yellow" | "red" = "green";
  let isPaused = false;

  // Connect and authenticate
  await client.waitForConnection();
  console.log("Connected to PTY daemon");

  // Listen for backpressure warnings
  client.on("backpressure_warning", (event: BackpressureWarningEvent) => {
    currentBackpressure = event.level;

    console.log(`[Backpressure] Session ${event.session}:`);
    console.log(`  Level: ${event.level}`);
    console.log(`  Queue size: ${event.queue_size} messages`);

    // React to different levels
    switch (event.level) {
      case "green":
        console.log("  ✓ Normal operation");
        if (isPaused) {
          console.log("  → Resuming UI updates");
          isPaused = false;
        }
        break;

      case "yellow":
        console.warn("  ⚠ Warning: High queue depth");
        console.warn("  → Consider reducing update frequency");
        break;

      case "red":
        console.error("  ⛔ Severe backpressure!");
        console.error("  → Pausing non-critical UI updates");
        isPaused = true;
        break;
    }
  });

  // Create a session with fast output
  const { session } = await client.create({
    cwd: process.cwd(),
    cols: 80,
    rows: 24,
  });
  console.log(`Created session ${session}`);

  // Attach to session
  await client.attach(session);
  console.log(`Attached to session ${session}`);

  // Configure ACK behavior
  // Option 1: Use auto-ACK (default: every 100 messages)
  client.setAckThreshold(100);

  // Option 2: Manual ACK only
  // client.setAckThreshold(0);
  // let pendingAck = 0;

  // Process output with backpressure awareness
  let messageCount = 0;
  let processedCount = 0;

  client.on("output", (event) => {
    messageCount++;

    // Skip rendering if severely backpressured
    if (!isPaused) {
      // Process the output (render to terminal, update UI, etc.)
      process.stdout.write(event.data);
      processedCount++;
    } else {
      // In red zone: drop frames to catch up
      console.log(`[Dropped frame #${messageCount}]`);
    }

    // Example: Manual ACK every 50 messages
    // if (client.getAckThreshold() === 0) {
    //   pendingAck++;
    //   if (pendingAck >= 50) {
    //     client.ack(session, pendingAck);
    //     pendingAck = 0;
    //   }
    // }

    // Log stats every 1000 messages
    if (messageCount % 1000 === 0) {
      console.log(`\n[Stats] Received: ${messageCount}, Processed: ${processedCount}, Backpressure: ${currentBackpressure}`);
    }
  });

  client.on("exit", (event) => {
    console.log(`\nSession ${event.session} exited with code ${event.code}`);
    client.close();
  });

  // Demonstrate slow processing simulation
  console.log("\nRunning command that generates fast output...");
  client.write(session, new TextEncoder().encode("seq 1 100000\n"));

  // Simulate slow processing by delaying
  // (In real app, this might be slow rendering, network requests, etc.)
  setTimeout(() => {
    console.log("\nSimulating slow processing...");
    // This would cause backpressure in a real scenario
  }, 1000);

  // Clean up on exit
  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await client.shutdown();
    process.exit(0);
  });
}

// Advanced: Custom backpressure handling strategy
class BackpressureAwareTerminal {
  private client: any;
  private sessionId: number;
  private frameBuffer: Uint8Array[] = [];
  private renderInterval: number = 16; // 60fps default

  constructor(client: any, sessionId: number) {
    this.client = client;
    this.sessionId = sessionId;

    client.on("backpressure_warning", (event: BackpressureWarningEvent) => {
      if (event.session !== this.sessionId) return;

      // Adjust render rate based on backpressure
      switch (event.level) {
        case "green":
          this.renderInterval = 16; // 60fps
          break;
        case "yellow":
          this.renderInterval = 33; // 30fps
          break;
        case "red":
          this.renderInterval = 100; // 10fps
          this.frameBuffer = []; // Drop buffered frames
          break;
      }
    });

    client.on("output", (event: any) => {
      if (event.session !== this.sessionId) return;

      // Buffer frames and render at adjusted rate
      this.frameBuffer.push(event.data);
    });

    // Render loop
    setInterval(() => {
      if (this.frameBuffer.length > 0) {
        const frame = this.frameBuffer.shift()!;
        process.stdout.write(frame);
      }
    }, this.renderInterval);
  }
}

// Example usage:
async function advancedExample() {
  const client = createClient({ socketPath: "/tmp/rust-pty.sock" });
  await client.waitForConnection();

  const { session } = await client.create({});
  await client.attach(session);

  // Use backpressure-aware terminal
  const terminal = new BackpressureAwareTerminal(client, session);

  // Terminal automatically adjusts render rate based on backpressure
  client.write(session, new TextEncoder().encode("ls -la /usr/bin\n"));
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main, advancedExample, BackpressureAwareTerminal };
