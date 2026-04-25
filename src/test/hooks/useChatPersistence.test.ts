import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSupabase } from "../mocks/supabase";
import {
  loadSessionMessages,
  persistMessage,
  extractPersistContent,
} from "@/features/chat/hooks/useChatPersistence";

describe("extractPersistContent", () => {
  it("returns full content when no markers present", () => {
    expect(extractPersistContent("Hello world")).toBe("Hello world");
  });

  it("strips content after ---OPERATIONS--- marker", () => {
    const input = 'Chat text here---OPERATIONS---{"operations":[]}';
    expect(extractPersistContent(input)).toBe("Chat text here");
  });

  it("strips content after ---DOCUMENT--- marker", () => {
    const input = "Some chat\n---DOCUMENT---\n## Title\nContent";
    expect(extractPersistContent(input)).toBe("Some chat");
  });

  it("strips content after ---DOCUMENT_APPEND--- marker", () => {
    const input = "Reply text---DOCUMENT_APPEND---Extra content";
    expect(extractPersistContent(input)).toBe("Reply text");
  });

  it("uses earliest marker when multiple present", () => {
    const input = "A---DOCUMENT---B---OPERATIONS---C";
    expect(extractPersistContent(input)).toBe("A");
  });

  it("trims trailing whitespace before marker", () => {
    const input = "Chat response   ---OPERATIONS---{}";
    expect(extractPersistContent(input)).toBe("Chat response");
  });
});

describe("loadSessionMessages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when no messages found", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null }),
    };
    mockSupabase.from.mockReturnValueOnce(chain);
    const result = await loadSessionMessages("session-1");
    expect(result).toEqual([]);
  });

  it("maps database rows to Message objects", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: "m1", role: "user", content: "Hello", created_at: "2025-01-01T00:00:00Z" },
          { id: "m2", role: "assistant", content: "Hi!", created_at: "2025-01-01T00:00:01Z" },
        ],
      }),
    };
    mockSupabase.from.mockReturnValueOnce(chain);
    const result = await loadSessionMessages("session-1");
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("assistant");
    expect(result[0].timestamp).toBeInstanceOf(Date);
  });
});

describe("persistMessage", () => {
  it("calls supabase insert with correct data", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValueOnce({ insert: insertMock });
    await persistMessage("msg-1", "sess-1", "user", "Hello");
    expect(insertMock).toHaveBeenCalledWith({
      id: "msg-1",
      session_id: "sess-1",
      role: "user",
      content: "Hello",
    });
  });
});
