-- Migration 010: Add the Hammer Strength Iso-Lateral Chest/Back to the live catalog.
--
-- Closes #25. The catalog in equipment.json is only a seed — once a row exists
-- in equipment_config (or gym_catalogs), that row is what the workout generator
-- and equipment pages read. Editing the file alone changes nothing in
-- production, which is the trap this migration exists to spring.
--
-- Safe to run before or after migrate_008: it patches whichever tables exist.
-- Idempotent: the guard skips gyms that already have the machine.

DO $$
DECLARE
  machine jsonb := '{
    "id": "iso_chest_back_pl",
    "name": "Iso-Lateral Chest/Back",
    "brand_guess": "Hammer Strength",
    "count": 1,
    "confidence": "high",
    "weight_type": "plates",
    "muscles": ["chest", "front delts", "triceps", "lats", "rhomboids", "rear delts", "biceps"],
    "moves": [
      { "id": "iso_chest_press_combo", "name": "Iso-lateral chest press" },
      { "id": "iso_mid_row_combo", "name": "Iso-lateral mid row" }
    ]
  }'::jsonb;
BEGIN
  IF to_regclass('public.equipment_config') IS NOT NULL THEN
    UPDATE equipment_config
    SET data = jsonb_set(data, '{plate_loaded_machines}',
                         (data -> 'plate_loaded_machines') || machine),
        updated_at = now()
    WHERE id = 1
      AND NOT (data -> 'plate_loaded_machines' @> jsonb_build_array(jsonb_build_object('id', 'iso_chest_back_pl')));
  END IF;

  IF to_regclass('public.gym_catalogs') IS NOT NULL THEN
    UPDATE gym_catalogs c
    SET data = jsonb_set(c.data, '{plate_loaded_machines}',
                         (c.data -> 'plate_loaded_machines') || machine),
        updated_at = now()
    FROM gyms g
    WHERE g.id = c.gym_id
      AND g.slug = 'hanz-n-franz'
      AND NOT (c.data -> 'plate_loaded_machines' @> jsonb_build_array(jsonb_build_object('id', 'iso_chest_back_pl')));
  END IF;
END $$;

-- The two new moves need canonical movements too, or logs against them land
-- with a null movement_id. Only meaningful after migrate_008 + 009.
DO $$
BEGIN
  IF to_regclass('public.movements') IS NULL THEN RETURN; END IF;

  INSERT INTO movements (id, name, pattern) VALUES
    ('iso_chest_press_combo', 'Iso-lateral chest press', 'horizontal_push'),
    ('iso_mid_row_combo', 'Iso-lateral mid row', 'horizontal_pull')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO gym_movements (gym_id, equipment_id, move_id, movement_id)
  SELECT g.id, v.equipment_id, v.move_id, v.movement_id
  FROM gyms g CROSS JOIN (VALUES
    ('iso_chest_back_pl', 'iso_chest_press_combo', 'iso_chest_press_combo'),
    ('iso_chest_back_pl', 'iso_mid_row_combo', 'iso_mid_row_combo')
  ) AS v(equipment_id, move_id, movement_id)
  WHERE g.slug = 'hanz-n-franz'
  ON CONFLICT (gym_id, equipment_id, move_id) DO NOTHING;
END $$;
