/**
 * Applies structured patch operations to a sections array.
 * Deterministic merge: each operation type has clear semantics.
 */
import type { Section, Operation } from "../types/document";

export function applyOperations(sections: Section[], operations: Operation[]): Section[] {
  // Shallow-copy sections so we don't mutate the input
  const result = sections.map((s) => ({ ...s, metadata: { ...s.metadata } }));

  for (const op of operations) {
    switch (op.type) {
      case "create_section": {
        // Only create if section doesn't already exist
        const exists = result.find((s) => s.sectionKey === op.sectionKey);
        if (!exists) {
          result.push({
            id: crypto.randomUUID(),
            sectionKey: op.sectionKey,
            title: op.title || op.sectionKey,
            content: op.content || "",
            orderIndex: result.length,
            status: "draft",
            metadata: {},
          });
        } else {
          console.warn(`[ReqSmith] Section "${op.sectionKey}" already exists, skipping create`);
        }
        break;
      }

      case "replace_section_content": {
        const section = result.find((s) => s.sectionKey === op.sectionKey);
        if (section && op.content !== undefined) {
          section.content = op.content;
          section.status = "draft";
        } else if (!section) {
          console.warn(`[ReqSmith] Section "${op.sectionKey}" not found for replace, creating it`);
          // Graceful: create the section if it doesn't exist
          result.push({
            id: crypto.randomUUID(),
            sectionKey: op.sectionKey,
            title: op.title || op.sectionKey,
            content: op.content || "",
            orderIndex: result.length,
            status: "draft",
            metadata: {},
          });
        }
        break;
      }

      case "append_to_section": {
        const section = result.find((s) => s.sectionKey === op.sectionKey);
        if (section && op.content) {
          section.content = section.content
            ? `${section.content}\n\n${op.content}`
            : op.content;
        } else if (!section) {
          console.warn(`[ReqSmith] Section "${op.sectionKey}" not found for append, creating it`);
          result.push({
            id: crypto.randomUUID(),
            sectionKey: op.sectionKey,
            title: op.title || op.sectionKey,
            content: op.content || "",
            orderIndex: result.length,
            status: "draft",
            metadata: {},
          });
        }
        break;
      }

      case "update_section_title": {
        const section = result.find((s) => s.sectionKey === op.sectionKey);
        if (section && op.title) {
          section.title = op.title;
        }
        break;
      }

      case "mark_open_question": {
        const section = result.find((s) => s.sectionKey === op.sectionKey);
        if (section && op.question) {
          const questions = (section.metadata.openQuestions as string[]) || [];
          questions.push(op.question);
          section.metadata.openQuestions = questions;
        }
        break;
      }

      case "update_metadata": {
        const section = result.find((s) => s.sectionKey === op.sectionKey);
        if (section && op.metadata) {
          section.metadata = { ...section.metadata, ...op.metadata };
        }
        break;
      }

      default:
        console.warn(`[ReqSmith] Unknown operation type: ${(op as any).type}`);
    }
  }

  return result;
}
