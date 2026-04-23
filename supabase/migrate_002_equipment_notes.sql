-- Migration 002: per-equipment voice notes.
-- Run once in Supabase SQL Editor after deploying the matching app build.
-- Idempotent: safe to re-run.

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

alter table equipment_notes enable row level security;

drop policy if exists "anon read equipment_notes" on equipment_notes;
create policy "anon read equipment_notes" on equipment_notes
  for select to anon using (true);

drop policy if exists "anon insert equipment_notes" on equipment_notes;
create policy "anon insert equipment_notes" on equipment_notes
  for insert to anon with check (true);

drop policy if exists "anon delete equipment_notes" on equipment_notes;
create policy "anon delete equipment_notes" on equipment_notes
  for delete to anon using (true);
