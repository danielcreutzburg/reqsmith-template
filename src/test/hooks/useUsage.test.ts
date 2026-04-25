import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

let rolesData: any = [];
let usageData: any = { message_count: 3, max_messages: 10 };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "user_roles") {
        return {
          select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: rolesData }) })),
        };
      }
      // usage_counts
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: usageData }) })),
        })),
      };
    }),
  },
}));

import { useUsage } from "@/features/chat/hooks/useUsage";

describe("useUsage", () => {
  it("loads usage for non-admin users", async () => {
    rolesData = [];
    usageData = { message_count: 3, max_messages: 10 };
    const { result } = renderHook(() => useUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messageCount).toBe(3);
    expect(result.current.maxMessages).toBe(10);
    expect(result.current.remaining).toBe(7);
    expect(result.current.isAdmin).toBe(false);
  });

  it("flags admin users and skips usage fetch", async () => {
    rolesData = [{ role: "admin" }];
    const { result } = renderHook(() => useUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
  });

  it("exposes a refetch function", () => {
    const { result } = renderHook(() => useUsage());
    expect(typeof result.current.refetch).toBe("function");
  });
});
