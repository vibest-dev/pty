import { decode, encode } from "@msgpack/msgpack";

export const DEFAULT_MAX_FRAME_SIZE = 64 * 1024 * 1024; // 64MB
export const DEFAULT_MAX_BUFFER_SIZE = 128 * 1024 * 1024; // 128MB

export class FrameParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FrameParserError";
  }
}

export function encodeFrame(message: unknown): Uint8Array {
  const payload = encode(message);
  const frame = new Uint8Array(4 + payload.length);
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  view.setUint32(0, payload.length, false);
  frame.set(payload, 4);
  return frame;
}

export type FrameParserOptions = {
  maxFrameSize?: number;
  maxBufferSize?: number;
};

export class FrameParser {
  private buffer = new Uint8Array(0);
  private readonly maxFrameSize: number;
  private readonly maxBufferSize: number;

  constructor(options: FrameParserOptions = {}) {
    this.maxFrameSize = options.maxFrameSize ?? DEFAULT_MAX_FRAME_SIZE;
    this.maxBufferSize = options.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;
  }

  push(chunk: Uint8Array): unknown[] {
    const next = new Uint8Array(this.buffer.length + chunk.length);
    next.set(this.buffer);
    next.set(chunk, this.buffer.length);
    this.buffer = next;

    if (this.buffer.length > this.maxBufferSize) {
      throw new FrameParserError(
        `Buffer size ${this.buffer.length} exceeds max ${this.maxBufferSize}`
      );
    }

    const messages: unknown[] = [];
    while (this.buffer.length >= 4) {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
      const len = view.getUint32(0, false);

      if (len === 0) {
        throw new FrameParserError("Invalid frame: length is 0");
      }

      if (len > this.maxFrameSize) {
        throw new FrameParserError(
          `Frame size ${len} exceeds max ${this.maxFrameSize}`
        );
      }

      if (this.buffer.length < len + 4) {
        break;
      }

      const payload = this.buffer.slice(4, 4 + len);
      messages.push(decode(payload));
      this.buffer = this.buffer.slice(4 + len);
    }

    return messages;
  }

  reset(): void {
    this.buffer = new Uint8Array(0);
  }
}
