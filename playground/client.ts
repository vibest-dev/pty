import { createPty, type PtyDaemonClient } from "@vibest/pty-daemon";

const DEFAULT_BASE_DIR = `${process.env.HOME || "/tmp"}/.vibest/pty`;
const SOCKET_PATH = process.env.RUST_PTY_SOCKET_PATH || `${DEFAULT_BASE_DIR}/socket`;
const TOKEN_PATH = process.env.RUST_PTY_TOKEN_PATH || `${DEFAULT_BASE_DIR}/token`;
const PROTOCOL_VERSION = 1;

type CommandName =
  | "create"
  | "list"
  | "attach"
  | "kill"
  | "kill-all"
  | "signal"
  | "help";

function usage(): string {
  return [
    "Usage: bun playground/client.ts [command] [args]",
    "",
    "Commands:",
    "  (no args)              Create and attach to new session",
    "  create [cmd...]        Create session, optionally run initial commands",
    "  list                   List all sessions",
    "  attach <id>            Attach to existing session",
    "  kill <id>              Kill session",
    "  kill-all               Kill all sessions",
    "  signal <id> [SIG]      Send signal (default: SIGINT)",
    "  help                   Show this help",
  ].join("\n");
}

async function createConnectedClient(): Promise<PtyDaemonClient> {
  const pty = createPty({
    socketPath: SOCKET_PATH,
    tokenPath: TOKEN_PATH,
    protocolVersion: PROTOCOL_VERSION,
  });
  await pty.daemon.connect();
  return pty.client;
}

function sendResize(client: PtyDaemonClient, sessionId: number): void {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  client.resize({ id: sessionId }, cols, rows);
}

async function attachInteractive(client: PtyDaemonClient, sessionId: number): Promise<number> {
  const attached = await client.attach({ id: sessionId });
  const { snapshot } = attached;

  if (snapshot.rehydrate) {
    process.stdout.write(snapshot.rehydrate);
  }
  if (snapshot.content) {
    process.stdout.write(snapshot.content);
  }

  sendResize(client, sessionId);

  return await new Promise<number>((resolve, reject) => {
    let resolved = false;

    const done = (code: number): void => {
      if (resolved) {
        return;
      }
      resolved = true;
      cleanup();
      resolve(code);
    };

    const fail = (error: Error): void => {
      if (resolved) {
        return;
      }
      resolved = true;
      cleanup();
      reject(error);
    };

    const onOutput = (event: { session: number; data: Uint8Array }): void => {
      if (event.session !== sessionId) {
        return;
      }
      process.stdout.write(Buffer.from(event.data));
    };

    const onExit = (event: { session: number; code: number; signal?: number }): void => {
      if (event.session !== sessionId) {
        return;
      }
      const suffix = typeof event.signal === "number" ? ` (signal ${event.signal})` : "";
      process.stdout.write(`\n[Session ${event.session} exited with code ${event.code}${suffix}]\n`);
      done(event.code);
    };

    const onError = (error: Error): void => {
      fail(error);
    };

    const onStdin = (data: Buffer): void => {
      client.write({ id: sessionId }, new Uint8Array(data));
    };

    const onSigwinch = (): void => {
      sendResize(client, sessionId);
    };

    const cleanup = (): void => {
      client.off("output", onOutput);
      client.off("exit", onExit);
      client.off("error", onError);
      process.off("SIGWINCH", onSigwinch);
      process.stdin.off("data", onStdin);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
    };

    client.on("output", onOutput);
    client.on("exit", onExit);
    client.on("error", onError);
    process.on("SIGWINCH", onSigwinch);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.on("data", onStdin);
  });
}

function parseSessionId(raw: string | undefined, command: string): number {
  const parsed = Number.parseInt(raw || "", 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Usage: ${command} <session_id>`);
  }
  return parsed;
}

async function run(): Promise<number> {
  const args = process.argv.slice(2);
  const command = (args[0] || "") as CommandName | "";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(usage());
    return 0;
  }

  const client = await createConnectedClient();

  try {
    if (command === "create") {
      const initial = args.slice(1);
      const { session } = await client.create({
        initial_commands: initial.length > 0 ? initial : undefined,
      });
      console.log(`Created session ${session}`);
      return 0;
    }

    if (command === "list") {
      const sessions = await client.list();
      if (sessions.length === 0) {
        console.log("No sessions");
      } else {
        console.log("Sessions:");
        for (const session of sessions) {
          const alive = session.is_alive ? "alive" : "dead";
          console.log(`  ${session.id}: [${alive}] PID ${session.pid} (${session.pts})`);
        }
      }
      return 0;
    }

    if (command === "attach") {
      const sessionId = parseSessionId(args[1], "attach");
      return await attachInteractive(client, sessionId);
    }

    if (command === "kill") {
      const sessionId = parseSessionId(args[1], "kill");
      await client.kill(sessionId);
      console.log(`Killed session ${sessionId}`);
      return 0;
    }

    if (command === "kill-all") {
      const count = await client.killAll();
      console.log(`Killed ${count} session(s)`);
      return 0;
    }

    if (command === "signal") {
      const sessionId = parseSessionId(args[1], "signal");
      const signal = args[2] || "SIGINT";
      await client.signal(sessionId, signal);
      console.log(`Sent ${signal} to session ${sessionId}`);
      return 0;
    }

    if (command !== "") {
      throw new Error(`Unknown command: ${command}\n\n${usage()}`);
    }

    // Default command: create then attach.
    const { session } = await client.create();
    console.log(`[Attached to session ${session}]`);
    return await attachInteractive(client, session);
  } finally {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    client.close();
  }
}

run()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.exit(1);
  });
