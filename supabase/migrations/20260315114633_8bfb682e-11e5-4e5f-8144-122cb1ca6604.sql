
-- Fix 1: Remove anon SELECT on shared_document_comments that exposes author_email
-- Replace with a view that excludes author_email for anon access

DROP POLICY IF EXISTS "Anon can read comments of active docs" ON public.shared_document_comments;

-- Create a public view without author_email for anonymous access
CREATE OR REPLACE VIEW public.shared_document_comments_public
WITH (security_invoker = on) AS
  SELECT id, shared_document_id, author_name, content, section_ref, created_at
  FROM public.shared_document_comments;

-- Fix 2: Restrict shared_documents anon SELECT to require share_token match
-- Remove the overly permissive anon policy
DROP POLICY IF EXISTS "Anyone can read active shared docs" ON public.shared_documents;

-- No new anon policy on shared_documents base table - access only via token-based query
-- We create a security definer function for token-based lookup instead
CREATE OR REPLACE FUNCTION public.get_shared_document_by_token(_token text)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  template_name text,
  allow_comments boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, content, template_name, allow_comments, created_at, updated_at
  FROM shared_documents
  WHERE share_token = _token AND is_active = true
  LIMIT 1;
$$;

-- Function to get comments for a shared document (by document id, no email exposed)
CREATE OR REPLACE FUNCTION public.get_shared_document_comments(_doc_id uuid)
RETURNS TABLE(
  id uuid,
  author_name text,
  content text,
  section_ref text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.author_name, c.content, c.section_ref, c.created_at
  FROM shared_document_comments c
  JOIN shared_documents d ON d.id = c.shared_document_id
  WHERE c.shared_document_id = _doc_id AND d.is_active = true
  ORDER BY c.created_at ASC;
$$;

-- Function for anon users to add comments (validates doc is active and allows comments)
CREATE OR REPLACE FUNCTION public.add_shared_document_comment(_doc_id uuid, _author_name text, _content text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify document exists, is active, and allows comments
  IF NOT EXISTS (
    SELECT 1 FROM shared_documents
    WHERE id = _doc_id AND is_active = true AND allow_comments = true
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO shared_document_comments (shared_document_id, author_name, content)
  VALUES (_doc_id, _author_name, _content);

  RETURN true;
END;
$$;
