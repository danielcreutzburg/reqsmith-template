import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ExamplePrompts } from "@/features/chat/components/ExamplePrompts";

describe("ExamplePrompts", () => {
  it("renders example prompt buttons", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <LanguageProvider>
        <ExamplePrompts onSelect={onSelect} />
      </LanguageProvider>
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("calls onSelect when clicking a prompt", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <LanguageProvider>
        <ExamplePrompts onSelect={onSelect} />
      </LanguageProvider>
    );
    const button = container.querySelector("button");
    button?.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
