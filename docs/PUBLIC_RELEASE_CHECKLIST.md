# Public Release Checklist

Status of cleanup tasks before publishing this repo as a fresh open-source template.

## Already done in this template

- No hardcoded production secrets (verified by grep + audit).
- `.env` removed from version control; `.gitignore` covers all env-file variants and Lovable internals.
- `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/SECURITY.md` present and template-friendly.
- Issue templates and PR template under `.github/`.
- Service-role key only used inside Edge Functions via `Deno.env.get`.
- Anon key in `.env.example` is the safe-to-expose publishable key (kept as placeholder).
- `index.html`: hardcoded Supabase project URL, `generator: Lovable` meta and Lovable preview URLs removed.
- Single package manager (npm); CI runs `npm ci` + `npm run lint` + `npm test` + `npm run build`.
- `supabase/config.toml` uses placeholder `project_id = "your-project-ref"`.
- README and CONTRIBUTING use `<your-org>` placeholder consistently.

## Manual steps after creating your fork

### 1. Replace `<your-org>` placeholders

After creating the public GitHub repo, search & replace `<your-org>` in:

- `README.md`
- `CONTRIBUTING.md`
- `package.json`

with your real GitHub org/user.

### 2. Add an OG image

`index.html` references `/og-image.png` (relative). Drop a 1200×630 social-preview image at `public/og-image.png` before publishing — otherwise social cards will show a broken image.

### 3. Set up your Supabase project

```bash
supabase login
supabase link --project-ref <your-project-ref>
# config.toml will be updated automatically by the link command
supabase functions deploy chat parse-pdf score-document admin-llm-settings admin-users create-ticket lookup-user
```

Then run the SQL migrations under `supabase/migrations/` in chronological order via the Supabase SQL editor (or `supabase db push`).

### 4. Set required Edge Function secrets

Via Supabase Dashboard → Project Settings → Edge Functions → Secrets, or `supabase secrets set`:

- `ALLOWED_ORIGINS` — comma-separated CORS origins (e.g. `http://localhost:5173,https://your-domain.com`).
- LLM provider key — preferred path: configure an OpenRouter key in the in-app Admin → LLM-Einstellungen UI (stored encrypted in Supabase Vault). Alternative: set `LOVABLE_API_KEY` if you stay on Lovable Cloud.

### 5. Update the canonical URL

`index.html` sets `<link rel="canonical" href="https://reqsmith.example.com/" />` and matching `og:url`. Replace with your real production domain.

### 6. (Optional) Strip Lovable helpers entirely

See "Optional: Removing Lovable bits" in `README.md`.
