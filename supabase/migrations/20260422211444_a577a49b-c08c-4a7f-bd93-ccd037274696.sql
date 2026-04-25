-- 1) Restrictive policies — AND-combined, cannot be overridden by future permissive policies
DROP POLICY IF EXISTS "Restrict client SELECT on llm_settings" ON public.llm_settings;
CREATE POLICY "Restrict client SELECT on llm_settings"
ON public.llm_settings
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS "Restrict client INSERT on llm_settings" ON public.llm_settings;
CREATE POLICY "Restrict client INSERT on llm_settings"
ON public.llm_settings
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "Restrict client UPDATE on llm_settings" ON public.llm_settings;
CREATE POLICY "Restrict client UPDATE on llm_settings"
ON public.llm_settings
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Restrict client DELETE on llm_settings" ON public.llm_settings;
CREATE POLICY "Restrict client DELETE on llm_settings"
ON public.llm_settings
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- 2) Column-level revoke as a second layer:
--    Even if RLS is later misconfigured, anon/authenticated cannot touch the secret columns.
REVOKE SELECT (api_key, api_key_secret_id) ON public.llm_settings FROM PUBLIC, anon, authenticated;
REVOKE INSERT (api_key, api_key_secret_id) ON public.llm_settings FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (api_key, api_key_secret_id) ON public.llm_settings FROM PUBLIC, anon, authenticated;
-- Also revoke broad table-level privs to be safe (RLS still enforced, but this is the ground floor)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.llm_settings FROM PUBLIC, anon, authenticated;

-- 3) Belt-and-braces: keep Vault decryption view inaccessible from client roles
REVOKE ALL ON vault.decrypted_secrets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON vault.secrets            FROM PUBLIC, anon, authenticated;