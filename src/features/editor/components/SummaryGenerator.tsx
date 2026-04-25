import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type SummaryType = "executive" | "elevator" | "stakeholder";

const PROMPTS: Record<SummaryType, { de: string; en: string }> = {
  executive: {
    de: "Erstelle eine prägnante Executive Summary (max. 300 Wörter) des folgenden Dokuments. Fokussiere auf die wichtigsten Entscheidungen, Ziele und nächsten Schritte.",
    en: "Create a concise Executive Summary (max 300 words) of the following document. Focus on key decisions, goals, and next steps.",
  },
  elevator: {
    de: "Erstelle einen Elevator Pitch (max. 100 Wörter) basierend auf dem folgenden Dokument. Kurz, überzeugend und auf den Punkt.",
    en: "Create an Elevator Pitch (max 100 words) based on the following document. Brief, compelling, and to the point.",
  },
  stakeholder: {
    de: "Erstelle ein Stakeholder Briefing (max. 500 Wörter) basierend auf dem folgenden Dokument. Strukturiere es mit: Kontext, Kernpunkte, Auswirkungen, Empfehlungen.",
    en: "Create a Stakeholder Briefing (max 500 words) based on the following document. Structure it with: Context, Key Points, Impact, Recommendations.",
  },
};

interface SummaryGeneratorProps {
  document: string;
  disabled?: boolean;
}

export function SummaryGenerator({ document, disabled }: SummaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState<SummaryType>("executive");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const generate = async (type: SummaryType) => {
    setSummaryType(type);
    setSummary("");
    setDialogOpen(true);
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Bitte einloggen", variant: "destructive" });
        setIsGenerating(false);
        return;
      }
      const prompt = PROMPTS[type][language === "de" ? "de" : "en"];

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `${prompt}\n\n---\n\n${document}` },
          ],
          language,
          skipUsageCheck: true,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rawResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "") continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              rawResult += delta;
              // Strip everything before ---DOCUMENT--- marker if present
              const markerIdx = rawResult.indexOf("---DOCUMENT---");
              const clean = markerIdx !== -1
                ? rawResult.slice(markerIdx + "---DOCUMENT---".length).trimStart()
                : rawResult;
              setSummary(clean);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      toast({ title: t("error.generic"), variant: "destructive" });
      setDialogOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled || !document}>
                <Sparkles className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("summary.button")}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => generate("executive")}>
            {t("summary.executive")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => generate("elevator")}>
            {t("summary.elevator")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => generate("stakeholder")}>
            {t("summary.stakeholder")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t(`summary.${summaryType}`)}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh]">
            {isGenerating && !summary ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Sparkles className="w-4 h-4 animate-pulse" />
                {t("summary.generating")}
              </div>
            ) : (
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </article>
            )}
          </ScrollArea>
          {summary && (
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? t("doc.copied") : t("doc.copy")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
