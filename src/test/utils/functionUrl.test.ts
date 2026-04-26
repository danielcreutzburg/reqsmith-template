import { describe, expect, it } from "vitest";
import { buildFunctionUrl } from "@/integrations/supabase/functionUrl";

describe("buildFunctionUrl", () => {
  it("builds proxy URL in development mode", () => {
    const url = buildFunctionUrl("chat", {
      isDev: true,
      supabaseUrl: "https://example.supabase.co",
    });
    expect(url).toBe("/__supabase/functions/v1/chat");
  });

  it("builds direct Supabase URL in production mode", () => {
    const url = buildFunctionUrl("score-document", {
      isDev: false,
      supabaseUrl: "https://example.supabase.co",
    });
    expect(url).toBe("https://example.supabase.co/functions/v1/score-document");
  });

  it("strips wrapping quotes from Supabase URL", () => {
    const url = buildFunctionUrl("parse-pdf", {
      isDev: false,
      supabaseUrl: "\"https://example.supabase.co\"",
    });
    expect(url).toBe("https://example.supabase.co/functions/v1/parse-pdf");
  });

  it("throws on missing function name", () => {
    expect(() =>
      buildFunctionUrl("", {
        isDev: true,
        supabaseUrl: "https://example.supabase.co",
      }),
    ).toThrow("functionName is required");
  });

  it("throws in production mode when Supabase URL is missing", () => {
    expect(() =>
      buildFunctionUrl("chat", {
        isDev: false,
        supabaseUrl: "",
      }),
    ).toThrow("VITE_SUPABASE_URL is missing");
  });
});

