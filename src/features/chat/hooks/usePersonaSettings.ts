import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AiPersona, Verbosity } from "@/types/chat";

export function usePersonaSettings() {
  const { user } = useAuth();
  const [persona, setPersona] = useState<AiPersona>("balanced");
  const [verbosity, setVerbosity] = useState<Verbosity>("normal");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("ai_persona, verbosity")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPersona(((data as any).ai_persona || "balanced") as AiPersona);
          setVerbosity(((data as any).verbosity || "normal") as Verbosity);
        }
      });
  }, [user]);

  const updatePersona = useCallback(async (newPersona: AiPersona) => {
    setPersona(newPersona);
    if (!user) return;
    await (supabase.from("profiles") as any)
      .update({ ai_persona: newPersona })
      .eq("user_id", user.id);
  }, [user]);

  const updateVerbosity = useCallback(async (newVerbosity: Verbosity) => {
    setVerbosity(newVerbosity);
    if (!user) return;
    await (supabase.from("profiles") as any)
      .update({ verbosity: newVerbosity })
      .eq("user_id", user.id);
  }, [user]);

  return { persona, verbosity, updatePersona, updateVerbosity };
}
