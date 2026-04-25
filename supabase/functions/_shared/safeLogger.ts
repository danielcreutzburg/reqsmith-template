/**
 * Safe logger for Edge Functions.
 *
 * Goals:
 * 1. Never let an LLM provider key (or any Bearer credential) reach stdout/stderr.
 * 2. Redact secrets recursively from objects/arrays before stringifying.
 * 3. Provide a `safeError()` helper that turns errors into client-safe messages
 *    (no stack frames, no embedded secrets) for HTTP responses.
 * 4. Install a process-wide guard that wraps `console.*` and catches
 *    `unhandledrejection` / `error` events so even third-party code can't leak.
 *
 * Usage:
 *   import { logger, safeError, installGlobalLogGuard } from "../_shared/safeLogger.ts";
 *   installGlobalLogGuard();
 *   logger.error("admin-llm-settings error:", err);
 *   return new Response(JSON.stringify({ error: safeError(err) }), {...});
 */

const REDACTED = "[REDACTED]";

/** Field names that always carry secret material. Case-insensitive. */
const SECRET_KEYS = new Set(
  [
    "api_key",
    "apikey",
    "api-key",
    "authorization",
    "auth",
    "bearer",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "secret_key",
    "client_secret",
    "password",
    "_new_key",
    "new_key",
    "decrypted_secret",
    "secretkey",
    "x-api-key",
    "openai-api-key",
    "anthropic-api-key",
    "x-goog-api-key",
  ].map((s) => s.toLowerCase()),
);

/**
 * Patterns matching common secret token shapes inside arbitrary strings.
 * Order matters – more specific patterns first.
 */
const SECRET_PATTERNS: { name: string; re: RegExp; replace: string }[] = [
  // Authorization: Bearer xxxxx
  {
    name: "bearer",
    re: /(authorization\s*[:=]\s*)(?:bearer\s+)?[A-Za-z0-9._\-+/=]{8,}/gi,
    replace: `$1Bearer ${REDACTED}`,
  },
  // "Bearer xxxxx" anywhere (e.g. inside header objects already stringified)
  {
    name: "bearer-prefix",
    re: /\bBearer\s+[A-Za-z0-9._\-+/=]{8,}/g,
    replace: `Bearer ${REDACTED}`,
  },
  // OpenAI-style: sk-... / sk-proj-...
  {
    name: "openai",
    re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g,
    replace: REDACTED,
  },
  // OpenRouter: or-v1-...
  { name: "openrouter", re: /\bor-v1-[A-Za-z0-9_-]{16,}\b/g, replace: REDACTED },
  // Anthropic: sk-ant-...
  { name: "anthropic", re: /\bsk-ant-[A-Za-z0-9_-]{16,}\b/g, replace: REDACTED },
  // Google AI Studio: AIza...
  { name: "google-ai", re: /\bAIza[0-9A-Za-z_-]{20,}\b/g, replace: REDACTED },
  // Generic JWT (three base64url parts separated by dots)
  {
    name: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    replace: REDACTED,
  },
  // Supabase service-role / anon key prefix marker (sbp_ / sb-)
  { name: "supabase", re: /\bsbp_[A-Za-z0-9]{20,}\b/g, replace: REDACTED },
];

/** Quick check whether a string contains anything that looks like a secret. */
function containsSecret(value: string): boolean {
  return SECRET_PATTERNS.some((p) => {
    p.re.lastIndex = 0;
    return p.re.test(value);
  });
}

/** Sanitize a single string by applying every pattern in order. */
function sanitizeString(input: string): string {
  let out = input;
  for (const { re, replace } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, replace);
  }
  return out;
}

