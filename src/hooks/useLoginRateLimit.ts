import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RateLimitStatus = "ok" | "limited" | "network_error";

interface CheckResult {
  status: RateLimitStatus;
  /** seconds remaining until the user may try again (only set when status === "limited") */
  waitSeconds: number;
}

/**
 * Talks to the `auth-rate-limit` Edge Function.
 *
 * The underlying SQL RPCs are not callable from the client (EXECUTE revoked
 * for anon/authenticated). Centralising the call here keeps `Auth.tsx` slim
 * and surfaces a clear status enum so the UI can react differently to a real
 * rate-limit hit vs. a transient network problem (fail-open, but visible).
 */
export function useLoginRateLimit() {
  const check = useCallback(async (email: string): Promise<CheckResult> => {
    // Local DX: avoid hard dependency on deployed Edge Functions during template setup.
    if (import.meta.env.DEV && !import.meta.env.VITEST) {
      return { status: "ok", waitSeconds: 0 };
    }
    try {
      const { data, error } = await supabase.functions.invoke("auth-rate-limit", {
        body: { action: "check", email },
      });
      if (error || !data) {
        return { status: "network_error", waitSeconds: 0 };
      }
      const allowed = (data as { allowed?: boolean }).allowed !== false;
      const waitSeconds = Number((data as { wait_seconds?: number }).wait_seconds ?? 0);
      return allowed
        ? { status: "ok", waitSeconds: 0 }
        : { status: "limited", waitSeconds };
    } catch {
      return { status: "network_error", waitSeconds: 0 };
    }
  }, []);

  const clear = useCallback(async (email: string) => {
    if (import.meta.env.DEV && !import.meta.env.VITEST) return;
    try {
      await supabase.functions.invoke("auth-rate-limit", {
        body: { action: "clear", email },
      });
    } catch {
      /* best-effort */
    }
  }, []);

  return { check, clear };
}
