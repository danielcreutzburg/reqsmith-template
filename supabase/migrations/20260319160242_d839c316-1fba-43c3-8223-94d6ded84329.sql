
-- Badge definitions table
CREATE TABLE public.badge_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name_de text NOT NULL,
  name_en text NOT NULL,
  description_de text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'general',
  threshold integer NOT NULL DEFAULT 1,
  metric text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read badge definitions"
  ON public.badge_definitions FOR SELECT TO authenticated
  USING (true);

-- User badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL REFERENCES public.badge_definitions(key) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  earned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own badges" ON public.user_badges
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User streaks table
CREATE TABLE public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON public.user_streaks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own streak" ON public.user_streaks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own streak" ON public.user_streaks
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Seed badge definitions
INSERT INTO public.badge_definitions (key, name_de, name_en, description_de, description_en, icon, category, threshold, metric, sort_order) VALUES
  ('first_message', 'Erste Schritte', 'First Steps', 'Erste Nachricht gesendet', 'Sent your first message', '🌱', 'chat', 1, 'message_count', 1),
  ('chatty', 'Gesprächig', 'Chatty', '25 Nachrichten gesendet', 'Sent 25 messages', '💬', 'chat', 25, 'message_count', 2),
  ('power_user', 'Power-User', 'Power User', '100 Nachrichten gesendet', 'Sent 100 messages', '⚡', 'chat', 100, 'message_count', 3),
  ('chat_marathon', 'Chat-Marathon', 'Chat Marathon', '500 Nachrichten gesendet', 'Sent 500 messages', '🏆', 'chat', 500, 'message_count', 4),
  ('first_draft', 'Erster Entwurf', 'First Draft', 'Erste Session erstellt', 'Created your first session', '📝', 'documents', 1, 'session_count', 5),
  ('productive', 'Produktiv', 'Productive', '10 Sessions erstellt', 'Created 10 sessions', '📚', 'documents', 10, 'session_count', 6),
  ('doc_pro', 'Dokumenten-Profi', 'Doc Pro', '25 Dokumente mit Inhalt erstellt', 'Created 25 documents with content', '🎯', 'documents', 25, 'doc_count', 7),
  ('template_master', 'Template-Meister', 'Template Master', '5 verschiedene Templates genutzt', 'Used 5 different templates', '🧩', 'documents', 5, 'unique_templates', 8),
  ('team_player', 'Team-Player', 'Team Player', 'Erstes Dokument geteilt', 'Shared your first document', '🤝', 'collaboration', 1, 'shared_count', 9),
  ('feedback_giver', 'Feedback-Geber', 'Feedback Giver', '5 Kommentare hinterlassen', 'Left 5 comments', '💭', 'collaboration', 5, 'comment_count', 10),
  ('glossary_fan', 'Glossar-Fan', 'Glossary Fan', '10 Glossareinträge erstellt', 'Created 10 glossary entries', '📖', 'features', 10, 'glossary_count', 11),
  ('custom_template', 'Vorlagen-Schmied', 'Template Smith', 'Eigenes Template erstellt', 'Created a custom template', '✨', 'features', 1, 'custom_template_count', 12),
  ('export_pro', 'Export-Profi', 'Export Pro', '10 Versionen erstellt', 'Created 10 versions', '📤', 'features', 10, 'version_count', 13),
  ('streak_3', '3-Tage-Streak', '3-Day Streak', '3 Tage in Folge aktiv', 'Active 3 days in a row', '🔥', 'streaks', 3, 'current_streak', 14),
  ('streak_7', 'Wochenkrieger', 'Week Warrior', '7 Tage in Folge aktiv', 'Active 7 days in a row', '💪', 'streaks', 7, 'current_streak', 15),
  ('streak_30', 'Monatsheld', 'Month Hero', '30 Tage in Folge aktiv', 'Active 30 days in a row', '🏅', 'streaks', 30, 'current_streak', 16);

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _message_count integer;
  _session_count integer;
  _doc_count integer;
  _unique_templates integer;
  _shared_count integer;
  _comment_count integer;
  _glossary_count integer;
  _custom_template_count integer;
  _version_count integer;
  _current_streak integer;
  _last_active date;
  _longest integer;
  _today date := current_date;
  _badge record;
  _metric_val integer;
  _newly_earned jsonb := '[]'::jsonb;
  _was_earned boolean;
