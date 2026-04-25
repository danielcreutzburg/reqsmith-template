import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/hooks/use-toast", () => {
  const toast = vi.fn();
  return { useToast: () => ({ toast }), __toast: toast };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "tok" } } }) },
  },
}));

import { DocumentScorecard } from "@/features/scorecard/components/DocumentScorecard";
import * as toastMod from "@/hooks/use-toast";
const toast = (toastMod as any).__toast as ReturnType<typeof vi.fn>;

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </LanguageProvider>
  );
}

describe("DocumentScorecard", () => {
  beforeEach(() => {
    toast.mockReset();
    (global as any).fetch = vi.fn();
  });

  it("toast errors and does not call fetch when document is too short", async () => {
    render(
      <Wrap>
        <DocumentScorecard document="short" />
      </Wrap>
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it("renders dialog with overall score after successful fetch", async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        strategy: { score: 80, feedback: "ok" },
        structure: { score: 70, feedback: "ok" },
        clarity: { score: 90, feedback: "ok" },
        completeness: { score: 60, feedback: "ok" },
        testability: { score: 50, feedback: "ok" },
        traceability: { score: 75, feedback: "ok" },
        overall: 71,
        topSuggestions: ["Mehr Metriken"],
      }),
    });
    const longDoc = "A".repeat(120);
    render(
      <Wrap>
        <DocumentScorecard document={longDoc} />
      </Wrap>
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("71")).toBeInTheDocument());
  });

  it("toasts on 429, 402 and 500", async () => {
    for (const status of [429, 402, 500]) {
      toast.mockReset();
      (global as any).fetch = vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({}) });
      const longDoc = "A".repeat(120);
      const { unmount } = render(
        <Wrap>
          <DocumentScorecard document={longDoc} />
        </Wrap>
      );
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(toast).toHaveBeenCalled());
      unmount();
    }
  });
});
