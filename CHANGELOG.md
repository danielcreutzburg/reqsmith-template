# Changelog

All notable changes to ReqSmith will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Template release prep
- Removed `bun.lock` / `bun.lockb`; npm is now the single supported package manager. CI switched from `oven-sh/setup-bun` + `bun install` to `actions/setup-node` + `npm ci`.
- Stripped `.env` from version control and replaced `.gitignore` with a comprehensive open-source variant (covers env files, build output, editor folders, Supabase local-dev temp).
- Removed `.lovable/` internal planning notes from the repo (kept under `.gitignore`).
- Cleaned Lovable branding from `index.html` (`generator` meta, `reqsmith.lovable.app` canonical/OG URLs) and `package.json` (`homepage`).
- README rewritten as a template-friendly entry point: explicit "fork me" framing, npm-first commands, optional path for removing the Lovable helpers.
- `supabase/config.toml` now uses a placeholder `project_id`; forks must set their own.

### Security
- **LLM provider key now encrypted at rest via Supabase Vault (pgsodium).** The plaintext `llm_settings.api_key` column is no longer used; secrets live in `vault.secrets` and are referenced by `llm_settings.api_key_secret_id`. Three new SECURITY DEFINER RPCs (`set_llm_api_key`, `get_llm_api_key`, `clear_llm_api_key`) are the only way to read/write the key; `EXECUTE` is granted exclusively to `service_role` (revoked from `anon` and `authenticated`). Edge functions (`admin-llm-settings`, `chat`, `score-document`) updated to never `SELECT api_key` and to fetch the decrypted value via RPC. The legacy plaintext value is auto-migrated into the Vault on first read, then cleared. No log statement prints the key.
- Hardened `audit_logs` RLS: removed the confusing permissive deny-all policy and replaced it with explicit `RESTRICTIVE` policies that block all client INSERT/UPDATE/DELETE. Admin SELECT access preserved; server-side `SECURITY DEFINER` writes unaffected.
- Hardened `has_role(_user_id, _role)`: non-admin authenticated callers can now only check their own role. Cross-user probing raises `Unauthorized`. Service-role/SQL/trigger contexts and admin callers retain full access.
- Hardened `search_sessions(_user_id, _query)`: now rejects calls where `_user_id` differs from `auth.uid()`, preventing cross-user session enumeration.
- `avatars` storage bucket switched to **private** with owner-scoped RLS (folder = `auth.uid()`); UI now resolves avatars via short-lived signed URLs.
- `chat-attachments` storage policies cleaned: removed public SELECT policy; only owner-scoped authenticated access remains.

### Operational notes
- **External LLM API key rotation (manual, provider-side):** The LLM key in `llm_settings` belongs to a third-party provider (e.g. OpenRouter, OpenAI). To rotate: revoke the existing key at the provider, generate a new one, then in ReqSmith open Admin → LLM-Einstellungen, paste the new key, save, and run "Verbindung testen". Lovable cannot rotate provider keys automatically.

## [1.0.0] - 2025-07-06

### 🎉 Initial Open Source Release

#### Core Features
- AI-powered chat for generating requirements documents with follow-up questions
- Live Markdown editor with section-based editing and real-time preview
- 15+ built-in templates (PRD, User Story, Feature Spec, Technical Spec, Roadmap, etc.)
- Custom template creation with AI system prompt customization
- Multi-format export (Markdown, DOCX, PDF)
- Ticket export to Jira and Linear

#### Collaboration
- Real-time collaboration with live cursors and presence indicators
- Document sharing via public links with optional commenting
- Inline comments on document sections

#### Editor & Quality
- Diff review panel for AI-generated changes (accept/reject/edit)
- Document validation with rule-based checks
- AI-powered Document Scorecard for quality assessment
- Version history with restoration
- Word/DOCX import

#### Search & Organization
- Full-text search across sessions, documents, and messages (⌘K)
- Session management (create, duplicate, delete, save as template)
- Dashboard with usage statistics and analytics

#### Developer Experience
- 146 unit tests with >90% coverage on core logic
- Feature-based module architecture
- Bilingual support (German/English)
- Dark mode
- Keyboard shortcuts (press `?` for overlay)
- PWA support
- Glossary for consistent AI terminology

#### Security
- JWT-based authentication with email verification
- Row-Level Security (RLS) on all database tables
- Server-side rate limiting on Edge Functions
- Optimistic locking for conflict-free auto-save
- CORS restriction support via `ALLOWED_ORIGINS`
- Input validation and sanitization
