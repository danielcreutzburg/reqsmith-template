-- Full-text search function over sessions + documents
CREATE OR REPLACE FUNCTION public.search_sessions(_user_id uuid, _query text)
RETURNS TABLE(
  id uuid,
  title text,
  document text,
  template_id text,
  updated_at timestamptz,
  match_type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (cs.id)
    cs.id,
    cs.title,
    cs.document,
    cs.template_id,
    cs.updated_at,
    CASE
      WHEN cs.title ILIKE '%' || _query || '%' THEN 'title'
      WHEN cs.document ILIKE '%' || _query || '%' THEN 'document'
      ELSE 'message'
    END AS match_type
  FROM chat_sessions cs
  LEFT JOIN chat_messages cm ON cm.session_id = cs.id
  WHERE cs.user_id = _user_id
    AND (
      cs.title ILIKE '%' || _query || '%'
      OR cs.document ILIKE '%' || _query || '%'
      OR cm.content ILIKE '%' || _query || '%'
    )
  ORDER BY cs.id, cs.updated_at DESC;
END;
$$;

-- Create chat_attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);

-- Storage policies for chat attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Add updated_at column to chat_sessions for conflict detection (already exists, add version counter)
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;