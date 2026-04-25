/**
 * Shared configuration helper for Edge Functions.
 * Validates required secrets on first access and throws clear errors.
 */

interface SecretConfig {
  name: string;
  required: boolean;
}

const REQUIRED_SECRETS: SecretConfig[] = [
  { name: "SUPABASE_URL", required: true },
  { name: "SUPABASE_ANON_KEY", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true },
];

const OPTIONAL_SECRETS: SecretConfig[] = [
  { name: "LOVABLE_API_KEY", required: false },
];

/**
 * Get a required secret. Throws if not set.
 */
export function requireSecret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required secret: ${name}. Configure it in Supabase Secrets.`);
  }
  return value;
}

/**
 * Get an optional secret. Returns undefined if not set.
 */
export function optionalSecret(name: string): string | undefined {
  return Deno.env.get(name) || undefined;
}

/**
 * Validate all required secrets are present.
 * Call at the top of each edge function for fail-fast behavior.
 */
export function validateRequiredSecrets(additional: string[] = []): void {
  const missing: string[] = [];
  for (const secret of REQUIRED_SECRETS) {
    if (secret.required && !Deno.env.get(secret.name)) {
      missing.push(secret.name);
    }
  }
  for (const name of additional) {
    if (!Deno.env.get(name)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  }
}
