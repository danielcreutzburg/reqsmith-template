import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatSession {
  id: string;
  template_id: string | null;
  title: string;
  document: string;
  created_at: string;
  updated_at: string;
}

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, template_id, title, document, created_at, updated_at")
      .order("updated_at", { ascending: false });
    setSessions((data as ChatSession[]) ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (templateId: string | null, title: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, template_id: templateId, title })
      .select("id, template_id, title, document, created_at, updated_at")
      .single();
    if (error || !data) return null;
    const session = data as ChatSession;
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    return session;
  }, [user]);

  const deleteSession = useCallback(async (sessionId: string) => {
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) setActiveSessionId(null);
  }, [activeSessionId]);

  const updateSessionDocument = useCallback(async (sessionId: string, document: string) => {
    await supabase.from("chat_sessions").update({ document }).eq("id", sessionId);
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, document } : s));
  }, []);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    await supabase.from("chat_sessions").update({ title }).eq("id", sessionId);
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title } : s));
  }, []);

  const duplicateSession = useCallback(async (sessionId: string) => {
    if (!user) return null;
    const source = sessions.find((s) => s.id === sessionId);
    if (!source) return null;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        template_id: source.template_id,
        title: `${source.title} (Kopie)`,
        document: source.document,
      })
      .select("id, template_id, title, document, created_at, updated_at")
      .single();

    if (error || !data) return null;
    const session = data as ChatSession;
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    return session;
  }, [user, sessions]);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading,
    createSession,
    deleteSession,
    updateSessionDocument,
    updateSessionTitle,
    duplicateSession,
    fetchSessions,
  };
}
