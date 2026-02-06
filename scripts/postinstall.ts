#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_PKG = "@vibest/pty-daemon";
const DAEMON_BINARY = "vibest-pty-daemon";

function platformPackageName(): string | null {
  if (os.platform() !== "darwin") {
    return null;
  }

  if (os.arch() === "arm64") {
    return "@vibest/pty-daemon-darwin-arm64";
  }

  if (os.arch() === "x64") {
    return "@vibest/pty-daemon-darwin-x64";
  }

  return null;
}

function findBinary(packageName: string): string | null {
  try {
    const pkgJsonPath = require.resolve(`${packageName}/package.json`);
    const pkgDir = path.dirname(pkgJsonPath);
    const binaryPath = path.join(pkgDir, "bin", DAEMON_BINARY);
    if (fs.existsSync(binaryPath)) {
      return binaryPath;
    }
  } catch {
    // optional dep may not be installed in this resolution mode
  }

  const fallback = path.resolve(
    __dirname,
    "..",
    packageName.replace("@vibest/", ""),
    "bin",
    DAEMON_BINARY
  );
  if (fs.existsSync(fallback)) {
    return fallback;
  }

  return null;
}

function linkBinary(sourcePath: string): void {
  const targetDir = path.join(__dirname, "bin");
  const targetPath = path.join(targetDir, DAEMON_BINARY);

  fs.mkdirSync(targetDir, { recursive: true });
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }

  fs.symlinkSync(sourcePath, targetPath);
}

function main(): void {
  const packageName = platformPackageName();
  if (!packageName) {
    console.warn(`${MAIN_PKG}: unsupported platform ${os.platform()}-${os.arch()}`);
    return;
  }

  const binary = findBinary(packageName);
  if (!binary) {
    console.warn(`${MAIN_PKG}: binary not found for ${packageName}`);
    return;
  }

  linkBinary(binary);
  console.log(`${MAIN_PKG}: linked ${packageName}`);
}

main();
