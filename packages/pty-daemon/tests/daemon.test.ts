import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveBinaryPath } from "../src/daemon";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // no-op
    }
  }
});

function createPackageRoot(withBinary = false): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pty-daemon-sdk-"));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, "bin"), { recursive: true });
  if (withBinary) {
    fs.writeFileSync(path.join(dir, "bin", "vibest-pty-daemon"), "#!/bin/sh\n", "utf8");
  }
  return dir;
}

describe("resolveBinaryPath", () => {
  it("prefers PTY_DAEMON_PATH when set", () => {
    const root = createPackageRoot(true);
    const custom = path.join(root, "custom", "daemon");
    fs.mkdirSync(path.dirname(custom), { recursive: true });
    fs.writeFileSync(custom, "bin", "utf8");

    const result = resolveBinaryPath({
      env: { PTY_DAEMON_PATH: custom },
      packageRoot: root,
    });

    expect(result).toBe(custom);
  });

  it("falls back to package bin path", () => {
    const root = createPackageRoot(true);
    const result = resolveBinaryPath({ packageRoot: root, env: {} });
    expect(result).toBe(path.join(root, "bin", "vibest-pty-daemon"));
  });

  it("returns null when no binary available", () => {
    const root = createPackageRoot(false);
    const result = resolveBinaryPath({ packageRoot: root, env: {} });
    expect(result).toBeNull();
  });
});
