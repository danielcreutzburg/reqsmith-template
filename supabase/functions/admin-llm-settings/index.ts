import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { installGlobalLogGuard, logger, safeError } from "../_shared/safeLogger.ts";

installGlobalLogGuard();

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Never select api_key. has_custom_key is derived from the Vault link.
      const { data, error } = await supabaseAdmin
        .from("llm_settings")
        .select("api_url, model, has_custom_key, updated_at, api_key_secret_id")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const safe = {
        api_url: data?.api_url ?? "",
        model: data?.model ?? "",
        has_custom_key: !!(data?.has_custom_key || data?.api_key_secret_id),
        updated_at: data?.updated_at ?? null,
      };

      return new Response(JSON.stringify(safe), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Test connection mode — fetches the decrypted key via RPC, never logs it
      if (body.test_connection) {
        const { data: settings } = await supabaseAdmin
          .from("llm_settings")
          .select("api_url, model")
          .limit(1)
          .maybeSingle();

        const { data: secretKey, error: keyErr } = await supabaseAdmin.rpc("get_llm_api_key");
        if (keyErr) throw keyErr;

        if (!settings?.api_url || !secretKey) {
          return new Response(
            JSON.stringify({ success: false, error: "Keine API-URL oder Key konfiguriert. Bitte zuerst speichern." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          const testHeaders: Record<string, string> = {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
            "X-Title": "ReqBot",
          };

          const testResponse = await fetch(settings.api_url, {
            method: "POST",
            headers: testHeaders,
            body: JSON.stringify({
              model: settings.model || "openai/gpt-4o-mini",
              messages: [{ role: "user", content: "Say OK" }],
              max_tokens: 5,
            }),
          });

          if (!testResponse.ok) {
            const errText = await testResponse.text();
            return new Response(
              JSON.stringify({ success: false, error: `API-Fehler ${testResponse.status}: ${errText.substring(0, 200)}` }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const testData = await testResponse.json();
          const reply = testData.choices?.[0]?.message?.content || "";

          return new Response(
            JSON.stringify({ success: true, reply: reply.substring(0, 100), model: testData.model || settings.model }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (fetchErr: unknown) {
          const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          return new Response(
            JSON.stringify({ success: false, error: `Verbindungsfehler: ${msg}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Normal save mode — validate inputs
      const { api_url, model, api_key, clear_key } = body;
      if (api_url !== undefined && typeof api_url !== "string") {
        return new Response(JSON.stringify({ error: "api_url must be a string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (model !== undefined && typeof model !== "string") {
        return new Response(JSON.stringify({ error: "model must be a string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (api_key !== undefined && typeof api_key !== "string") {
        return new Response(JSON.stringify({ error: "api_key must be a string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (api_url && api_url.length > 2000) {
        return new Response(JSON.stringify({ error: "api_url too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Ensure a row exists, then update url/model fields
      const { data: existing } = await supabaseAdmin
        .from("llm_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      const updates: Record<string, unknown> = {
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };
      if (api_url !== undefined) updates.api_url = api_url;
      if (model !== undefined) updates.model = model;

      if (existing) {
        const { error } = await supabaseAdmin
          .from("llm_settings")
          .update(updates)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin
          .from("llm_settings")
          .insert(updates);
        if (error) throw error;
      }

      // Key handling goes through Vault-backed RPCs only
      if (clear_key) {
        const { error } = await supabaseAdmin.rpc("clear_llm_api_key");
        if (error) throw error;
      } else if (api_key && api_key.trim().length > 0) {
        const { error } = await supabaseAdmin.rpc("set_llm_api_key", {
          _new_key: api_key.trim(),
        });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    // Log only the message, never the request body (which may include the key)
    logger.error("admin-llm-settings error:", err);
    return new Response(
      JSON.stringify({ error: safeError(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
