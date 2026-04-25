import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { CookieBanner } from "@/components/CookieBanner";
import { BadgeProgress } from "@/features/gamification/components/BadgeProgress";
import { DiffViewer } from "@/features/editor/components/DiffViewer";
import { AnalyticsCharts } from "@/features/dashboard/components/AnalyticsCharts";

// recharts depends on ResizeObserver in jsdom
beforeEach(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <LanguageProvider>{children}</LanguageProvider>
    </MemoryRouter>
  );
}

describe("CookieBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders when no consent stored and hides on accept", () => {
    render(
      <Wrap>
        <CookieBanner />
      </Wrap>
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(localStorage.getItem("reqsmith-cookie-consent")).toBe("true");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("does not render when consent already stored", () => {
    localStorage.setItem("reqsmith-cookie-consent", "true");
    const { container } = render(
      <Wrap>
        <CookieBanner />
      </Wrap>
    );
    expect(container.textContent ?? "").not.toMatch(/cookie/i);
  });
});

describe("BadgeProgress", () => {
  it("renders nothing when no nextBadge", () => {
    const { container } = render(
      <Wrap>
        <BadgeProgress nextBadge={null} earnedCount={0} totalCount={5} />
      </Wrap>
    );
    expect(container.textContent).toBe("");
  });

  it("renders next badge info and progress numbers", () => {
    const next = {
      key: "k",
      name_de: "Hero",
      name_en: "Hero",
      description_de: "",
      description_en: "",
      icon: "🦸",
      category: "doc",
      threshold: 10,
      metric: "documents",
      sort_order: 1,
      progress: 4,
      earned: false,
      earned_at: null,
    };
    render(
      <Wrap>
        <BadgeProgress nextBadge={next} earnedCount={2} totalCount={5} />
      </Wrap>
    );
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText("4/10")).toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument();
  });
});

describe("DiffViewer", () => {
  it("renders added/removed lines for a real diff", () => {
    render(
      <Wrap>
        <DiffViewer
          open={true}
          onOpenChange={() => {}}
          oldContent={"line1\nold\nline3"}
          newContent={"line1\nnew\nline3"}
          versionLabel="v2 → v3"
        />
      </Wrap>
    );
    // The dialog contains both old and new line text
    expect(screen.getByText(/v2 → v3/)).toBeInTheDocument();
    expect(screen.getByText("old")).toBeInTheDocument();
    expect(screen.getByText("new")).toBeInTheDocument();
  });
});

describe("AnalyticsCharts", () => {
  it("renders skeleton placeholders while loading", () => {
    const { container } = render(
      <AnalyticsCharts
        analytics={{
          sharedDocsCount: 0,
          totalComments: 0,
          activeShares: 0,
          weeklyActivity: [],
          templateBreakdown: [],
          totalWordsWritten: 0,
        }}
        loading={true}
      />
    );
    // Skeletons render as divs with the skeleton class
    expect(container.querySelectorAll("[class*='animate-pulse']").length).toBeGreaterThan(0);
  });

  it("renders stat numbers when not loading", () => {
    render(
      <AnalyticsCharts
        analytics={{
          sharedDocsCount: 3,
          totalComments: 7,
          activeShares: 2,
          weeklyActivity: [{ week: "1.1", sessions: 2, documents: 1 }],
          templateBreakdown: [{ name: "modern-prd", count: 4 }],
          totalWordsWritten: 1500,
        }}
        loading={false}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    // 1500 words → "1.5k" via formatter
    expect(screen.getByText("1.5k")).toBeInTheDocument();
  });

  it("formats small word counts as raw numbers", () => {
    render(
      <AnalyticsCharts
        analytics={{
          sharedDocsCount: 0,
          totalComments: 0,
          activeShares: 0,
          weeklyActivity: [],
          templateBreakdown: [],
          totalWordsWritten: 42,
        }}
        loading={false}
      />
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
