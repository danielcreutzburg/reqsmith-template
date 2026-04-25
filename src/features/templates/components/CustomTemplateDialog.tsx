import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { CustomTemplateRow } from "../hooks/useCustomTemplates";

interface CustomTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string, systemPromptAddition: string) => Promise<void>;
  editingTemplate?: CustomTemplateRow | null;
}

export function CustomTemplateDialog({
  open,
  onOpenChange,
  onSave,
  editingTemplate,
}: CustomTemplateDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setDescription(editingTemplate.description);
      setSystemPrompt(editingTemplate.system_prompt_addition);
    } else {
      setName("");
      setDescription("");
      setSystemPrompt("");
    }
  }, [editingTemplate, open]);

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim(), systemPrompt.trim());
    setSaving(false);
    onOpenChange(false);
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Parse failed");

      const { text } = await response.json();
      setSystemPrompt((prev) => prev ? `${prev}\n\n---\n\n${text}` : text);
      toast.success(t("customTemplate.importSuccess"));
    } catch {
      toast.error(t("customTemplate.importError"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? t("customTemplate.edit") : t("customTemplate.create")}
          </DialogTitle>
          <DialogDescription>{t("customTemplate.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">{t("customTemplate.name")}</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("customTemplate.namePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-desc">{t("customTemplate.description")}</Label>
            <Input
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("customTemplate.descPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tpl-prompt">{t("customTemplate.prompt")}</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {importing ? t("customTemplate.importing") : t("customTemplate.importPdf")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfImport}
              />
            </div>
            <Textarea
              id="tpl-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t("customTemplate.promptPlaceholder")}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">{t("customTemplate.promptHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("customTemplate.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !systemPrompt.trim()}>
            {saving ? "..." : t("customTemplate.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}