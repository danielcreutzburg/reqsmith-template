// Server-side login rate limiter.
// The underlying SQL functions `check_login_rate_limit` and `clear_login_attempts`
// are EXECUTE-revoked from anon/authenticated, so they can only be invoked here
// (via the service role). This prevents:
//   - Account lockout DoS (anon caller spamming `check` for any email)
//   - Brute-force bypass (anon caller wiping attempts via `clear`)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { installGlobalLogGuard, safeError } from "../_shared/safeLogger.ts";

installGlobalLogGuard();

interface Body {
  action: "check" | "clear";
  email: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = (await req.json()) as Body;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (body.action !== "check" && body.action !== "clear") {
      return new Response(JSON.stringify({ error: "invalid_action" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (body.action === "check") {
      const { data, error } = await admin.rpc("check_login_rate_limit", { _email: email });
      if (error) throw error;
      return new Response(JSON.stringify(data ?? { allowed: true, wait_seconds: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { error } = await admin.rpc("clear_login_attempts", { _email: email });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: safeError(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
