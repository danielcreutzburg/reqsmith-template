import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Hammer, Languages, Shield, LogOut, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useLanguage } from "@/i18n/LanguageContext";
import { useUsage } from "@/features/chat/hooks/useUsage";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AccountSettings } from "@/components/AccountSettings";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useUsage();
  const { user, signOut } = useAuth();
  const { profile, updateAvatar } = useProfile();
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="flex-shrink-0 h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50" role="banner">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group" aria-label="ReqSmith – Startseite">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-md transition-shadow">
              <Hammer className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline">ReqSmith</span>
          </Link>
        </div>

        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Hauptnavigation">
          {isAdmin && (
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-medium" asChild>
              <Link to="/admin"><Shield className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">Admin</span></Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "de" ? "en" : "de")}
            className="h-8 px-2 gap-1 text-xs font-medium"
            aria-label={`Sprache wechseln zu ${language === "de" ? "Englisch" : "Deutsch"}`}
          >
            <Languages className="w-4 h-4" aria-hidden="true" />
            {language === "de" ? "EN" : "DE"}
          </Button>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("header.themeToggle")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          )}
          {user && (
            <>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-medium" asChild>
                <Link to="/app"><Award className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">{t("badges.title")}</span></Link>
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" aria-label={t("account.settings")}>
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile?.display_name || t("account.settings")}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Separator />
                    <AccountSettings
                      avatarUrl={profile?.avatar_url || ""}
                      displayName={profile?.display_name || ""}
                      onAvatarChange={updateAvatar}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} aria-label="Logout">
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
