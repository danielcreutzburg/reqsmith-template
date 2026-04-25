-- 1. Make chat-attachments bucket private (was public)
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- 2. Drop old public SELECT policy if exists, replace with owner-scoped
DROP POLICY IF EXISTS "Public read access for chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can read chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read own chat attachments" ON storage.objects;

CREATE POLICY "Authenticated users can read own chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Add explicit restrictive UPDATE policy: only file owner may update their own files
DROP POLICY IF EXISTS "Users can update own chat attachments" ON storage.objects;
CREATE POLICY "Users can update own chat attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);