import type { ChildProcess } from "node:child_process";
import { DEFAULT_SOCKET_PATH, DEFAULT_TOKEN_PATH } from "./daemon";
import { createClient, type ClientOptions, type PtyDaemonClient } from "./client";

export type CreatePtyOptions = Omit<ClientOptions, "socketPath" | "tokenPath"> & {
  socketPath?: string;
  tokenPath?: string;
};

export type PtyDaemon = {
  readonly process: ChildProcess | null;
  readonly socketPath: string;
  readonly tokenPath: string;
  close(): Promise<void>;
};

export type PtyInstance = {
  readonly client: PtyDaemonClient;
  readonly daemon: PtyDaemon;
  close(): Promise<void>;
  shutdown(): Promise<void>;
};

export function createPtyClient(options: ClientOptions): PtyDaemonClient {
  return createClient(options);
}

export async function createPty(options: CreatePtyOptions = {}): Promise<PtyInstance> {
  const socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH;
  const tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
  const clientOptions: ClientOptions = {
    ...options,
    socketPath,
    tokenPath,
  };

  const client = createPtyClient(clientOptions);
  await client.waitForConnection();

  const close = async (): Promise<void> => {
    await client.shutdown();
  };

  const daemon: PtyDaemon = {
    get process() {
      return client.daemonProcess;
    },
    socketPath,
    tokenPath,
    close,
  };

  return {
    client,
    daemon,
    close,
    shutdown: close,
  };
}
