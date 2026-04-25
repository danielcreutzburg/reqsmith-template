import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

const initialSessions = [
  { id: "s1", template_id: "modern-prd", title: "Alpha", document: "doc-a", created_at: "2024-01-01", updated_at: "2024-01-02" },
  { id: "s2", template_id: null, title: "Beta", document: "", created_at: "2024-01-01", updated_at: "2024-01-01" },
];

const order = vi.fn().mockResolvedValue({ data: initialSessions });
const insertSingle = vi.fn().mockResolvedValue({
  data: { id: "s3", template_id: "modern-prd", title: "Gamma", document: "", created_at: "2024-01-03", updated_at: "2024-01-03" },
  error: null,
});
const updateEq = vi.fn().mockResolvedValue({ error: null });
const deleteEq = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: insertSingle })) })),
      update: vi.fn(() => ({ eq: updateEq })),
      delete: vi.fn(() => ({ eq: deleteEq })),
    })),
  },
}));

import { useSessions } from "@/features/sessions/hooks/useSessions";

describe("useSessions (renderHook)", () => {
  beforeEach(() => {
    insertSingle.mockClear();
    updateEq.mockClear();
    deleteEq.mockClear();
  });

  it("loads sessions on mount", async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    expect(result.current.activeSessionId).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("createSession prepends and sets activeSessionId", async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    await act(async () => {
      const s = await result.current.createSession("modern-prd", "Gamma");
      expect(s?.id).toBe("s3");
    });
    expect(result.current.sessions[0].id).toBe("s3");
    expect(result.current.activeSessionId).toBe("s3");
  });

  it("deleteSession removes and clears activeSessionId when active", async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    act(() => result.current.setActiveSessionId("s1"));
    await act(async () => {
      await result.current.deleteSession("s1");
    });
    expect(result.current.sessions.find((s) => s.id === "s1")).toBeUndefined();
    expect(result.current.activeSessionId).toBeNull();
  });

  it("deleteSession keeps activeSessionId when other session deleted", async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    act(() => result.current.setActiveSessionId("s1"));
    await act(async () => {
      await result.current.deleteSession("s2");
    });
    expect(result.current.activeSessionId).toBe("s1");
  });

  it("updateSessionDocument and updateSessionTitle mutate locally", async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    await act(async () => {
      await result.current.updateSessionDocument("s1", "new doc");
      await result.current.updateSessionTitle("s1", "Renamed");
    });
    const s = result.current.sessions.find((x) => x.id === "s1")!;
    expect(s.document).toBe("new doc");
    expect(s.title).toBe("Renamed");
  });

  it("duplicateSession creates a (Kopie) of source", async () => {
    insertSingle.mockResolvedValueOnce({
      data: { id: "s4", template_id: "modern-prd", title: "Alpha (Kopie)", document: "doc-a", created_at: "2024-01-04", updated_at: "2024-01-04" },
      error: null,
    });
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    await act(async () => {
      const s = await result.current.duplicateSession("s1");
      expect(s?.title).toBe("Alpha (Kopie)");
    });
  });

  it("duplicateSession returns null for unknown id", async () => {
    const { result } = renderHook(() => useSessions());
    await waitFor(() => expect(result.current.sessions).toHaveLength(2));
    await act(async () => {
      const s = await result.current.duplicateSession("does-not-exist");
      expect(s).toBeNull();
    });
  });
});
