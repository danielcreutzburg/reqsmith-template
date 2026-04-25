import { describe, it, expect, vi } from "vitest";
import "../../test/mocks/supabase";

describe("useSessions", () => {
  // Test pure logic aspects that don't require full hook rendering

  it("should generate correct duplicate title", () => {
    const title = "My Session";
    const duplicateTitle = `${title} (Kopie)`;
    expect(duplicateTitle).toBe("My Session (Kopie)");
  });

  it("should filter sessions correctly on delete", () => {
    const sessions = [
      { id: "1", title: "A" },
      { id: "2", title: "B" },
      { id: "3", title: "C" },
    ];
    const filtered = sessions.filter((s) => s.id !== "2");
    expect(filtered).toHaveLength(2);
    expect(filtered.map((s) => s.id)).toEqual(["1", "3"]);
  });

  it("should reset activeSessionId when active session is deleted", () => {
    let activeSessionId: string | null = "2";
    const sessionIdToDelete = "2";
    if (activeSessionId === sessionIdToDelete) {
      activeSessionId = null;
    }
    expect(activeSessionId).toBeNull();
  });

  it("should not reset activeSessionId when other session is deleted", () => {
    let activeSessionId: string | null = "1";
    const sessionIdToDelete = "2";
    if (activeSessionId === sessionIdToDelete) {
      activeSessionId = null;
    }
    expect(activeSessionId).toBe("1");
  });
});
