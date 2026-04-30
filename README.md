# C.A.D.E.T.

**Chris and Dave's Experimental Training** — a two-person fitness companion that generates AI-powered daily workouts, tracks weight progression, and catalogs gym equipment with voice notes and form-check videos.

## What It Does

- **Workout generator** — select your goal, available time, and fatigue level; Claude builds a structured workout from your actual gym equipment
- **Weight logging** — log your working weight per exercise; view progression over time on the Trends page
- **Equipment catalog** — browse all gym equipment, see which moves are available, and check when you last trained each piece
- **Voice notes & videos** — attach voice memos and form-check videos to equipment entries

## Philosophy

C.A.D.E.T. is built around one idea: **knowing your working weight is the key to consistent improvement.**

We log a single weight per exercise per day. That number is your *working weight* — not a one-rep max, not the weight on your first warm-up set, but the weight you're actually training with today. Tracking it over time gives you the clearest possible signal of whether you're progressing.

Simplicity is a core tenet. We deliberately don't log reps or sets. More fields mean more friction, and friction means you stop logging. One number per exercise, every session — that's enough to see the trend that matters.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend:** Supabase (Postgres)
- **AI:** Claude Sonnet 4.6 for workout generation, Claude Haiku 4.5 for voice-note summarization — both via Anthropic AI Gateway

## Getting Started

```bash
git clone <repo-url>
cd hanz-n-franz/web
npm install
```

Copy the environment variables (see below) into `web/.env.local`, then:

```bash
npm run dev   # http://localhost:3000
```

## Environment Variables

| Variable | Description |
|---|---|
| `AI_GATEWAY_API_KEY` | Anthropic AI Gateway key — server-only, never exposed to the client |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |

## Project Structure

```
web/
  app/              # App Router pages: /, /equipment, /equipment/[id], /trends, /qr
  components/       # React components (pure Tailwind, no component library)
  contexts/         # Client-side state: UserContext, EntriesContext, NotesContext, VideosContext
  lib/              # Supabase client, equipment loaders, AI prompt builders, Zod schemas
  supabase/         # SQL migrations (4 files)
equipment.json      # Gym inventory — source of truth for all equipment and moves
```

## How It Works

1. User picks a goal, time budget, and fatigue level
2. Server reads `equipment.json` + user params and builds a Claude prompt (`lib/prompt.ts`)
3. Claude returns a structured workout via `generateObject` + Zod schema
4. Client displays the workout; per-move log entries are saved to Supabase `log_entries`
5. `/trends` fetches all logs and renders weight-progression charts

One constraint worth knowing: the `log_entries` table has a unique constraint on `(user_id, equipment_id, move_id, log_date)`. Logging the same move twice in a day upserts (replaces) rather than duplicating.

## Adding Equipment

`equipment.json` is the static catalog — Claude only knows about equipment that appears in this file. To add a new piece of equipment, edit the file directly and restart the dev server. No database migration needed.

## Supabase Setup

Migrations live in `web/supabase/`. Run them in order against your Supabase project to bootstrap the schema from scratch.
