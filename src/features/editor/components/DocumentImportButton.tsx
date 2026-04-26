import { useRef, useState } from "react";
import { Upload, Loader2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import mammoth from "mammoth/mammoth.browser";
import { supabase } from "@/integrations/supabase/client";
import { buildFunctionUrl } from "@/integrations/supabase/functionUrl";

interface DocumentImportButtonProps {
  onImport: (content: string, filename: string) => void;
  variant?: "empty" | "toolbar";
  disabled?: boolean;
}

export function DocumentImportButton({ onImport, variant = "empty", disabled }: DocumentImportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let text: string;

      if (file.type === "application/pdf") {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error(t("auth.loginRequired" as any) || "Bitte einloggen");
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(buildFunctionUrl("parse-pdf"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });
        if (!res.ok) throw new Error("PDF parse failed");
        const data = await res.json();
        text = data.text;
      } else if (file.name.toLowerCase().endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await (mammoth as any).extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await file.text();
      }

      if (!text || text.length < 10) {
        toast.error(t("import.extractionEmpty" as any));
        return;
      }

      onImport(text, file.name);
      toast.success(t("import.success" as any));
    } catch {
      toast.error(t("import.error" as any));
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (variant === "toolbar") {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,.docx"
          className="hidden"
          onChange={handleFile}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading || disabled}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("import.button" as any)}</TooltipContent>
        </Tooltip>
      </>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown,.docx"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="lg"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading || disabled}
        className="mt-4 gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("import.processing" as any)}
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            {t("import.uploadButton" as any)}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        {t("import.hint" as any)}
      </p>
    </>
  );
}
