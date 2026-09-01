-- Migration 008: Multi-tenant foundation — gyms, membership, and a canonical
-- movement taxonomy.
--
--   *** DRAFT — DO NOT RUN YET. ***
--
-- This is the schema half of a design under discussion. Phases 1 and 2 are
-- additive and safe to run against production while the current single-gym
-- code keeps working untouched. Phase 3 is destructive and must not run until
-- the app has been cut over. Read the phase notes before executing anything.
--
-- Idempotent throughout: safe to re-run.

-- ---------------------------------------------------------------------------
-- PHASE 1 — Tenancy. Additive. The running app ignores all of this.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  -- Where the catalog came from: 'video' once the cataloging pipeline runs it,
  -- 'manual' for hand-built, 'seed' for the original single-gym import.
  catalog_source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gym_members (
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- 'owner' edits the catalog; 'coach' reads members' logs; 'member' is self-only.
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'coach', 'owner')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS gym_members_user_idx ON gym_members (user_id);

-- A member can belong to several gyms; this is the one the app opens in.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_gym_id uuid REFERENCES gyms(id);

-- Per-gym catalog. Replaces the equipment_config singleton (id = 1), which is
-- left in place until the code cuts over — see Phase 3.
CREATE TABLE IF NOT EXISTS gym_catalogs (
  gym_id uuid PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Backfill: the existing installation becomes the first gym, and everyone who
-- has ever logged a set becomes a member of it.
INSERT INTO gyms (slug, name, catalog_source)
SELECT 'hanz-n-franz', 'Hanz N Franz', 'seed'
WHERE NOT EXISTS (SELECT 1 FROM gyms WHERE slug = 'hanz-n-franz');

INSERT INTO gym_catalogs (gym_id, data, updated_at, updated_by)
SELECT g.id, ec.data, ec.updated_at, ec.updated_by
FROM equipment_config ec
CROSS JOIN gyms g
WHERE g.slug = 'hanz-n-franz' AND ec.id = 1
ON CONFLICT (gym_id) DO NOTHING;

INSERT INTO gym_members (gym_id, user_id, role)
SELECT g.id, p.id,
       CASE WHEN p.id IN (
         '4291b0b5-41d7-4a04-b138-90a578193e71'::uuid,
         '67772697-6da4-49fd-93f0-87af75befc99'::uuid
       ) THEN 'owner' ELSE 'member' END
FROM profiles p CROSS JOIN gyms g
WHERE g.slug = 'hanz-n-franz'
ON CONFLICT (gym_id, user_id) DO NOTHING;

UPDATE profiles p SET home_gym_id = g.id
FROM gyms g WHERE g.slug = 'hanz-n-franz' AND p.home_gym_id IS NULL;

ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_catalogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read their gyms" ON gyms;
CREATE POLICY "members read their gyms" ON gyms
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM gym_members m WHERE m.gym_id = gyms.id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "members read own memberships" ON gym_members;
CREATE POLICY "members read own memberships" ON gym_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "members read their gym catalog" ON gym_catalogs;
CREATE POLICY "members read their gym catalog" ON gym_catalogs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM gym_members m
            WHERE m.gym_id = gym_catalogs.gym_id AND m.user_id = auth.uid())
  );

-- Catalog writes still go through the admin API on the service-role client,
-- which bypasses RLS; this policy exists so a future direct-from-client editor
-- can only touch a gym the user actually owns.
DROP POLICY IF EXISTS "owners write their gym catalog" ON gym_catalogs;
CREATE POLICY "owners write their gym catalog" ON gym_catalogs
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM gym_members m
            WHERE m.gym_id = gym_catalogs.gym_id AND m.user_id = auth.uid() AND m.role = 'owner')
  );

