-- Migration 007: Athlete memory — persistent AI-learned notes + upcoming events
--
-- Lets the workout generator account for a user's long-term goals,
-- preferences, and habits (learned over time from logs/notes), plus
-- concrete upcoming events (e.g. "marathon on 2026-11-01") that should
-- shift periodization (tapering, deload, etc).
--
-- Run in Supabase Dashboard → SQL Editor.

CREATE TABLE athlete_memory (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE athlete_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own memory" ON athlete_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own memory" ON athlete_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own memory" ON athlete_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE athlete_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX athlete_events_user_idx ON athlete_events (user_id, event_date);

ALTER TABLE athlete_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own events" ON athlete_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own events" ON athlete_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own events" ON athlete_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
