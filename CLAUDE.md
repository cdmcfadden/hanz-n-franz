# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

C.A.D.E.T. (Chris and Dave's Experimental Training) — a fitness companion app that generates AI-powered daily workouts, tracks per-exercise weight logs, and catalogs gym equipment with voice notes and form-check videos. Supports a buddy system so multiple Google-authenticated users can share a group and compare trends.

## Git Workflow

After making any file change, immediately stage, commit, and push to `main` — do not wait to be asked. No feature branches, no PRs. Before pushing, run `git status` to catch any other uncommitted files that belong in the same commit, and `git fetch origin` to check for upstream changes (rebase if needed).

## Commands

All commands run from `web/`:

```bash
cd web
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint (flat config, Next.js rules)
```

No test runner is configured.

## Next.js Version Warning

This project uses **Next.js 16** — APIs, conventions, and file structure differ from 14/15. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · Tailwind CSS v4 · Supabase (Postgres + Auth) · AI SDK with Claude via AI Gateway

### Key Directories (under `web/`)

- `app/` — App Router pages: `/` (workout generator), `/equipment`, `/equipment/[id]`, `/trends`, `/qr`, `/login`, `/account`, `/buddy/join/[userId]`, `/api`
- `components/` — React components (no component library; pure Tailwind)
- `contexts/` — Client-side global state: `UserContext`, `EntriesContext`, `NotesContext`, `VideosContext`
- `lib/` — Utilities: Supabase clients, equipment loaders, AI prompt builders, Zod schemas
- `../supabase/` — SQL migrations (5 files); run in Supabase Dashboard SQL Editor
- `equipment.json` — Manually cataloged gym inventory; source of truth for all equipment/moves

### Data Flow

1. User selects goal/time/fatigue → POST `/api/workout`
2. Server reads `equipment.json` + user params → builds Claude prompt (`lib/prompt.ts`)
3. Claude Sonnet 4.6 (via AI Gateway) returns structured workout via `generateObject` + Zod schema (`lib/schema.ts`)
4. Client displays workout; per-move log entries saved to Supabase `log_entries`
5. `/trends` fetches all-user logs and renders weight progression charts

### Authentication

Google OAuth via Supabase Auth. All routes except `/login` and `/auth/callback` require a valid session. The `UserContext` (`contexts/UserContext.tsx`) reads the session from Supabase and loads the user's `profiles` row. A database trigger (`migrate_004`) auto-creates the `profiles` row on first Google sign-in.

- **Server routes** use `getServerSupabase()` (`lib/supabase-server.ts`) — cookie-based SSR client from `@supabase/ssr`
- **Client components** use `getBrowserSupabase()` (`lib/supabase-browser.ts`) — browser client from `@supabase/ssr`
- **Admin operations** (buddy system, profile writes) use `getAdminSupabase()` (`lib/supabase-admin.ts`) — service-role key, server-only
- `lib/supabase.ts` is a legacy client left from the pre-auth era; prefer the three above

### User Model

Users are Google OAuth accounts with UUID primary keys. `profiles` table stores `display_name`, `short_name`, `avatar_url`, and `buddy_group_id`. `lib/users.ts` contains the legacy hardcoded user list (pre-auth); it is not used by the running app.

### Buddy System

Users can form groups (max 4) by scanning a QR code from another user's `/qr` page. The joiner visits `/buddy/join/[inviterId]` which calls `POST /api/buddy/join`. Group membership is stored as `profiles.buddy_group_id` (UUID). `/trends` fetches buddy members' entries via `GET /api/buddy/entries` and overlays them on the same charts.

### State Management

React Context only — no Redux/Zustand. `EntriesContext` precomputes `lastActivityMap` (last log date per equipment) to avoid O(N×moves) sorts on the equipment list.

### AI Integration

- **Workout generation:** Claude Sonnet 4.6, `generateObject`, structured output via Zod (`lib/schema.ts`)
- **Voice-note summarization:** Claude Haiku 4.5, `generateText`
- Both use `@ai-sdk/gateway` with `AI_GATEWAY_API_KEY` (server-only)
- Prompts in `lib/prompt.ts`

### Important Constraints

- **One log per day:** Supabase unique constraint on `(user_id, equipment_id, move_id, log_date)`. Same-day re-logs upsert (replace).
- **Equipment catalog is static:** `equipment.json` is loaded server-side and passed to Claude. Adding equipment requires editing that file.
- **No light mode:** Theme is baked into `globals.css` as `:root` CSS variables (`--bg`, `--accent`, `--text`). Color scheme is black/red.

### Environment Variables

```
AI_GATEWAY_API_KEY=             # Server-only; Anthropic AI Gateway key
NEXT_PUBLIC_SUPABASE_URL=       # Public Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public Supabase anon key
SUPABASE_SECRET_KEY=            # Server-only; Supabase service role key (admin client)
```
