import { useState } from "react";
import { BookOpen, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GlossaryTerm } from "../hooks/useGlossary";

interface GlossaryPanelProps {
  terms: GlossaryTerm[];
  onAdd: (term: string, definition: string) => Promise<void>;
  onUpdate: (id: string, term: string, definition: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
}

export function GlossaryPanel({ terms, onAdd, onUpdate, onDelete, disabled }: GlossaryPanelProps) {
  const { t } = useLanguage();
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDef, setEditDef] = useState("");

  const handleAdd = async () => {
    if (!newTerm.trim()) return;
    await onAdd(newTerm.trim(), newDef.trim());
    setNewTerm("");
    setNewDef("");
  };

  const startEdit = (t: GlossaryTerm) => {
    setEditId(t.id);
    setEditTerm(t.term);
    setEditDef(t.definition);
  };

  const handleUpdate = async () => {
    if (!editId || !editTerm.trim()) return;
    await onUpdate(editId, editTerm.trim(), editDef.trim());
    setEditId(null);
  };

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
              <BookOpen className="w-4 h-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("glossary.button")}{terms.length > 0 ? ` (${terms.length})` : ""}</TooltipContent>
      </Tooltip>
      <SheetContent className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>{t("glossary.title")}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Input
              placeholder={t("glossary.termPlaceholder")}
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder={t("glossary.defPlaceholder")}
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              className="text-sm min-h-[60px]"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newTerm.trim()} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              {t("glossary.add")}
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2 pr-2">
              {terms.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">{t("glossary.empty")}</p>
              )}
              {terms.map((term) => (
                <div key={term.id} className="p-3 rounded-lg border border-border bg-card">
                  {editId === term.id ? (
                    <div className="space-y-2">
                      <Input value={editTerm} onChange={(e) => setEditTerm(e.target.value)} className="text-sm" />
                      <Textarea value={editDef} onChange={(e) => setEditDef(e.target.value)} className="text-sm min-h-[60px]" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdate} className="flex-1">{t("customTemplate.save")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{t("customTemplate.cancel")}</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">{term.term}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(term)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(term.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {term.definition && (
                        <p className="text-xs text-muted-foreground mt-1">{term.definition}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
