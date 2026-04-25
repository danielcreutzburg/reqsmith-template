import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { installGlobalLogGuard, logger, safeError } from "../_shared/safeLogger.ts";

installGlobalLogGuard();

const systemPromptDe = `Du bist ein erfahrener Requirements-Engineering-Experte. Bewerte das folgende Anforderungsdokument auf 6 Dimensionen.

Antworte NUR mit einem gültigen JSON-Objekt (kein Markdown, kein Text drumherum) in diesem Format:
{
  "strategy": { "score": 0-100, "feedback": "1-2 Sätze" },
  "structure": { "score": 0-100, "feedback": "1-2 Sätze" },
  "clarity": { "score": 0-100, "feedback": "1-2 Sätze" },
  "completeness": { "score": 0-100, "feedback": "1-2 Sätze" },
  "testability": { "score": 0-100, "feedback": "1-2 Sätze" },
  "traceability": { "score": 0-100, "feedback": "1-2 Sätze" },
  "overall": 0-100,
  "topSuggestions": ["Verbesserung 1", "Verbesserung 2", "Verbesserung 3"]
}

Bewertungskriterien:
- **Strategie**: Ist das "Warum" klar? Gibt es Geschäftswert, KPIs, Zielgruppe? Sind Stakeholder identifiziert?
- **Struktur**: Folgt das Dokument einer logischen Gliederung? Sind Abschnitte sinnvoll? Entspricht es professionellen RE-Standards?
- **Klarheit**: Sind Anforderungen eindeutig und verständlich? Keine Nominalisierungen? Keine Mehrdeutigkeiten? Prozessverben verwendet?
- **Vollständigkeit**: Fehlen wichtige Aspekte (Edge Cases, NFRs, Akzeptanzkriterien, Risiken, Systemkontext, Out of Scope)?
- **Testbarkeit**: Sind Akzeptanzkriterien vorhanden (Given-When-Then)? Sind Anforderungen überprüfbar? Sind Qualitätsanforderungen messbar?
- **Verfolgbarkeit**: Haben Anforderungen IDs (z.B. FR-001, QR-001)? Sind Abhängigkeiten dokumentiert? Sind Anforderungen zu Geschäftszielen zurückverfolgbar?`;

const systemPromptEn = `You are an experienced Requirements Engineering expert. Evaluate the following requirements document on 6 dimensions.

Reply ONLY with a valid JSON object (no markdown, no surrounding text) in this format:
{
  "strategy": { "score": 0-100, "feedback": "1-2 sentences" },
  "structure": { "score": 0-100, "feedback": "1-2 sentences" },
  "clarity": { "score": 0-100, "feedback": "1-2 sentences" },
  "completeness": { "score": 0-100, "feedback": "1-2 sentences" },
  "testability": { "score": 0-100, "feedback": "1-2 sentences" },
  "traceability": { "score": 0-100, "feedback": "1-2 sentences" },
  "overall": 0-100,
  "topSuggestions": ["Improvement 1", "Improvement 2", "Improvement 3"]
}

Evaluation criteria:
- **Strategy**: Is the "why" clear? Are there business value, KPIs, target audience? Are stakeholders identified?
- **Structure**: Does the document follow a logical outline? Are sections meaningful? Does it comply with professional RE standards?
- **Clarity**: Are requirements unambiguous and understandable? No nominalizations? No ambiguities? Process verbs used?
- **Completeness**: Are important aspects missing (edge cases, NFRs, acceptance criteria, risks, system context, out of scope)?
- **Testability**: Are acceptance criteria present (Given-When-Then)? Are requirements verifiable? Are quality requirements measurable?
- **Traceability**: Do requirements have IDs (e.g., FR-001, QR-001)? Are dependencies documented? Are requirements traceable to business goals?`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user rate limit: 10 req/min for scoring
    const rl = checkRateLimit(`score:${claimsData.claims.sub}`, { windowMs: 60_000, maxRequests: 10 });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterMs, corsHeaders);
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { document, language } = body;
    if (typeof document !== "string") {
      return new Response(
        JSON.stringify({ error: "document must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (document.length > 200000) {
      return new Response(
        JSON.stringify({ error: "Document too long (max 200,000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (language !== undefined && typeof language !== "string") {
      return new Response(
        JSON.stringify({ error: "language must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!document || document.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Document too short to evaluate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = language === "en" ? systemPromptEn : systemPromptDe;

    // Check for custom LLM settings (key fetched via Vault-backed RPC)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: llmSettings } = await serviceClient
      .from("llm_settings")
      .select("api_url, model, has_custom_key, api_key_secret_id")
      .limit(1)
      .maybeSingle();

    const hasCustomKey = !!(llmSettings?.has_custom_key || llmSettings?.api_key_secret_id);
    let customKey: string | null = null;
    if (hasCustomKey && llmSettings?.api_url) {
      const { data: keyVal } = await serviceClient.rpc("get_llm_api_key");
      if (typeof keyVal === "string" && keyVal.length > 0) customKey = keyVal;
    }
    const useCustom = !!(llmSettings?.api_url && customKey);

    const aiUrl = useCustom
      ? llmSettings!.api_url
      : "https://ai.gateway.lovable.dev/v1/chat/completions";

    const aiKey = useCustom ? customKey! : Deno.env.get("LOVABLE_API_KEY");

    if (!aiKey) {
      throw new Error("No API key configured");
    }

    const aiModel = useCustom && llmSettings?.model
      ? llmSettings.model
      : "google/gemini-3-flash-preview";

    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${aiKey}`,
      "Content-Type": "application/json",
    };
    if (useCustom) {
      fetchHeaders["HTTP-Referer"] = Deno.env.get("SUPABASE_URL") || "";
      fetchHeaders["X-Title"] = "ReqBot";
    }

    // 15-second timeout for AI requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(aiUrl, {
        method: "POST",
        headers: fetchHeaders,
        signal: controller.signal,
        body: JSON.stringify({
          model: aiModel,
          max_tokens: 2000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: document },
          ],
        }),
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "AI request timed out (15s)" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchErr;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      logger.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const scorecard = JSON.parse(jsonStr);

    return new Response(JSON.stringify(scorecard), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    logger.error("score-document error:", e);
    return new Response(
      JSON.stringify({ error: safeError(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
