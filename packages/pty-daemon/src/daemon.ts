import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
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

async function waitForDaemonReady(
  child: ChildProcess,
  socketPath: string,
  tokenPath: string,
  timeoutMs: number
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (isDaemonReady(socketPath, tokenPath)) {
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

  if (fs.existsSync(socketPath)) {
    return null;
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
    child.once("exit", () => resolve());
    child.kill("SIGTERM");
  });
}
