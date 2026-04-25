import { describe, it, expect, vi } from "vitest";
import { applyOperations } from "@/features/editor/utils/patchEngine";
import type { Section, Operation } from "@/features/editor/types/document";

function makeSection(key: string, content = "", title?: string): Section {
  return {
    id: crypto.randomUUID(),
    sectionKey: key,
    title: title || key,
    content,
    orderIndex: 0,
    status: "draft",
    metadata: {},
  };
}

describe("applyOperations", () => {
  it("update_section_title changes title", () => {
    const sections = [makeSection("intro", "content", "Old Title")];
    const result = applyOperations(sections, [
      { type: "update_section_title", sectionKey: "intro", title: "New Title" },
    ]);
    expect(result[0].title).toBe("New Title");
  });

  it("update_metadata merges metadata", () => {
    const sections = [makeSection("intro")];
    sections[0].metadata = { existing: true };
    const result = applyOperations(sections, [
      { type: "update_metadata", sectionKey: "intro", metadata: { priority: "high" } },
    ]);
    expect(result[0].metadata).toEqual({ existing: true, priority: "high" });
  });

  it("mark_open_question appends to metadata", () => {
    const sections = [makeSection("intro")];
    const result = applyOperations(sections, [
      { type: "mark_open_question", sectionKey: "intro", question: "What scope?" },
    ]);
    expect(result[0].metadata.openQuestions).toEqual(["What scope?"]);
  });

  it("unknown operation type logs warning but doesn't crash", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const sections = [makeSection("intro")];
    const result = applyOperations(sections, [
      { type: "unknown_op" as any, sectionKey: "intro" },
    ]);
    expect(result.length).toBe(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("append_to_section on empty content section", () => {
    const sections = [makeSection("intro", "")];
    const result = applyOperations(sections, [
      { type: "append_to_section", sectionKey: "intro", content: "New stuff" },
    ]);
    expect(result[0].content).toBe("New stuff");
  });

  it("append_to_section creates section if not found", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = applyOperations([], [
      { type: "append_to_section", sectionKey: "new_section", content: "Content" },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].sectionKey).toBe("new_section");
    warn.mockRestore();
  });

  it("does not mutate input sections", () => {
    const original = [makeSection("intro", "original")];
    const contentBefore = original[0].content;
    applyOperations(original, [
      { type: "replace_section_content", sectionKey: "intro", content: "changed" },
    ]);
    expect(original[0].content).toBe(contentBefore);
  });
});
