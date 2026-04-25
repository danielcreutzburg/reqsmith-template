import { useState, useCallback, useEffect } from "react";
import type { Message, Template, ChatPhase, ChatMode, AiPersona, Verbosity } from "@/types/chat";
import { useLanguage } from "@/i18n/LanguageContext";
import { hasOperationsMarker, extractOperations } from "@/features/editor/utils/patchParser";
import type { Operation } from "@/features/editor/types/document";
import { loadSessionMessages, persistMessage, extractPersistContent } from "./useChatPersistence";
import { sendChatRequest, ChatApiError } from "./useChatApi";
import { consumeStream } from "./useChatStream";
import { withRetry } from "@/lib/retry";

interface UseChatOptions {
  selectedTemplate: Template | null;
  sessionId: string | null;
  mode: ChatMode;
  glossaryContext?: string;
  onDocumentReplace?: (md: string) => void;
  onPatchOperations?: (ops: Operation[], summary?: string) => void;
  currentDocument?: string;
  onTitleUpdate?: (sessionId: string, title: string) => void;
  onUsageRefetch?: () => void;
  persona?: AiPersona;
  verbosity?: Verbosity;
}

export function useChat({
  selectedTemplate,
  sessionId,
  mode,
  glossaryContext,
  onDocumentReplace,
  onPatchOperations,
  currentDocument = "",
  onTitleUpdate,
  onUsageRefetch,
  persona,
  verbosity,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const { language, t } = useLanguage();

  // Load messages when session changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    loadSessionMessages(sessionId).then((msgs) => {
      if (msgs.length > 0) setMessages(msgs);
    });
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string, fileContext?: string) => {
      if (!content.trim() || isLoading || !sessionId) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setPhase("questioning");

      // Persist user message
      await persistMessage(userMessage.id, sessionId, "user", userMessage.content);

      // Auto-title on first message
      const currentMessages = [...messages, userMessage];
      if (currentMessages.filter((m) => m.role === "user").length === 1 && onTitleUpdate) {
        const title = content.trim().slice(0, 60) + (content.trim().length > 60 ? "..." : "");
        onTitleUpdate(sessionId, title);
      }

      const assistantId = crypto.randomUUID();

      try {
        // Send request with retry for server errors
        const response = await withRetry(
          () =>
            sendChatRequest({
              messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
              currentDocument,
              glossaryContext,
              fileContext,
              selectedTemplate,
              language,
              mode,
              persona: persona || "balanced",
              verbosity: verbosity || "normal",
            }),
          { maxRetries: 2, retryableStatuses: [500, 502, 503, 504] }
        );

        // Consume the SSE stream
        const fullContent = await consumeStream(
          response.body!,
          currentDocument,
          {
            onAssistantUpdate: (chatContent, newPhase, deferDoc, documentReplace) => {
              setPhase(newPhase);

              if (!deferDoc && documentReplace !== undefined) {
                onDocumentReplace?.(documentReplace);
              }

              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: chatContent } : m
                  );
                }
                return [
                  ...prev,
                  { id: assistantId, role: "assistant", content: chatContent, timestamp: new Date() },
                ];
              });
            },
            onDone: () => {},
            onError: () => {},
          }
        );

        // Post-stream: Apply structured operations if present
        if (hasOperationsMarker(fullContent)) {
          const { operations, summary } = extractOperations(fullContent);
          if (operations && operations.length > 0) {
            onPatchOperations?.(operations, summary || undefined);
          }
        }

        // Persist assistant message (chat portion only)
        const persistContent = extractPersistContent(fullContent);
        await persistMessage(assistantId, sessionId, "assistant", persistContent);
      } catch (error) {
        let errorMessage: string;

        if (error instanceof ChatApiError) {
          if (error.status === 401) {
            errorMessage = "Bitte melden Sie sich an, um fortzufahren.";
          } else if (error.status === 403) {
            onUsageRefetch?.();
            setIsLoading(false);
            setPhase("idle");
            return;
          } else if (error.status === 429) {
            errorMessage = t("error.tooManyRequests");
          } else if (error.status === 402) {
            errorMessage = t("error.creditsExhausted");
          } else {
            errorMessage = t("error.generic");
          }
        } else {
          errorMessage = error instanceof Error ? error.message : t("error.unexpected");
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `❌ ${errorMessage}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setPhase("idle");
        onUsageRefetch?.();
      }
    },
    [
      messages, isLoading, selectedTemplate, language, t, sessionId, mode,
      glossaryContext, currentDocument, onDocumentReplace, onPatchOperations,
      onTitleUpdate, onUsageRefetch, persona, verbosity,
    ]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setPhase("idle");
  }, []);

  return { messages, isLoading, phase, sendMessage, resetChat };
}
