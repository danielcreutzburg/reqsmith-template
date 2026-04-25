import { useState } from "react";
import { History, Star, X, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SavedPrompt } from "../hooks/useSavedPrompts";

interface PromptHistoryProps {
  frequent: SavedPrompt[];
  favorites: SavedPrompt[];
  onSelect: (content: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PromptHistory({ frequent, favorites, onSelect, onToggleFavorite, onDelete }: PromptHistoryProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleSelect = (content: string) => {
    onSelect(content);
    setOpen(false);
  };

  const PromptItem = ({ prompt }: { prompt: SavedPrompt }) => (
    <div className="flex items-start gap-2 py-2 px-2 rounded-md hover:bg-muted/50 group cursor-pointer">
      <button
        className="flex-1 text-left text-sm text-foreground truncate"
        onClick={() => handleSelect(prompt.content)}
        title={prompt.content}
      >
        <span className="line-clamp-2">{prompt.content}</span>
        <span className="text-xs text-muted-foreground">×{prompt.use_count}</span>
      </button>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          {prompt.is_favorite ? <Star className="w-3.5 h-3.5 fill-primary text-primary" /> : <StarOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const hasContent = frequent.length > 0 || favorites.length > 0;
  if (!hasContent) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <History className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{t("prompts.title")}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <Tabs defaultValue="frequent" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="frequent">{t("prompts.frequent")}</TabsTrigger>
            <TabsTrigger value="favorites">{t("prompts.favorites")}</TabsTrigger>
          </TabsList>
          <TabsContent value="frequent" className="m-0">
            <ScrollArea className="max-h-64 p-2">
              {frequent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("prompts.empty")}</p>
              ) : (
                frequent.map((p) => <PromptItem key={p.id} prompt={p} />)
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="favorites" className="m-0">
            <ScrollArea className="max-h-64 p-2">
              {favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("prompts.noFavorites")}</p>
              ) : (
                favorites.map((p) => <PromptItem key={p.id} prompt={p} />)
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
