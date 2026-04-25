import { Plus, Trash2, MessageSquare, LogOut, MoreVertical, Home, Copy, BookTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { SearchBar } from "@/features/search/components/SearchBar";
import type { ChatSession } from "../hooks/useSessions";

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onDelete: (sessionId: string) => void;
  onBackToDashboard: () => void;
  onDuplicate?: (sessionId: string) => void;
  onSaveAsTemplate?: (sessionId: string) => void;
}

export function SessionSidebar({ sessions, activeSessionId, onSelect, onNew, onDelete, onBackToDashboard, onDuplicate, onSaveAsTemplate }: SessionSidebarProps) {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  return (
    <nav className="flex flex-col h-full w-64 border-r border-border bg-sidebar-background" aria-label="Sessions">
      <div className="flex-shrink-0 p-3 border-b border-sidebar-border space-y-2">
        <Button variant="ghost" size="sm" className="w-full gap-2 justify-start" onClick={onBackToDashboard}>
          <Home className="w-4 h-4" />
          {t("dashboard.backToDashboard")}
        </Button>
        <SearchBar onSelectSession={onSelect} />
        <Button onClick={onNew} size="sm" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          {t("session.new")}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t("session.empty")}
            </p>
          )}
          {sessions.map((session) => {
            const displayTitle = session.title.length > 25
              ? session.title.slice(0, 25) + "..."
              : session.title;
            return (
              <div
                key={session.id}
                className={cn(
                  "flex items-center rounded-md text-sm cursor-pointer transition-colors overflow-hidden",
                  session.id === activeSessionId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <div
                  className="flex items-center gap-2 flex-1 min-w-0 px-2 py-2 overflow-hidden"
                  onClick={() => onSelect(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(session.id); } }}
                  aria-label={`Session: ${session.title}`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate text-xs">{displayTitle}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1 mr-1 flex-shrink-0 rounded hover:bg-sidebar-accent/80"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Session-Menü"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="right">
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(session.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        {t("session.duplicate")}
                      </DropdownMenuItem>
                    )}
                    {onSaveAsTemplate && session.document && (
                      <DropdownMenuItem onClick={() => onSaveAsTemplate(session.id)}>
                        <BookTemplate className="w-4 h-4 mr-2" />
                        {t("session.saveAsTemplate")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("session.delete")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("session.deleteConfirm.title")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("session.deleteConfirm.description")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("session.deleteConfirm.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDelete(session.id)}
                          >
                            {t("session.deleteConfirm.confirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-muted-foreground truncate">
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={signOut} aria-label="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