-- ---------------------------------------------------------------------------
-- PHASE 2 — Canonical movements. Also additive: the new columns stay nullable
-- and unread until the app knows about them.
--
-- This is the part that makes a member's history survive changing gyms, and
-- the only reason to do any of this before there are a thousand catalogs.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS movements (
  id text PRIMARY KEY,                       -- 'bench_press', 'back_squat'
  name text NOT NULL,                        -- 'Bench press'
  pattern text,                              -- 'horizontal_push', 'hinge', ...
  primary_muscles text[] NOT NULL DEFAULT '{}'
);

-- Maps one gym's equipment vocabulary onto the canonical taxonomy. A gym's
-- "iso_chest_back_pl::iso_chest_press_combo" and another's
-- "power_rack::bench_press" both point at movements.id = 'bench_press'.
CREATE TABLE IF NOT EXISTS gym_movements (
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  equipment_id text NOT NULL,
  move_id text NOT NULL,
  movement_id text NOT NULL REFERENCES movements(id),
  PRIMARY KEY (gym_id, equipment_id, move_id)
);

CREATE INDEX IF NOT EXISTS gym_movements_movement_idx ON gym_movements (movement_id);

-- Logs gain both: gym_id says where it happened, movement_id says what it was.
-- Trends, personal records, and athlete memory key on movement_id; the
-- equipment id stays for display ("Hammer Strength chest press", not "bench").
ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS gym_id uuid REFERENCES gyms(id);
ALTER TABLE log_entries ADD COLUMN IF NOT EXISTS movement_id text REFERENCES movements(id);

CREATE INDEX IF NOT EXISTS log_entries_movement_idx
  ON log_entries (user_id, movement_id, log_date);

UPDATE log_entries l SET gym_id = g.id
FROM gyms g WHERE g.slug = 'hanz-n-franz' AND l.gym_id IS NULL;

-- Backfill movement_id once gym_movements is populated for this gym. Rows whose
-- (equipment_id, move_id) has no mapping are left null on purpose — they are
-- the report of what the taxonomy is still missing:
--
--   SELECT equipment_id, move_id, count(*) FROM log_entries
--   WHERE movement_id IS NULL GROUP BY 1, 2 ORDER BY 3 DESC;
UPDATE log_entries l SET movement_id = gm.movement_id
FROM gym_movements gm
WHERE gm.gym_id = l.gym_id
  AND gm.equipment_id = l.equipment_id
  AND gm.move_id = l.move_id
  AND l.movement_id IS NULL;

-- Logging happens client-side, straight to Supabase from MoveLogger. Rather than
-- teach every client to resolve a gym and a movement, fill both here: the row
-- arrives with equipment_id and move_id, and the trigger derives the rest from
-- the athlete's home gym and that gym's mapping. An unmapped move still logs —
-- it just lands with a null movement_id, which the report query above surfaces.
CREATE OR REPLACE FUNCTION set_log_entry_gym_and_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.gym_id IS NULL THEN
    SELECT p.home_gym_id INTO NEW.gym_id FROM profiles p WHERE p.id = NEW.user_id;
  END IF;

  IF NEW.gym_id IS NOT NULL AND NEW.movement_id IS NULL THEN
    SELECT gm.movement_id INTO NEW.movement_id
    FROM gym_movements gm
    WHERE gm.gym_id = NEW.gym_id
      AND gm.equipment_id = NEW.equipment_id
      AND gm.move_id = NEW.move_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_entries_set_gym_and_movement ON log_entries;
CREATE TRIGGER log_entries_set_gym_and_movement
  BEFORE INSERT OR UPDATE OF equipment_id, move_id ON log_entries
  FOR EACH ROW EXECUTE FUNCTION set_log_entry_gym_and_movement();

-- ---------------------------------------------------------------------------
-- PHASE 3 — Cutover. DESTRUCTIVE. Run only after the app reads gym_catalogs,
-- scopes admin writes by gym_members.role, and writes gym_id + movement_id on
-- every new log row. Keep equipment_config until then as the rollback path.
-- ---------------------------------------------------------------------------

-- ALTER TABLE log_entries ALTER COLUMN gym_id SET NOT NULL;
-- DROP TABLE equipment_config;
