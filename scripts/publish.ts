#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";
import { buildDistributables } from "./build";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = path.join(ROOT, "dist");
const MAIN_PACKAGE = "@vibest/pty-daemon";
const NPM_CACHE_DIR = path.join(ROOT, ".npm-cache");

function parseArgs() {
  const args = Bun.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const mockBinaries = args.includes("--mock-binaries");
  const versionArgIdx = args.indexOf("--version");
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
    version: string;
  };

  const version =
    versionArgIdx >= 0 && args[versionArgIdx + 1]
      ? args[versionArgIdx + 1]
      : packageJson.version;

  return { dryRun, version, mockBinaries };
}

function packageDir(packageName: string): string {
  const [scope, name] = packageName.split("/");
  return path.join(DIST_DIR, scope, name);
}

async function publishPackage(packageName: string, dryRun: boolean): Promise<void> {
  const dir = packageDir(packageName);
  fs.mkdirSync(NPM_CACHE_DIR, { recursive: true });
  if (dryRun) {
    await $`npm publish --dry-run --access public --cache ${NPM_CACHE_DIR}`.cwd(dir);
  } else {
    await $`npm publish --access public --cache ${NPM_CACHE_DIR}`.cwd(dir);
  }
  console.log(`${dryRun ? "would publish" : "published"} ${packageName}`);
}

async function lintPackage(packageName: string): Promise<void> {
  const dir = packageDir(packageName);
  await $`bunx publint ${dir} --pack bun`.cwd(ROOT);
}

if (import.meta.main) {
  const { dryRun, version, mockBinaries } = parseArgs();

  await buildDistributables({
    version,
    mockBinaries,
    skipSdkBuild: false,
  });

  await lintPackage("@vibest/pty-daemon-darwin-arm64");
  await lintPackage("@vibest/pty-daemon-darwin-x64");
  await lintPackage(MAIN_PACKAGE);

  await publishPackage("@vibest/pty-daemon-darwin-arm64", dryRun);
  await publishPackage("@vibest/pty-daemon-darwin-x64", dryRun);
  await publishPackage(MAIN_PACKAGE, dryRun);
}
