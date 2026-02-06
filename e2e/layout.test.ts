import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("repo layout", () => {
  it("places daemon crate under crates/daemon", () => {
    expect(fs.existsSync(path.join(ROOT_DIR, "crates", "daemon", "Cargo.toml"))).toBe(true);
  });
});
