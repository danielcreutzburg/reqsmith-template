import { useState, useCallback, useRef, useEffect, memo, useMemo } from "react";
import type { ProposedChange, Section } from "../types/document";
import { DiffReviewPanel } from "./DiffReviewPanel";
import { EditorToolbar, type ExportFormat } from "./EditorToolbar";
import { markdownToSections } from "../utils/markdownSections";
import { validateDocument } from "../utils/documentValidator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, PenLine } from "lucide-react";
import { DocumentImportButton } from "./DocumentImportButton";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { WordCounter } from "./WordCounter";
import type { GlossaryTerm } from "@/features/glossary/hooks/useGlossary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { exportToWord, exportToPdf, exportToExcel } from "../utils/export";
import type { Template } from "@/types/chat";
import { useLanguage } from "@/i18n/LanguageContext";
import type { DocumentVersion } from "@/features/sessions/hooks/useDocumentVersions";

interface DocumentEditorProps {
  document: string;
  selectedTemplate: Template | null;
  sections?: Section[];
  onReset: () => void;
  onDocumentEdit?: (content: string) => void;
  versions?: DocumentVersion[];
  onRestoreVersion?: (content: string) => void;
  onSectionEdit?: (sectionTitle: string) => void;
  onDocumentImport?: (content: string) => void;
  
  glossaryTerms?: GlossaryTerm[];
  onGlossaryAdd?: (term: string, definition: string) => Promise<void>;
  onGlossaryUpdate?: (id: string, term: string, definition: string) => Promise<void>;
  onGlossaryDelete?: (id: string) => Promise<void>;
  sessionId?: string | null;
  // Diff review props
  proposedChanges?: ProposedChange[];
  onAcceptChange?: (changeId: string) => void;
  onAcceptWithEdit?: (changeId: string, editedContent: string) => void;
  onRejectChange?: (changeId: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

/* Memoized markdown renderer to prevent unnecessary re-renders */
const MarkdownContent = memo(function MarkdownContent({
  content,
  onSectionEdit,
  t,
}: {
  content: string;
  onSectionEdit?: (title: string) => void;
  t: (key: any) => string;
}) {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none animate-in fade-in-0 duration-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <div className="group flex items-center gap-2 mt-8 mb-3">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">{children}</h2>
              {onSectionEdit && (
                <button
                  onClick={() => onSectionEdit(String(children))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  title={t("doc.section.edit")}
                >
                  <PenLine className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ),
          h3: ({ children }) => (
            <div className="group flex items-center gap-2 mt-6 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{children}</h3>
              {onSectionEdit && (
                <button
                  onClick={() => onSectionEdit(String(children))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  title={t("doc.section.edit")}
                >
                  <PenLine className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground mb-4 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground mb-4 ml-1">{children}</ol>
          ),
          li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-foreground">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="p-4 rounded-lg bg-muted overflow-x-auto mb-4 border border-border">{children}</pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50 border-b border-border">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-xs text-muted-foreground">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground">{children}</blockquote>
          ),
          hr: () => <hr className="border-border my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
});

export function DocumentEditor({ document, selectedTemplate, sections: sectionsProp, onReset, onDocumentEdit, versions = [], onRestoreVersion, onSectionEdit, onDocumentImport, glossaryTerms = [], onGlossaryAdd, onGlossaryUpdate, onGlossaryDelete, sessionId, proposedChanges = [], onAcceptChange, onAcceptWithEdit, onRejectChange, onAcceptAll, onRejectAll }: DocumentEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(document);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const sections = useMemo(
    () => sectionsProp && sectionsProp.length > 0 ? sectionsProp : markdownToSections(document),
    [sectionsProp, document]
  );

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      onDocumentEdit?.(editContent);
      setIsEditing(false);
    } else {
      setEditContent(document);
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isEditing, editContent, document, onDocumentEdit]);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(document);
    }
  }, [document, isEditing]);

  const getFilename = useCallback(() => {
    const templateName = selectedTemplate
      ? t(`template.${selectedTemplate.id}.name` as any)
      : t("doc.title");
    const date = new Date().toISOString().split("T")[0];
    return `${templateName}_${date}`;
  }, [selectedTemplate, t]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!document) return;

    const validation = validateDocument(sections, selectedTemplate?.id || null, glossaryTerms);
    if (validation.errors > 0) {
      toast({
        title: t("validation.exportBlocked" as any),
        description: `${validation.errors} ${t("validation.errors" as any)}, ${validation.warnings} ${t("validation.warnings" as any)}`,
        variant: "destructive",
      });
    }

    setIsExporting(true);
    try {
      const filename = getFilename();
      switch (format) {
        case "word": await exportToWord(document, filename); break;
        case "pdf": exportToPdf(document, filename); break;
        case "excel": await exportToExcel(document, filename); break;
      }
      toast({
        title: t("doc.export.success"),
        description: t("doc.export.successDesc", { format: format.toUpperCase() }),
      });
    } catch {
      toast({
        title: t("doc.export.error"),
        description: t("doc.export.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [document, sections, selectedTemplate, glossaryTerms, getFilename, toast, t]);

  const handleCopy = useCallback(async () => {
    if (!document) return;
    try {
      await navigator.clipboard.writeText(document);
      setCopied(true);
      toast({ title: t("doc.copy.success"), description: t("doc.copy.successDesc") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("doc.copy.error"), description: t("doc.copy.errorDesc"), variant: "destructive" });
    }
  }, [document, toast, t]);

  return (
    <div className="flex flex-col h-full bg-background relative" data-tour="document-panel" role="region" aria-label="Dokument-Editor">
      <EditorToolbar
        document={document}
        selectedTemplate={selectedTemplate}
        sections={sections}
        copied={copied}
        isEditing={isEditing}
        isExporting={isExporting}
        onCopy={handleCopy}
        onToggleEdit={handleToggleEdit}
        onExport={handleExport}
        onDocumentImport={onDocumentImport}
        versions={versions}
        onRestoreVersion={onRestoreVersion}
        glossaryTerms={glossaryTerms}
        onGlossaryAdd={onGlossaryAdd}
        onGlossaryUpdate={onGlossaryUpdate}
        onGlossaryDelete={onGlossaryDelete}
        t={t}
      />

      {isEditing && (
        <MarkdownToolbar
          textareaRef={textareaRef}
          editContent={editContent}
          onContentChange={setEditContent}
        />
      )}

      {/* Diff Review Panel – shown when AI has proposed changes */}
      {proposedChanges.length > 0 && onAcceptChange && onAcceptWithEdit && onRejectChange && onAcceptAll && onRejectAll && (
        <DiffReviewPanel
          proposedChanges={proposedChanges}
          onAccept={onAcceptChange}
          onAcceptWithEdit={onAcceptWithEdit}
          onReject={onRejectChange}
          onAcceptAll={onAcceptAll}
          onRejectAll={onRejectAll}
        />
      )}

      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          {document ? (
            isEditing ? (
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[calc(100vh-250px)] w-full font-mono text-sm bg-background border-border resize-none focus-visible:ring-1"
                placeholder={t("doc.edit.placeholder")}
              />
            ) : (
              <MarkdownContent content={document} onSectionEdit={onSectionEdit} t={t} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-in fade-in-0 duration-500">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("doc.empty.title")}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{t("doc.empty.description")}</p>
              {onDocumentImport && (
                <DocumentImportButton
                  onImport={(content) => onDocumentImport(content)}
                  variant="empty"
                  disabled={false}
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <WordCounter document={document} />
    </div>
  );
}
