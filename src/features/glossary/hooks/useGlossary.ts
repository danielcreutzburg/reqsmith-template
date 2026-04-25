import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
}

export function useGlossary() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchTerms = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("glossary_terms")
      .select("id, term, definition, created_at")
      .order("term", { ascending: true });
    if (data) setTerms(data as GlossaryTerm[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchTerms(); }, [fetchTerms]);

  const addTerm = useCallback(async (term: string, definition: string) => {
    if (!user) return;
    await supabase.from("glossary_terms").insert({
      user_id: user.id,
      term,
      definition,
    });
    await fetchTerms();
  }, [user, fetchTerms]);

  const updateTerm = useCallback(async (id: string, term: string, definition: string) => {
    await supabase.from("glossary_terms").update({ term, definition, updated_at: new Date().toISOString() }).eq("id", id);
    await fetchTerms();
  }, [fetchTerms]);

  const deleteTerm = useCallback(async (id: string) => {
    await supabase.from("glossary_terms").delete().eq("id", id);
    await fetchTerms();
  }, [fetchTerms]);

  // Format terms for AI context injection
  const glossaryContext = terms.length > 0
    ? terms.map(t => `- **${t.term}**: ${t.definition}`).join("\n")
    : "";

  return { terms, isLoading, addTerm, updateTerm, deleteTerm, glossaryContext };
}
