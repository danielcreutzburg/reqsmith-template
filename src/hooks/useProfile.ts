import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  display_name: string;
  avatar_url: string;
}

async function resolveAvatarUrl(stored: string | null): Promise<string> {
  if (!stored) return "";
  // Legacy values may already be a full URL (from when the bucket was public).
  // New values store only the storage path (e.g. "<user_id>/avatar.png").
  if (/^https?:\/\//i.test(stored)) return stored;
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(stored, 60 * 60);
  return data?.signedUrl ?? "";
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const signed = await resolveAvatarUrl(data.avatar_url);
        setProfile({ display_name: data.display_name ?? "", avatar_url: signed });
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateAvatar = (url: string) => {
    setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
  };

  return { profile, loading, updateAvatar };
}
