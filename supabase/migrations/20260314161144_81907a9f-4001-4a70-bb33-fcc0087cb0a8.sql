
-- Add audit logging to export_user_data
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
    'shared_documents', COALESCE((SELECT jsonb_agg(row_to_json(sd)) FROM shared_documents sd WHERE sd.user_id = _user_id), '[]'::jsonb),
    'exported_at', now()
  ) INTO result;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
  VALUES (_user_id, 'EXPORT', 'user_data', _user_id::text);

  RETURN result;
END;
$function$;

-- Add audit logging to delete_user_data
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

  -- Audit log BEFORE deletion
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (_user_id, 'DELETE', 'user_data', _user_id::text, jsonb_build_object('type', 'full_account_deletion'));

  DELETE FROM shared_document_comments WHERE shared_document_id IN (SELECT id FROM shared_documents WHERE user_id = _user_id);
  DELETE FROM shared_documents WHERE user_id = _user_id;
  DELETE FROM document_versions WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id);
  DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = _user_id);
  DELETE FROM chat_sessions WHERE user_id = _user_id;
  DELETE FROM custom_templates WHERE user_id = _user_id;
  DELETE FROM glossary_terms WHERE user_id = _user_id;
  DELETE FROM saved_prompts WHERE user_id = _user_id;
  DELETE FROM usage_counts WHERE user_id = _user_id;
  DELETE FROM user_roles WHERE user_id = _user_id;
  DELETE FROM profiles WHERE user_id = _user_id;

  RETURN true;
END;
$function$;
