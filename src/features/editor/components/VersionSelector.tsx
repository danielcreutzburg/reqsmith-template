import { useState, forwardRef } from "react";
import { History, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import { DiffViewer } from "./DiffViewer";
import type { DocumentVersion } from "@/features/sessions/hooks/useDocumentVersions";

interface VersionSelectorProps {
  versions: DocumentVersion[];
  onRestore: (content: string) => void;
  currentDocument?: string;
  disabled?: boolean;
}

const TriggerButton = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  (props, ref) => (
    <Button ref={ref} variant="ghost" size="icon" className="h-8 w-8 relative" {...props} />
  )
);
TriggerButton.displayName = "TriggerButton";

export function VersionSelector({ versions, onRestore, currentDocument = "", disabled }: VersionSelectorProps) {
  const { t } = useLanguage();
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffVersion, setDiffVersion] = useState<DocumentVersion | null>(null);

  if (versions.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCompare = (v: DocumentVersion) => {
    setDiffVersion(v);
    setDiffOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <TriggerButton disabled={disabled}>
                <History className="w-4 h-4" />
                {versions.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-muted text-muted-foreground rounded-full w-4 h-4 flex items-center justify-center">
                    {versions.length}
                  </span>
                )}
              </TriggerButton>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("doc.versions")} ({versions.length})</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="max-h-64 overflow-auto">
          {versions.map((v) => (
            <DropdownMenuItem key={v.id} className="flex items-center justify-between gap-2">
              <span className="text-xs cursor-pointer" onClick={() => onRestore(v.content)}>
                v{v.version_number} — {formatDate(v.created_at)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => { e.stopPropagation(); handleCompare(v); }}
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {diffVersion && (
        <DiffViewer
          open={diffOpen}
          onOpenChange={setDiffOpen}
          oldContent={diffVersion.content}
          newContent={currentDocument}
          versionLabel={`v${diffVersion.version_number}`}
        />
      )}
    </>
  );
}
