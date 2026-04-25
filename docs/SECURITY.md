# Sicherheit & Konfiguration

## Passwort-Reset (Recovery-Link)

Der Link zum Zurücksetzen des Passworts wird von Supabase Auth per E-Mail versendet und enthält einen zeitlich begrenzten Token.

### Ablauf des Recovery-Links konfigurieren (Lovable Cloud)

- **Lovable Cloud:** Die Ablaufzeit des Recovery-Links wird von Lovable/Supabase verwaltet.
- **Prüfen/Anpassen:** Im Lovable-Projekt unter **Cloud** → **Users & Auth** (bzw. wo Auth-Einstellungen liegen) oder in der Supabase-Dokumentation nach „Recovery link expiry“ / „Password recovery“ suchen.
- **Typischer Standard:** 1 Stunde. Nach Ablauf muss der Nutzer erneut „Passwort vergessen“ auslösen.

Die eigentliche Reset-Seite ist `src/pages/ResetPassword.tsx`; sie reagiert auf den Event `PASSWORD_RECOVERY` und den URL-Hash `type=recovery`. Die Gültigkeitsdauer des Links wird serverseitig (Auth-Provider) festgelegt, nicht im Frontend-Code.

## CORS (Edge Functions)

In Produktion können erlaubte Origins eingeschränkt werden:

- **Secret in Lovable/Supabase setzen:** `ALLOWED_ORIGINS`
- **Wert:** Kommagetrennte Liste, z. B. `https://deine-app.lovable.app,https://deine-domain.de`
- Wenn `ALLOWED_ORIGINS` gesetzt ist, akzeptieren die Edge Functions nur Requests von diesen Origins. Ohne Setzung gilt weiterhin `*` (alle Origins).

## Passwort-Policy

- Mindestlänge: **8 Zeichen** (Frontend-Validierung in Auth und Reset-Password).
- Supabase Auth kann zusätzliche Regeln erzwingen; ggf. in den Auth-Einstellungen prüfen.

## Login Rate Limiting (server-side)

Das Brute-Force-/Lockout-Limit für Logins läuft **ausschließlich serverseitig**.

**Architektur**

- SQL-Funktionen `public.check_login_rate_limit(email)` und `public.clear_login_attempts(email)` sind `SECURITY DEFINER`.
- `EXECUTE` ist für `anon`, `authenticated` und `PUBLIC` **revoked**; nur `service_role` darf sie aufrufen.
- Die Edge Function `auth-rate-limit` (`supabase/functions/auth-rate-limit/index.ts`) ist der einzige öffentliche Einstiegspunkt. Sie validiert die E-Mail, ruft die RPCs mit Service-Role-Key und liefert `{ allowed, wait_seconds }` zurück.
- Der Client benutzt den Hook `useLoginRateLimit` (`src/hooks/useLoginRateLimit.ts`), der ausschließlich diese Edge Function anspricht.

**Bedrohungsmodell, das damit adressiert wird**

| Angriff                                       | Vorher                                                 | Jetzt                                |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| Account-Lockout-DoS (5× `check` für ein Opfer)| Möglich für jeden anon-User                            | Edge Function ist die einzige Tür; weitere Limits können dort ergänzt werden |
| Brute-Force-Bypass via `clear`                | Möglich (anon konnte Versuche löschen)                 | `EXECUTE` revoked – RPC nicht erreichbar |
| Komplettumgehung (RPC einfach nicht aufrufen) | Frontend-only Check                                    | Limit-Logik liegt im Server, RPCs nicht öffentlich |

**Fail-open Verhalten**

Schlägt die Edge Function netzbedingt fehl, lässt der Hook den Login-Versuch zu (`allowed: true`), damit legitime Nutzer nicht ausgesperrt werden. Die eigentliche Authentifizierung erfolgt weiterhin gegen Supabase Auth.
