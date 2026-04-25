import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: ShortcutAction[];
}

function formatKey(shortcut: ShortcutAction): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join(" + ");
}

export function KeyboardShortcutsOverlay({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsOverlayProps) {
  const { language } = useLanguage();

  // Group by category
  const grouped = shortcuts.reduce<Record<string, ShortcutAction[]>>(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            {language === "de" ? "Tastenkürzel" : "Keyboard Shortcuts"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="space-y-1.5">
                {items.map((shortcut) => (
                  <div
                    key={`${shortcut.key}-${shortcut.ctrl}-${shortcut.shift}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">
                      {language === "de" ? shortcut.label : shortcut.labelEn}
                    </span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted rounded-md border border-border text-muted-foreground">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between py-1.5 px-2">
              <span className="text-sm text-muted-foreground">
                {language === "de" ? "Diese Hilfe anzeigen" : "Show this help"}
              </span>
              <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-muted rounded-md border border-border text-muted-foreground">
                ?
              </kbd>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
