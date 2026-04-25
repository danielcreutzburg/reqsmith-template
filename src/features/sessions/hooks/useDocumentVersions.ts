import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentVersion {
  id: string;
  version_number: number;
  content: string;
  created_at: string;
}

export function useDocumentVersions(sessionId: string | null) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setVersions([]);
      return;
    }
    loadVersions(sessionId);
  }, [sessionId]);

  const loadVersions = async (sid: string) => {
    const { data } = await supabase
      .from("document_versions")
      .select("id, version_number, content, created_at")
      .eq("session_id", sid)
      .order("version_number", { ascending: false })
      .limit(50);
    if (data) setVersions(data as DocumentVersion[]);
  };

  const saveVersion = useCallback(async (content: string) => {
    if (!sessionId || !content.trim()) return;

    // Get current max version number
    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

    // Don't save if content is identical to latest version
    if (versions.length > 0 && versions[0].content === content) return;

    await supabase.from("document_versions").insert({
      session_id: sessionId,
      content,
      version_number: nextVersion,
    });

    await loadVersions(sessionId);
  }, [sessionId, versions]);

  return { versions, saveVersion };
}
