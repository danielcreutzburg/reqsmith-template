/**
 * Extracts structured operations from KI response.
 * Looks for ---OPERATIONS--- marker followed by JSON.
 * Falls back gracefully if no operations found.
 */
import type { Operation } from "../types/document";

export interface ParsedResponse {
  chatContent: string;
  operations: Operation[] | null;
  summary: string | null;
}

const OPERATIONS_MARKER = "---OPERATIONS---";

export function extractOperations(fullResponse: string): ParsedResponse {
  const idx = fullResponse.indexOf(OPERATIONS_MARKER);

  if (idx === -1) {
    return { chatContent: fullResponse, operations: null, summary: null };
  }

  const chatContent = fullResponse.slice(0, idx).trimEnd();
  let jsonStr = fullResponse.slice(idx + OPERATIONS_MARKER.length).trim();

  // Strip markdown code fences if KI wrapped JSON in ```json ... ```
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(jsonStr);

    if (parsed.operations && Array.isArray(parsed.operations)) {
      // Validate each operation has required fields
      const validOps: Operation[] = parsed.operations.filter(
        (op: any) => op && typeof op.type === "string" && typeof op.sectionKey === "string"
      );

      if (validOps.length > 0) {
        return {
          chatContent,
          operations: validOps,
          summary: parsed.summary || null,
        };
      }
    }
  } catch (e) {
    console.warn("[ReqSmith] Failed to parse operations JSON:", e);
  }

  // JSON parse failed or invalid structure → return chat content, no operations
  return { chatContent, operations: null, summary: null };
}

/**
 * Check if a streaming buffer contains the operations marker.
 * Used during streaming to determine if we should defer document updates.
 */
export function hasOperationsMarker(content: string): boolean {
  return content.includes(OPERATIONS_MARKER);
}
