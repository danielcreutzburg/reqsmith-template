-- 1. Drop dependent functions first
DROP FUNCTION IF EXISTS public.get_shared_document_by_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_shared_document_comments(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.add_shared_document_comment(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_comment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_invite() CASCADE;
DROP FUNCTION IF EXISTS public.is_collaborator(uuid, uuid) CASCADE;

-- 2. Drop view if exists
DROP VIEW IF EXISTS public.shared_document_comments_public CASCADE;

-- 3. Drop tables (CASCADE removes any remaining policies/constraints)
DROP TABLE IF EXISTS public.shared_document_comments CASCADE;
DROP TABLE IF EXISTS public.shared_documents CASCADE;
DROP TABLE IF EXISTS public.document_collaborators CASCADE;
DROP TABLE IF EXISTS public.inline_comments CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_integrations CASCADE;

-- 4. Recreate RLS policies on chat_sessions (owner-only, no collaborator logic)
DROP POLICY IF EXISTS "Users and collaborators can update sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users and collaborators can view sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;

CREATE POLICY "Users can view own sessions"
ON public.chat_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
ON public.chat_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Recreate RLS policies on chat_messages (owner-only)
DROP POLICY IF EXISTS "Users and collaborators can update messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users and collaborators can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;

CREATE POLICY "Users can view own messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can update own messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid()));

-- 6. Recreate RLS policies on document_versions (owner-only)
DROP POLICY IF EXISTS "Users and collaborators can update document versions" ON public.document_versions;
DROP POLICY IF EXISTS "Users and collaborators can view document versions" ON public.document_versions;
DROP POLICY IF EXISTS "Users can view own document versions" ON public.document_versions;
DROP POLICY IF EXISTS "Users can update own document versions" ON public.document_versions;

CREATE POLICY "Users can view own document versions"
ON public.document_versions FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = document_versions.session_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can update own document versions"
ON public.document_versions FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM chat_sessions s WHERE s.id = document_versions.session_id AND s.user_id = auth.uid()));

-- 7. Update delete_user_data to remove references to dropped tables
CREATE OR REPLACE FUNCTION public.delete_user_data(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (_user_id, 'DELETE', 'user_data', _user_id::text, jsonb_build_object('type', 'full_account_deletion'));

  DELETE FROM document_versions WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id);
  DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id);
  DELETE FROM chat_sessions WHERE user_id = _user_id;
  DELETE FROM custom_templates WHERE user_id = _user_id;
  DELETE FROM glossary_terms WHERE user_id = _user_id;
  DELETE FROM saved_prompts WHERE user_id = _user_id;
  DELETE FROM usage_counts WHERE user_id = _user_id;
  DELETE FROM user_badges WHERE user_id = _user_id;
  DELETE FROM user_streaks WHERE user_id = _user_id;
  DELETE FROM user_roles WHERE user_id = _user_id;
  DELETE FROM profiles WHERE user_id = _user_id;

  RETURN true;
END;
$function$;

-- 8. Update export_user_data to remove references to dropped tables
CREATE OR REPLACE FUNCTION public.export_user_data(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.user_id = _user_id),
    'chat_sessions', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM chat_sessions s WHERE s.user_id = _user_id), '[]'::jsonb),
    'chat_messages', COALESCE((SELECT jsonb_agg(row_to_json(m)) FROM chat_messages m WHERE m.session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id)), '[]'::jsonb),
    'document_versions', COALESCE((SELECT jsonb_agg(row_to_json(dv)) FROM document_versions dv WHERE dv.session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id)), '[]'::jsonb),
    'custom_templates', COALESCE((SELECT jsonb_agg(row_to_json(ct)) FROM custom_templates ct WHERE ct.user_id = _user_id), '[]'::jsonb),
    'glossary_terms', COALESCE((SELECT jsonb_agg(row_to_json(gt)) FROM glossary_terms gt WHERE gt.user_id = _user_id), '[]'::jsonb),
    'saved_prompts', COALESCE((SELECT jsonb_agg(row_to_json(sp)) FROM saved_prompts sp WHERE sp.user_id = _user_id), '[]'::jsonb),
    'exported_at', now()
  ) INTO result;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (_user_id, 'EXPORT', 'user_data', _user_id::text);

  RETURN result;
END;
$function$;

-- 9. Update check_and_award_badges to remove references to dropped tables
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _message_count integer;
  _session_count integer;
  _doc_count integer;
  _unique_templates integer;
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
  SELECT count(*) INTO _message_count FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id) AND role = 'user';
  SELECT count(*) INTO _session_count FROM chat_sessions WHERE user_id = _user_id;
  SELECT count(*) INTO _doc_count FROM chat_sessions WHERE user_id = _user_id AND length(document) > 50;
  SELECT count(DISTINCT template_id) INTO _unique_templates FROM chat_sessions WHERE user_id = _user_id AND template_id IS NOT NULL;
  SELECT count(*) INTO _glossary_count FROM glossary_terms WHERE user_id = _user_id;
  SELECT count(*) INTO _custom_template_count FROM custom_templates WHERE user_id = _user_id;
  SELECT count(*) INTO _version_count FROM document_versions WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id);

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

  FOR _badge IN SELECT * FROM badge_definitions ORDER BY sort_order LOOP
    _metric_val := CASE _badge.metric
      WHEN 'message_count' THEN _message_count
      WHEN 'session_count' THEN _session_count
      WHEN 'doc_count' THEN _doc_count
      WHEN 'unique_templates' THEN _unique_templates
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
$function$;