import { useRef, useEffect, memo } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ExamplePrompts } from "./ExamplePrompts";
import { PersonaSettings } from "./PersonaSettings";
import { FollowUpSuggestions } from "./FollowUpSuggestions";
import { TemplateSelector } from "@/features/templates/components/TemplateSelector";
import type { Message, ChatPhase, Template, ChatMode, AiPersona, Verbosity } from "@/types/chat";
import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SavedPrompt } from "../hooks/useSavedPrompts";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  phase: ChatPhase;
  selectedTemplate: Template | null;
  onSendMessage: (message: string, fileContext?: string) => void;
  onSelectTemplate: (template: Template) => void;
  onReset: () => void;
  templateLocked?: boolean;
  chatMode: ChatMode;
  onChatModeChange: (mode: ChatMode) => void;
  frequentPrompts?: SavedPrompt[];
  favoritePrompts?: SavedPrompt[];
  onToggleFavorite?: (id: string) => void;
  onDeletePrompt?: (id: string) => void;
  persona: AiPersona;
  verbosity: Verbosity;
  onPersonaChange: (persona: AiPersona) => void;
  onVerbosityChange: (verbosity: Verbosity) => void;
}

export function ChatPanel({
  messages,
  isLoading,
  phase,
  selectedTemplate,
  onSendMessage,
  onSelectTemplate,
  onReset,
  templateLocked = false,
  chatMode,
  onChatModeChange,
  frequentPrompts,
  favoritePrompts,
  onToggleFavorite,
  onDeletePrompt,
  persona,
  verbosity,
  onPersonaChange,
  onVerbosityChange,
}: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const templateName = selectedTemplate
    ? t(`template.${selectedTemplate.id}.name` as any)
    : "";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground tracking-tight">{t("chat.title")}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <PersonaSettings
              persona={persona}
              verbosity={verbosity}
              onPersonaChange={onPersonaChange}
              onVerbosityChange={onVerbosityChange}
            />
          </div>
        </div>
        <TemplateSelector
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
          onReset={onReset}
          locked={templateLocked}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4" ref={scrollContainerRef}>
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/60 flex items-center justify-center animate-in zoom-in-50 duration-500 delay-100">
                <MessageSquare className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 animate-in fade-in-0 duration-500 delay-200">{t("chat.welcome.title")}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4 animate-in fade-in-0 duration-500 delay-300">
                {t("chat.welcome.description")}
              </p>
              {selectedTemplate && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400">
                  <ExamplePrompts onSelect={(prompt) => onSendMessage(prompt)} />
                </div>
              )}
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && <TypingIndicator phase={phase} />}
          {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
            <FollowUpSuggestions
              lastAssistantMessage={messages[messages.length - 1].content}
              onSelect={(prompt) => onSendMessage(prompt)}
              templateId={selectedTemplate?.id}
              disabled={false}
            />
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card/50 backdrop-blur-sm" data-tour="chat-input">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={onSendMessage}
            isLoading={isLoading}
            placeholder={
              selectedTemplate
                ? t("chat.input.templatePlaceholder", { template: templateName })
                : t("chat.input.noTemplate")
            }
            chatMode={chatMode}
            onChatModeChange={onChatModeChange}
            frequentPrompts={frequentPrompts}
            favoritePrompts={favoritePrompts}
            onToggleFavorite={onToggleFavorite}
            onDeletePrompt={onDeletePrompt}
          />
        </div>
      </div>
    </div>
  );
}
