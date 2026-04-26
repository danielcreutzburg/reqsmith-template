/**
 * API layer extracted from useChat.
 * Builds the request payload and handles HTTP-level errors.
 */
import { supabase } from "@/integrations/supabase/client";
import { buildFunctionUrl } from "@/integrations/supabase/functionUrl";
import { markdownToSections, buildSectionIndex } from "@/features/editor/utils/markdownSections";
import type { Template, ChatMode, AiPersona, Verbosity } from "@/types/chat";

const CHAT_URL = buildFunctionUrl("chat");

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface SendChatRequestOptions {
  messages: ApiMessage[];
  currentDocument: string;
  glossaryContext?: string;
  fileContext?: string;
  selectedTemplate: Template | null;
  language: string;
  mode: ChatMode;
  persona: AiPersona;
  verbosity: Verbosity;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

/**
 * Build the full API message array with document context, glossary, and file attachment.
 */
export function buildApiMessages(
  messages: ApiMessage[],
  currentDocument: string,
  glossaryContext?: string,
  fileContext?: string
): ApiMessage[] {
  const apiMessages = [...messages];

  if (currentDocument) {
    const docSections = markdownToSections(currentDocument);
    const sectionIndex = buildSectionIndex(docSections);
    const contextBlock = sectionIndex
      ? `[DOKUMENT-SEKTIONEN]\n${sectionIndex}\n[/DOKUMENT-SEKTIONEN]\n\n[AKTUELLER DOKUMENTSTAND]\n${currentDocument}\n[/AKTUELLER DOKUMENTSTAND]`
      : `[AKTUELLER DOKUMENTSTAND]\n${currentDocument}\n[/AKTUELLER DOKUMENTSTAND]`;
    apiMessages.unshift({ role: "user", content: contextBlock });
  }

  if (glossaryContext) {
    apiMessages.unshift({
      role: "user",
      content: `[GLOSSAR – Verwende diese Begriffe konsistent]\n${glossaryContext}\n[/GLOSSAR]`,
    });
  }

  if (fileContext) {
    apiMessages.push({
      role: "user",
      content: `[ANGEHÄNGTE DATEI ALS KONTEXT]\n${fileContext}\n[/ANGEHÄNGTE DATEI]`,
    });
  }

  return apiMessages;
}

/**
 * Send the chat request and return the streaming Response.
 * Throws ChatApiError on HTTP errors.
 */
export async function sendChatRequest(options: SendChatRequestOptions): Promise<Response> {
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession?.access_token) {
    throw new ChatApiError("Bitte melden Sie sich an, um fortzufahren.", 401);
  }

  const apiMessages = buildApiMessages(
    options.messages,
    options.currentDocument,
    options.glossaryContext,
    options.fileContext
  );

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authSession.access_token}`,
    },
    body: JSON.stringify({
      messages: apiMessages,
      templateId: options.selectedTemplate?.id || null,
      language: options.language,
      planMode: options.mode === "plan",
      coachingMode: options.mode === "coaching",
      persona: options.persona || "balanced",
      verbosity: options.verbosity || "normal",
    }),
  });

  if (!response.ok) {
    throw new ChatApiError(
      `HTTP ${response.status}`,
      response.status
    );
  }

  if (!response.body) {
    throw new ChatApiError("No response body", 0);
  }

  return response;
}
