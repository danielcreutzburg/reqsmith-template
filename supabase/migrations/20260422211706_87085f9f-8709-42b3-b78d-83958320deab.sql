-- Block all client DELETEs on user_badges. SECURITY DEFINER functions still bypass.
CREATE POLICY "Restrict client DELETE on user_badges"
ON public.user_badges AS RESTRICTIVE FOR DELETE
TO authenticated, anon
USING (false);

-- Defense in depth: also revoke table-level DELETE from client roles.
REVOKE DELETE ON public.user_badges FROM anon, authenticated;