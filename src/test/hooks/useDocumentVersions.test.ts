import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const versionsData = [
  { id: "v2", version_number: 2, content: "v2 body", created_at: "2024-01-02" },
  { id: "v1", version_number: 1, content: "v1 body", created_at: "2024-01-01" },
];

const limit = vi.fn().mockResolvedValue({ data: versionsData });
const insert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit })) })) })),
      insert,
    })),
  },
}));

import { useDocumentVersions } from "@/features/sessions/hooks/useDocumentVersions";

describe("useDocumentVersions", () => {
  beforeEach(() => {
    insert.mockClear();
  });

  it("returns empty list when sessionId is null", () => {
    const { result } = renderHook(() => useDocumentVersions(null));
    expect(result.current.versions).toEqual([]);
  });

  it("loads versions for given sessionId", async () => {
    const { result } = renderHook(() => useDocumentVersions("s1"));
    await waitFor(() => expect(result.current.versions).toHaveLength(2));
    expect(result.current.versions[0].version_number).toBe(2);
  });

  it("saveVersion is no-op without sessionId", async () => {
    const { result } = renderHook(() => useDocumentVersions(null));
    await act(async () => {
      await result.current.saveVersion("anything");
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("saveVersion is no-op for empty content", async () => {
    const { result } = renderHook(() => useDocumentVersions("s1"));
    await waitFor(() => expect(result.current.versions).toHaveLength(2));
    await act(async () => {
      await result.current.saveVersion("   ");
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("saveVersion skips when content matches latest version", async () => {
    const { result } = renderHook(() => useDocumentVersions("s1"));
    await waitFor(() => expect(result.current.versions).toHaveLength(2));
    await act(async () => {
      await result.current.saveVersion("v2 body");
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("saveVersion inserts next version when content differs", async () => {
    const { result } = renderHook(() => useDocumentVersions("s1"));
    await waitFor(() => expect(result.current.versions).toHaveLength(2));
    await act(async () => {
      await result.current.saveVersion("brand new content");
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: "s1", content: "brand new content", version_number: 3 })
    );
  });
});
