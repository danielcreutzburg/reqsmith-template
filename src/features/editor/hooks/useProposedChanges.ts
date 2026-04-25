/**
 * useProposedChanges – Manages pending AI change proposals for diff review.
 *
 * replace_section_content on existing sections → queued as ProposedChange
 * create_section / append_to_section → applied directly (no review needed)
 */
import { useState, useCallback } from "react";
import type { Section, Operation, ProposedChange } from "../types/document";
import { applyOperations } from "../utils/patchEngine";
import { sectionsToMarkdown } from "../utils/markdownSections";

interface ClassifiedOps {
  /** Operations safe to apply directly (create, append, title, metadata, questions) */
  directOps: Operation[];
  /** Operations that need review (replace on existing sections) */
  reviewOps: { op: Operation; originalContent: string; sectionTitle: string }[];
}

/**
 * Classify operations: replacements on existing sections go to review,
 * everything else applies directly.
 */
function classifyOperations(sections: Section[], operations: Operation[]): ClassifiedOps {
  const directOps: Operation[] = [];
  const reviewOps: ClassifiedOps["reviewOps"] = [];

  for (const op of operations) {
    if (op.type === "replace_section_content") {
      const existing = sections.find((s) => s.sectionKey === op.sectionKey);
      if (existing && existing.content.trim()) {
        // Existing section with content → needs review
        reviewOps.push({
          op,
          originalContent: existing.content,
          sectionTitle: existing.title,
        });
      } else {
        // Empty or non-existent section → direct apply is fine
        directOps.push(op);
      }
    } else {
      directOps.push(op);
    }
  }

  return { directOps, reviewOps };
}

export interface UseProposedChangesReturn {
  /** Pending proposals awaiting user review */
  proposedChanges: ProposedChange[];
  /** Number of pending proposals */
  pendingCount: number;
  /** Process incoming operations: direct-apply safe ones, queue replacements for review */
  processOperations: (
    sections: Section[],
    operations: Operation[],
    summary: string,
    applyDirect: (ops: Operation[]) => string
  ) => void;
  /** Accept a proposed change → apply to document */
  acceptChange: (
    changeId: string,
    sections: Section[],
    applyDirect: (ops: Operation[]) => string
  ) => string | null;
  /** Accept with edited content */
  acceptWithEdit: (
    changeId: string,
    editedContent: string,
    sections: Section[],
    applyDirect: (ops: Operation[]) => string
  ) => string | null;
  /** Reject a proposed change */
  rejectChange: (changeId: string) => void;
  /** Accept all pending changes at once */
  acceptAll: (
    sections: Section[],
    applyDirect: (ops: Operation[]) => string
  ) => string | null;
  /** Reject all pending changes */
  rejectAll: () => void;
  /** Clear all proposals */
  clear: () => void;
}

export function useProposedChanges(): UseProposedChangesReturn {
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);

  const processOperations = useCallback(
    (
      sections: Section[],
      operations: Operation[],
      summary: string,
      applyDirect: (ops: Operation[]) => string
    ) => {
      const { directOps, reviewOps } = classifyOperations(sections, operations);

      // Apply direct operations immediately
      if (directOps.length > 0) {
        applyDirect(directOps);
      }

      // Queue review operations as proposals
      if (reviewOps.length > 0) {
        const newProposals: ProposedChange[] = reviewOps.map(({ op, originalContent, sectionTitle }) => ({
          id: crypto.randomUUID(),
          operationType: op.type,
          sectionKey: op.sectionKey,
          proposedContent: op.content || "",
          originalContent,
          sectionTitle,
          summary,
          createdAt: new Date(),
        }));

        setProposedChanges((prev) => [...prev, ...newProposals]);
      }
    },
    []
  );

  const acceptChange = useCallback(
    (
      changeId: string,
      sections: Section[],
      applyDirect: (ops: Operation[]) => string
    ): string | null => {
      const change = proposedChanges.find((c) => c.id === changeId);
      if (!change) return null;

      const op: Operation = {
        type: "replace_section_content",
        sectionKey: change.sectionKey,
        content: change.proposedContent,
      };

      const newMd = applyDirect([op]);
      setProposedChanges((prev) => prev.filter((c) => c.id !== changeId));
      return newMd;
    },
    [proposedChanges]
  );

  const acceptWithEdit = useCallback(
    (
      changeId: string,
      editedContent: string,
      sections: Section[],
      applyDirect: (ops: Operation[]) => string
    ): string | null => {
      const change = proposedChanges.find((c) => c.id === changeId);
      if (!change) return null;

      const op: Operation = {
        type: "replace_section_content",
        sectionKey: change.sectionKey,
        content: editedContent,
      };

      const newMd = applyDirect([op]);
      setProposedChanges((prev) => prev.filter((c) => c.id !== changeId));
      return newMd;
    },
    [proposedChanges]
  );

  const rejectChange = useCallback((changeId: string) => {
    setProposedChanges((prev) => prev.filter((c) => c.id !== changeId));
  }, []);

  const acceptAll = useCallback(
    (
      sections: Section[],
      applyDirect: (ops: Operation[]) => string
    ): string | null => {
      if (proposedChanges.length === 0) return null;

      const ops: Operation[] = proposedChanges.map((c) => ({
        type: "replace_section_content" as const,
        sectionKey: c.sectionKey,
        content: c.proposedContent,
      }));

      const newMd = applyDirect(ops);
      setProposedChanges([]);
      return newMd;
    },
    [proposedChanges]
  );

  const rejectAll = useCallback(() => {
    setProposedChanges([]);
  }, []);

  const clear = useCallback(() => {
    setProposedChanges([]);
  }, []);

  return {
    proposedChanges,
    pendingCount: proposedChanges.length,
    processOperations,
    acceptChange,
    acceptWithEdit,
    rejectChange,
    acceptAll,
    rejectAll,
    clear,
  };
}
