import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDocumentStore } from "@/features/editor/hooks/useDocumentStore";

describe("useDocumentStore", () => {
  it("starts with empty sections and markdown", () => {
    const { result } = renderHook(() => useDocumentStore());
    expect(result.current.sections).toEqual([]);
    expect(result.current.markdown).toBe("");
  });

  it("loadFromMarkdown parses markdown into sections", () => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => result.current.loadFromMarkdown("## Intro\n\nHello world"));
    expect(result.current.sections.length).toBeGreaterThan(0);
    expect(result.current.markdown).toContain("Hello world");
  });

  it("loadFromMarkdown with empty string resets", () => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => result.current.loadFromMarkdown("## Test\n\nContent"));
    expect(result.current.sections.length).toBeGreaterThan(0);
    act(() => result.current.loadFromMarkdown(""));
    expect(result.current.sections).toEqual([]);
  });

  it("setFromMarkdown works like loadFromMarkdown", () => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => result.current.setFromMarkdown("## Section\n\nData"));
    expect(result.current.sections.length).toBeGreaterThan(0);
    act(() => result.current.setFromMarkdown("  "));
    expect(result.current.sections).toEqual([]);
  });

  it("updateSectionContent updates a specific section", () => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => result.current.loadFromMarkdown("## Alpha\n\nOld content\n\n## Beta\n\nKeep this"));
    const key = result.current.sections.find((s) => s.title.includes("Alpha"))?.sectionKey;
    expect(key).toBeDefined();
    act(() => result.current.updateSectionContent(key!, "New content"));
    const updated = result.current.sections.find((s) => s.sectionKey === key);
    expect(updated?.content).toBe("New content");
    expect(result.current.sections.find((s) => s.title.includes("Beta"))?.content).toContain("Keep this");
  });

  it("reset clears everything", () => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => result.current.loadFromMarkdown("## Test\n\nData"));
    act(() => result.current.reset());
    expect(result.current.sections).toEqual([]);
    expect(result.current.markdown).toBe("");
  });

  it("applyPatch applies operations and updates sections", () => {
    const { result } = renderHook(() => useDocumentStore());
    act(() => result.current.loadFromMarkdown("## Intro\n\nOriginal"));
    const key = result.current.sections[0]?.sectionKey;
    act(() => {
      result.current.applyPatch([
        { type: "replace_section_content", sectionKey: key || "intro", content: "Replaced content" },
      ]);
    });
    expect(result.current.markdown).toContain("Replaced");
  });

  it("setSections replaces sections directly", () => {
    const { result } = renderHook(() => useDocumentStore());
    const sections = [
      { id: "1", sectionKey: "test", title: "Test", content: "Hello", orderIndex: 0, status: "draft" as const, metadata: {} },
    ];
    act(() => result.current.setSections(sections));
    expect(result.current.sections).toEqual(sections);
  });
});
