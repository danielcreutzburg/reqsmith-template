/**
 * Structured document model for section-based document management.
 * Replaces the old "document = single markdown string" approach.
 */

export interface Section {
  id: string;
  sectionKey: string;       // e.g. "executive_summary", "funktionale_anforderungen"
  title: string;            // e.g. "1. Executive Summary / Zusammenfassung"
  content: string;          // Markdown content of this section
  orderIndex: number;
  status: "draft" | "complete" | "review" | "approved";
  metadata: Record<string, unknown>;
}

export type OperationType =
  | "create_section"
  | "replace_section_content"
  | "append_to_section"
  | "update_section_title"
  | "mark_open_question"
  | "update_metadata";

export interface Operation {
  type: OperationType;
  sectionKey: string;
  content?: string;
  title?: string;
  question?: string;
  metadata?: Record<string, unknown>;
}

export interface PatchResponse {
  operations: Operation[];
  summary: string;
}

export interface DocumentState {
  sections: Section[];
  lastUpdated: Date;
}

/**
 * A proposed change to an existing section.
 * Used for diff-review: the user can accept, reject, or edit before merging.
 */
export interface ProposedChange {
  id: string;
  operationType: OperationType;
  sectionKey: string;
  /** The new/proposed content */
  proposedContent: string;
  /** The original content at the time of proposal (for diff) */
  originalContent: string;
  /** Section title (for display) */
  sectionTitle: string;
  /** AI summary of what changed */
  summary: string;
  /** When the proposal was created */
  createdAt: Date;
}
