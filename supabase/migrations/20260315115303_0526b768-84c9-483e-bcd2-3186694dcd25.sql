
-- Fix 1: Drop the view that bypasses RLS (it's not needed since we use security definer functions)
DROP VIEW IF EXISTS public.shared_document_comments_public;

-- Fix 2: Restrict authenticated SELECT policy on shared_document_comments to document owner only
DROP POLICY IF EXISTS "Authenticated users can read comments of accessible docs" ON public.shared_document_comments;

CREATE POLICY "Doc owners can read comments"
ON public.shared_document_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_documents sd
    WHERE sd.id = shared_document_comments.shared_document_id
    AND sd.user_id = auth.uid()
  )
);
