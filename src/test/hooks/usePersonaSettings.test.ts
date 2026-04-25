import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const user = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user }) }));

const single = vi.fn().mockReturnValue({
  then: (resolve: any) => Promise.resolve({ data: { ai_persona: "strict-cpo", verbosity: "detailed" } }).then(resolve),
});
const updateEq = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
      update: vi.fn(() => ({ eq: updateEq })),
    })),
  },
}));

import { usePersonaSettings } from "@/features/chat/hooks/usePersonaSettings";

describe("usePersonaSettings", () => {
  it("loads persona and verbosity from profile", async () => {
    const { result } = renderHook(() => usePersonaSettings());
    await waitFor(() => expect(result.current.persona).toBe("strict-cpo"));
    expect(result.current.verbosity).toBe("detailed");
  });

  it("updatePersona sets state and writes to DB", async () => {
    const { result } = renderHook(() => usePersonaSettings());
    // wait for initial profile load to settle to avoid race with the effect
    await waitFor(() => expect(result.current.persona).toBe("strict-cpo"));
    await act(async () => {
      await result.current.updatePersona("balanced");
    });
    expect(result.current.persona).toBe("balanced");
    expect(updateEq).toHaveBeenCalled();
  });

  it("updateVerbosity sets state and writes to DB", async () => {
    const { result } = renderHook(() => usePersonaSettings());
    await waitFor(() => expect(result.current.verbosity).toBe("detailed"));
    await act(async () => {
      await result.current.updateVerbosity("concise");
    });
    expect(result.current.verbosity).toBe("concise");
    expect(updateEq).toHaveBeenCalled();
  });
});
