import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { mockedAuthUser } = vi.hoisted(() => ({ mockedAuthUser: { id: "u1" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: mockedAuthUser }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { useAnalytics } from "@/features/dashboard/hooks/useAnalytics";

const today = new Date();

function makeSession(daysAgo: number, templateId: string | null, doc: string) {
  const d = new Date(today);
  d.setDate(today.getDate() - daysAgo);
  return {
    id: `s-${daysAgo}-${templateId}`,
    template_id: templateId,
    document: doc,
    created_at: d.toISOString(),
  };
}

describe("useAnalytics", () => {
  it("computes weekly activity, template breakdown and total words", async () => {
    const sessions = [
      makeSession(0, "modern-prd", "one two three " + "x ".repeat(60)),
      makeSession(2, "modern-prd", "a b c"),
      makeSession(10, "agile-user-story", "longer body text " + "y ".repeat(60)),
      makeSession(20, null, ""),
    ];
    const { result } = renderHook(() => useAnalytics(sessions));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });

    expect(result.current.analytics.weeklyActivity).toHaveLength(8);
    // sharing fields zeroed
    expect(result.current.analytics.sharedDocsCount).toBe(0);
    expect(result.current.analytics.activeShares).toBe(0);
    expect(result.current.analytics.totalComments).toBe(0);
    // template breakdown counts modern-prd twice, agile once, null skipped
    const mp = result.current.analytics.templateBreakdown.find((b) => b.name === "modern-prd");
    expect(mp?.count).toBe(2);
    expect(result.current.analytics.templateBreakdown.find((b) => b.name === "agile-user-story")?.count).toBe(1);
    // words computed
    expect(result.current.analytics.totalWordsWritten).toBeGreaterThan(0);
  });

  it("returns empty breakdown when there are no sessions", async () => {
    const sessions: { id: string; template_id: string | null; document: string; created_at: string }[] = [];
    const { result } = renderHook(() => useAnalytics(sessions));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });
    expect(result.current.analytics.templateBreakdown).toEqual([]);
    expect(result.current.analytics.totalWordsWritten).toBe(0);
  });
});
