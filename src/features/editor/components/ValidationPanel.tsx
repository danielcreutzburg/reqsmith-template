/**
 * ValidationPanel – Shows document validation results in a popover.
 * Accessible from the DocumentEditor toolbar.
 */
import { useMemo } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Section } from "../types/document";
import type { GlossaryTerm } from "@/features/glossary/hooks/useGlossary";
import { validateDocument, type ValidationResult, type ValidationSummary } from "../utils/documentValidator";

interface ValidationPanelProps {
  sections: Section[];
  templateId: string | null;
  glossaryTerms: GlossaryTerm[];
  disabled?: boolean;
}

function SeverityIcon({ severity }: { severity: ValidationResult["severity"] }) {
  switch (severity) {
    case "error":
      return <ShieldAlert className="w-3.5 h-3.5 text-destructive shrink-0" />;
    case "warning":
      return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
    case "info":
      return <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  }
}

export function ValidationPanel({ sections, templateId, glossaryTerms, disabled }: ValidationPanelProps) {
  const { t, language } = useLanguage();

  const summary: ValidationSummary = useMemo(
    () => validateDocument(sections, templateId, glossaryTerms, language as "de" | "en"),
    [sections, templateId, glossaryTerms, language]
  );

  const hasIssues = summary.results.length > 0;
  const iconColor = summary.errors > 0
    ? "text-destructive"
    : summary.warnings > 0
    ? "text-yellow-500"
    : "text-green-500";

  /** Resolve a validation result's message via i18n, falling back to the built-in message */
  const resolveMessage = (result: ValidationResult): string => {
    try {
      const vars = result.messageVars
        ? Object.fromEntries(Object.entries(result.messageVars).map(([k, v]) => [k, String(v)]))
        : undefined;
      const translated = t(result.messageKey as any, vars);
      // If t() returns the key itself (no translation found), use fallback
      return translated === result.messageKey ? result.message : translated;
    } catch {
      return result.message;
    }
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative"
              disabled={disabled}
            >
              {hasIssues ? (
                <ShieldAlert className={`w-4 h-4 ${iconColor}`} />
              ) : (
                <ShieldCheck className="w-4 h-4 text-green-500" />
              )}
              {summary.errors > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                  {summary.errors}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("validation.title")}</TooltipContent>
      </Tooltip>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{t("validation.title")}</h3>
            <div className="flex items-center gap-1.5">
              {summary.errors > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  {summary.errors} {t("validation.errors")}
                </Badge>
              )}
              {summary.warnings > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-yellow-500/50 text-yellow-600">
                  {summary.warnings} {t("validation.warnings")}
                </Badge>
              )}
              {summary.infos > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {summary.infos} {t("validation.infos")}
                </Badge>
              )}
            </div>
          </div>
          {summary.isExportReady ? (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CircleCheck className="w-3 h-3" />
              {t("validation.exportReady")}
            </p>
          ) : (
            <p className="text-xs text-destructive mt-1">
              {t("validation.exportBlocked")}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-[350px]">
          {summary.results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
              {t("validation.allGood")}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {summary.results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <SeverityIcon severity={result.severity} />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{resolveMessage(result)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
