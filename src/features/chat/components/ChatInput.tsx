import { useState, KeyboardEvent } from "react";
import { Send, Zap, Map, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileAttachButton } from "./FileAttachButton";
import { ChatAttachmentButton, type ChatAttachment } from "./ChatAttachmentButton";
import { PromptHistory } from "./PromptHistory";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ChatMode } from "@/types/chat";
import type { SavedPrompt } from "../hooks/useSavedPrompts";
import { featureFlags } from "@/config/featureFlags";

interface ChatInputProps {
  onSend: (message: string, fileContext?: string, attachment?: ChatAttachment) => void;
  isLoading: boolean;
  placeholder?: string;
  chatMode?: ChatMode;
  onChatModeChange?: (mode: ChatMode) => void;
  isExhausted?: boolean;
  exhaustedMessage?: string;
  frequentPrompts?: SavedPrompt[];
  favoritePrompts?: SavedPrompt[];
  onToggleFavorite?: (id: string) => void;
  onDeletePrompt?: (id: string) => void;
}

export function ChatInput({ onSend, isLoading, placeholder, chatMode, onChatModeChange, isExhausted, exhaustedMessage, frequentPrompts = [], favoritePrompts = [], onToggleFavorite, onDeletePrompt }: ChatInputProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [fileContext, setFileContext] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading && !isExhausted) {
      onSend(input, fileContext || undefined, attachment || undefined);
      setInput("");
      setFileContext(null);
      setFileName(null);
      setAttachment(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileContent = (content: string, name: string) => {
    setFileContext(content);
    setFileName(name);
  };

  const handleClearFile = () => {
    setFileContext(null);
    setFileName(null);
  };

  return (
    <div className="space-y-2">
      {isExhausted && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {exhaustedMessage}
        </div>
      )}

      {/* Attachment preview */}
      {attachment && attachment.type === "image" && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
          <img src={attachment.url} alt={attachment.name} className="h-12 w-12 rounded object-cover" />
          <span className="text-xs text-muted-foreground truncate flex-1">{attachment.name}</span>
        </div>
      )}

      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Beschreiben Sie Ihre Feature-Idee..."}
          className="min-h-[80px] max-h-[200px] resize-none bg-background pr-14 pb-10"
          disabled={isLoading || isExhausted}
          aria-label="Chat-Nachricht eingeben"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <PromptHistory
            frequent={frequentPrompts}
            favorites={favoritePrompts}
            onSelect={(content) => setInput(content)}
            onToggleFavorite={(id) => onToggleFavorite?.(id)}
            onDelete={(id) => onDeletePrompt?.(id)}
          />
          <FileAttachButton
            onFileContent={handleFileContent}
            attachedFile={fileName}
            onClear={handleClearFile}
          />
          <ChatAttachmentButton
            onAttach={setAttachment}
            attachment={attachment}
            onClear={() => setAttachment(null)}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isExhausted}
            size="icon"
            className="h-8 w-8 rounded-lg"
            aria-label="Nachricht senden"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {chatMode && onChatModeChange && (
        <div className="flex items-center gap-1" role="group" aria-label="Chat-Modus">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChatModeChange("direct")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  chatMode === "direct"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-pressed={chatMode === "direct"}
              >
                <Zap className="w-3.5 h-3.5" />
                {t("chat.mode.direct")}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("chat.mode.directDesc")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChatModeChange("plan")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  chatMode === "plan"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-pressed={chatMode === "plan"}
              >
                <Map className="w-3.5 h-3.5" />
                {t("chat.mode.plan")}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("chat.mode.planDesc")}</TooltipContent>
          </Tooltip>
          {featureFlags.coachingMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChatModeChange("coaching")}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    chatMode === "coaching"
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-pressed={chatMode === "coaching"}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  {t("chat.mode.coaching" as any)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{t("chat.mode.coachingDesc" as any)}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
