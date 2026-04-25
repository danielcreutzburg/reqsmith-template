
-- Collaborators: who has access to which session
CREATE TABLE public.document_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor',
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

-- Security definer function to check collaboration access
CREATE OR REPLACE FUNCTION public.is_collaborator(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.document_collaborators
    WHERE user_id = _user_id AND session_id = _session_id
  ) OR EXISTS (
    SELECT 1 FROM public.chat_sessions
    WHERE id = _session_id AND user_id = _user_id
  )
$$;

-- Collaborators policies
CREATE POLICY "Users can view collaborators of their sessions"
  ON public.document_collaborators FOR SELECT TO authenticated
  USING (public.is_collaborator(auth.uid(), session_id));

CREATE POLICY "Session owners can insert collaborators"
  ON public.document_collaborators FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Session owners can delete collaborators"
  ON public.document_collaborators FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid()
  ));

-- Inline comments for collaboration
CREATE TABLE public.inline_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.inline_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  section_ref text,
  position_start integer,
  position_end integer,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inline_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators can view comments"
  ON public.inline_comments FOR SELECT TO authenticated
  USING (public.is_collaborator(auth.uid(), session_id));

CREATE POLICY "Collaborators can insert comments"
  ON public.inline_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_collaborator(auth.uid(), session_id) AND user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.inline_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Comment owners and session owners can delete"
  ON public.inline_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid()
  ));

-- Allow collaborators to view and edit shared sessions
CREATE POLICY "Collaborators can view sessions"
  ON public.chat_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_collaborator(auth.uid(), id));

CREATE POLICY "Collaborators can update sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_collaborator(auth.uid(), id));

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.inline_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_collaborators;
