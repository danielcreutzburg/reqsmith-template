-- Lock down login rate-limit RPCs so they cannot be abused by anon clients
REVOKE EXECUTE ON FUNCTION public.check_login_rate_limit(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(text) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_login_attempts(text) TO service_role;