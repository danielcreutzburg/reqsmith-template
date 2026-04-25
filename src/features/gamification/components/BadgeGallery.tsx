import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import type { BadgeWithProgress } from "../hooks/useAchievements";

interface BadgeGalleryProps {
  badges: BadgeWithProgress[];
  streak: { current_streak: number; longest_streak: number };
}

const CATEGORIES = [
  { key: "all", de: "Alle", en: "All" },
  { key: "chat", de: "Chat", en: "Chat" },
  { key: "documents", de: "Dokumente", en: "Documents" },
  { key: "collaboration", de: "Team", en: "Team" },
  { key: "features", de: "Features", en: "Features" },
  { key: "streaks", de: "Streaks", en: "Streaks" },
];

const BadgeCard = memo(function BadgeCard({
  badge,
  language,
}: {
  badge: BadgeWithProgress;
  language: string;
}) {
  const name = language === "de" ? badge.name_de : badge.name_en;
  const desc = language === "de" ? badge.description_de : badge.description_en;
  const percent = badge.threshold > 0 ? Math.round((badge.progress / badge.threshold) * 100) : 0;

  return (
    <Card className={`transition-all duration-200 ${badge.earned ? "border-primary/30 bg-primary/5 shadow-sm" : "opacity-60 grayscale"}`}>
      <CardContent className="p-4 text-center space-y-2">
        <div className="text-3xl" aria-hidden="true">{badge.icon}</div>
        <p className="font-semibold text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
        {badge.earned ? (
          <p className="text-xs text-primary font-medium">
            ✓ {new Date(badge.earned_at!).toLocaleDateString(language === "de" ? "de-DE" : "en-US")}
          </p>
        ) : (
          <div className="space-y-1">
            <Progress value={percent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{badge.progress} / {badge.threshold}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export function BadgeGallery({ badges, streak }: BadgeGalleryProps) {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Streak display */}
      <Card className="border-primary/20">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {streak.current_streak} {language === "de" ? "Tage Streak" : "Day Streak"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "de" ? "Längster" : "Longest"}: {streak.longest_streak} {language === "de" ? "Tage" : "days"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="w-full flex-wrap h-auto gap-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key} className="text-xs">
              {language === "de" ? cat.de : cat.en}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.key} value={cat.key}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges
                .filter((b) => cat.key === "all" || b.category === cat.key)
                .map((badge) => (
                  <BadgeCard key={badge.key} badge={badge} language={language} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
