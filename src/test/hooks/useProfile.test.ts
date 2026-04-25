import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

let currentUser: any = { id: "u1" };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: currentUser }) }));

const single = vi.fn();
const createSignedUrl = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
    })),
    storage: {
      from: vi.fn(() => ({ createSignedUrl })),
    },
  },
}));

import { useProfile } from "@/hooks/useProfile";

describe("useProfile", () => {
  it("returns null profile when no user", async () => {
    currentUser = null;
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
  });

  it("uses stored URL directly when avatar is a full http URL", async () => {
    currentUser = { id: "u1" };
    single.mockResolvedValueOnce({ data: { display_name: "Alice", avatar_url: "https://cdn/x.png" } });
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.profile?.display_name).toBe("Alice"));
    expect(result.current.profile?.avatar_url).toBe("https://cdn/x.png");
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("creates signed URL for storage path", async () => {
    currentUser = { id: "u1" };
    single.mockResolvedValueOnce({ data: { display_name: "Bob", avatar_url: "u1/avatar.png" } });
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://signed" } });
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.profile?.avatar_url).toBe("https://signed"));
  });

  it("handles missing data row", async () => {
    currentUser = { id: "u1" };
    single.mockResolvedValueOnce({ data: null });
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
  });

  it("updateAvatar replaces current avatar URL", async () => {
    currentUser = { id: "u1" };
    single.mockResolvedValueOnce({ data: { display_name: "Eve", avatar_url: "https://cdn/e.png" } });
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.profile?.display_name).toBe("Eve"));
    act(() => result.current.updateAvatar("https://new"));
    expect(result.current.profile?.avatar_url).toBe("https://new");
  });
});
