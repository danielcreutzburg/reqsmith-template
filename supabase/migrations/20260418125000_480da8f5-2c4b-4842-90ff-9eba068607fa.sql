-- Lock down llm_settings: remove direct admin SELECT/UPDATE access via Supabase client.
-- All reads/writes must go through the admin-llm-settings edge function (service role),
-- which never returns the api_key to clients.

DROP POLICY IF EXISTS "Admins can manage llm_settings" ON public.llm_settings;

-- Deny all client access; service role bypasses RLS automatically.
CREATE POLICY "Deny all client access on llm_settings"
ON public.llm_settings
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);