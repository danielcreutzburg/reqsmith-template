import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

const insert = vi.fn().mockResolvedValue({ error: null });
const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const del = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const order = vi.fn().mockResolvedValue({
  data: [{ id: "t1", term: "API", definition: "App Programming Interface", created_at: "2024-01-01" }],
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order })),
      insert,
      update,
      delete: del,
    })),
  },
}));

import { useGlossary } from "@/features/glossary/hooks/useGlossary";

describe("useGlossary", () => {
  beforeEach(() => {
    insert.mockClear();
    update.mockClear();
    del.mockClear();
  });

  it("loads terms on mount and exposes glossaryContext", async () => {
    const { result } = renderHook(() => useGlossary());
    await waitFor(() => expect(result.current.terms).toHaveLength(1));
    expect(result.current.glossaryContext).toContain("API");
    expect(result.current.glossaryContext).toContain("App Programming Interface");
  });

  it("addTerm calls insert with user id", async () => {
    const { result } = renderHook(() => useGlossary());
    await waitFor(() => expect(result.current.terms).toHaveLength(1));
    await act(async () => {
      await result.current.addTerm("PRD", "Product Requirements Doc");
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", term: "PRD", definition: "Product Requirements Doc" })
    );
  });

  it("updateTerm calls update + eq", async () => {
    const { result } = renderHook(() => useGlossary());
    await act(async () => {
      await result.current.updateTerm("t1", "API v2", "def");
    });
    expect(update).toHaveBeenCalled();
  });

  it("deleteTerm calls delete + eq", async () => {
    const { result } = renderHook(() => useGlossary());
    await act(async () => {
      await result.current.deleteTerm("t1");
    });
    expect(del).toHaveBeenCalled();
  });

  it("returns empty glossaryContext when terms array is empty", () => {
    // re-arrange: empty data
    order.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => useGlossary());
    // Initial render: terms === [], glossaryContext === ""
    expect(result.current.glossaryContext).toBe("");
  });
});
