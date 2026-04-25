
-- Drop the conflicting old restrictive policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Collaborators can view sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Collaborators can update sessions" ON public.chat_sessions;

-- Recreate as single policies that include collaborators
CREATE POLICY "Users and collaborators can view sessions"
  ON public.chat_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_collaborator(auth.uid(), id));

CREATE POLICY "Users and collaborators can update sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_collaborator(auth.uid(), id));
