import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";

interface DiffViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldContent: string;
  newContent: string;
  versionLabel: string;
}

type DiffLine = { type: "same" | "added" | "removed"; text: string };

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const n = oldLines.length;
  const m = newLines.length;

  // LCS DP
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ type: "same", text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "added", text: newLines[j - 1] });
      j--;
    } else {
      result.push({ type: "removed", text: oldLines[i - 1] });
      i--;
    }
  }
  return result.reverse();
}

export function DiffViewer({ open, onOpenChange, oldContent, newContent, versionLabel }: DiffViewerProps) {
  const { t } = useLanguage();
  const diff = useMemo(() => computeDiff(oldContent, newContent), [oldContent, newContent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("diff.title")} — {versionLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/40" />
            {t("diff.removed")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/40" />
            {t("diff.added")}
          </span>
        </div>
        <ScrollArea className="max-h-[60vh]">
          <pre className="text-sm font-mono leading-6">
            {diff.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === "added"
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : line.type === "removed"
                    ? "bg-destructive/10 text-destructive"
                    : "text-muted-foreground"
                }
              >
                <span className="inline-block w-6 text-right mr-2 select-none opacity-50">
                  {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                </span>
                {line.text || " "}
              </div>
            ))}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
