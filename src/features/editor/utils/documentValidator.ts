/**
 * Document Validator – Checks document completeness and consistency before export.
 *
 * Rules are template-aware: each template defines required sections.
 * Generic rules apply to all templates (min content length, open questions, glossary).
 */
import type { Section } from "../types/document";
import type { GlossaryTerm } from "@/features/glossary/hooks/useGlossary";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationResult {
  id: string;
  severity: ValidationSeverity;
  ruleId: string;
  sectionKey?: string;
  sectionTitle?: string;
  /** i18n key for the message */
  messageKey: string;
  /** Variables to interpolate into the translated message */
  messageVars?: Record<string, string | number>;
  /** Fallback message when no translation is available */
  message: string;
}

export interface ValidationSummary {
  results: ValidationResult[];
  errors: number;
  warnings: number;
  infos: number;
  isExportReady: boolean;
}

/**
 * Required sections per template.
 * `patterns` are matched against the sectionKey using boundary-aware matching
 * to avoid false positives (e.g. "funktionale" matching "nichtfunktionale").
 * Multiple patterns allow matching DE + EN headings.
 */
const TEMPLATE_REQUIRED_SECTIONS: Record<string, { patterns: string[]; labelDe: string; labelEn: string }[]> = {
  "modern-prd": [
    { patterns: ["executive_summary"], labelDe: "Executive Summary", labelEn: "Executive Summary" },
    { patterns: ["stakeholder"], labelDe: "Stakeholder & Zielgruppe", labelEn: "Stakeholders & Target Audience" },
    {
      patterns: ["funktionale_anforderungen", "functional_requirements"],
      labelDe: "Funktionale Anforderungen",
      labelEn: "Functional Requirements",
    },
    {
      patterns: ["nichtfunktionale", "non_functional", "qualitaetsanforderungen", "quality_requirements"],
      labelDe: "Nichtfunktionale Anforderungen",
      labelEn: "Non-Functional Requirements",
    },
    {
      patterns: ["risiken", "risks"],
      labelDe: "Risiken & Abhängigkeiten",
      labelEn: "Risks & Dependencies",
    },
  ],
  "feature-spec": [
    { patterns: ["overview", "ueberblick", "uebersicht"], labelDe: "Überblick", labelEn: "Overview" },
    { patterns: ["requirements", "anforderungen"], labelDe: "Anforderungen", labelEn: "Requirements" },
    { patterns: ["api"], labelDe: "API Design", labelEn: "API Design" },
    { patterns: ["test"], labelDe: "Test Cases", labelEn: "Test Cases" },
  ],
  "agile-user-story": [
    { patterns: ["user_story"], labelDe: "User Story", labelEn: "User Story" },
    { patterns: ["akzeptanzkriterien", "acceptance_criteria"], labelDe: "Akzeptanzkriterien", labelEn: "Acceptance Criteria" },
  ],
  "technical-spec": [
    { patterns: ["architektur", "architecture"], labelDe: "Architektur", labelEn: "Architecture" },
    { patterns: ["datenmodell", "data_model"], labelDe: "Datenmodell", labelEn: "Data Model" },
    { patterns: ["api"], labelDe: "API", labelEn: "API" },
  ],
};

/** Minimum content length (chars) for a section to not be flagged as "too short" */
const MIN_CONTENT_LENGTH = 30;

/** Minimum content length (chars) for a section to not be flagged as "empty" */
const EMPTY_THRESHOLD = 5;

/**
 * Boundary-aware section matcher.
 * Checks that a pattern matches at a word boundary within the sectionKey
 * to prevent "funktionale_anforderungen" from matching "nichtfunktionale_anforderungen".
 */
