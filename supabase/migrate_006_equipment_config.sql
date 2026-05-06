-- Migration 006: Equipment config table
-- Stores the equipment catalog as a JSON blob so admins can edit it
-- without redeploying. Seeded from equipment.json on first read.

CREATE TABLE equipment_config (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE equipment_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (server-side loaders use service role, but this
-- allows anon reads to be blocked and future direct client reads to work)
CREATE POLICY "authenticated read" ON equipment_config
  FOR SELECT TO authenticated USING (true);

-- Writes go through the admin API (service-role client bypasses RLS),
-- so no explicit write policy is needed for regular users.
