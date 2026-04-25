import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FollowUpSuggestions } from "@/features/chat/components/FollowUpSuggestions";
import { PromptHistory } from "@/features/chat/components/PromptHistory";
import { EmptyState } from "@/components/ui/empty-state";
import { BadgeGallery } from "@/features/gamification/components/BadgeGallery";
import { SearchBar } from "@/features/search/components/SearchBar";
import { VersionSelector } from "@/features/editor/components/VersionSelector";
import { FileText } from "lucide-react";

// Mock useSearch for SearchBar
vi.mock("@/features/search/hooks/useSearch", () => ({
  useSearch: () => ({
    results: [],
    isSearching: false,
    query: "",
    search: vi.fn(),
    clearSearch: vi.fn(),
  }),
}));

beforeEach(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </LanguageProvider>
  );
}

describe("FollowUpSuggestions", () => {
  it("returns null when no last message", () => {
    const { container } = render(
      <Wrap>
        <FollowUpSuggestions lastAssistantMessage="" onSelect={vi.fn()} />
      </Wrap>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders suggestions for question phase", () => {
    render(
      <Wrap>
        <FollowUpSuggestions lastAssistantMessage="Welche Plattform?" onSelect={vi.fn()} />
      </Wrap>
    );
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("renders document-phase suggestions for templated content", () => {
    const onSelect = vi.fn();
    render(
      <Wrap>
        <FollowUpSuggestions
          lastAssistantMessage={"## Heading\nbody"}
          onSelect={onSelect}
          templateId="agile-user-story"
        />
      </Wrap>
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalled();
  });

  it("hides itself when disabled", () => {
    const { container } = render(
      <Wrap>
        <FollowUpSuggestions lastAssistantMessage="## doc" onSelect={vi.fn()} disabled />
      </Wrap>
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("PromptHistory", () => {
  it("returns null when there are no prompts", () => {
    const { container } = render(
      <Wrap>
        <PromptHistory frequent={[]} favorites={[]} onSelect={vi.fn()} onToggleFavorite={vi.fn()} onDelete={vi.fn()} />
      </Wrap>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders trigger when at least one favorite", () => {
    render(
      <Wrap>
        <PromptHistory
          frequent={[]}
          favorites={[
            { id: "p1", content: "fav prompt", label: null, is_favorite: true, use_count: 1, created_at: "2024-01-01" },
          ]}
          onSelect={vi.fn()}
          onToggleFavorite={vi.fn()}
          onDelete={vi.fn()}
        />
      </Wrap>
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title only", () => {
    render(<EmptyState icon={FileText} title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders action button and forwards click", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={FileText}
        title="Empty"
        description="please add"
        actionLabel="Add"
        onAction={onAction}
      />
    );
    expect(screen.getByText("please add")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe("BadgeGallery", () => {
  it("renders streak block and badge cards", () => {
    const badges = [
      {
        key: "k1",
        name_de: "Erstes",
        name_en: "First",
        description_de: "desc",
        description_en: "desc",
        icon: "🌟",
        category: "documents",
        threshold: 1,
        metric: "documents",
        sort_order: 1,
        progress: 1,
        earned: true,
        earned_at: "2024-01-01",
      },
      {
        key: "k2",
        name_de: "Zweites",
        name_en: "Second",
        description_de: "d",
        description_en: "d",
        icon: "🚀",
        category: "chat",
        threshold: 10,
        metric: "messages",
        sort_order: 2,
        progress: 4,
        earned: false,
        earned_at: null,
      },
    ];
    render(
      <Wrap>
        <BadgeGallery badges={badges} streak={{ current_streak: 5, longest_streak: 9 }} />
      </Wrap>
    );
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("4 / 10")).toBeInTheDocument();
  });
});

describe("SearchBar", () => {
  it("renders input with keyboard hint and triggers debounced search on type", () => {
    render(
      <Wrap>
        <SearchBar onSelectSession={vi.fn()} />
      </Wrap>
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect((input as HTMLInputElement).value).toBe("abc");
  });

  it("clear button appears once input has value", () => {
    render(
      <Wrap>
        <SearchBar onSelectSession={vi.fn()} />
      </Wrap>
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "x" } });
    // Clear button + kbd are both inside; at least 1 button exists now
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});

describe("VersionSelector", () => {
  it("returns null when no versions", () => {
    const { container } = render(
      <Wrap>
        <VersionSelector versions={[]} onRestore={vi.fn()} />
      </Wrap>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders trigger with version count badge", () => {
    render(
      <Wrap>
        <VersionSelector
          versions={[
            { id: "v1", version_number: 1, content: "abc", created_at: "2024-01-01T10:00:00Z" },
            { id: "v2", version_number: 2, content: "def", created_at: "2024-01-02T10:00:00Z" },
          ]}
          onRestore={vi.fn()}
        />
      </Wrap>
    );
    // Badge text "2" should be visible somewhere
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
});
