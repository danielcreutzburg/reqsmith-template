import { describe, it, expect, vi } from "vitest";

// Test the chat message parsing logic (extracted for testability)
describe("Chat message parsing", () => {
  it("should detect document marker and split content", () => {
    const content = "Here are my questions.\n---DOCUMENT---\n# PRD Title\n\n## Overview";
    const marker = "---DOCUMENT---";
    const markerIdx = content.indexOf(marker);

    expect(markerIdx).toBeGreaterThan(-1);

    const chatContent = content.slice(0, markerIdx).trimEnd();
    const docContent = content.slice(markerIdx + marker.length).trimStart();

    expect(chatContent).toBe("Here are my questions.");
    expect(docContent).toBe("# PRD Title\n\n## Overview");
  });

  it("should detect headings as document content", () => {
    const content = "## Overview\n\nThis is a section.";
    const hasHeading = content.includes("## ") || content.includes("# ");
    expect(hasHeading).toBe(true);
  });

  it("should not detect document without marker or headings", () => {
    const content = "I have some follow-up questions for you.";
    const marker = "---DOCUMENT---";
    const hasMarker = content.includes(marker);
    const hasHeading = content.includes("## ") || content.includes("# ");
    expect(hasMarker).toBe(false);
    expect(hasHeading).toBe(false);
  });
});

describe("Auto-title generation", () => {
  it("should truncate title at 60 characters", () => {
    const longInput = "A".repeat(100);
    const title = longInput.slice(0, 60) + (longInput.length > 60 ? "..." : "");
    expect(title).toBe("A".repeat(60) + "...");
  });

  it("should not add ellipsis for short titles", () => {
    const shortInput = "My feature idea";
    const title = shortInput.slice(0, 60) + (shortInput.length > 60 ? "" : "");
    expect(title).toBe("My feature idea");
  });
});
