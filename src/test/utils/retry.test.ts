import { describe, it, expect } from "vitest";
import { withRetry } from "@/lib/retry";

describe("withRetry", () => {
  it("should return result on first success", async () => {
    const fn = async () => 42;
    const result = await withRetry(fn);
    expect(result).toBe(42);
  });

  it("should retry on failure and succeed on second attempt", async () => {
    let attempt = 0;
    const fn = async () => {
      attempt++;
      if (attempt === 1) {
        const err = new Error("Server error");
        (err as any).status = 500;
        throw err;
      }
      return "ok";
    };
    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 10 });
    expect(result).toBe("ok");
    expect(attempt).toBe(2);
  });

  it("should not retry on non-retryable status", async () => {
    let attempt = 0;
    const fn = async () => {
      attempt++;
      const err = new Error("Forbidden");
      (err as any).status = 403;
      throw err;
    };
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow("Forbidden");
    expect(attempt).toBe(1);
  });

  it("should throw after max retries exhausted", async () => {
    let attempt = 0;
    const fn = async () => {
      attempt++;
      const err = new Error("Server error");
      (err as any).status = 500;
      throw err;
    };
    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow("Server error");
    expect(attempt).toBe(3); // initial + 2 retries
  });
});
