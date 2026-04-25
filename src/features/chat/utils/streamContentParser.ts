import { hasOperationsMarker } from "@/features/editor/utils/patchParser";

const OPERATIONS_MARKER = "---OPERATIONS---";
const APPEND_MARKER_REGEX = /(?:^|\n)\s*---DOCUMENT_APPEND---\s*(?:\n|$)/g;
const REPLACE_MARKER_REGEX = /(?:^|\n)\s*---DOCUMENT---\s*(?:\n|$)/g;

export interface StreamParseResult {
  chatContent: string;
  documentReplace?: string;
  phase: "idle" | "generating";
  /** If true, caller should not call onDocumentReplace during stream; apply after stream via extractOperations. */
  deferDocumentToPostStream?: boolean;
}

/**
 * Pure function: given the current assistant stream buffer and optional current document,
 * returns the chat content to show and any document replacement (legacy markers or headings).
 * Used during streaming to compute UI state without side effects.
 */
export function parseStreamContent(
  assistantContent: string,
  currentDocument?: string
): StreamParseResult {
  if (!assistantContent) {
    return { chatContent: "", phase: "idle" };
  }

  // Priority 1: Structured operations (patch system) – defer document update to post-stream
  if (hasOperationsMarker(assistantContent)) {
    const opsIdx = assistantContent.indexOf(OPERATIONS_MARKER);
    const chatContent = assistantContent.slice(0, opsIdx).trimEnd();
    return {
      chatContent,
      phase: "generating",
      deferDocumentToPostStream: true,
    };
  }

  // Priority 2: Legacy markers
  let lastAppendMatch: RegExpExecArray | null = null;
  let lastReplaceMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  APPEND_MARKER_REGEX.lastIndex = 0;
  while ((match = APPEND_MARKER_REGEX.exec(assistantContent)) !== null) {
    lastAppendMatch = match;
  }
  REPLACE_MARKER_REGEX.lastIndex = 0;
  while ((match = REPLACE_MARKER_REGEX.exec(assistantContent)) !== null) {
    lastReplaceMatch = match;
  }

  let chatContent = assistantContent;
  let documentReplace: string | undefined;

  if (lastAppendMatch !== null) {
    const markerEnd = lastAppendMatch.index + lastAppendMatch[0].length;
    const newContent = assistantContent.slice(markerEnd).trimStart();
    chatContent = assistantContent.slice(0, lastAppendMatch.index).trimEnd();
    documentReplace = currentDocument ? `${currentDocument}\n\n${newContent}` : newContent;
  } else if (lastReplaceMatch !== null) {
    const markerEnd = lastReplaceMatch.index + lastReplaceMatch[0].length;
    documentReplace = assistantContent.slice(markerEnd).trimStart();
    chatContent = assistantContent.slice(0, lastReplaceMatch.index).trimEnd();
  } else if (assistantContent.includes("## ") || assistantContent.includes("# ")) {
    documentReplace = assistantContent;
  }

  return {
    chatContent,
    documentReplace,
    phase: documentReplace !== undefined ? "generating" : "idle",
  };
}
