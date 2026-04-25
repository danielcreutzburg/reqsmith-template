import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isLoading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
  AuthProvider: ({ children }: any) => children,
}));

import Landing from "@/pages/Landing";

function renderLanding() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <TooltipProvider>
          <Landing />
        </TooltipProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe("Landing Page", () => {
  it("renders the hero section with h1", () => {
    const { container } = renderLanding();
    expect(container.querySelector("h1")).toBeTruthy();
  });

  it("renders the ReqSmith brand", () => {
    const { container } = renderLanding();
    expect(container.textContent).toContain("ReqSmith");
  });

  it("renders feature cards (at least 6)", () => {
    const { container } = renderLanding();
    const h3s = container.querySelectorAll("h3");
    expect(h3s.length).toBeGreaterThanOrEqual(6);
  });

  it("renders stats section", () => {
    const { container } = renderLanding();
    expect(container.textContent).toContain("10x");
    expect(container.textContent).toContain("5+");
    expect(container.textContent).toContain("100%");
  });

  it("renders login/signup links", () => {
    const { container } = renderLanding();
    const authLinks = container.querySelectorAll('a[href="/auth"]');
    expect(authLinks.length).toBeGreaterThanOrEqual(2);
  });
});
