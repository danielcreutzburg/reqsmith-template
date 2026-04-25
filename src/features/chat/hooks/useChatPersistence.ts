/**
 * Message persistence logic extracted from useChat.
 * Handles saving/loading messages to/from the database.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types/chat";

/**
 * Load messages for a given session from the database.
 */
export async function loadSessionMessages(sessionId: string): Promise<Message[]> {
  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!msgs) return [];

  return msgs.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: new Date(m.created_at),
  }));
}

/**
 * Persist a single message (user or assistant) to the database.
 */
export async function persistMessage(
  id: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await supabase.from("chat_messages").insert({
    id,
    session_id: sessionId,
    role,
    content,
  });
}

/**
 * Extract the chat-only content (strip document/operations markers) for persistence.
 */
export function extractPersistContent(assistantContent: string): string {
  const firstMarkerIdx =
    [
      assistantContent.indexOf("---OPERATIONS---"),
      assistantContent.indexOf("---DOCUMENT_APPEND---"),
      assistantContent.indexOf("---DOCUMENT---"),
    ]
      .filter((i) => i !== -1)
      .sort((a, b) => a - b)[0] ?? -1;

  return firstMarkerIdx !== -1
    ? assistantContent.slice(0, firstMarkerIdx).trimEnd()
    : assistantContent;
}
