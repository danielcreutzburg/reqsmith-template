import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders privacy and imprint links", () => {
    const { container } = render(
      <BrowserRouter>
        <LanguageProvider>
          <Footer />
        </LanguageProvider>
      </BrowserRouter>
    );
    expect(container.querySelector('a[href="/datenschutz"]')).toBeTruthy();
    expect(container.querySelector('a[href="/impressum"]')).toBeTruthy();
  });

  it("shows GDPR badge text", () => {
    const { container } = render(
      <BrowserRouter>
        <LanguageProvider>
          <Footer />
        </LanguageProvider>
      </BrowserRouter>
    );
    expect(container.textContent).toMatch(/DSGVO|GDPR/i);
  });
});
