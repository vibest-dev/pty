import type { ChildProcess } from "node:child_process";
import {
  DEFAULT_SOCKET_PATH,
  DEFAULT_TOKEN_PATH,
  ensureDaemonRunning,
  type EnsureDaemonRunningOptions,
} from "./daemon";
import { createPtyClient, type ClientOptions, type PtyDaemonClient } from "./client";

export type CreatePtyOptions = Omit<ClientOptions, "socketPath" | "tokenPath"> & {
  socketPath?: string;
  tokenPath?: string;
  daemon?: Omit<EnsureDaemonRunningOptions, "socketPath" | "tokenPath">;
};

export type PtyDaemon = {
  readonly process: ChildProcess | null;
  readonly socketPath: string;
  readonly tokenPath: string;
  connect(): Promise<void>;
};

export type PtyInstance = {
  readonly client: PtyDaemonClient;
  readonly daemon: PtyDaemon;
};

export function createPty(options: CreatePtyOptions = {}): PtyInstance {
  const socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
  const tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
  let daemonProcess: ChildProcess | null = null;
  let daemonBootPromise: Promise<ChildProcess | null> | null = null;
  let connectPromise: Promise<void> | null = null;

  const clientOptions: ClientOptions = {
    token: options.token,
    protocolVersion: options.protocolVersion,
    clientId: options.clientId,
    role: options.role,
    requestTimeoutMs: options.requestTimeoutMs,
    socketPath,
    tokenPath,
  };

  const client = createPtyClient(clientOptions);

  const bootDaemon = (): Promise<ChildProcess | null> => {
    if (!daemonBootPromise) {
      const promise = ensureDaemonRunning({
        ...options.daemon,
        socketPath,
        tokenPath,
      });
      daemonBootPromise = promise
        .then((child) => {
          daemonProcess = child;
          return child;
        })
        .catch((error) => {
          daemonBootPromise = null;
          throw error;
        });
      // createPty() is sync; keep background warmup errors contained until connect() awaits them
      daemonBootPromise.catch(() => {});
    }

    return daemonBootPromise;
  };

  const daemon: PtyDaemon = {
    get process() {
      return daemonProcess;
    },
    socketPath,
    tokenPath,
    async connect() {
      if (!connectPromise) {
        connectPromise = (async () => {
          await bootDaemon();

          if (!client.isConnected) {
            await client.waitForConnection();
            return;
          }

          await client.handshake();
        })();
      }

      try {
        await connectPromise;
      } finally {
        connectPromise = null;
      }
    },
  };

  // Start daemon warmup in background by default.
  void bootDaemon();

  return {
    client,
    daemon,
  };
}
