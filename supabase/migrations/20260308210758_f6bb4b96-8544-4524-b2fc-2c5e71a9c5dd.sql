-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';

-- Create login_attempts table for rate limiting
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  ip_hint text DEFAULT ''
);

-- RLS: no client access, only via security definer function
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all on login_attempts" ON public.login_attempts
FOR ALL USING (false) WITH CHECK (false);

-- Function to check rate limit (max 5 attempts in 15 min)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _oldest timestamptz;
  _wait_seconds integer;
BEGIN
  -- Clean old entries (older than 15 min)
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '15 minutes';
  
  -- Count recent attempts
  SELECT count(*), min(attempted_at) INTO _count, _oldest
  FROM login_attempts
  WHERE email = lower(_email) AND attempted_at > now() - interval '15 minutes';
  
  IF _count >= 5 THEN
    _wait_seconds := EXTRACT(EPOCH FROM (_oldest + interval '15 minutes' - now()))::integer;
    RETURN jsonb_build_object('allowed', false, 'wait_seconds', GREATEST(_wait_seconds, 1));
  END IF;
  
  -- Record attempt
  INSERT INTO login_attempts (email) VALUES (lower(_email));
  
  RETURN jsonb_build_object('allowed', true, 'wait_seconds', 0);
END;
$$;

-- Function to clear attempts on successful login
CREATE OR REPLACE FUNCTION public.clear_login_attempts(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_attempts WHERE email = lower(_email);
END;
$$;