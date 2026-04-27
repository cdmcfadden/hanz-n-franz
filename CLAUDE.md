# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

C.A.D.E.T. (Chris and Dave's Experimental Training) — a two-person fitness companion app that generates AI-powered daily workouts, tracks per-exercise weight logs, and catalogs gym equipment with voice notes and form-check videos.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint (flat config, Next.js rules)
```

No test runner is configured.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · Tailwind CSS v4 · Supabase (Postgres) · AI SDK with Claude via AI Gateway

### Key Directories

- `/app` — App Router pages: `/` (workout generator), `/equipment`, `/equipment/[id]`, `/trends`, `/qr`, `/api`
- `/components` — React components (no component library; pure Tailwind)
- `/contexts` — Client-side global state: `UserContext`, `EntriesContext`, `NotesContext`, `VideosContext`
- `/lib` — Utilities: Supabase client, equipment loaders, AI prompt builders, Zod schemas
- `/supabase` — SQL migrations (4 files)
- `equipment.json` — Manually cataloged gym inventory; source of truth for all equipment/moves

### Data Flow

1. User selects goal/time/fatigue → POST `/api/workout`
2. Server reads `equipment.json` + user params → builds Claude prompt (`lib/prompt.ts`)
3. Claude Sonnet 4.6 (via AI Gateway) returns structured workout via `generateObject` + Zod schema
4. Client displays workout; per-move log entries saved to Supabase `log_entries`
5. `/trends` fetches all-user logs and renders weight progression charts

### State Management

React Context only — no Redux/Zustand. Contexts persist to `localStorage` (user selection) and Supabase (log data). `EntriesContext` precomputes `lastActivityMap` (last log date per equipment) to avoid O(N×moves) sorts on the equipment list.

### User Model

Two hardcoded users (Chris and David) defined in `lib/users.ts`. User ID is persisted in `localStorage` under the key `h360:user`. All Supabase data is keyed by `user_id`.

### Trust Model

No authentication. Supabase uses anonymous RLS with permissive policies — anyone with the anon key can read/write either user's data. This is intentional for a shared two-person app.

### AI Integration

- **Workout generation:** Claude Sonnet 4.6, `generateObject`, structured output via Zod
- **Voice-note summarization:** Claude Haiku 4.5, `generateText`
- Both use `@ai-sdk/gateway` with `AI_GATEWAY_API_KEY` (server-only env var)
- Prompts are in `lib/prompt.ts`

### Important Constraints

- **One log per day:** Supabase has a unique constraint on `(user_id, equipment_id, move_id, log_date)`. Same-day re-logs upsert (replace), not duplicate.
- **Equipment catalog is static:** `equipment.json` is loaded server-side and passed to Claude. Adding equipment requires editing that JSON file.
- **Supabase client is a singleton:** `getSupabase()` in `lib/supabase.ts` — do not instantiate multiple clients.
- **No light mode:** Theme is baked into `globals.css` as `:root` CSS variables (`--bg`, `--accent`, `--text`). Color scheme is black/red.

### Environment Variables

```
AI_GATEWAY_API_KEY=             # Server-only; Anthropic AI Gateway key
NEXT_PUBLIC_SUPABASE_URL=       # Public Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public Supabase anon key
```