/**
 * Recursively redact a value. Returns a new structure – the original is
 * untouched. Cycles are short-circuited.
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value == null) return value;
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value;
  }
  if (value instanceof Error) {
    // Preserve the message but sanitize it; never expose stack to logs.
    return {
      name: value.name,
      message: sanitizeString(value.message),
    };
  }
  if (value instanceof Headers) {
    const obj: Record<string, string> = {};
    value.forEach((v, k) => {
      obj[k] = SECRET_KEYS.has(k.toLowerCase()) ? REDACTED : sanitizeString(v);
    });
    return obj;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    return value.map((v) => redact(v, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value as object)) return "[Circular]";
    seen.add(value as object);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.has(k.toLowerCase())) {
        out[k] = REDACTED;
      } else {
        out[k] = redact(v, seen);
      }
    }
    return out;
  }
  // functions, symbols, undefined → drop
  return undefined;
}

function formatArg(arg: unknown): string {
  const cleaned = redact(arg);
  if (typeof cleaned === "string") return cleaned;
  try {
    return JSON.stringify(cleaned);
  } catch {
    return "[Unserializable]";
  }
}

function emit(level: "log" | "info" | "warn" | "error" | "debug", args: unknown[]) {
  const safe = args.map(formatArg).join(" ");
  // Final defensive pass on the joined line.
  const line = sanitizeString(safe);
  // Resolve the original method lazily so test setups that swap console
  // *after* module load (e.g. vi.spyOn) still capture the output.
  const original = ORIGINAL_CONSOLE[level] ?? console[level].bind(console);
  original(line);
}

export const logger = {
  log: (...args: unknown[]) => emit("log", args),
  info: (...args: unknown[]) => emit("info", args),
  warn: (...args: unknown[]) => emit("warn", args),
  error: (...args: unknown[]) => emit("error", args),
  debug: (...args: unknown[]) => emit("debug", args),
};

/**
 * Convert any thrown value into a client-safe error message.
 * Strips secrets and is bounded in length so attackers can't echo data
 * back via crafted error payloads.
 */
export function safeError(err: unknown, fallback = "Internal error"): string {
  if (err == null) return fallback;
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : (() => {
          try {
            return JSON.stringify(err);
          } catch {
            return String(err);
          }
        })();
  const cleaned = sanitizeString(raw).slice(0, 500);
  // If after cleaning we'd reveal a redacted token only, prefer fallback.
  if (!cleaned.trim() || cleaned === REDACTED) return fallback;
  return cleaned;
}

// ---------------------------------------------------------------------------
// Global guard: wrap console.* and listen for unhandled errors.
// ---------------------------------------------------------------------------

/**
 * Holds the "real" console methods. Two states:
 *  - Before installGlobalLogGuard(): values are thin wrappers that defer to
 *    `console[level]` at call time. This lets test setups that swap
 *    `console.error` (vi.spyOn) intercept logger output naturally.
 *  - After installGlobalLogGuard(): values are snapshotted from the live
 *    console BEFORE we wrap it, so emit() can write through the wrapper
 *    without recursing.
 */
const ORIGINAL_CONSOLE: Record<
  "log" | "info" | "warn" | "error" | "debug",
  (...args: unknown[]) => void
> = {
  log: (...a) => console.log(...a),
  info: (...a) => console.info(...a),
  warn: (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
  debug: (...a) => console.debug(...a),
};

let guardInstalled = false;
let preGuardConsole: typeof ORIGINAL_CONSOLE | null = null;

export function installGlobalLogGuard(): void {
  if (guardInstalled) return;
  guardInstalled = true;

  // Snapshot the *current* methods before wrapping so emit() doesn't recurse.
  preGuardConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };
  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    ORIGINAL_CONSOLE[level] = preGuardConsole[level];
    console[level] = (...args: unknown[]) => emit(level, args);
  }

  try {
    addEventListener("unhandledrejection", (event: Event) => {
      const reason = (event as PromiseRejectionEvent).reason;
      ORIGINAL_CONSOLE.error("[unhandledrejection]", formatArg(reason));
      (event as PromiseRejectionEvent).preventDefault?.();
    });
    addEventListener("error", (event: Event) => {
      const err = (event as ErrorEvent).error ?? (event as ErrorEvent).message;
      ORIGINAL_CONSOLE.error("[uncaught]", formatArg(err));
      (event as ErrorEvent).preventDefault?.();
    });
  } catch {
    // Some test runtimes don't expose addEventListener – ignore.
  }
}

/** Test-only: restore the pre-guard console state. */
export function __resetGlobalLogGuardForTests(): void {
  if (preGuardConsole) {
    for (const level of ["log", "info", "warn", "error", "debug"] as const) {
      console[level] = preGuardConsole[level];
    }
    preGuardConsole = null;
  }
  // Reset to lazy deferring wrappers so post-reset spies are seen again.
  ORIGINAL_CONSOLE.log = (...a) => console.log(...a);
  ORIGINAL_CONSOLE.info = (...a) => console.info(...a);
  ORIGINAL_CONSOLE.warn = (...a) => console.warn(...a);
  ORIGINAL_CONSOLE.error = (...a) => console.error(...a);
  ORIGINAL_CONSOLE.debug = (...a) => console.debug(...a);
  guardInstalled = false;
}
