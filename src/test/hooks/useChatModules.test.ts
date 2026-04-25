import { describe, it, expect } from "vitest";
import { buildApiMessages } from "@/features/chat/hooks/useChatApi";
import { extractPersistContent } from "@/features/chat/hooks/useChatPersistence";

describe("buildApiMessages", () => {
  it("should return base messages when no context is provided", () => {
    const msgs = [{ role: "user" as const, content: "Hello" }];
    const result = buildApiMessages(msgs, "");
    expect(result).toEqual(msgs);
  });

  it("should prepend document context when document is provided", () => {
    const msgs = [{ role: "user" as const, content: "Hello" }];
    const result = buildApiMessages(msgs, "# My Doc\n\n## Intro");
    expect(result.length).toBe(2);
    expect(result[0].content).toContain("[AKTUELLER DOKUMENTSTAND]");
    expect(result[0].content).toContain("# My Doc");
  });

  it("should prepend glossary before document context", () => {
    const msgs = [{ role: "user" as const, content: "Hello" }];
    const result = buildApiMessages(msgs, "# Doc", "API = Application Programming Interface");
    expect(result.length).toBe(3);
    expect(result[0].content).toContain("[GLOSSAR");
    expect(result[1].content).toContain("[AKTUELLER DOKUMENTSTAND]");
  });

  it("should append file context at the end", () => {
    const msgs = [{ role: "user" as const, content: "Hello" }];
    const result = buildApiMessages(msgs, "", undefined, "file content here");
    expect(result.length).toBe(2);
    expect(result[result.length - 1].content).toContain("[ANGEHÄNGTE DATEI");
  });
});

describe("extractPersistContent", () => {
  it("should return full content when no markers present", () => {
    const content = "Here is my answer.";
    expect(extractPersistContent(content)).toBe("Here is my answer.");
  });

  it("should strip content after ---OPERATIONS--- marker", () => {
    const content = "Chat reply here\n---OPERATIONS---\n{\"operations\": []}";
    expect(extractPersistContent(content)).toBe("Chat reply here");
  });

  it("should strip content after ---DOCUMENT--- marker", () => {
    const content = "Some chat\n---DOCUMENT---\n# Full Doc";
    expect(extractPersistContent(content)).toBe("Some chat");
  });

  it("should use earliest marker when multiple are present", () => {
    const content = "Chat\n---DOCUMENT---\n# Doc\n---OPERATIONS---\n{}";
    expect(extractPersistContent(content)).toBe("Chat");
  });
});
