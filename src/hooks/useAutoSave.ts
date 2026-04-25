import { useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface UseAutoSaveOptions {
  sessionId: string | null;
  content: string;
  onConflict?: (serverContent: string) => void;
  debounceMs?: number;
}

export function useAutoSave({ sessionId, content, onConflict, debounceMs = 2000 }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef(content);
  const versionRef = useRef(1);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Load initial version
  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from("chat_sessions")
      .select("version")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) versionRef.current = (data as any).version || 1;
      });
  }, [sessionId]);

  const save = useCallback(async () => {
    if (!sessionId || content === lastSavedRef.current) return;

    // Check for conflicts using optimistic locking
    const { data: current } = await supabase
      .from("chat_sessions")
      .select("version, document")
      .eq("id", sessionId)
      .single();

    if (current && (current as any).version > versionRef.current) {
      // Conflict detected!
      toast({
        title: t("autoSave.conflict"),
        description: t("autoSave.conflictDesc"),
        variant: "destructive",
      });
      onConflict?.((current as any).document);
      versionRef.current = (current as any).version;
      return;
    }

    const newVersion = versionRef.current + 1;
    const { error } = await supabase
      .from("chat_sessions")
      .update({ document: content, version: newVersion })
      .eq("id", sessionId);

    if (!error) {
      versionRef.current = newVersion;
      lastSavedRef.current = content;
    }
  }, [sessionId, content, onConflict, toast, t]);

  // Debounced auto-save
  useEffect(() => {
    if (!sessionId || content === lastSavedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [content, sessionId, save, debounceMs]);

  return { save };
}
