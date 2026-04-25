import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: any[]) => invoke(...args) } },
}));

import { useLoginRateLimit } from "@/hooks/useLoginRateLimit";

describe("useLoginRateLimit", () => {
  beforeEach(() => invoke.mockReset());

  it("returns ok when allowed", async () => {
    invoke.mockResolvedValueOnce({ data: { allowed: true }, error: null });
    const { result } = renderHook(() => useLoginRateLimit());
    let res: any;
    await act(async () => {
      res = await result.current.check("a@b.de");
    });
    expect(res).toEqual({ status: "ok", waitSeconds: 0 });
  });

  it("returns limited with waitSeconds when blocked", async () => {
    invoke.mockResolvedValueOnce({ data: { allowed: false, wait_seconds: 30 }, error: null });
    const { result } = renderHook(() => useLoginRateLimit());
    let res: any;
    await act(async () => {
      res = await result.current.check("a@b.de");
    });
    expect(res).toEqual({ status: "limited", waitSeconds: 30 });
  });

  it("returns network_error on edge function error", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const { result } = renderHook(() => useLoginRateLimit());
    let res: any;
    await act(async () => {
      res = await result.current.check("a@b.de");
    });
    expect(res.status).toBe("network_error");
  });

  it("returns network_error on thrown exception", async () => {
    invoke.mockRejectedValueOnce(new Error("nope"));
    const { result } = renderHook(() => useLoginRateLimit());
    let res: any;
    await act(async () => {
      res = await result.current.check("a@b.de");
    });
    expect(res.status).toBe("network_error");
  });

  it("clear invokes edge function", async () => {
    invoke.mockResolvedValueOnce({ data: {}, error: null });
    const { result } = renderHook(() => useLoginRateLimit());
    await act(async () => {
      await result.current.clear("a@b.de");
    });
    expect(invoke).toHaveBeenCalledWith("auth-rate-limit", {
      body: { action: "clear", email: "a@b.de" },
    });
  });

  it("clear swallows errors", async () => {
    invoke.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useLoginRateLimit());
    await expect(
      act(async () => {
        await result.current.clear("a@b.de");
      })
    ).resolves.toBeUndefined();
  });
});
