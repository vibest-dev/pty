export type SeqResponse = {
  type: "ok" | "error" | "handshake";
  seq: number;
};

export type PendingEntry<TResponse extends SeqResponse> = {
  resolve: (response: TResponse) => void;
  reject: (error: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

export class PendingRequests<TResponse extends SeqResponse = SeqResponse> {
  private readonly pending = new Map<number, PendingEntry<TResponse>>();

  register(seq: number, timeoutMs?: number): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const entry: PendingEntry<TResponse> = { resolve, reject };

      if (timeoutMs && timeoutMs > 0) {
        entry.timer = setTimeout(() => {
          this.pending.delete(seq);
          reject(new Error(`Request seq=${seq} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }

      this.pending.set(seq, entry);
    });
  }

  resolve(response: TResponse): void {
    const entry = this.pending.get(response.seq);
    if (!entry) {
      return;
    }

    this.pending.delete(response.seq);
    if (entry.timer) clearTimeout(entry.timer);
    entry.resolve(response);
  }

  rejectAll(error: Error): void {
    for (const [seq, entry] of this.pending) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.reject(error);
    }
    this.pending.clear();
  }

  get size(): number {
    return this.pending.size;
  }
}
