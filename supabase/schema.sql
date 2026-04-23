-- Hanz-n-Franz schema
-- Run this once in your Supabase project's SQL Editor.
-- Anonymous-keyed model (option B): two fixed profiles, no auth required,
-- anyone with the anon key can read and write either profile's data.

create table if not exists profiles (
  id text primary key,
  display_name text not null,
  short_name text not null,
  avatar_url text
);

insert into profiles (id, display_name, short_name, avatar_url)
values
  ('david', 'David (Hasselhoff)', 'David', '/users/david.jpg'),
  ('chris', 'Chris (Hemsworth)', 'Chris', '/users/chris.jpg')
on conflict (id) do nothing;

create table if not exists log_entries (
  id bigserial primary key,
  user_id text not null references profiles(id) on delete cascade,
  equipment_id text not null,
  move_id text not null,
  log_date date not null,
  weight numeric not null check (weight > 0),
  created_at timestamptz not null default now(),
  -- One log row per (user, equipment, move, day). Same-day re-logs upsert.
  constraint log_entries_unique_per_day
    unique (user_id, equipment_id, move_id, log_date)
);

create index if not exists log_entries_user_idx
  on log_entries (user_id, equipment_id, move_id, log_date);

-- Per-equipment voice notes: user speaks, LLM summarizes, both are stored.
create table if not exists equipment_notes (
  id bigserial primary key,
  user_id text not null references profiles(id) on delete cascade,
  equipment_id text not null,
  transcript text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists equipment_notes_lookup_idx
  on equipment_notes (user_id, equipment_id, created_at desc);

-- Per-equipment form-check videos. Binary lives in the "form-videos" storage
-- bucket; this table just indexes the uploaded paths.
create table if not exists form_videos (
  id bigserial primary key,
  user_id text not null references profiles(id) on delete cascade,
  equipment_id text not null,
  video_path text not null,
  mime_type text,
  duration_ms integer,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create index if not exists form_videos_lookup_idx
  on form_videos (user_id, equipment_id, created_at desc);

-- RLS: enable, then explicitly allow anon to read/write everything.
-- This matches the "shared trust" model the user picked. Tighten later
-- by introducing real auth and constraining policies on auth.uid().
alter table profiles enable row level security;
alter table log_entries enable row level security;
alter table equipment_notes enable row level security;
alter table form_videos enable row level security;

drop policy if exists "anon read profiles" on profiles;
create policy "anon read profiles" on profiles
  for select to anon using (true);

drop policy if exists "anon read log_entries" on log_entries;
create policy "anon read log_entries" on log_entries
  for select to anon using (true);

drop policy if exists "anon insert log_entries" on log_entries;
create policy "anon insert log_entries" on log_entries
  for insert to anon with check (true);

drop policy if exists "anon update log_entries" on log_entries;
create policy "anon update log_entries" on log_entries
  for update to anon using (true) with check (true);

drop policy if exists "anon delete log_entries" on log_entries;
create policy "anon delete log_entries" on log_entries
  for delete to anon using (true);

drop policy if exists "anon read equipment_notes" on equipment_notes;
create policy "anon read equipment_notes" on equipment_notes
  for select to anon using (true);

drop policy if exists "anon insert equipment_notes" on equipment_notes;
create policy "anon insert equipment_notes" on equipment_notes
  for insert to anon with check (true);

drop policy if exists "anon delete equipment_notes" on equipment_notes;
create policy "anon delete equipment_notes" on equipment_notes
  for delete to anon using (true);

drop policy if exists "anon read form_videos" on form_videos;
create policy "anon read form_videos" on form_videos
  for select to anon using (true);

drop policy if exists "anon insert form_videos" on form_videos;
create policy "anon insert form_videos" on form_videos
  for insert to anon with check (true);

drop policy if exists "anon delete form_videos" on form_videos;
create policy "anon delete form_videos" on form_videos
  for delete to anon using (true);
