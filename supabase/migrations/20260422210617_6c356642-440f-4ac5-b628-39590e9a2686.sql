CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
BEGIN
  -- Allow when:
  --  * called from a non-user context (service role / SQL / triggers) where auth.uid() is NULL
  --  * the caller is checking their own role
  --  * the caller is themselves an admin (admins may legitimately probe other users)
  IF _caller IS NOT NULL
     AND _caller IS DISTINCT FROM _user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _caller AND role = 'admin'
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: cannot check role of another user';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;