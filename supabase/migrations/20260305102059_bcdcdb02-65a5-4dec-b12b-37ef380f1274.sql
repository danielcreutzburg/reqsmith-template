
-- Block all client-side writes to user_roles (only handle_new_user trigger and admin edge function should write)
CREATE POLICY "Deny insert on user_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Deny update on user_roles" ON public.user_roles FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny delete on user_roles" ON public.user_roles FOR DELETE TO authenticated USING (false);

-- Block all client-side writes to usage_counts (only check_and_increment_usage and admin edge function should write)
CREATE POLICY "Deny insert on usage_counts" ON public.usage_counts FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Deny update on usage_counts" ON public.usage_counts FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny delete on usage_counts" ON public.usage_counts FOR DELETE TO authenticated USING (false);
