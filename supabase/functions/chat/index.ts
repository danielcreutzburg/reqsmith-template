/**
 * Chat Edge Function
 *
 * Streaming proxy between the ReqSmith client and the LLM gateway:
 *  1. Validates the request (auth + payload shape).
 *  2. Enforces rate limit + per-user usage quota.
 *  3. Composes the system prompt from modular pieces in `./prompts/`.
 *  4. Resolves the LLM target (default Lovable AI Gateway or admin-configured custom URL).
 *  5. Forwards an SSE stream back to the caller.
 *
 * The big prompt strings live in `prompts/` so this file stays focused on
 * orchestration. See `prompts/index.ts` for the registry.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { installGlobalLogGuard, logger, safeError } from "../_shared/safeLogger.ts";
import {
  baseSystemPromptDe, baseSystemPromptEn,
  planModeAdditionDe, planModeAdditionEn,
  coachingModeAdditionDe, coachingModeAdditionEn,
  personaPromptsDe, personaPromptsEn,
  verbosityPromptsDe, verbosityPromptsEn,
  templatesDe, templatesEn,
} from "./prompts/index.ts";

installGlobalLogGuard();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_MESSAGE_CHARS = 100_000;
const VALID_ROLES = ["user", "assistant", "system"] as const;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const AI_TIMEOUT_MS = 15_000;
const DEFAULT_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_AI_MODEL = "google/gemini-3-flash-preview";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ChatMessage { role: string; content: string; }

interface ChatRequestBody {
  messages: ChatMessage[];
  templateId?: string | null;
  language?: string;
  planMode?: boolean;
  coachingMode?: boolean;
  persona?: string;
  verbosity?: string;
}

function jsonError(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Validate request body shape — returns parsed body or an error response. */
function validateRequest(
  body: unknown,
  corsHeaders: Record<string, string>,
): ChatRequestBody | Response {
  if (!body || typeof body !== "object") {
    return jsonError("Invalid request body", 400, corsHeaders);
  }
  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return jsonError("messages must be a non-empty array", 400, corsHeaders);
  }
  for (const msg of b.messages) {
    if (!msg || typeof (msg as ChatMessage).role !== "string" || typeof (msg as ChatMessage).content !== "string") {
      return jsonError("Each message must have a string role and content", 400, corsHeaders);
    }
    if (!VALID_ROLES.includes((msg as ChatMessage).role as typeof VALID_ROLES[number])) {
      return jsonError(`Invalid message role: ${(msg as ChatMessage).role}`, 400, corsHeaders);
    }
    if ((msg as ChatMessage).content.length > MAX_MESSAGE_CHARS) {
      return jsonError(`Message content too long (max ${MAX_MESSAGE_CHARS} chars)`, 400, corsHeaders);
    }
  }
  for (const [field, expected] of [
    ["templateId", "string|null"],
    ["language", "string"],
    ["persona", "string"],
    ["verbosity", "string"],
  ] as const) {
    const v = b[field];
    if (v === undefined) continue;
    if (field === "templateId" && v === null) continue;
    if (typeof v !== "string") {
      return jsonError(`${field} must be a ${expected}`, 400, corsHeaders);
    }
  }

  return b as unknown as ChatRequestBody;
}

/** Extract the authenticated user id from the request's bearer token. */
async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

/** Compose the full system prompt from the modular pieces. */
function buildSystemPrompt(opts: {
  language?: string;
  planMode?: boolean;
  coachingMode?: boolean;
  persona?: string;
  verbosity?: string;
  templateId?: string | null;
}): string {
  const isEnglish = opts.language === "en";
  let prompt = isEnglish ? baseSystemPromptEn : baseSystemPromptDe;

  if (opts.planMode)     prompt += isEnglish ? planModeAdditionEn     : planModeAdditionDe;
  if (opts.coachingMode) prompt += isEnglish ? coachingModeAdditionEn : coachingModeAdditionDe;

  if (opts.persona && opts.persona !== "balanced") {
    const map = isEnglish ? personaPromptsEn : personaPromptsDe;
    prompt += map[opts.persona] ?? "";
  }
  if (opts.verbosity && opts.verbosity !== "normal") {
    const map = isEnglish ? verbosityPromptsEn : verbosityPromptsDe;
    prompt += map[opts.verbosity] ?? "";
  }

  if (opts.templateId) {
    const tplMap = isEnglish ? templatesEn : templatesDe;
    if (tplMap[opts.templateId]) prompt += "\n\n" + tplMap[opts.templateId];
  }

  return prompt;
}

