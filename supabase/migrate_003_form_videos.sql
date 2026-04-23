-- Migration 003: per-equipment form videos (stored in Supabase Storage).
-- Run once in Supabase SQL Editor. Idempotent.

-- 1. Metadata table mirroring the equipment_notes pattern.
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

alter table form_videos enable row level security;

drop policy if exists "anon read form_videos" on form_videos;
create policy "anon read form_videos" on form_videos
  for select to anon using (true);

drop policy if exists "anon insert form_videos" on form_videos;
create policy "anon insert form_videos" on form_videos
  for insert to anon with check (true);

drop policy if exists "anon delete form_videos" on form_videos;
create policy "anon delete form_videos" on form_videos
  for delete to anon using (true);

-- 2. Storage bucket for the actual video blobs.
insert into storage.buckets (id, name, public)
values ('form-videos', 'form-videos', true)
on conflict (id) do nothing;

-- 3. Storage RLS — anon can upload + read objects in this bucket.
drop policy if exists "anon upload form-videos objects" on storage.objects;
create policy "anon upload form-videos objects" on storage.objects
  for insert to anon
  with check (bucket_id = 'form-videos');

drop policy if exists "anon read form-videos objects" on storage.objects;
create policy "anon read form-videos objects" on storage.objects
  for select to anon
  using (bucket_id = 'form-videos');

drop policy if exists "anon delete form-videos objects" on storage.objects;
create policy "anon delete form-videos objects" on storage.objects
  for delete to anon
  using (bucket_id = 'form-videos');
