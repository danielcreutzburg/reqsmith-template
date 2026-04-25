import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, FileText, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearch, type SearchResult } from "../hooks/useSearch";
import { useLanguage } from "@/i18n/LanguageContext";

interface SearchBarProps {
  onSelectSession: (sessionId: string) => void;
}

export function SearchBar({ onSelectSession }: SearchBarProps) {
  const { results, isSearching, query, search, clearSearch } = useSearch();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { t } = useLanguage();

  const handleChange = useCallback((value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }, [search]);

  const handleSelect = (result: SearchResult) => {
    onSelectSession(result.id);
    setOpen(false);
    setInputValue("");
    clearSearch();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const matchIcon = (type: string) => {
    if (type === "title") return <MessageSquare className="w-3 h-3" />;
    if (type === "document") return <FileText className="w-3 h-3" />;
    return <MessageSquare className="w-3 h-3" />;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t("search.placeholder")}
          className="pl-8 pr-16 h-8 text-xs"
        />
        <div className="absolute right-2 top-1.5 flex items-center gap-1">
          {isSearching && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          {inputValue && (
            <button onClick={() => { setInputValue(""); clearSearch(); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground bg-muted px-1 rounded">⌘K</kbd>
        </div>
      </div>

      {open && inputValue && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(r.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px] gap-1">
                {matchIcon(r.match_type)}
                {t(`search.match.${r.match_type}` as any)}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {open && inputValue && !isSearching && results.length === 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-50 p-3 text-center text-sm text-muted-foreground">
          {t("search.noResults")}
        </div>
      )}
    </div>
  );
}
