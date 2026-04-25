import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

const rpc = vi.fn().mockResolvedValue({
  data: [
    { id: "s1", title: "Hit", document: "doc", template_id: "modern-prd", updated_at: "2024-01-01", match_type: "title" },
  ],
  error: null,
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: any[]) => rpc(...args) },
}));

import { useSearch } from "@/features/search/hooks/useSearch";

describe("useSearch", () => {
  beforeEach(() => rpc.mockClear());

  it("starts with empty results", () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.query).toBe("");
  });

  it("clears results when query is empty", async () => {
    const { result } = renderHook(() => useSearch());
    await act(async () => {
      await result.current.search("   ");
    });
    expect(result.current.results).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls rpc and sets results when query is non-empty", async () => {
    const { result } = renderHook(() => useSearch());
    await act(async () => {
      await result.current.search("Hit");
    });
    await waitFor(() => expect(result.current.results).toHaveLength(1));
    expect(rpc).toHaveBeenCalledWith("search_sessions", { _user_id: "u1", _query: "Hit" });
    expect(result.current.isSearching).toBe(false);
  });

  it("clearSearch resets state", async () => {
    const { result } = renderHook(() => useSearch());
    await act(async () => {
      await result.current.search("Hit");
    });
    act(() => result.current.clearSearch());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
  });

  it("swallows rpc errors silently", async () => {
    rpc.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useSearch());
    await act(async () => {
      await result.current.search("oops");
    });
    expect(result.current.isSearching).toBe(false);
  });
});
