CREATE TABLE public.llm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL DEFAULT '',
  api_key text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  has_custom_key boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.llm_settings (api_url, api_key, model, has_custom_key) VALUES ('', '', '', false);