
-- 1. Roles enum & table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS: users can read own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. usage_counts table
CREATE TABLE public.usage_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  message_count integer NOT NULL DEFAULT 0,
  max_messages integer NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_counts ENABLE ROW LEVEL SECURITY;

-- RLS: users can read own usage
CREATE POLICY "Users can view own usage"
ON public.usage_counts FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. check_and_increment_usage security definer function
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _current integer;
  _max integer;
BEGIN
  SELECT has_role(_user_id, 'admin') INTO _is_admin;
  IF _is_admin THEN RETURN true; END IF;

  INSERT INTO usage_counts (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT message_count, max_messages INTO _current, _max
  FROM usage_counts WHERE user_id = _user_id;

  IF _current >= _max THEN RETURN false; END IF;

  UPDATE usage_counts SET message_count = _current + 1, updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END $$;

-- 5. Update handle_new_user to add role + usage entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  INSERT INTO public.usage_counts (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
