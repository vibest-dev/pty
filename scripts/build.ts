#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = path.join(ROOT, "dist");
const SDK_DIR = path.join(ROOT, "packages", "pty-daemon");
const DAEMON_CRATE = "vibest-pty-daemon";
const DAEMON_BINARY = "vibest-pty-daemon";

const MAIN_PACKAGE = "@vibest/pty-daemon";
const TARGETS = [
  {
    packageName: "@vibest/pty-daemon-darwin-arm64",
    arch: "arm64",
    triple: "aarch64-apple-darwin",
  },
  {
    packageName: "@vibest/pty-daemon-darwin-x64",
    arch: "x64",
    triple: "x86_64-apple-darwin",
  },
] as const;

type BuildOptions = {
  version: string;
  mockBinaries: boolean;
  skipSdkBuild: boolean;
};

function parseArgs(): BuildOptions {
  const args = Bun.argv.slice(2);
  const versionArgIdx = args.indexOf("--version");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
  ) as { version: string };

  const version =
    versionArgIdx >= 0 && args[versionArgIdx + 1]
      ? args[versionArgIdx + 1]
      : packageJson.version;

  return {
    version,
    mockBinaries: args.includes("--mock-binaries"),
    skipSdkBuild: args.includes("--skip-sdk-build"),
  };
}

function packageDir(packageName: string): string {
  const [scope, name] = packageName.split("/");
  return path.join(DIST_DIR, scope, name);
}

function ensureExecutable(filePath: string): void {
  fs.chmodSync(filePath, 0o755);
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function buildTarget(options: BuildOptions, target: (typeof TARGETS)[number]): Promise<void> {
  const outDir = packageDir(target.packageName);
  const outBinary = path.join(outDir, "bin", DAEMON_BINARY);
  fs.mkdirSync(path.dirname(outBinary), { recursive: true });

  if (options.mockBinaries) {
    fs.writeFileSync(outBinary, "#!/usr/bin/env sh\necho mock-daemon\n", "utf8");
    ensureExecutable(outBinary);
  } else {
    await $`cargo build --release -p ${DAEMON_CRATE} --target ${target.triple}`.cwd(ROOT);
    const builtBinary = path.join(ROOT, "target", target.triple, "release", DAEMON_BINARY);
    if (!fs.existsSync(builtBinary)) {
      throw new Error(`expected binary not found: ${builtBinary}`);
    }
    fs.copyFileSync(builtBinary, outBinary);
    ensureExecutable(outBinary);
  }

  writeJson(path.join(outDir, "package.json"), {
    name: target.packageName,
    version: options.version,
    type: "commonjs",
    os: ["darwin"],
    cpu: [target.arch],
    files: ["bin"],
  });
}

async function buildMainPackage(options: BuildOptions): Promise<void> {
  const outDir = packageDir(MAIN_PACKAGE);
  const sdkDist = path.join(SDK_DIR, "dist");

  if (!options.skipSdkBuild) {
    await $`bun run --cwd ${SDK_DIR} build`.cwd(ROOT);
  }

  fs.rmSync(path.join(outDir, "dist"), { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.cpSync(sdkDist, path.join(outDir, "dist"), { recursive: true });

  fs.mkdirSync(path.join(outDir, "bin"), { recursive: true });

  await $`bun build ${path.join(ROOT, "scripts", "postinstall.ts")} --target node --format esm --outfile ${path.join(outDir, "postinstall.mjs")}`.cwd(ROOT);

  const optionalDependencies: Record<string, string> = {};
  for (const target of TARGETS) {
    optionalDependencies[target.packageName] = options.version;
  }

  writeJson(path.join(outDir, "package.json"), {
    name: MAIN_PACKAGE,
    version: options.version,
    type: "module",
    main: "./dist/index.cjs",
    module: "./dist/index.mjs",
    types: "./dist/index.d.mts",
    exports: {
      ".": {
        import: {
          types: "./dist/index.d.mts",
          default: "./dist/index.mjs",
        },
        require: {
          types: "./dist/index.d.cts",
          default: "./dist/index.cjs",
        },
      },
    },
    files: ["dist", "bin", "postinstall.mjs"],
    scripts: {
      postinstall: "node ./postinstall.mjs",
    },
    dependencies: {
      "@msgpack/msgpack": "^3.0.0",
    },
    optionalDependencies,
  });
}

export async function buildDistributables(options: BuildOptions): Promise<void> {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  for (const target of TARGETS) {
    await buildTarget(options, target);
  }
  await buildMainPackage(options);
}

if (import.meta.main) {
  const options = parseArgs();
  await buildDistributables(options);
  console.log(`built ${MAIN_PACKAGE} v${options.version}`);
}