BEGIN
  -- Gather metrics
  SELECT count(*) INTO _message_count FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id) AND role = 'user';
  SELECT count(*) INTO _session_count FROM chat_sessions WHERE user_id = _user_id;
  SELECT count(*) INTO _doc_count FROM chat_sessions WHERE user_id = _user_id AND length(document) > 50;
  SELECT count(DISTINCT template_id) INTO _unique_templates FROM chat_sessions WHERE user_id = _user_id AND template_id IS NOT NULL;
  SELECT count(*) INTO _shared_count FROM shared_documents WHERE user_id = _user_id;
  SELECT count(*) INTO _comment_count FROM inline_comments WHERE user_id = _user_id;
  SELECT count(*) INTO _glossary_count FROM glossary_terms WHERE user_id = _user_id;
  SELECT count(*) INTO _custom_template_count FROM custom_templates WHERE user_id = _user_id;
  SELECT count(*) INTO _version_count FROM document_versions WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id);

  -- Update streak
  SELECT current_streak, longest_streak, last_active_date INTO _current_streak, _longest, _last_active
  FROM user_streaks WHERE user_id = _user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (_user_id, 1, 1, _today);
    _current_streak := 1;
  ELSIF _last_active = _today THEN
    NULL;
  ELSIF _last_active = _today - 1 THEN
    _current_streak := _current_streak + 1;
    IF _current_streak > _longest THEN _longest := _current_streak; END IF;
    UPDATE user_streaks SET current_streak = _current_streak, longest_streak = _longest, last_active_date = _today, updated_at = now() WHERE user_id = _user_id;
  ELSE
    _current_streak := 1;
    UPDATE user_streaks SET current_streak = 1, last_active_date = _today, updated_at = now() WHERE user_id = _user_id;
  END IF;

  -- Check each badge
  FOR _badge IN SELECT * FROM badge_definitions ORDER BY sort_order LOOP
    _metric_val := CASE _badge.metric
      WHEN 'message_count' THEN _message_count
      WHEN 'session_count' THEN _session_count
      WHEN 'doc_count' THEN _doc_count
      WHEN 'unique_templates' THEN _unique_templates
      WHEN 'shared_count' THEN _shared_count
      WHEN 'comment_count' THEN _comment_count
      WHEN 'glossary_count' THEN _glossary_count
      WHEN 'custom_template_count' THEN _custom_template_count
      WHEN 'version_count' THEN _version_count
      WHEN 'current_streak' THEN _current_streak
      ELSE 0
    END;

    SELECT (earned_at IS NOT NULL) INTO _was_earned FROM user_badges WHERE user_id = _user_id AND badge_key = _badge.key;

    INSERT INTO user_badges (user_id, badge_key, progress, earned_at)
    VALUES (
      _user_id,
      _badge.key,
      LEAST(_metric_val, _badge.threshold),
      CASE WHEN _metric_val >= _badge.threshold THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id, badge_key) DO UPDATE SET
      progress = LEAST(_metric_val, _badge.threshold),
      earned_at = CASE
        WHEN user_badges.earned_at IS NOT NULL THEN user_badges.earned_at
        WHEN _metric_val >= _badge.threshold THEN now()
        ELSE NULL
      END;

    IF _metric_val >= _badge.threshold AND (_was_earned IS NULL OR _was_earned = false) THEN
      _newly_earned := _newly_earned || jsonb_build_object(
        'key', _badge.key,
        'name_de', _badge.name_de,
        'name_en', _badge.name_en,
        'icon', _badge.icon
      );
    END IF;
  END LOOP;

  RETURN _newly_earned;
END;
$$;
