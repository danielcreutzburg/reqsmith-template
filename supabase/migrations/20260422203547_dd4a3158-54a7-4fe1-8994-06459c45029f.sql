-- 1) Add owner check to search_sessions
CREATE OR REPLACE FUNCTION public.search_sessions(_user_id uuid, _query text)
 RETURNS TABLE(id uuid, title text, document text, template_id text, updated_at timestamp with time zone, match_type text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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
$function$;

-- 2) Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- 3) Storage policies for avatars (owner-scoped by first folder = user_id)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);