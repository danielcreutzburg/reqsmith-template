/**
 * DiffReviewPanel – Shows pending AI change proposals with inline diff.
 * User can accept, reject, or edit each proposed section change.
 */
import { useState, useMemo, memo } from "react";
import { Check, X, CheckCheck, XCircle, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ProposedChange } from "../types/document";

interface DiffReviewPanelProps {
  proposedChanges: ProposedChange[];
  onAccept: (changeId: string) => void;
  onAcceptWithEdit: (changeId: string, editedContent: string) => void;
  onReject: (changeId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

type DiffLine = { type: "same" | "added" | "removed"; text: string };

function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const n = oldLines.length;
  const m = newLines.length;

  // LCS DP (reused from existing DiffViewer)
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = n,
    j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ type: "same", text: oldLines[i - 1] });
      i--;
      j--;
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

const InlineDiff = memo(function InlineDiff({
  oldContent,
  newContent,
}: {
  oldContent: string;
  newContent: string;
}) {
  const diff = useMemo(() => computeLineDiff(oldContent, newContent), [oldContent, newContent]);

  return (
    <pre className="text-xs font-mono leading-5 overflow-x-auto">
      {diff.map((line, i) => (
        <div
          key={i}
          className={
            line.type === "added"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : line.type === "removed"
              ? "bg-destructive/10 text-destructive line-through"
              : "text-muted-foreground"
          }
        >
          <span className="inline-block w-5 text-right mr-2 select-none opacity-50">
            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
          </span>
          {line.text || " "}
        </div>
      ))}
    </pre>
  );
});

function ChangeCard({
  change,
  onAccept,
  onAcceptWithEdit,
  onReject,
  t,
}: {
  change: ProposedChange;
  onAccept: (id: string) => void;
  onAcceptWithEdit: (id: string, content: string) => void;
  onReject: (id: string) => void;
  t: (key: any, params?: any) => string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(change.proposedContent);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-xs shrink-0">
            {t("diffReview.replace")}
          </Badge>
          <span className="text-sm font-medium text-foreground truncate">
            {change.sectionTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Summary */}
          <p className="text-xs text-muted-foreground italic">{change.summary}</p>

          {/* Diff or Edit */}
          {editing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[150px] font-mono text-xs"
            />
          ) : (
            <div className="max-h-[300px] overflow-y-auto rounded border border-border p-2">
              <InlineDiff oldContent={change.originalContent} newContent={change.proposedContent} />
            </div>
          )}

          {/* Legend */}
          {!editing && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-destructive/20 border border-destructive/40" />
                {t("diff.removed")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-500/20 border border-green-500/40" />
                {t("diff.added")}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {editing ? (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    onAcceptWithEdit(change.id, editContent);
                    setEditing(false);
                  }}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {t("diffReview.saveAndAccept")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditContent(change.proposedContent);
                    setEditing(false);
                  }}
                >
                  {t("diffReview.cancelEdit")}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => onAccept(change.id)}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {t("diffReview.accept")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  {t("diffReview.edit")}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onReject(change.id)}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  {t("diffReview.reject")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DiffReviewPanel({
  proposedChanges,
  onAccept,
  onAcceptWithEdit,
  onReject,
  onAcceptAll,
  onRejectAll,
}: DiffReviewPanelProps) {
  const { t } = useLanguage();

  if (proposedChanges.length === 0) return null;

  return (
    <div className="border-b border-border bg-accent/30">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {proposedChanges.length}
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {t("diffReview.pendingChanges")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={onAcceptAll}>
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            {t("diffReview.acceptAll")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onRejectAll}>
            <XCircle className="w-3.5 h-3.5 mr-1" />
            {t("diffReview.rejectAll")}
          </Button>
        </div>
      </div>
      <ScrollArea className="max-h-[400px]">
        <div className="px-4 pb-3 space-y-2">
          {proposedChanges.map((change) => (
            <ChangeCard
              key={change.id}
              change={change}
              onAccept={onAccept}
              onAcceptWithEdit={onAcceptWithEdit}
              onReject={onReject}
              t={t}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
