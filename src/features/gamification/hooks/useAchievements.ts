import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

export interface BadgeDefinition {
  key: string;
  name_de: string;
  name_en: string;
  description_de: string;
  description_en: string;
  icon: string;
  category: string;
  threshold: number;
  metric: string;
  sort_order: number;
}

export interface UserBadge {
  badge_key: string;
  progress: number;
  earned_at: string | null;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface BadgeWithProgress extends BadgeDefinition {
  progress: number;
  earned: boolean;
  earned_at: string | null;
}

export function useAchievements() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, longest_streak: 0, last_active_date: null });
  const [loading, setLoading] = useState(true);
  const [newBadgeCount, setNewBadgeCount] = useState(0);

  const loadBadges = useCallback(async () => {
    if (!user) return;

    const [{ data: definitions }, { data: userBadges }, { data: streakData }] = await Promise.all([
      supabase.from("badge_definitions").select("*").order("sort_order"),
      supabase.from("user_badges").select("badge_key, progress, earned_at").eq("user_id", user.id),
      supabase.from("user_streaks").select("current_streak, longest_streak, last_active_date").eq("user_id", user.id).maybeSingle(),
    ]);

    if (definitions) {
      const badgeMap = new Map((userBadges || []).map((b: any) => [b.badge_key, b]));
      const merged: BadgeWithProgress[] = definitions.map((d: any) => {
        const ub = badgeMap.get(d.key) as UserBadge | undefined;
        return {
          ...d,
          progress: ub?.progress ?? 0,
          earned: !!ub?.earned_at,
          earned_at: ub?.earned_at ?? null,
        };
      });
      setBadges(merged);
    }

    if (streakData) {
      setStreak(streakData as UserStreak);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const checkBadges = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc("check_and_award_badges", { _user_id: user.id });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      setNewBadgeCount((prev) => prev + data.length);
      data.forEach((badge: any) => {
        toast({
          title: `${badge.icon} ${language === "de" ? badge.name_de : badge.name_en}`,
          description: language === "de" ? "Neues Abzeichen verdient!" : "New badge earned!",
        });
      });
      // Reload badges to get updated progress
      await loadBadges();
    } else if (!error) {
      // Still reload to update progress even if no new badges
      await loadBadges();
    }
  }, [user, language, toast, loadBadges]);

  const clearNewBadgeCount = useCallback(() => setNewBadgeCount(0), []);

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  const nextBadge = badges
    .filter((b) => !b.earned)
    .sort((a, b) => (b.progress / b.threshold) - (a.progress / a.threshold))[0] ?? null;

  return {
    badges,
    streak,
    loading,
    earnedCount,
    totalCount,
    nextBadge,
    newBadgeCount,
    clearNewBadgeCount,
    checkBadges,
  };
}
