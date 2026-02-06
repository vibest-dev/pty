import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAIN_DIR = path.join(ROOT_DIR, "dist", "@vibest", "pty-daemon");
const MAIN_BIN = path.join(MAIN_DIR, "bin", "vibest-pty-daemon");

describe("package postinstall", () => {
  it("links platform binary into main package", () => {
    execFileSync("bun", ["scripts/build.ts", "--mock-binaries", "--version", "0.0.0-test"], {
      stdio: "pipe",
      cwd: ROOT_DIR,
    });

    execFileSync("node", [path.join(MAIN_DIR, "postinstall.mjs")], {
      stdio: "pipe",
      env: process.env,
      cwd: ROOT_DIR,
    });

    expect(fs.existsSync(MAIN_BIN)).toBe(true);
    const stat = fs.lstatSync(MAIN_BIN);
    expect(stat.isSymbolicLink() || stat.isFile()).toBe(true);
  });
});
