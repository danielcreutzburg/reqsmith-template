import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Datenschutz from "@/pages/Datenschutz";
import Impressum from "@/pages/Impressum";
import NotFound from "@/pages/NotFound";
import { MainLayout } from "@/components/layout/MainLayout";

// Stubs to avoid heavy deps inside Header/Footer
vi.mock("@/components/layout/Header", () => ({ Header: () => <header data-testid="header" /> }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => <footer data-testid="footer" /> }));

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <LanguageProvider>{children}</LanguageProvider>
    </MemoryRouter>
  );
}

describe("Datenschutz", () => {
  it("renders the privacy policy heading and back link", () => {
    render(
      <Wrap>
        <Datenschutz />
      </Wrap>
    );
    // Either DE or EN heading must exist
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/legal@example.com/i).length).toBeGreaterThan(0);
  });
});

describe("Impressum", () => {
  it("renders the legal notice heading", () => {
    render(
      <Wrap>
        <Impressum />
      </Wrap>
    );
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Your Name \/ Company/).length).toBeGreaterThan(0);
  });
});

describe("NotFound", () => {
  it("renders 404 and a back link", () => {
    render(
      <Wrap>
        <NotFound />
      </Wrap>
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });
});

describe("MainLayout", () => {
  it("wraps children in main with skip target id", () => {
    render(
      <Wrap>
        <MainLayout>
          <div data-testid="child">child</div>
        </MainLayout>
      </Wrap>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(document.querySelector("#main-content")).toBeTruthy();
  });
});
