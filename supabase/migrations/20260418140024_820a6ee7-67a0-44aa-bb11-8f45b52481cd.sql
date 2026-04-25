-- Remove client-side write access to user_badges.
-- Badges are awarded exclusively by the SECURITY DEFINER function check_and_award_badges.
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update own badges" ON public.user_badges;

CREATE POLICY "Deny client insert on user_badges"
ON public.user_badges FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny client update on user_badges"
ON public.user_badges FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);