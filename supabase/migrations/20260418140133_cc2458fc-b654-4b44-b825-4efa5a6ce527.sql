-- Extend realtime.messages policies to also cover the doc:<sessionId> broadcast channel
DROP POLICY IF EXISTS "Authenticated can read own scoped channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write own scoped channels" ON realtime.messages;

CREATE POLICY "Authenticated can read own scoped channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'presence:%'
  OR realtime.topic() = 'notifications:' || auth.uid()::text
  OR (
    (
      realtime.topic() LIKE 'comments:%'
      OR realtime.topic() LIKE 'collab-changes:%'
      OR realtime.topic() LIKE 'doc:%'
    )
    AND public.is_collaborator(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
);

CREATE POLICY "Authenticated can write own scoped channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'presence:%'
  OR realtime.topic() = 'notifications:' || auth.uid()::text
  OR (
    (
      realtime.topic() LIKE 'comments:%'
      OR realtime.topic() LIKE 'collab-changes:%'
      OR realtime.topic() LIKE 'doc:%'
    )
    AND public.is_collaborator(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
);