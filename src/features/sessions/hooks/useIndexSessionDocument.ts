/**
 * useIndexSessionDocument – Session-Document-Sync, Proposals und Versions für die Index-Seite.
 *
 * Bündelt: Document aus DB laden bei Session-Wechsel, Persistenz-Callbacks,
 * Patch- und Diff-Review-Handler, Document-Edit, Restore-Version, Konflikt-Handler.
 */
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentStore } from "@/features/editor/hooks/useDocumentStore";
import { useProposedChanges } from "@/features/editor/hooks/useProposedChanges";
import { useDocumentVersions } from "@/features/sessions/hooks/useDocumentVersions";
import type { Operation } from "@/features/editor/types/document";

export interface UseIndexSessionDocumentParams {
  activeSessionId: string | null;
  updateSessionDocument: (sessionId: string, document: string) => void;
}

export interface UseIndexSessionDocumentReturn {
  docStore: ReturnType<typeof useDocumentStore>;
  proposals: ReturnType<typeof useProposedChanges>;
  versions: ReturnType<typeof useDocumentVersions>["versions"];
  saveVersion: ReturnType<typeof useDocumentVersions>["saveVersion"];
  handleDocumentChanged: (md: string) => void;
  directApply: (ops: Operation[]) => string;
  handleDocumentReplace: (md: string) => void;
  handlePatchOperations: (ops: Operation[], summary?: string) => void;
  handleChatPatchOperations: (ops: Operation[], summary?: string) => void;
  handleAcceptChange: (changeId: string) => void;
  handleAcceptWithEdit: (changeId: string, editedContent: string) => void;
  handleRejectChange: (changeId: string) => void;
  handleAcceptAll: () => void;
  handleRejectAll: () => void;
  handleConflict: (serverContent: string) => void;
  handleDocumentEdit: (content: string) => void;
  handleRestoreVersion: (content: string) => void;
}

export function useIndexSessionDocument({
  activeSessionId,
  updateSessionDocument,
}: UseIndexSessionDocumentParams): UseIndexSessionDocumentReturn {
  const docStore = useDocumentStore();
  const proposals = useProposedChanges();
  const { versions, saveVersion } = useDocumentVersions(activeSessionId);

  useEffect(() => {
    if (!activeSessionId) {
      docStore.reset();
      proposals.clear();
      return;
    }
    const loadDoc = async () => {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("document")
        .eq("id", activeSessionId)
        .single();
      if (session?.document != null) {
        docStore.loadFromMarkdown(session.document);
      }
    };
    loadDoc();
  }, [activeSessionId]);

  const handleDocumentChanged = useCallback(
    (md: string) => {
      if (activeSessionId) updateSessionDocument(activeSessionId, md);
    },
    [activeSessionId, updateSessionDocument]
  );

  const directApply = useCallback(
    (ops: Operation[]): string => {
      const newMd = docStore.applyPatch(ops);
      handleDocumentChanged(newMd);
      return newMd;
    },
    [docStore, handleDocumentChanged]
  );

  const handleDocumentReplace = useCallback(
    (md: string) => {
      docStore.loadFromMarkdown(md);
      handleDocumentChanged(md);
    },
    [docStore, handleDocumentChanged]
  );

  const handlePatchOperations = useCallback(
    (ops: Operation[], summary?: string) => {
      proposals.processOperations(
        docStore.sections,
        ops,
        summary || "",
        directApply
      );
    },
    [docStore.sections, proposals, directApply]
  );

  const handleChatPatchOperations = useCallback(
    (ops: Operation[], summary?: string) => {
      handlePatchOperations(ops, summary || "KI-Änderungsvorschlag");
    },
    [handlePatchOperations]
  );

  const handleAcceptChange = useCallback(
    (changeId: string) => {
      const newMd = proposals.acceptChange(changeId, docStore.sections, directApply);
      if (newMd) saveVersion(newMd);
    },
    [proposals, docStore.sections, directApply, saveVersion]
  );

  const handleAcceptWithEdit = useCallback(
    (changeId: string, editedContent: string) => {
      const newMd = proposals.acceptWithEdit(changeId, editedContent, docStore.sections, directApply);
      if (newMd) saveVersion(newMd);
    },
    [proposals, docStore.sections, directApply, saveVersion]
  );

  const handleRejectChange = useCallback(
    (changeId: string) => {
      proposals.rejectChange(changeId);
    },
    [proposals]
  );

  const handleAcceptAll = useCallback(() => {
    const newMd = proposals.acceptAll(docStore.sections, directApply);
    if (newMd) saveVersion(newMd);
  }, [proposals, docStore.sections, directApply, saveVersion]);

  const handleRejectAll = useCallback(() => {
    proposals.rejectAll();
  }, [proposals]);

  const handleConflict = useCallback(
    (serverContent: string) => {
      docStore.loadFromMarkdown(serverContent);
    },
    [docStore]
  );

  const handleDocumentEdit = useCallback(
    (content: string) => {
      docStore.setFromMarkdown(content);
      if (activeSessionId) updateSessionDocument(activeSessionId, content);
      saveVersion(content);
    },
    [activeSessionId, updateSessionDocument, docStore, saveVersion]
  );

  const handleRestoreVersion = useCallback(
    (content: string) => {
      docStore.loadFromMarkdown(content);
      if (activeSessionId) updateSessionDocument(activeSessionId, content);
    },
    [activeSessionId, updateSessionDocument, docStore]
  );

  return {
    docStore,
    proposals,
    versions,
    saveVersion,
    handleDocumentChanged,
    directApply,
    handleDocumentReplace,
    handlePatchOperations,
    handleChatPatchOperations,
    handleAcceptChange,
    handleAcceptWithEdit,
    handleRejectChange,
    handleAcceptAll,
    handleRejectAll,
    handleConflict,
    handleDocumentEdit,
    handleRestoreVersion,
  };
}
