import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLAYGROUND_SERVER = path.join(ROOT_DIR, "playground", "server.ts");
const PLAYGROUND_CLIENT = path.join(ROOT_DIR, "playground", "client.ts");

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

describe("playground SDK migration", () => {
  it("uses @vibest/pty-daemon TS SDK instead of manual protocol wiring", () => {
    const serverSource = readSource(PLAYGROUND_SERVER);
    const clientSource = readSource(PLAYGROUND_CLIENT);

    expect(serverSource).toContain("@vibest/pty-daemon");
    expect(clientSource).toContain("@vibest/pty-daemon");

    expect(serverSource).not.toContain("@msgpack/msgpack");
    expect(clientSource).not.toContain("@msgpack/msgpack");

    expect(serverSource).not.toMatch(/\bBun\.connect\s*\(/);
    expect(clientSource).not.toMatch(/\bBun\.connect\s*\(/);
  });
});
