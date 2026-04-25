import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

const templates = [
  {
    id: "t1",
    user_id: "u1",
    name: "My Tpl",
    description: "desc",
    system_prompt_addition: "addition",
    icon: "📄",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

const order = vi.fn().mockResolvedValue({ data: templates });
const insertSingle = vi.fn().mockResolvedValue({
  data: {
    id: "t2",
    user_id: "u1",
    name: "New",
    description: "d",
    system_prompt_addition: "x",
    icon: "📄",
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
  },
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

import { useCustomTemplates } from "@/features/templates/hooks/useCustomTemplates";

describe("useCustomTemplates", () => {
  beforeEach(() => {
    insertSingle.mockClear();
    updateEq.mockClear();
    deleteEq.mockClear();
  });

  it("loads custom templates and maps to Template shape", async () => {
    const { result } = renderHook(() => useCustomTemplates());
    await waitFor(() => expect(result.current.customTemplates).toHaveLength(1));
    expect(result.current.asTemplates[0].id).toBe("custom-t1");
    expect(result.current.asTemplates[0].name).toBe("My Tpl");
  });

  it("createTemplate prepends new row", async () => {
    const { result } = renderHook(() => useCustomTemplates());
    await waitFor(() => expect(result.current.customTemplates).toHaveLength(1));
    await act(async () => {
      const row = await result.current.createTemplate("New", "d", "x");
      expect(row?.id).toBe("t2");
    });
    expect(result.current.customTemplates[0].id).toBe("t2");
  });

  it("updateTemplate mutates in-place", async () => {
    const { result } = renderHook(() => useCustomTemplates());
    await waitFor(() => expect(result.current.customTemplates).toHaveLength(1));
    await act(async () => {
      await result.current.updateTemplate("t1", "Renamed", "new desc", "new addition");
    });
    expect(updateEq).toHaveBeenCalled();
    expect(result.current.customTemplates[0].name).toBe("Renamed");
  });

  it("deleteTemplate removes row", async () => {
    const { result } = renderHook(() => useCustomTemplates());
    await waitFor(() => expect(result.current.customTemplates).toHaveLength(1));
    await act(async () => {
      await result.current.deleteTemplate("t1");
    });
    expect(deleteEq).toHaveBeenCalled();
    expect(result.current.customTemplates).toHaveLength(0);
  });
});
