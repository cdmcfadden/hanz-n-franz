-- Migration 004: Google OAuth — UUID primary keys, auto-profile trigger, updated RLS
--
-- PREREQUISITES before running this file:
--   1. Enable Google provider in Supabase Dashboard → Authentication → Providers → Google
--   2. Both Dave and Chris must have signed in at least once so their rows
--      exist in auth.users. Get their UUIDs from Dashboard → Authentication → Users.
--   3. Replace the placeholder UUIDs below with the real values.
--   4. Take a database backup first.
--
-- Run in two parts:
--   Part A: migrate_004_part_a_uuid.sql  (schema migration — run before deploying code)
--   Part B: migrate_004_part_b_rls.sql   (RLS tightening — run after deploying code)
--
-- This file contains both parts separated by a comment.

-- ===========================================================================
-- PART A: Migrate profiles.id from text to uuid, update foreign keys
-- ===========================================================================
-- Replace these with real UUIDs from Dashboard → Authentication → Users:
-- \set dave_uuid '<dave-google-uuid>'
-- \set chris_uuid '<chris-google-uuid>'

BEGIN;

-- 1. Add uuid staging columns
ALTER TABLE profiles ADD COLUMN new_id uuid;
ALTER TABLE log_entries ADD COLUMN new_user_id uuid;
ALTER TABLE equipment_notes ADD COLUMN new_user_id uuid;
ALTER TABLE form_videos ADD COLUMN new_user_id uuid;

-- 2. Set the UUIDs (replace placeholder values with real UUIDs)
UPDATE profiles SET new_id = '4291b0b5-41d7-4a04-b138-90a578193e71'::uuid  WHERE id = 'david';
UPDATE profiles SET new_id = '67772697-6da4-49fd-93f0-87af75befc99'::uuid WHERE id = 'chris';

-- 3. Backfill child table FK columns
UPDATE log_entries      SET new_user_id = p.new_id FROM profiles p WHERE log_entries.user_id      = p.id;
UPDATE equipment_notes  SET new_user_id = p.new_id FROM profiles p WHERE equipment_notes.user_id  = p.id;
UPDATE form_videos      SET new_user_id = p.new_id FROM profiles p WHERE form_videos.user_id      = p.id;

-- 4. Drop old FK constraints (constraint names — adjust if yours differ)
ALTER TABLE log_entries     DROP CONSTRAINT IF EXISTS log_entries_user_id_fkey;
ALTER TABLE equipment_notes DROP CONSTRAINT IF EXISTS equipment_notes_user_id_fkey;
ALTER TABLE form_videos     DROP CONSTRAINT IF EXISTS form_videos_user_id_fkey;

-- 5. Swap columns on child tables
ALTER TABLE log_entries     DROP COLUMN user_id; ALTER TABLE log_entries     RENAME COLUMN new_user_id TO user_id;
ALTER TABLE equipment_notes DROP COLUMN user_id; ALTER TABLE equipment_notes RENAME COLUMN new_user_id TO user_id;
ALTER TABLE form_videos     DROP COLUMN user_id; ALTER TABLE form_videos     RENAME COLUMN new_user_id TO user_id;

-- 6. Mark child columns NOT NULL and re-add FKs (temporarily pointing at old profiles.id)
ALTER TABLE log_entries     ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE equipment_notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE form_videos     ALTER COLUMN user_id SET NOT NULL;

-- 7. Swap profiles PK
ALTER TABLE profiles DROP CONSTRAINT profiles_pkey;
ALTER TABLE profiles DROP COLUMN id;
ALTER TABLE profiles RENAME COLUMN new_id TO id;
ALTER TABLE profiles ADD PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT profiles_auth_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. Re-add child FKs to profiles
ALTER TABLE log_entries     ADD CONSTRAINT log_entries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE equipment_notes ADD CONSTRAINT equipment_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE form_videos     ADD CONSTRAINT form_videos_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 9. Recreate index
DROP INDEX IF EXISTS log_entries_user_idx;
CREATE INDEX log_entries_user_idx ON log_entries (user_id, equipment_id, move_id, log_date);

-- Verify before committing:
-- SELECT id, display_name FROM profiles;
-- SELECT COUNT(*) FROM log_entries WHERE user_id IS NULL;

COMMIT;


-- ===========================================================================
-- PART B: Auto-profile trigger + tightened RLS (deploy code changes first)
-- ===========================================================================

-- Auto-create a profile row whenever a new Google user signs in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, short_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Drop all anon policies
DROP POLICY IF EXISTS "anon read profiles"         ON profiles;
DROP POLICY IF EXISTS "anon read log_entries"      ON log_entries;
DROP POLICY IF EXISTS "anon insert log_entries"    ON log_entries;
DROP POLICY IF EXISTS "anon update log_entries"    ON log_entries;
DROP POLICY IF EXISTS "anon delete log_entries"    ON log_entries;
DROP POLICY IF EXISTS "anon read equipment_notes"  ON equipment_notes;
DROP POLICY IF EXISTS "anon insert equipment_notes" ON equipment_notes;
DROP POLICY IF EXISTS "anon delete equipment_notes" ON equipment_notes;
DROP POLICY IF EXISTS "anon read form_videos"      ON form_videos;
DROP POLICY IF EXISTS "anon insert form_videos"    ON form_videos;
DROP POLICY IF EXISTS "anon delete form_videos"    ON form_videos;

-- profiles: all authenticated users can read (for displaying names), own row only for update
CREATE POLICY "users read all profiles"   ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile"  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- log_entries: own rows only
CREATE POLICY "users read own entries"   ON log_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own entries" ON log_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own entries" ON log_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own entries" ON log_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- equipment_notes: own rows only
CREATE POLICY "users read own notes"    ON equipment_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own notes"  ON equipment_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own notes"  ON equipment_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- form_videos: own rows only
CREATE POLICY "users read own videos"   ON form_videos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own videos" ON form_videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own videos" ON form_videos FOR DELETE TO authenticated USING (auth.uid() = user_id);