function sectionMatchesPattern(sectionKey: string, pattern: string): boolean {
  // Match at start of key or after an underscore (word boundary)
  const regex = new RegExp(`(?:^|_)${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
  return regex.test(sectionKey);
}

function findSectionByPatterns(sections: Section[], patterns: string[]): Section | undefined {
  return sections.find(
    (s) => s.sectionKey !== "_preamble" && patterns.some((p) => sectionMatchesPattern(s.sectionKey, p))
  );
}

export function validateDocument(
  sections: Section[],
  templateId: string | null,
  glossaryTerms: GlossaryTerm[] = [],
  language: "de" | "en" = "de"
): ValidationSummary {
  const results: ValidationResult[] = [];
  let nextId = 1;

  const addResult = (
    severity: ValidationSeverity,
    ruleId: string,
    messageKey: string,
    messageVars: Record<string, string | number> = {},
    fallback: string = "",
    sectionKey?: string,
    sectionTitle?: string
  ) => {
    results.push({
      id: `v${nextId++}`,
      severity,
      ruleId,
      sectionKey,
      sectionTitle,
      messageKey,
      messageVars,
      message: fallback,
    });
  };

  // Skip validation if no sections
  if (sections.length === 0 || (sections.length === 1 && sections[0].sectionKey === "_preamble")) {
    addResult("error", "empty_document", "validation.emptyDocument", {}, "Document is empty.");
    return { results, errors: 1, warnings: 0, infos: 0, isExportReady: false };
  }

  const nonPreambleSections = sections.filter((s) => s.sectionKey !== "_preamble");

  // === Rule 1: Required sections check (template-specific) ===
  if (templateId && TEMPLATE_REQUIRED_SECTIONS[templateId]) {
    const required = TEMPLATE_REQUIRED_SECTIONS[templateId];
    for (const req of required) {
      const label = language === "en" ? req.labelEn : req.labelDe;
      const found = findSectionByPatterns(sections, req.patterns);
      if (!found) {
        addResult(
          "error",
          "missing_required_section",
          "validation.missingSection",
          { section: label },
          `Required section "${label}" is missing.`,
          req.patterns[0],
          label
        );
      } else if (found.content.trim().length <= EMPTY_THRESHOLD) {
        addResult(
          "error",
          "empty_required_section",
          "validation.emptySection",
          { section: label },
          `Required section "${label}" is empty.`,
          found.sectionKey,
          found.title
        );
      }
    }
  }

  // === Rule 2: Short content warning (all sections) ===
  for (const section of nonPreambleSections) {
    const len = section.content.trim().length;
    if (len > EMPTY_THRESHOLD && len < MIN_CONTENT_LENGTH) {
      addResult(
        "warning",
        "short_content",
        "validation.shortContent",
        { section: section.title, chars: len },
        `Section "${section.title}" has very little content (${len} chars).`,
        section.sectionKey,
        section.title
      );
    }
  }

  // === Rule 3: Open questions ===
  for (const section of sections) {
    const openQuestions = (section.metadata?.openQuestions as string[]) || [];
    if (openQuestions.length > 0) {
      addResult(
        "warning",
        "open_questions",
        "validation.openQuestions",
        { section: section.title, count: openQuestions.length, first: openQuestions[0] },
        `Section "${section.title}" has ${openQuestions.length} open question(s).`,
        section.sectionKey,
        section.title
      );
    }
  }

  // === Rule 4: Content contains placeholder patterns ===
  const placeholderPatterns = [
    /\[TODO\]/gi,
    /\[TBD\]/gi,
    /\[OFFEN\]/gi,
    /\[PLATZHALTER\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[…\]/g,
    /\[\.\.\.\]/g,
  ];
  for (const section of nonPreambleSections) {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(section.content)) {
        addResult(
          "warning",
          "placeholder_found",
          "validation.placeholderFound",
          { section: section.title, pattern: pattern.source },
          `Section "${section.title}" contains placeholders.`,
          section.sectionKey,
          section.title
        );
        break;
      }
    }
  }

  // === Rule 5: Glossary consistency (simple check) ===
  if (glossaryTerms.length > 0) {
    const fullText = sections.map((s) => s.content).join(" ").toLowerCase();
    const unusedTerms = glossaryTerms.filter(
      (term) => !fullText.includes(term.term.toLowerCase())
    );
    if (unusedTerms.length > 0 && unusedTerms.length <= 5) {
      addResult(
        "info",
        "unused_glossary_terms",
        "validation.unusedGlossaryTerms",
        { terms: unusedTerms.map((t) => t.term).join(", ") },
        `Glossary terms not found in document: ${unusedTerms.map((t) => t.term).join(", ")}`,
      );
    } else if (unusedTerms.length > 5) {
      addResult(
        "info",
        "unused_glossary_terms",
        "validation.unusedGlossaryCount",
        { count: unusedTerms.length },
        `${unusedTerms.length} glossary terms are not used in the document.`,
      );
    }
  }

  // === Rule 6: Very few sections warning ===
  if (nonPreambleSections.length < 2) {
    addResult(
      "warning",
      "too_few_sections",
      "validation.tooFewSections",
      { count: nonPreambleSections.length },
      `The document has only ${nonPreambleSections.length} section(s). Check completeness.`,
    );
  }

  const errors = results.filter((r) => r.severity === "error").length;
  const warnings = results.filter((r) => r.severity === "warning").length;
  const infos = results.filter((r) => r.severity === "info").length;

  return {
    results,
    errors,
    warnings,
    infos,
    isExportReady: errors === 0,
  };
}
