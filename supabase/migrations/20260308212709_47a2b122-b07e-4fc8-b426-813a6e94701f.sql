
-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text DEFAULT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Only server-side inserts (via triggers/functions)
CREATE POLICY "Deny client insert on notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create a notification (security definer so it can insert)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _type text,
  _title text,
  _body text DEFAULT '',
  _link text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link);
END;
$$;

-- Trigger: notify on new inline comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_owner uuid;
  _commenter_name text;
BEGIN
  -- Get session owner
  SELECT user_id INTO _session_owner FROM chat_sessions WHERE id = NEW.session_id;
  
  -- Don't notify yourself
  IF _session_owner = NEW.user_id THEN RETURN NEW; END IF;
  
  -- Get commenter name
  SELECT display_name INTO _commenter_name FROM profiles WHERE user_id = NEW.user_id;
  
  PERFORM create_notification(
    _session_owner,
    'comment',
    COALESCE(_commenter_name, 'Jemand') || ' hat einen Kommentar hinterlassen',
    LEFT(NEW.content, 100)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON public.inline_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: notify on new collaborator invite
CREATE OR REPLACE FUNCTION public.notify_on_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_title text;
  _inviter_name text;
BEGIN
  SELECT title INTO _session_title FROM chat_sessions WHERE id = NEW.session_id;
  
  IF NEW.invited_by IS NOT NULL THEN
    SELECT display_name INTO _inviter_name FROM profiles WHERE user_id = NEW.invited_by;
  END IF;
  
  PERFORM create_notification(
    NEW.user_id,
    'invite',
    COALESCE(_inviter_name, 'Jemand') || ' hat Sie zu "' || COALESCE(_session_title, 'einem Dokument') || '" eingeladen',
    ''
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_invite
  AFTER INSERT ON public.document_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_invite();
