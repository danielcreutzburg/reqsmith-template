import { describe, it, expect } from "vitest";
import { extractOperations, hasOperationsMarker } from "@/features/editor/utils/patchParser";

describe("hasOperationsMarker", () => {
  it("returns true when marker is present", () => {
    expect(hasOperationsMarker("Some text ---OPERATIONS--- more")).toBe(true);
  });

  it("returns false when no marker", () => {
    expect(hasOperationsMarker("Just normal text")).toBe(false);
  });
});

describe("extractOperations", () => {
  it("filters out operations missing required fields", () => {
    const input = `Chat text---OPERATIONS---${JSON.stringify({
      operations: [
        { type: "replace_section_content", sectionKey: "intro", content: "valid" },
        { type: "replace_section_content" }, // missing sectionKey
        { sectionKey: "intro" }, // missing type
        null,
      ],
    })}`;
    const result = extractOperations(input);
    expect(result.operations).toHaveLength(1);
    expect(result.operations![0].sectionKey).toBe("intro");
  });

  it("returns null operations when JSON is invalid", () => {
    const result = extractOperations("Chat---OPERATIONS---not json{{{");
    expect(result.operations).toBeNull();
    expect(result.chatContent).toBe("Chat");
  });

  it("handles code-fenced JSON", () => {
    const json = JSON.stringify({
      operations: [{ type: "create_section", sectionKey: "new" }],
      summary: "Created section",
    });
    const input = `Hello---OPERATIONS---\`\`\`json\n${json}\n\`\`\``;
    const result = extractOperations(input);
    expect(result.operations).toHaveLength(1);
    expect(result.summary).toBe("Created section");
  });
});
