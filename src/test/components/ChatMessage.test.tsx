import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChatMessage } from "@/features/chat/components/ChatMessage";

describe("ChatMessage", () => {
  it("renders user message", () => {
    const { container } = render(
      <ChatMessage
        message={{ id: "1", role: "user", content: "Hello world", timestamp: new Date() }}
      />
    );
    expect(container.textContent).toContain("Hello world");
    const article = container.querySelector('[role="article"]');
    expect(article?.getAttribute("aria-label")).toBe("Ihre Nachricht");
  });

  it("renders assistant message", () => {
    const { container } = render(
      <ChatMessage
        message={{ id: "2", role: "assistant", content: "**bold**", timestamp: new Date() }}
      />
    );
    expect(container.textContent).toContain("bold");
    const article = container.querySelector('[role="article"]');
    expect(article?.getAttribute("aria-label")).toBe("KI-Antwort");
  });

  it("renders image attachment", () => {
    const { container } = render(
      <ChatMessage
        message={{ id: "3", role: "user", content: "Check this", timestamp: new Date() }}
        attachment={{ name: "photo.png", url: "https://example.com/photo.png", type: "image" }}
      />
    );
    const img = container.querySelector('img[alt="photo.png"]');
    expect(img).toBeTruthy();
  });

  it("renders file attachment link", () => {
    const { container } = render(
      <ChatMessage
        message={{ id: "4", role: "user", content: "See file", timestamp: new Date() }}
        attachment={{ name: "doc.pdf", url: "https://example.com/doc.pdf", type: "pdf" }}
      />
    );
    expect(container.textContent).toContain("doc.pdf");
  });
});
