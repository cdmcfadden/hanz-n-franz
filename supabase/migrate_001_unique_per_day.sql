-- Migration 001: one log_entries row per (user, equipment, move, day).
-- Run once in the Supabase SQL Editor after deploying the matching app build.
-- Idempotent: safe to re-run; all operations use IF NOT EXISTS / IF EXISTS.

-- 1. Dedupe existing rows that would violate the unique constraint below.
--    Keeps the row with the largest id (most recent insert) per group.
delete from log_entries a
using log_entries b
where a.id < b.id
  and a.user_id = b.user_id
  and a.equipment_id = b.equipment_id
  and a.move_id = b.move_id
  and a.log_date = b.log_date;

-- 2. Enforce uniqueness going forward so .upsert can replace same-day rows.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'log_entries_unique_per_day'
  ) then
    alter table log_entries
      add constraint log_entries_unique_per_day
      unique (user_id, equipment_id, move_id, log_date);
  end if;
end $$;

-- 3. Allow anon to UPDATE so Supabase upsert can replace the existing row.
--    Existing schema.sql only grants select/insert/delete to anon.
drop policy if exists "anon update log_entries" on log_entries;
create policy "anon update log_entries" on log_entries
  for update to anon using (true) with check (true);
