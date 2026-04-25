-- Enable RLS on realtime.messages and scope channel subscriptions to authorized users only.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior policy with same name (idempotent)
DROP POLICY IF EXISTS "Authenticated can read own scoped channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write own scoped channels" ON realtime.messages;

-- SELECT (subscribe / receive)
CREATE POLICY "Authenticated can read own scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Presence channels (no row data, used for cursors / online status)
  realtime.topic() LIKE 'presence:%'
  OR
  -- Own notifications: notifications:<auth.uid()>
  realtime.topic() = 'notifications:' || auth.uid()::text
  OR
  -- Comments / collab on owned or collaborated sessions
  (
    (realtime.topic() LIKE 'comments:%' OR realtime.topic() LIKE 'collab-changes:%')
    AND public.is_collaborator(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
);

-- INSERT (broadcast / presence track)
CREATE POLICY "Authenticated can write own scoped channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'presence:%'
  OR realtime.topic() = 'notifications:' || auth.uid()::text
  OR (
    (realtime.topic() LIKE 'comments:%' OR realtime.topic() LIKE 'collab-changes:%')
    AND public.is_collaborator(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
);