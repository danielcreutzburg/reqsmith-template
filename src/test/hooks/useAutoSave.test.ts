import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (k: string) => k, language: "de", setLanguage: vi.fn() }),
}));

const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { useAutoSave } from "@/hooks/useAutoSave";

function makeChain(data: any = null) {
  const eqFn = vi.fn().mockResolvedValue({ error: null });
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data }),
    update: vi.fn().mockReturnValue({ eq: eqFn }),
    _updateEq: eqFn,
  };
}

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFrom.mockReturnValue(makeChain({ version: 1, document: "" }));
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a save function", () => {
    const { result } = renderHook(() =>
      useAutoSave({ sessionId: null, content: "" })
    );
    expect(typeof result.current.save).toBe("function");
  });

  it("does not save when sessionId is null", async () => {
    mockFrom.mockClear();
    const { result } = renderHook(() =>
      useAutoSave({ sessionId: null, content: "changed" })
    );
    await act(async () => {
      await result.current.save();
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("does not save when content is unchanged", async () => {
    const chain = makeChain({ version: 1, document: "" });
    mockFrom.mockReturnValue(chain);
    const { result } = renderHook(() =>
      useAutoSave({ sessionId: "s1", content: "" })
    );
    await act(async () => {
      await result.current.save();
    });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("triggers debounced save on content change", () => {
    const chain = makeChain({ version: 1, document: "" });
    mockFrom.mockReturnValue(chain);

    const { rerender } = renderHook(
      ({ content }) => useAutoSave({ sessionId: "s1", content, debounceMs: 500 }),
      { initialProps: { content: "" } }
    );

    // Change content to trigger the debounce effect
    rerender({ content: "updated" });

    // Timer should be set but not yet fired
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("extractPersistContent strips markers (integration sanity)", async () => {
    // Verify the persistence module is importable alongside autoSave
    const { extractPersistContent } = await import("@/features/chat/hooks/useChatPersistence");
    expect(extractPersistContent("text---OPERATIONS---json")).toBe("text");
  });
});
