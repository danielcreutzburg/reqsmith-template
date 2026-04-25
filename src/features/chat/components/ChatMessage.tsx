import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { memo } from "react";
import type { Message } from "@/types/chat";
import type { ChatAttachment } from "./ChatAttachmentButton";

interface ChatMessageProps {
  message: Message;
  attachment?: ChatAttachment;
}

export const ChatMessage = memo(function ChatMessage({ message, attachment }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      role="article"
      aria-label={isUser ? "Ihre Nachricht" : "KI-Antwort"}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {attachment && attachment.type === "image" && (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-full rounded-lg mb-2 max-h-48 object-contain"
            loading="lazy"
          />
        )}
        {attachment && attachment.type !== "image" && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline mb-2 block opacity-80"
          >
            📎 {attachment.name}
          </a>
        )}

        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});
