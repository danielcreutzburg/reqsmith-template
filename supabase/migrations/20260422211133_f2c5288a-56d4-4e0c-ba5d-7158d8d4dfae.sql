-- 1) Ensure Vault extension is available
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 2) Add column to reference the Vault secret
ALTER TABLE public.llm_settings
  ADD COLUMN IF NOT EXISTS api_key_secret_id uuid;

-- 3) Helper: stable secret name per llm_settings row
--    We always keep ONE row, so a single fixed name is fine.
--    Function to set/update the key in the vault.
CREATE OR REPLACE FUNCTION public.set_llm_api_key(_new_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
DECLARE
  _row_id uuid;
  _existing_secret uuid;
  _new_secret uuid;
BEGIN
  SELECT id, api_key_secret_id INTO _row_id, _existing_secret
  FROM public.llm_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF _row_id IS NULL THEN
    INSERT INTO public.llm_settings DEFAULT VALUES
    RETURNING id INTO _row_id;
  END IF;

  IF _new_key IS NULL OR length(trim(_new_key)) = 0 THEN
    RAISE EXCEPTION 'api_key must be non-empty';
  END IF;

  IF _existing_secret IS NOT NULL THEN
    -- Update existing vault secret in place
    PERFORM vault.update_secret(_existing_secret, _new_key);
  ELSE
    -- Create a new vault secret with a unique name
    _new_secret := vault.create_secret(_new_key, 'llm_api_key_' || _row_id::text, 'ReqSmith LLM provider key');
    UPDATE public.llm_settings
       SET api_key_secret_id = _new_secret,
           api_key = '',          -- clear any plaintext residue
           has_custom_key = true,
           updated_at = now()
     WHERE id = _row_id;
    RETURN;
  END IF;

  UPDATE public.llm_settings
     SET api_key = '',
         has_custom_key = true,
         updated_at = now()
   WHERE id = _row_id;
END;
$$;

-- 4) Function to retrieve the decrypted key (server-side only)
CREATE OR REPLACE FUNCTION public.get_llm_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'vault'
AS $$
DECLARE
  _secret_id uuid;
  _legacy text;
  _row_id uuid;
  _decrypted text;
BEGIN
  SELECT id, api_key_secret_id, api_key
    INTO _row_id, _secret_id, _legacy
  FROM public.llm_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF _row_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Already migrated: return decrypted vault value
  IF _secret_id IS NOT NULL THEN
    SELECT decrypted_secret INTO _decrypted
      FROM vault.decrypted_secrets
     WHERE id = _secret_id;
    RETURN _decrypted;
  END IF;

  -- Auto-migrate: legacy plaintext present, move it into the vault NOW
  IF _legacy IS NOT NULL AND length(trim(_legacy)) > 0 THEN
    PERFORM public.set_llm_api_key(_legacy);
    SELECT api_key_secret_id INTO _secret_id
      FROM public.llm_settings WHERE id = _row_id;
    SELECT decrypted_secret INTO _decrypted
      FROM vault.decrypted_secrets WHERE id = _secret_id;
    RETURN _decrypted;
  END IF;

  RETURN NULL;
END;
$$;

-- 5) Function to clear the key
CREATE OR REPLACE FUNCTION public.clear_llm_api_key()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
DECLARE
  _row_id uuid;
  _secret_id uuid;
BEGIN
  SELECT id, api_key_secret_id INTO _row_id, _secret_id
  FROM public.llm_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF _row_id IS NULL THEN
    RETURN;
  END IF;

  IF _secret_id IS NOT NULL THEN
    BEGIN
      PERFORM vault.delete_secret(_secret_id);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if already gone
      NULL;
    END;
  END IF;

  UPDATE public.llm_settings
     SET api_key_secret_id = NULL,
         api_key = '',
         has_custom_key = false,
         updated_at = now()
   WHERE id = _row_id;
END;
$$;

-- 6) Lock down execute privileges — only service_role may call these
REVOKE ALL ON FUNCTION public.set_llm_api_key(text)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_llm_api_key()       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clear_llm_api_key()     FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_llm_api_key(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_llm_api_key()      TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_llm_api_key()    TO service_role;