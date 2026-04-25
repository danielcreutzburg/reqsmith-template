/**
 * CORS headers for Edge Functions.
 * Set ALLOWED_ORIGINS (comma-separated) in Supabase/Lovable secrets to restrict in production.
 * Example: https://your-app.lovable.app,https://your-domain.com
 * If unset, returns "*" for backward compatibility.
 */
const DEFAULT_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(
  req: Request,
  options?: { allowHeaders?: string }
): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedRaw = Deno.env.get("ALLOWED_ORIGINS");
  const allowed = allowedRaw
    ? allowedRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const allowOrigin =
    allowed.length === 0 ? "*" : (allowed.includes(origin) ? origin : "");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      options?.allowHeaders ?? DEFAULT_ALLOW_HEADERS,
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}
