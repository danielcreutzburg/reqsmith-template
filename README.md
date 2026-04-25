# ReqSmith 🛠️

**AI-assisted requirements documentation** – Create professional PRDs, User Stories and specifications through AI-powered dialogue.

Template repository: [github.com/danielcreutzburg/reqsmith-template](https://github.com/danielcreutzburg/reqsmith-template)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-146%20passing-brightgreen)]()
[![Built with AI](https://img.shields.io/badge/built%20with-AI%20%2B%20Human-blueviolet)]()

> **Use this repo as a template.** ReqSmith is open source under MIT and explicitly designed to be forked and customized for your own requirements-engineering workflow. See [Quick Start](#quick-start) below.
>
> Originally built with AI-assisted development on [Lovable](https://lovable.dev) — the codebase still ships the optional `lovable-tagger` (dev-only) and the `@lovable.dev/cloud-auth-js` helper for Google/Apple OAuth. Both are removable; see [Removing Lovable bits](#optional-removing-lovable-bits).

## What is ReqSmith?

ReqSmith helps product managers, developers, and consultants create structured requirements documents in minutes instead of hours. You describe your feature idea in a chat, the AI asks clarifying questions, and generates a professional document — complete with templates, export options, and team collaboration.

## Features

- 🤖 **AI Chat** – Generate and iterate requirements documents through dialogue
- 📝 **Live Editor** – Markdown editor with real-time preview and section-based editing
- 📋 **15+ Templates** – PRD, User Story, Feature Spec, Technical Spec, Roadmap, and more
- 🎨 **Custom Templates** – Create and manage your own document templates
- 📤 **Multi-Format Export** – Word, PDF, Excel, Confluence, Jira
- 🔍 **Full-Text Search** – Search across sessions and documents
- 👥 **Real-Time Collaboration** – Work together on documents with live cursors
- 💬 **Inline Comments** – Feedback directly in the document
- 🔗 **Document Sharing** – Public links with optional commenting
- 📊 **Document Scorecard** – AI-powered quality analysis
- 🏆 **Gamification** – Badges and achievements for active usage
- 🌐 **Bilingual** – German and English
- 🌙 **Dark Mode** – Light and dark themes
- ⌨️ **Keyboard Shortcuts** – Quick navigation (press `?` for overlay)
- 📖 **Glossary** – Project-wide term definitions for consistent AI output

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone https://github.com/<your-org>/reqsmith.git
cd reqsmith
npm install
cp .env.example .env
```

> Replace `<your-org>` with the GitHub organization or user that hosts your fork. On Windows PowerShell use `Copy-Item .env.example .env` instead of `cp`.

### Environment Variables

Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the migrations from `supabase/migrations/` in **chronological order** (filename prefix is the timestamp).
3. Verify the storage buckets `avatars` (public) and `chat-attachments` (private) exist — they are created by the migrations.

### Edge Functions

Edge functions live in `supabase/functions/`. Deploy them via the Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy chat parse-pdf score-document admin-llm-settings admin-users create-ticket lookup-user
```

### Required Edge Function Secrets

Set these in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (or via `supabase secrets set`):

| Secret | Required | Purpose |
|--------|----------|---------|
| LLM provider key | ✅ | Configure an **OpenRouter** key in the in-app Admin settings (recommended for self-hosted forks). Alternatively set `LOVABLE_API_KEY` to use the Lovable AI Gateway if you stay on Lovable Cloud. |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins (e.g. `http://localhost:5173,https://your-domain.com`). |
| `SLACK_*` | ⚪ | Only if you enable the Slack integration (disabled by default). |

> To enable Google OAuth, follow the [Supabase guide](https://supabase.com/docs/guides/auth/social-login/auth-google) and add `http://localhost:5173/` to your redirect URLs.

### Start

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Architecture

```
src/
├── components/         # Shared UI components (Layout, Header, etc.)
├── features/           # Feature modules (domain-driven)
│   ├── chat/           # AI chat (hooks, components, utils)
│   ├── editor/         # Document editor with diff review
│   ├── collaboration/  # Real-time collaboration
│   ├── dashboard/      # Dashboard with statistics
│   ├── gamification/   # Badges and achievements
│   ├── glossary/       # Term dictionary
│   ├── notifications/  # Notification system
│   ├── scorecard/      # Document quality scoring
│   ├── search/         # Full-text search
│   ├── sessions/       # Session management
│   ├── sharing/        # Document sharing
│   └── templates/      # Template system
├── hooks/              # Global hooks (Auth, AutoSave, etc.)
├── i18n/               # Translations (DE/EN)
├── integrations/       # Supabase client and types
├── pages/              # Page components
└── types/              # Shared TypeScript types

supabase/
├── functions/          # Edge Functions (Chat, PDF parsing, etc.)
└── migrations/         # Database migrations
```

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Supabase** as backend | Auth, DB, Realtime, Edge Functions in one platform — perfect for rapid prototyping with production-grade security (RLS policies) |
| **Feature-based modules** | Each feature (chat, editor, sharing) is self-contained with its own hooks, components, and utils — scales well as the app grows |
| **Structured Operations** over raw Markdown | AI generates structured patch operations (`replace_section_content`, `create_section`, etc.) instead of regenerating entire documents — enables diffing, partial updates, and section-level editing |
| **Edge Functions** for AI | Server-side AI calls prevent API key exposure, enable rate limiting, and allow model switching without frontend changes |
| **Optimistic Locking** for auto-save | Version-based conflict detection prevents data loss in collaborative editing scenarios |
| **Bilingual from day one** | i18n built into every component via `useLanguage()` hook — not bolted on later |

## Tech Stack

- **Frontend**: React 18, TypeScript 5, Vite 5
- **Styling**: Tailwind CSS 3, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions, Realtime)
- **AI**: OpenAI / Gemini via Edge Functions (configurable)
- **Testing**: Vitest, React Testing Library (146 tests, >90% coverage on core logic)

## Testing

```bash
npm run test          # Run all tests
npm run test:coverage # Run with coverage report
```

Current coverage: **146 tests** across 25 test files, with >90% statement coverage on core business logic (editor utils, patch engine, chat API, document validation).

## Future Work

This is an actively evolving project. Areas for future improvement:

- 🔒 **Production hardening** – Rate limiting fine-tuning, CSP headers, comprehensive security audit
- 🧪 **E2E testing** – Playwright/Cypress tests for critical user flows
- 📱 **Mobile optimization** – Touch-friendly editor, responsive improvements
- 🔌 **Plugin system** – Extensible template and export system
- 🌍 **Additional languages** – i18n framework supports easy addition of new locales
- 📊 **Analytics dashboard** – Usage insights, document quality trends
- 🏠 **Self-hosting guide** – Docker Compose setup with local Supabase

## Lessons Learned

Building ReqSmith with AI-assisted development revealed several insights relevant for consultants and teams evaluating AI coding tools:

1. **AI excels at scaffolding, humans at architecture** — AI generated most component code, but architectural decisions (feature modules, structured operations, optimistic locking) required deliberate human design.

2. **Structured AI output > free-form text** — Having the AI generate structured patch operations instead of raw Markdown was a game-changer for reliability and UX. This pattern applies broadly to any AI-powered editing tool.

3. **Testing AI-generated code is essential** — AI code works on happy paths but misses edge cases. The 146-test suite caught numerous issues that would have shipped to users otherwise.

4. **Security can't be "vibed"** — RLS policies, input validation, rate limiting, and secret management required careful manual review. AI-generated security code should always be audited.

## Optional: Removing Lovable bits

If you fork this repo and want to drop the Lovable-specific helpers entirely (pure Supabase setup):

1. **`lovable-tagger`** (dev-only) – remove from `package.json` `devDependencies` and delete the `componentTagger()` line in `vite.config.ts`.
2. **`@lovable.dev/cloud-auth-js`** – remove from `package.json` `dependencies`, delete `src/integrations/lovable/index.ts`, and replace the OAuth call sites in `src/pages/Auth.tsx` / `src/pages/ResetPassword.tsx` with `supabase.auth.signInWithOAuth(...)` directly.
3. **`LOVABLE_API_KEY`** – not needed if you configure an OpenRouter key (or another provider) via Admin → LLM-Einstellungen.

Everything else (Supabase, Edge Functions, RLS policies, tests) is provider-agnostic and works on any Supabase project.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © ReqSmith Contributors
