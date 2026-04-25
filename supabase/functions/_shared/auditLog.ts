import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuditEvent {
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event using service role (bypasses RLS).
 * Fire-and-forget — errors are logged but don't throw.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("audit_logs").insert({
      user_id: event.user_id,
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id || null,
      metadata: event.metadata || {},
    });

    if (error) {
      console.error("Audit log insert failed:", error.message);
    }
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
