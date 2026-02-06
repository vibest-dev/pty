import { describe, expect, it } from "vitest";
import { PendingRequests } from "../src/pending";

describe("pending requests", () => {
  it("resolves responses by seq", async () => {
    const pending = new PendingRequests();

    const one = pending.register(1);
    const two = pending.register(2);

    pending.resolve({ type: "ok", seq: 2 });
    pending.resolve({ type: "ok", seq: 1 });

    await expect(one).resolves.toMatchObject({ seq: 1 });
    await expect(two).resolves.toMatchObject({ seq: 2 });
  });
});
