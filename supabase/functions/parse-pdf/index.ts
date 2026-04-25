import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { installGlobalLogGuard, logger } from "../_shared/safeLogger.ts";

installGlobalLogGuard();

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (token === anonKey) {
      return new Response(JSON.stringify({ error: "Login erforderlich" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user rate limit: 10 PDF uploads/min
    const rl = checkRateLimit(`pdf:${claimsData.claims.sub}`, { windowMs: 60_000, maxRequests: 10 });
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterMs, corsHeaders);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // --- Magic-byte validation: ensure file is actually a PDF ---
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (bytes.length > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large: ${(bytes.length / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit` }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
    if (bytes.length < 4 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      return new Response(
        JSON.stringify({ error: "Invalid file: not a valid PDF (magic bytes mismatch)" }),
        { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try AI-based extraction first (much better for complex PDFs)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      try {
        const base64 = btoa(String.fromCharCode(...bytes));
        
        // 15-second timeout for AI requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            max_tokens: 4000,
            messages: [
              {
                role: "system",
                content: "Du bist ein Dokument-Extraktions-Assistent. Extrahiere den vollständigen Text aus dem PDF-Dokument. Gib den Inhalt als sauber formatiertes Markdown zurück. Behalte die Struktur bei (Überschriften, Listen, Tabellen). Gib NUR den extrahierten Inhalt zurück, keine Kommentare oder Erklärungen."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extrahiere den vollständigen Text aus diesem PDF-Dokument und formatiere ihn als Markdown:"
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:application/pdf;base64,${base64}`
                    }
                  }
                ]
              }
            ],
          }),
        });
        clearTimeout(timeoutId);

        if (aiResponse.ok) {
          const result = await aiResponse.json();
          const text = result.choices?.[0]?.message?.content;
          if (text && text.length > 20) {
            return new Response(JSON.stringify({ text }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (aiError) {
        logger.error("AI PDF extraction failed, falling back to regex:", aiError);
      }
    }

    // Fallback: simple regex-based extraction
    const text = extractTextFromPdf(bytes);

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("PDF parse error:", error);
    return new Response(JSON.stringify({ error: "Failed to parse PDF" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractTextFromPdf(bytes: Uint8Array): string {
  const content = new TextDecoder("latin1").decode(bytes);
  const textParts: string[] = [];

  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(content)) !== null) {
    const block = match[1];
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = decodePdfString(tjMatch[1]);
      if (decoded.trim()) textParts.push(decoded);
    }

    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      const parts: string[] = [];
      while ((strMatch = strRegex.exec(inner)) !== null) {
        parts.push(decodePdfString(strMatch[1]));
      }
      const line = parts.join("");
      if (line.trim()) textParts.push(line);
    }
  }

  if (textParts.length === 0) {
    const streamRegex = /stream\s([\s\S]*?)endstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(content)) !== null) {
      const streamContent = streamMatch[1];
      const readable = streamContent.replace(/[^\x20-\x7E\n\r\t]/g, " ");
      const words = readable.split(/\s+/).filter((w) => w.length > 1);
      if (words.length > 5) {
        textParts.push(words.join(" "));
      }
    }
  }

  return textParts.join("\n") || "Kein Text konnte aus dem PDF extrahiert werden.";
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}
