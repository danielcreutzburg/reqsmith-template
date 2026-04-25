import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SearchResult {
  id: string;
  title: string;
  document: string;
  template_id: string | null;
  updated_at: string;
  match_type: string;
}

export function useSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim() || !user) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_sessions", {
        _user_id: user.id,
        _query: q.trim(),
      });
      if (!error && data) {
        setResults(data as SearchResult[]);
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { results, isSearching, query, search, clearSearch };
}
