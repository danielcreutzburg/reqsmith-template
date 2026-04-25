import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Template } from "@/types/chat";

export interface CustomTemplateRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  system_prompt_addition: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

function rowToTemplate(row: CustomTemplateRow): Template {
  return {
    id: `custom-${row.id}`,
    name: row.name,
    description: row.description,
    systemPromptAddition: row.system_prompt_addition,
  };
}

export function useCustomTemplates() {
  const { user } = useAuth();
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("custom_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomTemplates(data as unknown as CustomTemplateRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(
    async (name: string, description: string, systemPromptAddition: string) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("custom_templates")
        .insert({ user_id: user.id, name, description, system_prompt_addition: systemPromptAddition })
        .select()
        .single();
      if (error) return null;
      const row = data as unknown as CustomTemplateRow;
      setCustomTemplates((prev) => [row, ...prev]);
      return row;
    },
    [user]
  );

  const updateTemplate = useCallback(
    async (id: string, name: string, description: string, systemPromptAddition: string) => {
      const { error } = await supabase
        .from("custom_templates")
        .update({ name, description, system_prompt_addition: systemPromptAddition })
        .eq("id", id);
      if (!error) {
        setCustomTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, name, description, system_prompt_addition: systemPromptAddition } : t))
        );
      }
    },
    []
  );

  const deleteTemplate = useCallback(async (id: string) => {
    await supabase.from("custom_templates").delete().eq("id", id);
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const asTemplates: Template[] = customTemplates.map(rowToTemplate);

  return { customTemplates, asTemplates, loading, createTemplate, updateTemplate, deleteTemplate, fetchTemplates };
}
