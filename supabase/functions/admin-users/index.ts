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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const method = req.method;

    if (method === "GET") {
      // List all users with profiles, roles, usage
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      if (usersError) throw usersError;

      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const { data: usage } = await supabaseAdmin.from("usage_counts").select("*");

      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      const roleMap = Object.fromEntries((roles || []).map((r: any) => [r.user_id, r.role]));
      const usageMap = Object.fromEntries((usage || []).map((u: any) => [u.user_id, u]));

      const result = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        display_name: profileMap[u.id]?.display_name || "",
        role: roleMap[u.id] || "user",
        message_count: usageMap[u.id]?.message_count || 0,
        max_messages: usageMap[u.id]?.max_messages || 15,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (method === "PATCH") {
      const body = await req.json();
      if (!body || typeof body !== "object") {
        return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { user_id, role, max_messages } = body;

      if (!user_id || typeof user_id !== "string") {
        return new Response(JSON.stringify({ error: "user_id is required and must be a string" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (role !== undefined && !["admin", "user"].includes(role)) {
        return new Response(JSON.stringify({ error: "role must be 'admin' or 'user'" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (max_messages !== undefined && (typeof max_messages !== "number" || max_messages < 0 || max_messages > 100000)) {
        return new Response(JSON.stringify({ error: "max_messages must be a number between 0 and 100000" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (role) {
        const oldRole = (await supabaseAdmin.from("user_roles").select("role").eq("user_id", user_id).maybeSingle())?.data?.role;
        await supabaseAdmin.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id" });

        // Audit: role change
        if (oldRole && oldRole !== role) {
          const svcClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
          await svcClient.from("audit_logs").insert({
            user_id: userId,
            action: "ROLE_CHANGE",
            entity_type: "user_roles",
            entity_id: user_id,
            metadata: { old_role: oldRole, new_role: role, changed_by: userId },
          });
        }
      }

      if (max_messages !== undefined) {
        await supabaseAdmin.from("usage_counts").upsert(
          { user_id, max_messages },
          { onConflict: "user_id" }
        );
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: unknown) {
    logger.error("admin-users error:", err);
    return new Response(JSON.stringify({ error: safeError(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
