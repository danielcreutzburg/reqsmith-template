import { describe, it, expect } from "vitest";
import { validateDocument, type ValidationSummary } from "@/features/editor/utils/documentValidator";
import type { Section } from "@/features/editor/types/document";

function makeSection(overrides: Partial<Section> & { sectionKey: string }): Section {
  return {
    id: crypto.randomUUID(),
    title: overrides.title || overrides.sectionKey,
    content: overrides.content || "",
    orderIndex: overrides.orderIndex ?? 0,
    status: "draft",
    metadata: overrides.metadata || {},
    ...overrides,
  };
}

describe("validateDocument", () => {
  it("returns error for empty sections array", () => {
    const result = validateDocument([], null);
    expect(result.errors).toBe(1);
    expect(result.isExportReady).toBe(false);
    expect(result.results[0].ruleId).toBe("empty_document");
  });

  it("returns error for only preamble section", () => {
    const result = validateDocument([makeSection({ sectionKey: "_preamble", content: "hi" })], null);
    expect(result.errors).toBe(1);
    expect(result.results[0].ruleId).toBe("empty_document");
  });

  it("returns no errors for valid sections without template", () => {
    const sections = [
      makeSection({ sectionKey: "intro", content: "A".repeat(50) }),
      makeSection({ sectionKey: "details", content: "B".repeat(50) }),
    ];
    const result = validateDocument(sections, null);
    expect(result.errors).toBe(0);
    expect(result.isExportReady).toBe(true);
  });

  it("detects missing required sections for modern-prd template", () => {
    const sections = [
      makeSection({ sectionKey: "executive_summary", content: "A".repeat(50) }),
    ];
    const result = validateDocument(sections, "modern-prd");
    const missing = result.results.filter((r) => r.ruleId === "missing_required_section");
    expect(missing.length).toBeGreaterThanOrEqual(3);
  });

  it("detects empty required section for modern-prd", () => {
    const sections = [
      makeSection({ sectionKey: "executive_summary", content: "A".repeat(50) }),
      makeSection({ sectionKey: "stakeholder", content: "A".repeat(50) }),
      makeSection({ sectionKey: "funktionale_anforderungen", content: "" }),
      makeSection({ sectionKey: "nichtfunktionale_anforderungen", content: "A".repeat(50) }),
      makeSection({ sectionKey: "risiken", content: "A".repeat(50) }),
    ];
    const result = validateDocument(sections, "modern-prd");
    const empty = result.results.filter((r) => r.ruleId === "empty_required_section");
    expect(empty.length).toBe(1);
    expect(empty[0].sectionKey).toBe("funktionale_anforderungen");
  });

  it("warns about short content", () => {
    const sections = [
      makeSection({ sectionKey: "intro", content: "Short." }),
      makeSection({ sectionKey: "details", content: "B".repeat(50) }),
    ];
    const result = validateDocument(sections, null);
    const short = result.results.filter((r) => r.ruleId === "short_content");
    expect(short.length).toBe(1);
  });

  it("warns about placeholders like [TODO]", () => {
    const sections = [
      makeSection({ sectionKey: "intro", content: "This is [TODO] content that needs work" }),
      makeSection({ sectionKey: "other", content: "B".repeat(50) }),
    ];
    const result = validateDocument(sections, null);
    const placeholders = result.results.filter((r) => r.ruleId === "placeholder_found");
    expect(placeholders.length).toBe(1);
  });

  it("warns about [TBD] placeholder", () => {
    const sections = [
      makeSection({ sectionKey: "a", content: "Some [TBD] placeholder text here" }),
      makeSection({ sectionKey: "b", content: "B".repeat(50) }),
    ];
    const result = validateDocument(sections, null);
    expect(result.results.some((r) => r.ruleId === "placeholder_found")).toBe(true);
  });

  it("detects open questions in metadata", () => {
    const sections = [
      makeSection({
        sectionKey: "intro",
        content: "A".repeat(50),
        metadata: { openQuestions: ["What about X?"] },
      }),
      makeSection({ sectionKey: "other", content: "B".repeat(50) }),
    ];
    const result = validateDocument(sections, null);
    const oq = result.results.filter((r) => r.ruleId === "open_questions");
    expect(oq.length).toBe(1);
  });

  it("reports unused glossary terms (<=5)", () => {
    const sections = [
      makeSection({ sectionKey: "intro", content: "We use REST APIs here." }),
      makeSection({ sectionKey: "other", content: "B".repeat(50) }),
    ];
    const glossary = [
      { id: "1", term: "GraphQL", definition: "Query language", user_id: "u", created_at: "", updated_at: "" },
    ];
    const result = validateDocument(sections, null, glossary);
    const unused = result.results.filter((r) => r.ruleId === "unused_glossary_terms");
    expect(unused.length).toBe(1);
  });

  it("reports count for >5 unused glossary terms", () => {
    const sections = [
      makeSection({ sectionKey: "intro", content: "Nothing relevant." }),
      makeSection({ sectionKey: "other", content: "B".repeat(50) }),
    ];
    const glossary = Array.from({ length: 7 }, (_, i) => ({
      id: String(i), term: `Term${i}`, definition: "def", user_id: "u", created_at: "", updated_at: "",
    }));
    const result = validateDocument(sections, null, glossary);
    const unused = result.results.filter((r) => r.ruleId === "unused_glossary_terms");
    expect(unused.length).toBe(1);
    expect(unused[0].messageKey).toBe("validation.unusedGlossaryCount");
  });

  it("warns about too few sections", () => {
    const sections = [makeSection({ sectionKey: "only", content: "A".repeat(50) })];
    const result = validateDocument(sections, null);
    expect(result.results.some((r) => r.ruleId === "too_few_sections")).toBe(true);
  });

  it("isExportReady is true when only warnings exist", () => {
    const sections = [
      makeSection({ sectionKey: "a", content: "A".repeat(50) }),
      makeSection({ sectionKey: "b", content: "Short." }),
    ];
    const result = validateDocument(sections, null);
    expect(result.errors).toBe(0);
    expect(result.warnings).toBeGreaterThan(0);
    expect(result.isExportReady).toBe(true);
  });

  it("boundary matching: funktionale does not match nichtfunktionale", () => {
    const sections = [
      makeSection({ sectionKey: "executive_summary", content: "A".repeat(50) }),
      makeSection({ sectionKey: "stakeholder", content: "A".repeat(50) }),
      makeSection({ sectionKey: "nichtfunktionale_anforderungen", content: "A".repeat(50) }),
      makeSection({ sectionKey: "risiken", content: "A".repeat(50) }),
    ];
    const result = validateDocument(sections, "modern-prd");
    const missing = result.results.filter(
      (r) => r.ruleId === "missing_required_section" && r.sectionKey === "funktionale_anforderungen"
    );
    expect(missing.length).toBe(1);
  });
});
