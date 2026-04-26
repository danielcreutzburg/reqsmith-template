const DEV_PROXY_PREFIX = "/__supabase/functions/v1";

const stripWrappingQuotes = (value: string | undefined) =>
  (value ?? "").trim().replace(/^["'](.*)["']$/, "$1");

interface BuildFunctionUrlOptions {
  supabaseUrl?: string;
  isDev?: boolean;
}

export function buildFunctionUrl(
  functionName: string,
  options: BuildFunctionUrlOptions = {},
): string {
  const supabaseUrl = stripWrappingQuotes(
    options.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL,
  );
  const isDev = options.isDev ?? import.meta.env.DEV;

  if (!functionName?.trim()) {
    throw new Error("functionName is required");
  }
  if (!supabaseUrl && !isDev) {
    throw new Error("VITE_SUPABASE_URL is missing");
  }

  return isDev
    ? `${DEV_PROXY_PREFIX}/${functionName}`
    : `${supabaseUrl}/functions/v1/${functionName}`;
}

