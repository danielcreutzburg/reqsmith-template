import { useEffect, useCallback, useState } from "react";

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  labelEn: string;
  category: string;
  action: () => void;
}

/**
 * Global keyboard shortcuts hook.
 * Registers shortcuts and provides a list for the overlay.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;

      // ? key always toggles overlay (unless typing)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !isInput) {
        e.preventDefault();
        setShowOverlay((prev) => !prev);
        return;
      }

      // Escape closes overlay
      if (e.key === "Escape" && showOverlay) {
        setShowOverlay(false);
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        // Allow ctrl shortcuts even when in inputs (e.g. Ctrl+S save)
        if (ctrlMatch && shiftMatch && keyMatch && (shortcut.ctrl || !isInput)) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, showOverlay]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { showOverlay, setShowOverlay };
}
