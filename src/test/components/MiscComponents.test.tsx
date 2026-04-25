import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { SkipLink } from "@/components/SkipLink";
import { NavLink } from "@/components/NavLink";
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";
import { WordCounter } from "@/features/editor/components/WordCounter";

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <LanguageProvider>{children}</LanguageProvider>
    </MemoryRouter>
  );
}

describe("SkipLink", () => {
  it("renders an anchor pointing to #main-content", () => {
    render(
      <Wrap>
        <SkipLink />
      </Wrap>
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("#main-content");
  });
});

describe("NavLink", () => {
  it("renders react-router NavLink with provided className parts", () => {
    render(
      <Wrap>
        <NavLink to="/" className="base" activeClassName="active">
          Home
        </NavLink>
      </Wrap>
    );
    const link = screen.getByRole("link", { name: "Home" });
    // On "/" route, the link to "/" should be active
    expect(link.className).toContain("base");
  });
});

describe("TypingIndicator", () => {
  it("renders generating phase text", () => {
    render(
      <Wrap>
        <TypingIndicator phase="generating" />
      </Wrap>
    );
    // Generating renders some non-empty text from i18n
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders questioning phase text", () => {
    render(
      <Wrap>
        <TypingIndicator phase="questioning" />
      </Wrap>
    );
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("WordCounter", () => {
  it("returns null for empty document", () => {
    const { container } = render(
      <Wrap>
        <WordCounter document="" />
      </Wrap>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders stats line for non-empty document", () => {
    render(
      <Wrap>
        <WordCounter document={"# Title\n\nSome words here in the body of the document."} />
      </Wrap>
    );
    // Three spans of stats are rendered
    const spans = document.querySelectorAll("span");
    expect(spans.length).toBeGreaterThanOrEqual(3);
  });
});
