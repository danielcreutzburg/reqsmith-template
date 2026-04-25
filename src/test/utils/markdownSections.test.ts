import { describe, it, expect } from "vitest";
import { markdownToSections, sectionsToMarkdown, slugify, buildSectionIndex } from "@/features/editor/utils/markdownSections";
import { applyOperations } from "@/features/editor/utils/patchEngine";
import { extractOperations } from "@/features/editor/utils/patchParser";

// ============================================================
// markdownToSections
// ============================================================
describe("markdownToSections", () => {
  it("returns empty array for empty string", () => {
    expect(markdownToSections("")).toEqual([]);
    expect(markdownToSections("   ")).toEqual([]);
  });

  it("parses a PRD with numbered sections", () => {
    const md = `# PRD: Mein Produkt

## 1. Executive Summary / Zusammenfassung

Das ist die Zusammenfassung.

## 2. Stakeholder und Zielgruppe

- Stakeholder A
- Stakeholder B

## 3. Funktionale Anforderungen

| ID | Beschreibung | Priorität |
|---|---|---|
| FR-001 | Validierung | Must |`;

    const sections = markdownToSections(md);

    expect(sections).toHaveLength(4); // preamble + 3 sections

    expect(sections[0].sectionKey).toBe("_preamble");
    expect(sections[0].content).toBe("# PRD: Mein Produkt");

    expect(sections[1].sectionKey).toBe("executive_summary_zusammenfassung");
    expect(sections[1].title).toBe("1. Executive Summary / Zusammenfassung");
    expect(sections[1].content).toContain("Zusammenfassung");

    expect(sections[2].sectionKey).toBe("stakeholder_und_zielgruppe");
    expect(sections[2].content).toContain("Stakeholder A");

    expect(sections[3].sectionKey).toBe("funktionale_anforderungen");
    expect(sections[3].content).toContain("FR-001");
  });

  it("preserves ### subsections within a ## section", () => {
    const md = `## Overview

### Sub-heading

Some content under sub-heading.

### Another sub

More content.`;

    const sections = markdownToSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain("### Sub-heading");
    expect(sections[0].content).toContain("### Another sub");
  });

  it("handles document without preamble", () => {
    const md = `## Section A

Content A

## Section B

Content B`;

    const sections = markdownToSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].sectionKey).toBe("section_a");
    expect(sections[1].sectionKey).toBe("section_b");
  });
});

// ============================================================
// sectionsToMarkdown
// ============================================================
describe("sectionsToMarkdown", () => {
  it("converts sections back to markdown", () => {
    const sections = [
      { id: "1", sectionKey: "_preamble", title: "", content: "# Title", orderIndex: 0, status: "draft" as const, metadata: {} },
      { id: "2", sectionKey: "overview", title: "1. Overview", content: "Some text.", orderIndex: 1, status: "draft" as const, metadata: {} },
      { id: "3", sectionKey: "details", title: "2. Details", content: "More text.", orderIndex: 2, status: "draft" as const, metadata: {} },
    ];

    const md = sectionsToMarkdown(sections);

    expect(md).toContain("# Title");
    expect(md).toContain("## 1. Overview");
    expect(md).toContain("Some text.");
    expect(md).toContain("## 2. Details");
    expect(md).toContain("More text.");
  });

  it("returns empty string for empty sections", () => {
    expect(sectionsToMarkdown([])).toBe("");
  });

  it("roundtrips: parse then render preserves structure", () => {
    const original = `# PRD

## 1. Summary

Content here.

## 2. Requirements

- Req A
- Req B`;

    const sections = markdownToSections(original);
    const rendered = sectionsToMarkdown(sections);

    // Key structural elements should survive roundtrip
    expect(rendered).toContain("# PRD");
    expect(rendered).toContain("## 1. Summary");
    expect(rendered).toContain("Content here.");
    expect(rendered).toContain("## 2. Requirements");
    expect(rendered).toContain("- Req A");
  });
});

// ============================================================
// slugify
// ============================================================
describe("slugify", () => {
  it("handles German umlauts", () => {
    expect(slugify("Qualitätsanforderungen")).toBe("qualitaetsanforderungen");
    expect(slugify("Überblick")).toBe("ueberblick");
  });

  it("handles slashes and special chars", () => {
    expect(slugify("Executive Summary / Zusammenfassung")).toBe("executive_summary_zusammenfassung");
  });

  it("strips leading/trailing underscores", () => {
    expect(slugify("  test  ")).toBe("test");
  });
});

// ============================================================
// buildSectionIndex
// ============================================================
describe("buildSectionIndex", () => {
  it("excludes preamble from index", () => {
    const sections = [
      { id: "1", sectionKey: "_preamble", title: "", content: "# T", orderIndex: 0, status: "draft" as const, metadata: {} },
      { id: "2", sectionKey: "overview", title: "Overview", content: "", orderIndex: 1, status: "draft" as const, metadata: {} },
    ];
    const index = buildSectionIndex(sections);
    expect(index).not.toContain("_preamble");
    expect(index).toContain('sectionKey: "overview"');
  });
});

