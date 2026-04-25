import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AnalyticsData {
  sharedDocsCount: number;
  totalComments: number;
  activeShares: number;
  weeklyActivity: { week: string; sessions: number; documents: number }[];
  templateBreakdown: { name: string; count: number }[];
  totalWordsWritten: number;
}

export function useAnalytics(sessions: { id: string; template_id: string | null; document: string; created_at: string }[]) {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    sharedDocsCount: 0,
    totalComments: 0,
    activeShares: 0,
    weeklyActivity: [],
    templateBreakdown: [],
    totalWordsWritten: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);

      // Sharing feature removed — these counters are kept at 0 for compatibility
      const sharedDocsCount = 0;
      const activeShares = 0;
      const totalComments = 0;

      // Calculate weekly activity from sessions (last 8 weeks)
      const now = new Date();
      const weeks: { week: string; sessions: number; documents: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekLabel = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`;
        const weekSessions = sessions.filter((s) => {
          const d = new Date(s.created_at);
          return d >= weekStart && d < weekEnd;
        });

        weeks.push({
          week: weekLabel,
          sessions: weekSessions.length,
          documents: weekSessions.filter((s) => s.document && s.document.length > 50).length,
        });
      }

      // Template breakdown
      const templateCounts: Record<string, number> = {};
      sessions.forEach((s) => {
        if (s.template_id) {
          templateCounts[s.template_id] = (templateCounts[s.template_id] || 0) + 1;
        }
      });
      const templateBreakdown = Object.entries(templateCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Total words written
      const totalWordsWritten = sessions.reduce((sum, s) => {
        if (s.document) {
          return sum + s.document.split(/\s+/).filter(Boolean).length;
        }
        return sum;
      }, 0);

      setData({
        sharedDocsCount,
        totalComments,
        activeShares,
        weeklyActivity: weeks,
        templateBreakdown,
        totalWordsWritten,
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [user, sessions]);

  return { analytics: data, loading };
}
