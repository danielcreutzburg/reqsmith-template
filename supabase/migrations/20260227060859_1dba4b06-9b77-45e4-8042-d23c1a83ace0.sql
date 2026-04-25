
-- Create document_versions table for version history
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies via session ownership
CREATE POLICY "Users can view own document versions"
ON public.document_versions FOR SELECT
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own document versions"
ON public.document_versions FOR INSERT
WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own document versions"
ON public.document_versions FOR DELETE
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_document_versions_session_id ON public.document_versions(session_id, version_number DESC);
