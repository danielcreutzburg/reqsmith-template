/**
 * Stream handling logic extracted from useChat.
 * Manages reading SSE stream, parsing deltas, and updating assistant content.
 */
import { parseStreamContent } from "@/features/chat/utils/streamContentParser";
import type { ChatPhase } from "@/types/chat";

interface StreamDelta {
  choices?: Array<{ delta?: { content?: string } }>;
}

export interface StreamCallbacks {
  onAssistantUpdate: (chatContent: string, phase: ChatPhase, deferDoc: boolean, documentReplace?: string) => void;
  onDone: (fullContent: string) => void;
  onError: (error: Error) => void;
}

/**
 * Read an SSE response body and invoke callbacks for each delta.
 */
export async function consumeStream(
  body: ReadableStream<Uint8Array>,
  currentDocument: string,
  callbacks: StreamCallbacks
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let assistantContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed: StreamDelta = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            assistantContent += delta;
            const result = parseStreamContent(assistantContent, currentDocument);
            callbacks.onAssistantUpdate(
              result.chatContent,
              result.phase === "idle" ? "questioning" : "generating",
              !!result.deferDocumentToPostStream,
              result.documentReplace
            );
          }
        } catch {
          // Incomplete JSON – push back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone(assistantContent);
  return assistantContent;
}
