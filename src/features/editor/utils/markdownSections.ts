/**
 * Bidirectional converter: Markdown ↔ Section[]
 * Parses ## headings as section boundaries.
 * Preserves content before first ## as "_preamble" section.
 */
import type { Section } from "../types/document";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (m) => ({ "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" }[m] || m))
    .replace(/[/&,()]/g, "_")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function markdownToSections(markdown: string): Section[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentKey = "_preamble";
  let currentTitle = "";
  let contentLines: string[] = [];
  let orderIndex = 0;

  const flush = () => {
    const content = contentLines.join("\n").trim();
    if (content || currentKey !== "_preamble") {
      sections.push({
        id: crypto.randomUUID(),
        sectionKey: currentKey,
        title: currentTitle,
        content,
        orderIndex: orderIndex++,
        status: "draft",
        metadata: {},
      });
    }
  };

  for (const line of lines) {
    // Match ## headings (section boundaries), but NOT ### or deeper
    const h2Match = line.match(/^## (.+)/);
    if (h2Match && !line.startsWith("### ")) {
      flush();
      const rawTitle = h2Match[1].trim();
      currentTitle = rawTitle;
      // Strip leading number (e.g. "1. " or "10. ") for the key
      const keyBase = rawTitle.replace(/^\d+\.\s*/, "");
      currentKey = slugify(keyBase);
      contentLines = [];
    } else {
      contentLines.push(line);
    }
  }

  flush();
  return sections;
}

export function sectionsToMarkdown(sections: Section[]): string {
  if (!sections || sections.length === 0) return "";

  const sorted = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);
  const parts: string[] = [];

  for (const section of sorted) {
    if (section.sectionKey === "_preamble") {
      if (section.content) {
        parts.push(section.content);
      }
    } else {
      const header = `## ${section.title}`;
      if (section.content) {
        parts.push(`${header}\n\n${section.content}`);
      } else {
        parts.push(header);
      }
    }
  }

  return parts.join("\n\n");
}

/**
 * Build a section index string for KI context.
 * Only includes non-preamble sections with their keys and titles.
 */
export function buildSectionIndex(sections: Section[]): string {
  return sections
    .filter((s) => s.sectionKey !== "_preamble")
    .map((s) => `  - sectionKey: "${s.sectionKey}" | Titel: "${s.title}"`)
    .join("\n");
}

export { slugify };
