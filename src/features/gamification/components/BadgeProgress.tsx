import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import type { BadgeWithProgress } from "../hooks/useAchievements";

interface BadgeProgressProps {
  nextBadge: BadgeWithProgress | null;
  earnedCount: number;
  totalCount: number;
}

export function BadgeProgress({ nextBadge, earnedCount, totalCount }: BadgeProgressProps) {
  const { language } = useLanguage();

  if (!nextBadge) return null;

  const percent = nextBadge.threshold > 0 ? Math.round((nextBadge.progress / nextBadge.threshold) * 100) : 0;
  const name = language === "de" ? nextBadge.name_de : nextBadge.name_en;

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="py-3 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{nextBadge.icon}</span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {language === "de" ? "Nächstes Abzeichen" : "Next Badge"}
              </p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {earnedCount}/{totalCount}
          </span>
        </div>
        <div className="space-y-1">
          <Progress value={percent} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">
            {nextBadge.progress}/{nextBadge.threshold}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
