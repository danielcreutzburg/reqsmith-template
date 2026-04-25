/**
 * EditorToolbar – Extracted toolbar for the DocumentEditor.
 * Pure presentation: renders all toolbar buttons and dropdowns.
 */
import { memo } from "react";
import {
  Copy, Check, FileText, Download, FileSpreadsheet, FileType,
  Eye, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentImportButton } from "./DocumentImportButton";
import { DocumentScorecard } from "@/features/scorecard/components/DocumentScorecard";
import { VersionSelector } from "./VersionSelector";
import { SummaryGenerator } from "./SummaryGenerator";
import { ValidationPanel } from "./ValidationPanel";
import { GlossaryPanel } from "@/features/glossary/components/GlossaryPanel";
import type { Section } from "../types/document";
import type { GlossaryTerm } from "@/features/glossary/hooks/useGlossary";
import type { Template } from "@/types/chat";
import type { DocumentVersion } from "@/features/sessions/hooks/useDocumentVersions";

export type ExportFormat = "word" | "pdf" | "excel";

export interface EditorToolbarProps {
  document: string;
  selectedTemplate: Template | null;
  sections: Section[];
  // State flags
  copied: boolean;
  isEditing: boolean;
  isExporting: boolean;
  // Handlers
  onCopy: () => void;
  onToggleEdit: () => void;
  onExport: (format: ExportFormat) => void;
  onDocumentImport?: (content: string) => void;
  // Versions
  versions: DocumentVersion[];
  onRestoreVersion?: (content: string) => void;
  // Glossary
  glossaryTerms: GlossaryTerm[];
  onGlossaryAdd?: (term: string, definition: string) => Promise<void>;
  onGlossaryUpdate?: (id: string, term: string, definition: string) => Promise<void>;
  onGlossaryDelete?: (id: string) => Promise<void>;
  // i18n
  t: (key: any, vars?: any) => string;
}

export const EditorToolbar = memo(function EditorToolbar({
  document,
  selectedTemplate,
  sections,
  copied,
  isEditing,
  isExporting,
  onCopy,
  onToggleEdit,
  onExport,
  onDocumentImport,
  versions,
  onRestoreVersion,
  glossaryTerms,
  onGlossaryAdd,
  onGlossaryUpdate,
  onGlossaryDelete,
  t,
}: EditorToolbarProps) {
  const hasDocument = !!document;

  return (
    <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
          <h2 className="font-semibold text-foreground tracking-tight truncate">{t("doc.title")}</h2>
          {selectedTemplate && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full hidden sm:inline-flex">
              {t(`template.${selectedTemplate.id}.name` as any)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onDocumentImport && (
            <DocumentImportButton
              onImport={(content) => onDocumentImport(content)}
              variant="toolbar"
              disabled={false}
            />
          )}
          {hasDocument && (
            <>
              <VersionSelector
                versions={versions}
                onRestore={(content) => onRestoreVersion?.(content)}
                currentDocument={document}
                disabled={!hasDocument}
              />
              <SummaryGenerator document={document} disabled={!hasDocument} />
              {onGlossaryAdd && (
                <GlossaryPanel
                  terms={glossaryTerms}
                  onAdd={onGlossaryAdd}
                  onUpdate={onGlossaryUpdate!}
                  onDelete={onGlossaryDelete!}
                />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isEditing ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={onToggleEdit}
                  >
                    {isEditing ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>{isEditing ? t("doc.preview") : t("doc.edit")}</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy} disabled={!hasDocument}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>{copied ? t("doc.copied") : t("doc.copy")}</TooltipContent>
          </Tooltip>
          <DocumentScorecard document={document} />
          <ValidationPanel
            sections={sections}
            templateId={selectedTemplate?.id || null}
            glossaryTerms={glossaryTerms}
            disabled={!hasDocument}
          />
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="icon" className="h-8 w-8" disabled={!hasDocument || isExporting} data-tour="export-button">
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t("doc.export")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("word")}>
                <FileType className="w-4 h-4 mr-2" />Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("pdf")}>
                <FileText className="w-4 h-4 mr-2" />PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});
