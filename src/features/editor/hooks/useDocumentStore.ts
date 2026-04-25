/**
 * useDocumentStore – Persistent structured document model.
 *
 * Holds Section[] as the single source of truth.
 * Exposes `markdown` (derived) for backward-compatible rendering/export.
 * Accepts patch operations from the AI orchestrator.
 * Transparently migrates legacy markdown strings into sections on load.
 */
import { useState, useCallback, useMemo } from "react";
import type { Section, Operation } from "../types/document";
import { markdownToSections, sectionsToMarkdown } from "../utils/markdownSections";
import { applyOperations } from "../utils/patchEngine";

export interface UseDocumentStoreReturn {
  /** Structured sections – the source of truth */
  sections: Section[];
  /** Derived markdown string for rendering / export / backward compat */
  markdown: string;
  /** Replace the full section array (e.g. on session load) */
  setSections: (sections: Section[]) => void;
  /** Load from a legacy markdown string (parses into sections) */
  loadFromMarkdown: (md: string) => void;
  /** Apply structured patch operations from AI */
  applyPatch: (operations: Operation[]) => string;
  /** Update a single section's content by key (manual editor edits) */
  updateSectionContent: (sectionKey: string, content: string) => void;
  /** Full reset */
  reset: () => void;
  /** Direct markdown update (backward compat for manual editing mode) */
  setFromMarkdown: (md: string) => void;
}

export function useDocumentStore(): UseDocumentStoreReturn {
  const [sections, setSectionsState] = useState<Section[]>([]);

  const markdown = useMemo(() => sectionsToMarkdown(sections), [sections]);

  const setSections = useCallback((newSections: Section[]) => {
    setSectionsState(newSections);
  }, []);

  const loadFromMarkdown = useCallback((md: string) => {
    if (!md || !md.trim()) {
      setSectionsState([]);
      return;
    }
    setSectionsState(markdownToSections(md));
  }, []);

  const setFromMarkdown = useCallback((md: string) => {
    if (!md || !md.trim()) {
      setSectionsState([]);
      return;
    }
    setSectionsState(markdownToSections(md));
  }, []);

  const applyPatch = useCallback((operations: Operation[]): string => {
    let updated: Section[] = [];
    setSectionsState((prev) => {
      updated = applyOperations(prev, operations);
      return updated;
    });
    return sectionsToMarkdown(updated);
  }, []);

  const updateSectionContent = useCallback((sectionKey: string, content: string) => {
    setSectionsState((prev) =>
      prev.map((s) =>
        s.sectionKey === sectionKey ? { ...s, content } : s
      )
    );
  }, []);

  const reset = useCallback(() => {
    setSectionsState([]);
  }, []);

  return {
    sections,
    markdown,
    setSections,
    loadFromMarkdown,
    applyPatch,
    updateSectionContent,
    reset,
    setFromMarkdown,
  };
}
