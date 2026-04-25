import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

const initialPrompts = [
  { id: "p1", content: "alpha prompt content", label: "a", is_favorite: true, use_count: 5, created_at: "2024-01-01" },
  { id: "p2", content: "beta prompt content", label: null, is_favorite: false, use_count: 2, created_at: "2024-01-02" },
];

const limit = vi.fn().mockResolvedValue({ data: initialPrompts });
const updateEq = vi.fn().mockResolvedValue({ error: null });
const deleteEq = vi.fn().mockResolvedValue({ error: null });
const insertSingle = vi.fn().mockResolvedValue({
  data: { id: "p3", content: "gamma new prompt", label: null, is_favorite: false, use_count: 1, created_at: "2024-01-03" },
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit })) })) })),
      update: vi.fn(() => ({ eq: updateEq })),
      delete: vi.fn(() => ({ eq: deleteEq })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: insertSingle })) })),
    })),
  },
}));

import { useSavedPrompts } from "@/features/chat/hooks/useSavedPrompts";

describe("useSavedPrompts", () => {
  beforeEach(() => {
    updateEq.mockClear();
    deleteEq.mockClear();
    insertSingle.mockClear();
  });

  it("loads prompts and computes favorites and frequent", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].id).toBe("p1");
    expect(result.current.frequent.length).toBeLessThanOrEqual(10);
  });

  it("trackPrompt ignores short content", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    await act(async () => {
      await result.current.trackPrompt("short");
    });
    expect(updateEq).not.toHaveBeenCalled();
    expect(insertSingle).not.toHaveBeenCalled();
  });

  it("trackPrompt increments existing prompt", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    await act(async () => {
      await result.current.trackPrompt("alpha prompt content");
    });
    expect(updateEq).toHaveBeenCalled();
  });

  it("trackPrompt inserts new prompt when not found", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    await act(async () => {
      await result.current.trackPrompt("a brand new prompt content here");
    });
    expect(insertSingle).toHaveBeenCalled();
  });

  it("toggleFavorite flips state", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    await act(async () => {
      await result.current.toggleFavorite("p2");
    });
    expect(updateEq).toHaveBeenCalled();
    const p2 = result.current.prompts.find((p) => p.id === "p2")!;
    expect(p2.is_favorite).toBe(true);
  });

  it("toggleFavorite no-op for unknown id", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    await act(async () => {
      await result.current.toggleFavorite("nope");
    });
    expect(updateEq).not.toHaveBeenCalled();
  });

  it("deletePrompt removes from state", async () => {
    const { result } = renderHook(() => useSavedPrompts());
    await waitFor(() => expect(result.current.prompts).toHaveLength(2));
    await act(async () => {
      await result.current.deletePrompt("p1");
    });
    expect(deleteEq).toHaveBeenCalled();
    expect(result.current.prompts.find((p) => p.id === "p1")).toBeUndefined();
  });
});
