import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts, type ShortcutAction } from "@/hooks/useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  it("toggles overlay on ? key", () => {
    const { result } = renderHook(() => useKeyboardShortcuts([]));
    expect(result.current.showOverlay).toBe(false);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    expect(result.current.showOverlay).toBe(true);
  });

  it("fires shortcut action on matching key combo", () => {
    const action = vi.fn();
    const shortcuts: ShortcutAction[] = [
      { key: "s", ctrl: true, label: "Speichern", labelEn: "Save", category: "General", action },
    ];
    renderHook(() => useKeyboardShortcuts(shortcuts));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true }));
    });
    expect(action).toHaveBeenCalledOnce();
  });

  it("does not fire non-ctrl shortcuts when typing in input", () => {
    const action = vi.fn();
    const shortcuts: ShortcutAction[] = [
      { key: "n", label: "Neu", labelEn: "New", category: "General", action },
    ];
    renderHook(() => useKeyboardShortcuts(shortcuts));
    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "n", bubbles: true }));
    });
    expect(action).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
