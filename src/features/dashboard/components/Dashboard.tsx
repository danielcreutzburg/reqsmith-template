import { useMemo, useState, memo, lazy, Suspense } from "react";
import { FileText, MessageSquare, Layout, Plus, Upload, ArrowRight, Clock, ChevronDown, ChevronUp, BarChart3, Sparkles, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalytics } from "../hooks/useAnalytics";
import type { ChatSession } from "@/features/sessions/hooks/useSessions";
import type { useAchievements } from "@/features/gamification/hooks/useAchievements";

// Lazy load heavy components (charts use recharts, badges have gallery)
const AnalyticsCharts = lazy(() => import("./AnalyticsCharts").then(m => ({ default: m.AnalyticsCharts })));
const BadgeGallery = lazy(() => import("@/features/gamification/components/BadgeGallery").then(m => ({ default: m.BadgeGallery })));
const BadgeProgress = lazy(() => import("@/features/gamification/components/BadgeProgress").then(m => ({ default: m.BadgeProgress })));

function LazyFallback() {
  return <LoadingSkeleton variant="chart" />;
}

interface DashboardProps {
  sessions: ChatSession[];
  usageRemaining: number;
  usageMax: number;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onImport?: () => void;
  achievements?: ReturnType<typeof useAchievements>;
}

const StatCard = memo(function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
});

const SessionRow = memo(function SessionRow({
  session,
  onSelect,
}: {
  session: ChatSession;
  onSelect: (id: string) => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all duration-150 group"
      onClick={() => onSelect(session.id)}
    >
      <CardContent className="py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate text-sm">{session.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(session.updated_at).toLocaleDateString()}
            </p>
          </div>
          {session.template_id && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {session.template_id}
            </Badge>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </CardContent>
    </Card>
  );
});

export function Dashboard({ sessions, usageRemaining, usageMax, onSelectSession, onNewSession, onImport, achievements }: DashboardProps) {
  const { t, language } = useLanguage();
  const { analytics, loading: analyticsLoading } = useAnalytics(sessions);
  const [showAll, setShowAll] = useState(false);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const docsCreated = sessions.filter((s) => s.document && s.document.length > 50).length;
    const templatesUsed = new Set(sessions.filter((s) => s.template_id).map((s) => s.template_id)).size;
    return { totalSessions, docsCreated, templatesUsed };
  }, [sessions]);

  const recentSessions = showAll ? sessions : sessions.slice(0, 5);
  const usagePercent = usageMax > 0 ? Math.round(((usageMax - usageRemaining) / usageMax) * 100) : 0;

  const statCards = [
    { label: t("dashboard.stats.sessions"), value: stats.totalSessions, icon: MessageSquare },
    { label: t("dashboard.stats.documents"), value: stats.docsCreated, icon: FileText },
    { label: t("dashboard.stats.templates"), value: stats.templatesUsed, icon: Layout },
    { label: t("dashboard.stats.remaining"), value: `${usageRemaining}/${usageMax}`, icon: Clock },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto" role="region" aria-label="Dashboard">
      <div className="max-w-4xl mx-auto w-full p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onNewSession} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              {t("dashboard.newSession")}
            </Button>
            {onImport && (
              <Button variant="outline" onClick={onImport} className="gap-2">
                <Upload className="w-4 h-4" />
                {t("dashboard.importDoc")}
              </Button>
            )}
          </div>
        </div>

        {/* Usage bar */}
        <Card>
          <CardContent className="py-3 px-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t("dashboard.stats.remaining")}
              </span>
              <span className="text-sm text-muted-foreground">{usageRemaining} / {usageMax}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Tabbed content */}
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="sessions" className="gap-1.5">
              <FileText className="w-4 h-4" />
              {t("dashboard.tab.sessions")}
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              {t("dashboard.tab.stats")}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5">
              <Award className="w-4 h-4" />
              {t("dashboard.tab.badges")}
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.recent")}</h2>
              {sessions.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  {recentSessions.length} / {sessions.length}
                </Badge>
              )}
            </div>
            {recentSessions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t("session.empty")}
                description={language === "de"
                  ? "Erstelle deine erste Session und beginne mit dem Anforderungsmanagement."
                  : "Create your first session and start managing requirements."}
                actionLabel={t("dashboard.newSession")}
                onAction={onNewSession}
              />
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <SessionRow key={session.id} session={session} onSelect={onSelectSession} />
                ))}
              </div>
            )}
            {sessions.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 gap-2"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {t("dashboard.showLess")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t("dashboard.showAll")}
                  </>
                )}
              </Button>
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {statCards.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
            <Suspense fallback={<LazyFallback />}>
              <AnalyticsCharts analytics={analytics} loading={analyticsLoading} />
            </Suspense>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4 mt-4">
            {achievements?.loading ? (
              <LoadingSkeleton variant="card" count={8} />
            ) : achievements && achievements.badges.length > 0 ? (
              <Suspense fallback={<LazyFallback />}>
                <BadgeProgress
                  nextBadge={achievements.nextBadge}
                  earnedCount={achievements.earnedCount}
                  totalCount={achievements.totalCount}
                />
                <BadgeGallery badges={achievements.badges} streak={achievements.streak} />
              </Suspense>
            ) : (
              <EmptyState
                icon={Award}
                title={language === "de" ? "Noch keine Abzeichen" : "No badges yet"}
                description={language === "de"
                  ? "Nutze die App regelmäßig, um Abzeichen freizuschalten."
                  : "Use the app regularly to unlock badges."}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
