import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));
vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ language: "de", setLanguage: vi.fn(), t: (k: string) => k }),
}));
const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const definitions = [
  { key: "first_doc", name_de: "Erstes Doc", name_en: "First Doc", description_de: "", description_en: "", icon: "📄", category: "doc", threshold: 1, metric: "documents", sort_order: 1 },
  { key: "ten_docs", name_de: "10 Docs", name_en: "10 Docs", description_de: "", description_en: "", icon: "📚", category: "doc", threshold: 10, metric: "documents", sort_order: 2 },
];
const userBadges = [
  { badge_key: "first_doc", progress: 1, earned_at: "2024-01-01" },
  { badge_key: "ten_docs", progress: 5, earned_at: null },
];
const streakRow = { current_streak: 3, longest_streak: 7, last_active_date: "2024-01-10" };

const rpc = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => rpc(...args),
    from: vi.fn((table: string) => {
      if (table === "badge_definitions") {
        return {
          select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: definitions }) })),
        };
      }
      if (table === "user_badges") {
        return {
          select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: userBadges }) })),
        };
      }
      // user_streaks
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: streakRow }) })),
        })),
      };
    }),
  },
}));

import { useAchievements } from "@/features/gamification/hooks/useAchievements";

describe("useAchievements", () => {
  beforeEach(() => {
    toast.mockClear();
    rpc.mockClear();
  });

  it("merges badges, computes earned/total and nextBadge", async () => {
    const { result } = renderHook(() => useAchievements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totalCount).toBe(2);
    expect(result.current.earnedCount).toBe(1);
    expect(result.current.streak.current_streak).toBe(3);
    // nextBadge is the unearned one with highest progress ratio: ten_docs (5/10 = 0.5)
    expect(result.current.nextBadge?.key).toBe("ten_docs");
  });

  it("checkBadges fires toasts for newly awarded badges", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ icon: "🏆", name_de: "Champion", name_en: "Champion" }],
      error: null,
    });
    const { result } = renderHook(() => useAchievements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.checkBadges();
    });
    expect(toast).toHaveBeenCalled();
    expect(result.current.newBadgeCount).toBe(1);
  });

  it("clearNewBadgeCount resets the counter", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ icon: "🏆", name_de: "Champion", name_en: "Champion" }],
      error: null,
    });
    const { result } = renderHook(() => useAchievements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.checkBadges();
    });
    act(() => result.current.clearNewBadgeCount());
    expect(result.current.newBadgeCount).toBe(0);
  });

  it("checkBadges with no new badges still reloads", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    const { result } = renderHook(() => useAchievements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.checkBadges();
    });
    expect(result.current.newBadgeCount).toBe(0);
  });
});
