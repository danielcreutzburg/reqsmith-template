import { Bot } from "lucide-react";
import type { ChatPhase } from "@/types/chat";
import { useLanguage } from "@/i18n/LanguageContext";

interface TypingIndicatorProps {
  phase: ChatPhase;
}

export function TypingIndicator({ phase }: TypingIndicatorProps) {
  const { t } = useLanguage();
  const phaseText = phase === "questioning" ? t("typing.questioning") : t("typing.generating");

  return (
    <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Bot className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-muted-foreground">{phaseText}</span>
        </div>
      </div>
    </div>
  );
}
