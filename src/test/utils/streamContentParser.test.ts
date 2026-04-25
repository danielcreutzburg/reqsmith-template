import { describe, it, expect } from "vitest";
import { parseStreamContent } from "@/features/chat/utils/streamContentParser";

describe("parseStreamContent", () => {
  it("returns idle and empty chatContent for empty input", () => {
    expect(parseStreamContent("")).toEqual({ chatContent: "", phase: "idle" });
  });

  it("returns OPERATIONS marker: chatContent only, deferDocumentToPostStream true", () => {
    const content = "Here is the summary.\n---OPERATIONS---\n{ \"operations\": [] }";
    const result = parseStreamContent(content);
    expect(result.chatContent).toBe("Here is the summary.");
    expect(result.deferDocumentToPostStream).toBe(true);
    expect(result.phase).toBe("generating");
    expect(result.documentReplace).toBeUndefined();
  });

  it("returns DOCUMENT_APPEND: documentReplace is currentDoc + new content", () => {
    const content = "Chat part\n---DOCUMENT_APPEND---\n\n## New Section\n\nText.";
    const result = parseStreamContent(content, "# Existing\n\nOld.");
    expect(result.chatContent).toBe("Chat part");
    expect(result.documentReplace).toBe("# Existing\n\nOld.\n\n## New Section\n\nText.");
    expect(result.phase).toBe("generating");
  });

  it("returns DOCUMENT_APPEND without currentDocument", () => {
    const content = "Intro\n---DOCUMENT_APPEND---\n\n# Title";
    const result = parseStreamContent(content);
    expect(result.chatContent).toBe("Intro");
    expect(result.documentReplace).toBe("# Title");
  });

  it("returns DOCUMENT replace marker: documentReplace is content after marker", () => {
    const content = "Some chat\n---DOCUMENT---\n\n# Full Doc\n\nBody.";
    const result = parseStreamContent(content);
    expect(result.chatContent).toBe("Some chat");
    expect(result.documentReplace).toBe("# Full Doc\n\nBody.");
    expect(result.phase).toBe("generating");
  });

  it("headings fallback: documentReplace is full content when ## or # present", () => {
    const content = "## Overview\n\nThis is the section.";
    const result = parseStreamContent(content);
    expect(result.chatContent).toBe("## Overview\n\nThis is the section.");
    expect(result.documentReplace).toBe("## Overview\n\nThis is the section.");
    expect(result.phase).toBe("generating");
  });

  it("plain text without markers: no documentReplace, phase idle", () => {
    const content = "Just a reply without structure.";
    const result = parseStreamContent(content);
    expect(result.chatContent).toBe(content);
    expect(result.documentReplace).toBeUndefined();
    expect(result.phase).toBe("idle");
  });
});
