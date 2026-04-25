/**
 * Simple in-memory rate limiter for Edge Functions.
 * Each function instance has its own map, so this is a best-effort
 * per-isolate rate limit (not distributed). It catches burst abuse
 * from a single user within a single function instance.
 *
 * For production-grade global limits, use a Redis/KV-based approach.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to avoid memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 min
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Time window in milliseconds (default: 60_000 = 1 min) */
  windowMs?: number;
  /** Max requests per window (default: 20) */
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check if a request from the given key is allowed.
 * @param key Unique identifier (e.g., userId, IP hash)
 */
export function checkRateLimit(
  key: string,
  options?: RateLimitOptions
): RateLimitResult {
  const windowMs = options?.windowMs ?? 60_000;
  const maxRequests = options?.maxRequests ?? 20;
  const now = Date.now();

  cleanup(windowMs);

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Returns a 429 Response with Retry-After header.
 */
export function rateLimitResponse(
  retryAfterMs: number,
  corsHeaders: Record<string, string>
): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
