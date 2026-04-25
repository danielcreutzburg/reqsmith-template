import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSupabase } from "../mocks/supabase";
import { buildApiMessages, sendChatRequest, ChatApiError } from "@/features/chat/hooks/useChatApi";

describe("buildApiMessages", () => {
  it("returns messages unchanged when no context provided", () => {
    const msgs = [{ role: "user" as const, content: "Hello" }];
    const result = buildApiMessages(msgs, "");
    expect(result).toEqual(msgs);
  });

  it("prepends document context when currentDocument is provided", () => {
    const msgs = [{ role: "user" as const, content: "Hello" }];
    const result = buildApiMessages(msgs, "## Intro\n\nSome doc content");
    expect(result.length).toBe(2);
    expect(result[0].content).toContain("[AKTUELLER DOKUMENTSTAND]");
    expect(result[0].content).toContain("Some doc content");
    expect(result[1].content).toBe("Hello");
  });

  it("prepends glossary context before document context", () => {
    const msgs = [{ role: "user" as const, content: "Hi" }];
    const result = buildApiMessages(msgs, "## Doc\n\nText", "API: Application Programming Interface");
    expect(result[0].content).toContain("[GLOSSAR");
    expect(result[1].content).toContain("[AKTUELLER DOKUMENTSTAND]");
  });

  it("appends file context at the end", () => {
    const msgs = [{ role: "user" as const, content: "Hi" }];
    const result = buildApiMessages(msgs, "", undefined, "File content here");
    const last = result[result.length - 1];
    expect(last.content).toContain("[ANGEHÄNGTE DATEI ALS KONTEXT]");
    expect(last.content).toContain("File content here");
  });

  it("includes section index when document has sections", () => {
    const result = buildApiMessages(
      [{ role: "user" as const, content: "q" }],
      "## Section A\n\nContent A\n\n## Section B\n\nContent B"
    );
    expect(result[0].content).toContain("[DOKUMENT-SEKTIONEN]");
  });
});

describe("ChatApiError", () => {
  it("has correct name and status", () => {
    const err = new ChatApiError("test", 429);
    expect(err.name).toBe("ChatApiError");
    expect(err.status).toBe(429);
    expect(err.message).toBe("test");
  });
});

describe("sendChatRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws 401 when no session", async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    await expect(
      sendChatRequest({
        messages: [],
        currentDocument: "",
        selectedTemplate: null,
        language: "de",
        mode: "direct",
        persona: "balanced",
        verbosity: "normal",
      })
    ).rejects.toThrow(ChatApiError);
  });

  it("throws ChatApiError on non-ok response", async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: "tok123" } },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    await expect(
      sendChatRequest({
        messages: [{ role: "user", content: "hi" }],
        currentDocument: "",
        selectedTemplate: null,
        language: "de",
        mode: "direct",
        persona: "balanced",
        verbosity: "normal",
      })
    ).rejects.toThrow("HTTP 500");
  });

  it("returns response on success", async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: "tok123" } },
    });
    const mockBody = new ReadableStream();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockBody, { status: 200 })
    );
    const res = await sendChatRequest({
      messages: [{ role: "user", content: "hi" }],
      currentDocument: "",
      selectedTemplate: null,
      language: "en",
      mode: "plan",
      persona: "strict-cpo",
      verbosity: "detailed",
    });
    expect(res.ok).toBe(true);
  });
});
