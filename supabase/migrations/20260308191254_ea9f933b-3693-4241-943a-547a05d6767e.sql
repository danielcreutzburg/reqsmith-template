
CREATE TABLE public.slack_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  team_id text NOT NULL,
  team_name text NOT NULL DEFAULT '',
  channel_id text,
  channel_name text,
  bot_user_id text,
  scope text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.slack_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slack connection"
  ON public.slack_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own slack connection"
  ON public.slack_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own slack connection"
  ON public.slack_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own slack connection"
  ON public.slack_connections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
