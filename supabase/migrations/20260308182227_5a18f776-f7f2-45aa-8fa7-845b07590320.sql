
-- Shared documents table for public sharing
CREATE TABLE public.shared_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  template_name text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  allow_comments boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments/feedback on shared documents
CREATE TABLE public.shared_document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_document_id uuid NOT NULL REFERENCES public.shared_documents(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonym',
  author_email text DEFAULT '',
  content text NOT NULL,
  section_ref text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for shared_documents
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shared docs"
  ON public.shared_documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public read for shared docs via token (handled by edge function, but allow anon select)
CREATE POLICY "Anyone can read active shared docs"
  ON public.shared_documents FOR SELECT
  TO anon
  USING (is_active = true);

-- RLS for comments
ALTER TABLE public.shared_document_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on shared docs
CREATE POLICY "Anyone can read comments"
  ON public.shared_document_comments FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can add comments to shared docs
CREATE POLICY "Anyone can add comments"
  ON public.shared_document_comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Owners can delete comments on their shared docs
CREATE POLICY "Doc owners can delete comments"
  ON public.shared_document_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_documents sd
      WHERE sd.id = shared_document_comments.shared_document_id
      AND sd.user_id = auth.uid()
    )
  );
