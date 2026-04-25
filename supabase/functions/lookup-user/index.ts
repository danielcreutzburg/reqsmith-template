import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req, {
    allowHeaders: "authorization, x-client-info, apikey, content-type",
  });
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user is authenticated
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { email, session_id: sessionId } = body;
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "E-Mail ist erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(JSON.stringify({ error: "Ungültige E-Mail-Adresse" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Zugriff nur: Session-Owner/Collaborator (mit session_id) oder Admin
    if (sessionId && typeof sessionId === "string") {
      const { data: session } = await adminClient
        .from("chat_sessions")
        .select("user_id")
        .eq("id", sessionId)
        .maybeSingle();
      const isOwner = session?.user_id === caller.id;
      const { data: collab } = await adminClient
        .from("document_collaborators")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", caller.id)
        .maybeSingle();
      if (!isOwner && !collab) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "session_id erforderlich oder Admin-Rechte" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Use service role to look up user by email
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      return new Response(JSON.stringify({ error: "Suche fehlgeschlagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const found = users.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!found) {
      return new Response(
        JSON.stringify({ error: "Kein Nutzer mit dieser E-Mail gefunden" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get display name from profiles
    const { data: profile } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", found.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        user_id: found.id,
        email: found.email,
        display_name: profile?.display_name || "",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Interner Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
