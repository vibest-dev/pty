import { describe, expect, it } from "vitest";
import { encodeFrame, FrameParser } from "../src/frame";

describe("frame codec", () => {
  it("parses concatenated frames", () => {
    const parser = new FrameParser();
    const data = new Uint8Array([
      ...encodeFrame({ type: "ok", seq: 1 }),
      ...encodeFrame({ type: "ok", seq: 2 }),
    ]);

    const messages = parser.push(data);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ seq: 1 });
    expect(messages[1]).toMatchObject({ seq: 2 });
  });
});
