import { useRef, useState } from "react";
import { Paperclip, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface FileAttachButtonProps {
  onFileContent: (content: string, filename: string) => void;
  attachedFile: string | null;
  onClear: () => void;
}

export function FileAttachButton({ onFileContent, attachedFile, onClear }: FileAttachButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      if (file.type === "application/pdf") {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error(t("auth.loginRequired" as any) || "Bitte einloggen");
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );
        if (!res.ok) throw new Error("PDF parse failed");
        const { text } = await res.json();
        onFileContent(text, file.name);
      } else {
        // TXT, MD, etc.
        const text = await file.text();
        onFileContent(text, file.name);
      }
      toast.success(t("chat.file.attached"));
    } catch {
      toast.error(t("chat.file.error"));
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown"
        className="hidden"
        onChange={handleFile}
      />
      {attachedFile ? (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={onClear}
        >
          <Paperclip className="w-3.5 h-3.5" />
          {attachedFile.length > 15 ? attachedFile.slice(0, 15) + "…" : attachedFile}
          <X className="w-3 h-3" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
