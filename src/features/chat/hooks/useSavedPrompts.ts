import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavedPrompt {
  id: string;
  content: string;
  label: string | null;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
}

export function useSavedPrompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);

  const fetchPrompts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_prompts" as any)
      .select("id, content, label, is_favorite, use_count, created_at")
      .eq("user_id", user.id)
      .order("use_count", { ascending: false })
      .limit(50);
    setPrompts((data as any as SavedPrompt[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const trackPrompt = useCallback(async (content: string) => {
    if (!user || content.length < 10) return;
    // Check if prompt exists
    const existing = prompts.find((p) => p.content === content);
    if (existing) {
      await (supabase.from("saved_prompts" as any) as any)
        .update({ use_count: existing.use_count + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      setPrompts((prev) =>
        prev.map((p) => (p.id === existing.id ? { ...p, use_count: p.use_count + 1 } : p))
      );
    } else {
      const { data } = await (supabase.from("saved_prompts" as any) as any)
        .insert({ user_id: user.id, content })
        .select("id, content, label, is_favorite, use_count, created_at")
        .single();
      if (data) setPrompts((prev) => [data as SavedPrompt, ...prev]);
    }
  }, [user, prompts]);

  const toggleFavorite = useCallback(async (id: string) => {
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) return;
    const newVal = !prompt.is_favorite;
    await (supabase.from("saved_prompts" as any) as any)
      .update({ is_favorite: newVal })
      .eq("id", id);
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_favorite: newVal } : p))
    );
  }, [prompts]);

  const deletePrompt = useCallback(async (id: string) => {
    await (supabase.from("saved_prompts" as any) as any).delete().eq("id", id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const favorites = prompts.filter((p) => p.is_favorite);
  const frequent = prompts.slice(0, 10);

  return { prompts, favorites, frequent, trackPrompt, toggleFavorite, deletePrompt, fetchPrompts };
}
