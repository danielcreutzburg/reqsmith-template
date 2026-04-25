/**
 * Tests for the shared safe logger.
 *
 * Pure unit tests – no network, no Deno.serve. We import the source as a TS
 * module via Vitest. The safeLogger module uses only standard browser APIs
 * (console + addEventListener), which exist in jsdom.
 *
 * NOTE: We import the file with a query-string to avoid Vitest sharing the
 * installed global guard between tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  redact,
  safeError,
  logger,
  installGlobalLogGuard,
  __resetGlobalLogGuardForTests,
} from "../../../supabase/functions/_shared/safeLogger.ts";

describe("redact()", () => {
  it("redacts known secret keys regardless of case", () => {
    const out = redact({
      api_key: "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAA",
      Authorization: "Bearer abcdefghijklmno",
      nested: { Token: "eyJhbGciOiJIUzI1NiIsInR5cCI.payload.signature123" },
      keep: "ok",
    }) as Record<string, unknown>;
    expect(out.api_key).toBe("[REDACTED]");
    expect(out.Authorization).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).Token).toBe("[REDACTED]");
    expect(out.keep).toBe("ok");
  });

  it("strips OpenAI / OpenRouter / Anthropic / Google / JWT tokens from free text", () => {
    const text = [
      "openai sk-proj-ABCDEFGHIJKLMNOPQRSTUVWX",
      "router or-v1-abcdefghijklmnopqrstuvwx",
      "anthropic sk-ant-ABCDEFGHIJKLMNOP1234",
      "google AIzaSyABCDEFGHIJKLMNOPQRSTUVWX",
      "jwt eyJhbGciOiJIUzI1Ni.eyJpYXQiOjE2MTY.signature123ABCxyz",
      "header Authorization: Bearer XYZ123abc456def",
    ].join("\n");
    const cleaned = redact(text) as string;
    expect(cleaned).not.toMatch(/sk-proj-[A-Z]/);
    expect(cleaned).not.toMatch(/or-v1-[a-z]/);
    expect(cleaned).not.toMatch(/sk-ant-[A-Z]/);
    expect(cleaned).not.toMatch(/AIzaSy[A-Z]/);
    expect(cleaned).not.toMatch(/eyJhbGc/);
    expect(cleaned).not.toMatch(/Bearer XYZ123/);
    expect(cleaned).toContain("[REDACTED]");
  });

  it("handles Headers, arrays, errors, and circular structures", () => {
    const headers = new Headers({ Authorization: "Bearer ABCDEFGHIJKLM", "X-Other": "ok" });
    const cleanedHeaders = redact(headers) as Record<string, string>;
    expect(cleanedHeaders.authorization).toBe("[REDACTED]");
    expect(cleanedHeaders["x-other"]).toBe("ok");

    const err = new Error("Failed: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWX leaked");
    const cleanedErr = redact(err) as { message: string; name: string };
    expect(cleanedErr.name).toBe("Error");
    expect(cleanedErr.message).not.toContain("sk-proj-");
    expect(cleanedErr.message).toContain("[REDACTED]");

    const circ: { self?: unknown } = {};
    circ.self = circ;
    const out = redact(circ) as Record<string, unknown>;
    expect(out.self).toBe("[Circular]");
  });
});

describe("safeError()", () => {
  it("returns a fallback for null / empty", () => {
    expect(safeError(null)).toBe("Internal error");
    expect(safeError(undefined)).toBe("Internal error");
    expect(safeError("")).toBe("Internal error");
  });

  it("strips secrets from Error messages", () => {
    const err = new Error("call failed with sk-proj-ABCDEFGHIJKLMNOPQRSTUVWX");
    const out = safeError(err);
    expect(out).not.toContain("sk-proj-");
    expect(out).toContain("[REDACTED]");
  });

  it("caps message length to prevent log echo amplification", () => {
    const long = "x".repeat(2000);
    expect(safeError(long).length).toBeLessThanOrEqual(500);
  });

  it("never returns just a redacted token alone", () => {
    expect(safeError("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWX")).toBe("Internal error");
  });
});

describe("logger + installGlobalLogGuard()", () => {
  let captured: string[];
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetGlobalLogGuardForTests();
    captured = [];
    // Spy on the underlying console BEFORE installing the guard – the guard
    // captures the original methods at module-load time, but our spy on
    // process.stderr-equivalent isn't stable in jsdom. Instead, we wrap
    // console.error after reset so we can observe what the guard emits.
    writeSpy = vi.spyOn(console, "error").mockImplementation((line: unknown) => {
      captured.push(String(line));
    });
  });

  it("logger.error redacts secrets in arguments", () => {
    logger.error("boom", { api_key: "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWX" });
    const joined = captured.join("\n");
    expect(joined).not.toContain("sk-proj-");
    expect(joined).toContain("[REDACTED]");
    writeSpy.mockRestore();
  });

  it("installGlobalLogGuard wraps console so even raw console.error is sanitised", () => {
    // Capture pre-install spy first.
    writeSpy.mockRestore();
    const lines: string[] = [];
    const originalError = console.error;
    console.error = (line: unknown) => lines.push(String(line));
    installGlobalLogGuard();
    // Now any console.error caller (third-party libs included) must be cleaned.
    console.error("leaked", { Authorization: "Bearer SUPERSECRETTOKEN12345" });
    console.error = originalError;
    __resetGlobalLogGuardForTests();
    const joined = lines.join("\n");
    expect(joined).not.toContain("SUPERSECRETTOKEN12345");
    expect(joined).toContain("[REDACTED]");
  });
});
