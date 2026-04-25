-- Drop the unused public-comment email column to eliminate PII exposure to doc owners.
-- Drop dependent view first, then column, then recreate the view without the column.
DROP VIEW IF EXISTS public.shared_document_comments_public;

ALTER TABLE public.shared_document_comments DROP COLUMN IF EXISTS author_email;

CREATE OR REPLACE VIEW public.shared_document_comments_public
WITH (security_invoker = on) AS
SELECT
  c.id,
  c.shared_document_id,
  c.author_name,
  c.content,
  c.section_ref,
  c.created_at
FROM public.shared_document_comments c
JOIN public.shared_documents d ON d.id = c.shared_document_id
WHERE d.is_active = true;