/** Check the per-user usage quota; returns false when the user is over limit. */
async function checkUsageAllowed(userId: string): Promise<{ allowed: boolean }> {
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: allowed, error } = await serviceClient.rpc(
    "check_and_increment_usage",
    { _user_id: userId },
  );

  if (error) {
    logger.error("Usage check error:", error);
    return { allowed: true }; // fail-open on infra error, original behaviour
  }
  if (allowed === false) {
    // Best-effort audit — don't block the user response if this fails.
    try {
      await serviceClient.from("audit_logs").insert({
        user_id: userId,
        action: "AI_LIMIT_EXCEEDED",
        entity_type: "usage_counts",
        entity_id: userId,
        metadata: {},
      });
    } catch (auditErr) {
      logger.error("Audit log error:", auditErr);
    }
    return { allowed: false };
  }
  return { allowed: true };
}

interface LlmConfig {
  url: string;
  apiKey: string;
  model: string;
  isCustom: boolean;
}

/** Resolve the LLM target: admin-configured custom endpoint, else Lovable Gateway. */
async function resolveLlmConfig(defaultKey: string): Promise<LlmConfig> {
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: settings } = await serviceClient
    .from("llm_settings")
    .select("api_url, model, has_custom_key, api_key_secret_id")
    .limit(1)
    .maybeSingle();

  const hasCustomKey = !!(settings?.has_custom_key || settings?.api_key_secret_id);
  let customKey: string | null = null;
  if (hasCustomKey && settings?.api_url) {
    const { data: keyVal } = await serviceClient.rpc("get_llm_api_key");
    if (typeof keyVal === "string" && keyVal.length > 0) customKey = keyVal;
  }

  const isCustom = !!(settings?.api_url && customKey);
  return {
    url: isCustom ? settings!.api_url : DEFAULT_AI_URL,
    apiKey: isCustom ? customKey! : defaultKey,
    model: isCustom && settings?.model ? settings.model : DEFAULT_AI_MODEL,
    isCustom,
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Validate input ------------------------------------------------------
    const rawBody = await req.json();
    const validation = validateRequest(rawBody, corsHeaders);
    if (validation instanceof Response) return validation;
    const body = validation;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 2) Auth ----------------------------------------------------------------
    const userId = await getUserIdFromRequest(req);
    if (!userId) return jsonError("Unauthorized", 401, corsHeaders);

    // 3) Rate limiting -------------------------------------------------------
    const rl = checkRateLimit(`chat:${userId}`, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, corsHeaders);

    // 4) Usage quota ---------------------------------------------------------
    const usage = await checkUsageAllowed(userId);
    if (!usage.allowed) return jsonError("usage_limit_reached", 403, corsHeaders);

    // 5) Build prompt + LLM config ------------------------------------------
    const systemPrompt = buildSystemPrompt(body);
    const llm = await resolveLlmConfig(LOVABLE_API_KEY);

    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${llm.apiKey}`,
      "Content-Type": "application/json",
    };
    if (llm.isCustom) {
      fetchHeaders["HTTP-Referer"] = Deno.env.get("SUPABASE_URL") || "";
      fetchHeaders["X-Title"] = "ReqBot";
    }

    // 6) Forward to LLM with timeout ----------------------------------------
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(llm.url, {
        method: "POST",
        headers: fetchHeaders,
        signal: controller.signal,
        body: JSON.stringify({
          model: llm.model,
          messages: [{ role: "system", content: systemPrompt }, ...body.messages],
          stream: true,
          max_tokens: 4000,
        }),
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
        return jsonError(`AI request timed out (${AI_TIMEOUT_MS / 1000}s)`, 504, corsHeaders);
      }
      throw fetchErr;
    }
    clearTimeout(timeoutId);

    // 7) Map upstream errors to client-friendly responses --------------------
    if (!response.ok) {
      if (response.status === 429) {
        return jsonError("Rate limits exceeded, please try again later.", 429, corsHeaders);
      }
      if (response.status === 402) {
        return jsonError("Payment required, please add funds.", 402, corsHeaders);
      }
      const errorText = await response.text();
      logger.error("AI gateway error:", response.status, errorText);
      return jsonError("AI gateway error", 500, corsHeaders);
    }

    // 8) Stream response back unchanged -------------------------------------
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    logger.error("chat error:", e);
    return jsonError(safeError(e, "Unknown error"), 500, corsHeaders);
  }
});
