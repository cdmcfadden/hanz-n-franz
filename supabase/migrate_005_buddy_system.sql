-- Migration 005: Buddy system — shared group_id column on profiles
--
-- Run in Supabase Dashboard → SQL Editor.
-- No transaction needed — simple ALTER TABLE.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buddy_group_id uuid;
CREATE INDEX IF NOT EXISTS profiles_buddy_group_idx ON profiles (buddy_group_id);
