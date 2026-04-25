-- Remove permissive client write policies on user_streaks
DROP POLICY IF EXISTS "Users can insert own streak" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update own streak" ON public.user_streaks;

-- Restrictive policies: block all client writes regardless of any future permissive policy.
-- SECURITY DEFINER functions (e.g. check_and_award_badges) run with bypass and are unaffected.
CREATE POLICY "Restrict client INSERT on user_streaks"
ON public.user_streaks AS RESTRICTIVE FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Restrict client UPDATE on user_streaks"
ON public.user_streaks AS RESTRICTIVE FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Restrict client DELETE on user_streaks"
ON public.user_streaks AS RESTRICTIVE FOR DELETE
TO authenticated, anon
USING (false);

-- Revoke direct table-level write privileges from client roles as a second layer of defense.
REVOKE INSERT, UPDATE, DELETE ON public.user_streaks FROM anon, authenticated;