// ============================================================
// extractOperations (patchParser)
// ============================================================
describe("extractOperations", () => {
  it("extracts operations from response with marker", () => {
    const response = `Ich habe die Anforderungen ergänzt.

---OPERATIONS---
{
  "operations": [
    {
      "type": "append_to_section",
      "sectionKey": "funktionale_anforderungen",
      "content": "| FR-002 | Logging | Should |"
    }
  ],
  "summary": "FR-002 ergänzt"
}`;

    const result = extractOperations(response);

    expect(result.chatContent).toBe("Ich habe die Anforderungen ergänzt.");
    expect(result.operations).toHaveLength(1);
    expect(result.operations![0].type).toBe("append_to_section");
    expect(result.operations![0].sectionKey).toBe("funktionale_anforderungen");
    expect(result.summary).toBe("FR-002 ergänzt");
  });

  it("returns null operations when no marker present", () => {
    const response = "Just a regular chat response.";
    const result = extractOperations(response);

    expect(result.chatContent).toBe("Just a regular chat response.");
    expect(result.operations).toBeNull();
  });

  it("handles JSON wrapped in code fences", () => {
    const response = `Comment here.

---OPERATIONS---
\`\`\`json
{
  "operations": [{ "type": "create_section", "sectionKey": "test", "title": "Test", "content": "Hello" }],
  "summary": "Test"
}
\`\`\``;

    const result = extractOperations(response);
    expect(result.operations).toHaveLength(1);
  });

  it("returns null operations for invalid JSON", () => {
    const response = `Chat text.

---OPERATIONS---
{ this is not valid json }`;

    const result = extractOperations(response);
    expect(result.chatContent).toBe("Chat text.");
    expect(result.operations).toBeNull();
  });
});

// ============================================================
// applyOperations (patchEngine)
// ============================================================
describe("applyOperations", () => {
  const baseSections = [
    { id: "s1", sectionKey: "overview", title: "1. Overview", content: "Old overview.", orderIndex: 0, status: "draft" as const, metadata: {} },
    { id: "s2", sectionKey: "requirements", title: "2. Requirements", content: "- Req A", orderIndex: 1, status: "draft" as const, metadata: {} },
  ];

  it("replace_section_content replaces content", () => {
    const result = applyOperations(baseSections, [
      { type: "replace_section_content", sectionKey: "overview", content: "New overview!" },
    ]);

    expect(result[0].content).toBe("New overview!");
    expect(result[1].content).toBe("- Req A"); // unchanged
  });

  it("append_to_section appends content", () => {
    const result = applyOperations(baseSections, [
      { type: "append_to_section", sectionKey: "requirements", content: "- Req B" },
    ]);

    expect(result[1].content).toBe("- Req A\n\n- Req B");
  });

  it("create_section adds new section", () => {
    const result = applyOperations(baseSections, [
      { type: "create_section", sectionKey: "risks", title: "3. Risks", content: "Risk 1" },
    ]);

    expect(result).toHaveLength(3);
    expect(result[2].sectionKey).toBe("risks");
    expect(result[2].title).toBe("3. Risks");
  });

  it("create_section skips if section exists", () => {
    const result = applyOperations(baseSections, [
      { type: "create_section", sectionKey: "overview", title: "Dup", content: "Dup content" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].content).toBe("Old overview."); // unchanged
  });

  it("mark_open_question adds to metadata", () => {
    const result = applyOperations(baseSections, [
      { type: "mark_open_question", sectionKey: "requirements", question: "Wie wird Req A validiert?" },
    ]);

    expect(result[1].metadata.openQuestions).toEqual(["Wie wird Req A validiert?"]);
  });

  it("does not mutate original sections", () => {
    const original = [...baseSections];
    applyOperations(baseSections, [
      { type: "replace_section_content", sectionKey: "overview", content: "Changed" },
    ]);

    expect(baseSections[0].content).toBe("Old overview."); // original unchanged
  });

  it("handles unknown sectionKey gracefully for replace", () => {
    const result = applyOperations(baseSections, [
      { type: "replace_section_content", sectionKey: "nonexistent", content: "New content", title: "New Section" },
    ]);

    // Should create the section as fallback
    expect(result).toHaveLength(3);
    expect(result[2].sectionKey).toBe("nonexistent");
  });

  it("applies multiple operations in sequence", () => {
    const result = applyOperations(baseSections, [
      { type: "replace_section_content", sectionKey: "overview", content: "Updated overview" },
      { type: "append_to_section", sectionKey: "requirements", content: "- Req C" },
      { type: "create_section", sectionKey: "timeline", title: "4. Timeline", content: "Q1 2025" },
    ]);

    expect(result[0].content).toBe("Updated overview");
    expect(result[1].content).toContain("- Req C");
    expect(result).toHaveLength(3);
    expect(result[2].sectionKey).toBe("timeline");
  });
});
