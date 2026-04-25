import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link, Quote, Code, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  editContent: string;
  onContentChange: (content: string) => void;
}

type ToolbarAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const actions: (ToolbarAction | "separator")[] = [
  { icon: Bold, label: "Fett", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Kursiv", prefix: "_", suffix: "_" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  "separator",
  { icon: Heading1, label: "H1", prefix: "# ", suffix: "", block: true },
  { icon: Heading2, label: "H2", prefix: "## ", suffix: "", block: true },
  { icon: Heading3, label: "H3", prefix: "### ", suffix: "", block: true },
  "separator",
  { icon: List, label: "Liste", prefix: "- ", suffix: "", block: true },
  { icon: ListOrdered, label: "Nummerierte Liste", prefix: "1. ", suffix: "", block: true },
  { icon: Quote, label: "Zitat", prefix: "> ", suffix: "", block: true },
  { icon: Minus, label: "Trennlinie", prefix: "\n---\n", suffix: "", block: true },
  "separator",
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)" },
];

export function MarkdownToolbar({ textareaRef, editContent, onContentChange }: MarkdownToolbarProps) {
  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editContent.slice(start, end);

    let replacement: string;
    let cursorOffset: number;

    if (action.block && !selected) {
      // For block elements, ensure we're on a new line
      const before = editContent.slice(0, start);
      const needsNewline = before.length > 0 && !before.endsWith("\n");
      const prefix = (needsNewline ? "\n" : "") + action.prefix;
      replacement = prefix + action.suffix;
      cursorOffset = start + prefix.length;
    } else if (selected) {
      replacement = action.prefix + selected + action.suffix;
      cursorOffset = start + replacement.length;
    } else {
      replacement = action.prefix + action.suffix;
      cursorOffset = start + action.prefix.length;
    }

    const newContent = editContent.slice(0, start) + replacement + editContent.slice(end);
    onContentChange(newContent);

    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-border bg-muted/30 flex-wrap">
        {actions.map((action, i) => {
          if (action === "separator") {
            return <Separator key={i} orientation="vertical" className="h-5 mx-1" />;
          }
          const Icon = action.icon;
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => applyAction(action)}
                >
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {action.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
