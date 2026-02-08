import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_SOCKET_PATH = "/tmp/rust-pty.sock";
export const DEFAULT_TOKEN_PATH = "/tmp/rust-pty.token";

export type ResolveBinaryPathOptions = {
  env?: Record<string, string | undefined>;
  packageRoot?: string;
};

export type EnsureDaemonRunningOptions = {
  binaryPath?: string;
  socketPath?: string;
  tokenPath?: string;
  timeoutMs?: number;
  env?: Record<string, string | undefined>;
};

function packageRootFromModule(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function isExecutableFile(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveBinaryPath(options: ResolveBinaryPathOptions = {}): string | null {
  const env = options.env ?? process.env;
  const override = env.PTY_DAEMON_PATH;
  if (override && isExecutableFile(override)) {
    return override;
  }

  const root = options.packageRoot ?? packageRootFromModule();
  const candidate = path.join(root, "bin", "vibest-pty-daemon");
  if (isExecutableFile(candidate)) {
    return candidate;
  }

  return null;
}

export function isDaemonReady(socketPath: string, tokenPath: string): boolean {
  return fs.existsSync(socketPath) && fs.existsSync(tokenPath);
}

async function canConnectUnixSocket(socketPath: string, timeoutMs = 150): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = net.createConnection(socketPath);
    let settled = false;

    const done = (value: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(value);
    };

    const timer = setTimeout(() => done(false), timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timer);
      done(true);
    });
    socket.once("error", () => {
      clearTimeout(timer);
      done(false);
    });
  });
}

async function isDaemonReachable(socketPath: string, tokenPath: string): Promise<boolean> {
  if (!isDaemonReady(socketPath, tokenPath)) {
    return false;
  }
  return await canConnectUnixSocket(socketPath);
}

async function waitForDaemonReady(
  child: ChildProcess,
  socketPath: string,
  tokenPath: string,
  timeoutMs: number
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isDaemonReachable(socketPath, tokenPath)) {
      return;
    }

    if (child.exitCode !== null) {
      throw new Error(`daemon exited early with code ${child.exitCode}`);
    }

    await sleep(25);
  }

  throw new Error(`daemon startup timeout after ${timeoutMs}ms`);
}

export async function ensureDaemonRunning(
  options: EnsureDaemonRunningOptions = {}
): Promise<ChildProcess | null> {
  const socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
  const tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;

  if (await isDaemonReachable(socketPath, tokenPath)) {
    return null;
  }

  if (fs.existsSync(socketPath)) {
    // Stale socket path left by a crashed daemon (or invalid file at socket path).
    try {
      fs.unlinkSync(socketPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`cannot remove stale socket at ${socketPath}: ${message}`);
    }
  }

  const env = {
    ...process.env,
    ...options.env,
    RUST_PTY_SOCKET_PATH: socketPath,
    RUST_PTY_TOKEN_PATH: tokenPath,
  };

  const binaryPath = options.binaryPath ?? resolveBinaryPath({ env });
  if (!binaryPath) {
    throw new Error("daemon binary not found (set PTY_DAEMON_PATH or install platform package)");
  }

  const child = spawn(binaryPath, [], {
    env,
    stdio: "ignore",
    detached: false,
  });

  await waitForDaemonReady(child, socketPath, tokenPath, options.timeoutMs ?? 5000);
  return child;
}

export async function stopDaemon(child: ChildProcess | null | undefined): Promise<void> {
  if (!child) {
    return;
  }

  if (child.exitCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    let finished = false;
    const finish = (): void => {
      if (finished) {
        return;
      }
      finished = true;
      resolve();
    };

    const termTimer = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }

      const killTimer = setTimeout(() => finish(), 1000);
      child.once("exit", () => {
        clearTimeout(killTimer);
        finish();
      });
    }, 2000);

    child.once("exit", () => {
      clearTimeout(termTimer);
      finish();
    });

    child.kill("SIGTERM");
  });
}
