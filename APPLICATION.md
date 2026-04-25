# ReqSmith – Application Overview

## Summary

**ReqSmith** is an AI-powered web application for creating and maintaining requirements documents. From a rough feature idea, the app generates structured documents (PRDs, User Stories, Specs, etc.) via chat — with clarifying questions from the AI and real-time preview in the editor. Documents can be exported, versioned, shared, and collaboratively edited.

**Core Value:** Requirements documents in minutes instead of hours, with consistent templates and direct reuse (export, ticket export, sharing).

---

## Target Audience

- **Product Managers & Product Owners** – Structure PRDs, roadmaps, user stories, and go-to-market strategies
- **Developers & Tech Leads** – Derive technical specs, feature specifications, and API designs from requirements
- **Consultants & Project Teams** – Quickly create specs, stakeholder maps, and competitive analyses
- **Small to Medium Teams** – Professional documentation without heavy requirements tooling

Language support: **German and English** (UI and translations).

---

## Features

### Core Workflow: Chat & Document

- **AI Chat with Follow-up Questions** — Users describe their idea; the AI asks targeted questions before generating a complete document. Two modes: "Direct" (questions → document) and "Plan" (brainstorm & structure first, then document).

- **Templates** — Multiple built-in templates (Modern PRD, Agile User Story, Competitive Analysis, Product Roadmap, Press Release, 1-Pager, Go-to-Market, Technical Spec, Launch Plan, OKR, Stakeholder Map, Feature Specification). Users can create **custom templates** with their own structure and AI system prompts.

- **Real-Time Editor** — Generated documents appear in the editor in real-time (structured into sections). Manual editing, section-level editing, version history, and restoration of previous versions.

- **Diff Review for AI Changes** — AI change proposals can be displayed as diffs; users can accept, reject, or edit individual changes.

### Export & Integration

- **Export** — Documents as **Markdown**, **DOCX**, or **PDF**.
- **Ticket Export** — Export user stories / sections as tickets to **Jira** or **Linear**.

### Sessions & Organization

- **Sessions** — Each conversation is a session with its own document and chat history. Switch, duplicate, delete, or save sessions as templates.
- **Dashboard** — Overview of sessions, usage statistics, analytics, and quick access to new or existing sessions.

### Collaboration

- **Real-Time Collaboration** — Simultaneous editing with **live cursors** and **presence** indicators.
- **Sharing** — Share documents via public link with optional commenting.
- **Inline Comments** — Attach comments to document sections.

### Additional Features

- **Glossary** — Define terms with definitions; the glossary can be passed as context to the AI.
- **Document Scorecard** — AI-powered document quality assessment.
- **Versions** — Automatic and manual document versions with restoration.
- **Import** — Import Word documents (DOCX) as a starting point.
- **Validation** — Check documents against rules; validation panel with suggestions.
- **Persona & Verbosity** — Configure AI personality and response detail level.
- **Prompt History** — Save and reuse frequent prompts.
- **PWA** — Installable as a Progressive Web App.

### Administration

- **Auth** — Registration, login, password reset, email confirmation.
- **Account Settings** — Profile, data export, integrations, notifications.
- **Admin** — Admin area for LLM settings and user management.
- **Legal** — Imprint, privacy policy, cookie banner.

---

## Technology & Structure

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui, React Router
- **Backend & Auth:** Supabase (Auth, PostgreSQL, Realtime, Edge Functions)
- **AI:** Connected via Supabase Edge Functions (streaming, structured operations)

Main routes: `/` (Landing), `/app` (Main app with Chat & Editor), `/auth`, `/admin`, `/shared/:token` (shared document), `/impressum`, `/datenschutz`, `/reset-password`.
