import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UsageData {
  messageCount: number;
  maxMessages: number;
  remaining: number;
  isExhausted: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function useUsage(): UsageData {
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [maxMessages, setMaxMessages] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) return;

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id);

    const adminRole = (roles as any[])?.find((r: any) => r.role === "admin");
    setIsAdmin(!!adminRole);

    if (adminRole) {
      setIsLoading(false);
      return;
    }

    // Fetch usage
    const { data: usage } = await supabase
      .from("usage_counts" as any)
      .select("message_count, max_messages")
      .eq("user_id", user.id)
      .single();

    if (usage) {
      setMessageCount((usage as any).message_count);
      setMaxMessages((usage as any).max_messages);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    messageCount,
    maxMessages,
    remaining: maxMessages - messageCount,
    isExhausted: false,
    isAdmin,
    isLoading,
    refetch: fetchUsage,
  };
}
