-- Migration 009: Seed the canonical movement taxonomy and map this gym onto it.
--
--   *** DRAFT — run only after migrate_008 phases 1 and 2. ***
--
-- Generated from web/equipment.json. Movement ids are 1:1 with catalog move ids
-- except where two catalog entries reach the same movement — a bench press is a
-- bench press whether it was logged from the power rack or the flat bench. Those
-- collapses are the whole point of the taxonomy, and they are listed explicitly
-- in the generator rather than inferred, so they are reviewable.
--
-- Granularity note: implement is preserved (barbell / dumbbell / smith / machine
-- bench presses stay distinct movements) because the working weight for each is
-- not comparable. Merging two movements later is a one-line update; splitting one
-- after members have logged against it is not.
--
-- Idempotent: safe to re-run.

INSERT INTO movements (id, name, pattern) VALUES
  ('assisted_dip', 'Assisted dip', 'horizontal_push'),
  ('assisted_pullup', 'Assisted pull-up', 'vertical_pull'),
  ('barbell_back_squat', 'Barbell back squat', 'squat'),
  ('barbell_bench_press', 'Barbell bench press', 'horizontal_push'),
  ('barbell_deadlift', 'Barbell deadlift', 'hinge'),
  ('barbell_front_squat', 'Barbell front squat', 'squat'),
  ('barbell_overhead_press', 'Barbell overhead press', 'vertical_push'),
  ('barbell_row', 'Barbell row', 'horizontal_pull'),
  ('belt_squat', 'Belt squat', 'squat'),
  ('cable_crossover', 'Cable crossover', 'horizontal_push'),
  ('cable_curl', 'Cable curl', 'elbow_flexion'),
  ('cable_fly', 'Cable fly', 'horizontal_push'),
  ('cable_lateral_raise', 'Cable lateral raise', 'vertical_push'),
  ('cable_row', 'Cable row', 'horizontal_pull'),
  ('close_grip_pulldown', 'Close-grip pulldown', 'vertical_pull'),
  ('decline_chest_press', 'Decline chest press', 'horizontal_push'),
  ('decline_db_press', 'Decline DB press', NULL),
  ('dumbbell_bench_press', 'Dumbbell bench press', 'horizontal_push'),
  ('dumbbell_curl', 'Dumbbell curl', 'elbow_flexion'),
  ('dumbbell_incline_press', 'Incline dumbbell press', 'incline_push'),
  ('dumbbell_rdl', 'Dumbbell Romanian deadlift', 'hinge'),
  ('dumbbell_row', 'Dumbbell row', 'horizontal_pull'),
  ('face_pull', 'Face pull', 'horizontal_pull'),
  ('farmers_carry', 'Farmer''s carry', 'carry'),
  ('glute_bridge', 'Glute bridge', 'hinge'),
  ('hack_squat', 'Hack squat', 'squat'),
  ('hip_abduction', 'Hip abduction', NULL),
  ('hip_adduction', 'Hip adduction', NULL),
  ('hip_thrust', 'Hip thrust', 'hinge'),
  ('incline_chest_press', 'Incline chest press', 'horizontal_push'),
  ('incline_db_curl', 'Incline DB curl', 'elbow_flexion'),
  ('iso_high_row', 'Iso high row', 'horizontal_pull'),
  ('iso_pulldown', 'Iso pulldown', 'vertical_pull'),
  ('iso_row', 'Iso row', 'horizontal_pull'),
  ('iso_shoulder_press', 'Iso shoulder press', 'vertical_push'),
  ('kettlebell_rdl', 'Kettlebell Romanian deadlift', 'hinge'),
  ('lat_pulldown', 'Lat pulldown', 'vertical_pull'),
  ('lat_pullover', 'Lat pullover', 'vertical_pull'),
  ('leg_curl', 'Leg curl', 'elbow_flexion'),
  ('leg_extension', 'Leg extension', NULL),
  ('leg_press', 'Leg press', 'squat'),
  ('machine_crunch', 'Machine crunch', 'core'),
  ('machine_shoulder_press', 'Machine shoulder press', 'vertical_push'),
  ('machine_squat', 'Machine squat', 'squat'),
  ('pec_fly', 'Pec fly', 'horizontal_push'),
  ('preacher_curl', 'Preacher curl', 'elbow_flexion'),
  ('reverse_fly', 'Reverse fly', 'horizontal_push'),
  ('reverse_hack_squat', 'Reverse hack squat', 'squat'),
  ('seal_row', 'Seal row', 'horizontal_pull'),
  ('seated_row', 'Seated row', 'horizontal_pull'),
  ('smith_bench', 'Smith bench press', 'horizontal_push'),
  ('smith_row', 'Smith row', 'horizontal_pull'),
  ('smith_shoulder_press', 'Smith shoulder press', 'vertical_push'),
  ('smith_squat', 'Smith squat', 'squat'),
  ('standing_chest_fly', 'Standing chest fly', 'horizontal_push'),
  ('standing_lateral_raise', 'Standing lateral raise', 'vertical_push'),
  ('tricep_kickbacks', 'Tricep kickbacks', 'elbow_extension'),
  ('tricep_pushdown', 'Tricep pushdown', 'elbow_extension')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pattern = EXCLUDED.pattern;

INSERT INTO gym_movements (gym_id, equipment_id, move_id, movement_id)
SELECT g.id, v.equipment_id, v.move_id, v.movement_id
FROM gyms g CROSS JOIN (VALUES
  ('dumbbells', 'flat_chest_press', 'dumbbell_bench_press'),
  ('dumbbells', 'inclined_chest_press', 'dumbbell_incline_press'),
  ('dumbbells', 'bent_over_rows', 'dumbbell_row'),
  ('dumbbells', 'bicep_curls', 'dumbbell_curl'),
  ('dumbbells', 'wide_bicep_curls', 'dumbbell_curl'),
  ('dumbbells', 'tricep_kickbacks', 'tricep_kickbacks'),
  ('dumbbells', 'farmers_carry', 'farmers_carry'),
  ('dumbbells', 'romanian_deadlifts', 'dumbbell_rdl'),
  ('barbells_olympic', 'barbell_row', 'barbell_row'),
  ('barbells_olympic', 'deadlift', 'barbell_deadlift'),
  ('kettlebells', 'kb_romanian_deadlift', 'kettlebell_rdl'),
  ('power_rack', 'back_squat', 'barbell_back_squat'),
  ('power_rack', 'front_squat', 'barbell_front_squat'),
  ('power_rack', 'deadlift', 'barbell_deadlift'),
  ('power_rack', 'bench_press', 'barbell_bench_press'),
  ('power_rack', 'overhead_press', 'barbell_overhead_press'),
  ('power_rack', 'barbell_row', 'barbell_row'),
  ('smith_machine', 'smith_squat', 'smith_squat'),
  ('smith_machine', 'smith_bench', 'smith_bench'),
  ('smith_machine', 'smith_shoulder_press', 'smith_shoulder_press'),
  ('smith_machine', 'smith_row', 'smith_row'),
  ('bench_flat', 'barbell_bench_press', 'barbell_bench_press'),
  ('bench_adjustable', 'incline_db_press', 'dumbbell_incline_press'),
  ('bench_adjustable', 'incline_db_curl', 'incline_db_curl'),
  ('bench_adjustable', 'seal_row', 'seal_row'),
  ('bench_decline', 'decline_db_press', 'decline_db_press'),
  ('bench_preacher', 'preacher_curl', 'preacher_curl'),
  ('leg_press_45', 'leg_press', 'leg_press'),
  ('hack_squat', 'hack_squat', 'hack_squat'),
  ('hack_squat', 'reverse_hack_squat', 'reverse_hack_squat'),
  ('incline_chest_press_pl', 'incline_chest_press', 'incline_chest_press'),
  ('decline_chest_press_pl', 'decline_chest_press', 'decline_chest_press'),
  ('iso_row_pl', 'iso_row', 'iso_row'),
  ('iso_shoulder_press_pl', 'iso_shoulder_press', 'iso_shoulder_press'),
  ('iso_high_row_pl', 'iso_high_row', 'iso_high_row'),
  ('iso_high_row_pl', 'iso_pulldown', 'iso_pulldown'),
  ('squat_sled_pl', 'belt_squat', 'belt_squat'),
  ('squat_sled_pl', 'machine_squat', 'machine_squat'),
  ('lat_pullover', 'lat_pullover', 'lat_pullover'),
  ('booty_builder', 'hip_thrust', 'hip_thrust'),
  ('booty_builder', 'glute_bridge', 'glute_bridge'),
  ('lat_pulldown', 'lat_pulldown', 'lat_pulldown'),
  ('lat_pulldown', 'close_grip_pulldown', 'close_grip_pulldown'),
  ('seated_row', 'seated_row', 'seated_row'),
  ('pec_deck', 'pec_fly', 'pec_fly'),
  ('pec_deck', 'reverse_fly', 'reverse_fly'),
  ('shoulder_press_selector', 'machine_shoulder_press', 'machine_shoulder_press'),
  ('leg_extension', 'leg_extension', 'leg_extension'),
  ('leg_curl', 'leg_curl', 'leg_curl'),
  ('hip_abduction', 'hip_abduction', 'hip_abduction'),
  ('hip_abduction', 'hip_adduction', 'hip_adduction'),
  ('ab_crunch', 'machine_crunch', 'machine_crunch'),
  ('assisted_pullup_dip', 'assisted_pullup', 'assisted_pullup'),
  ('assisted_pullup_dip', 'assisted_dip', 'assisted_dip'),
  ('functional_trainer', 'cable_row', 'cable_row'),
  ('functional_trainer', 'tricep_pushdown', 'tricep_pushdown'),
  ('functional_trainer', 'face_pull', 'face_pull'),
  ('functional_trainer', 'cable_curl', 'cable_curl'),
  ('functional_trainer', 'cable_lateral_raise', 'cable_lateral_raise'),
  ('cable_crossover', 'cable_fly', 'cable_fly'),
  ('cable_crossover', 'cable_crossover', 'cable_crossover'),
  ('standing_lateral_fly', 'standing_lateral_raise', 'standing_lateral_raise'),
  ('standing_lateral_fly', 'standing_chest_fly', 'standing_chest_fly')
) AS v(equipment_id, move_id, movement_id)
WHERE g.slug = 'hanz-n-franz'
ON CONFLICT (gym_id, equipment_id, move_id) DO UPDATE SET movement_id = EXCLUDED.movement_id;

-- Backfill any log rows written before the mapping existed.
UPDATE log_entries l SET movement_id = gm.movement_id
FROM gym_movements gm
WHERE gm.gym_id = l.gym_id AND gm.equipment_id = l.equipment_id
  AND gm.move_id = l.move_id AND l.movement_id IS NULL;

-- What the taxonomy still can't name. Should return zero rows for this gym.
-- SELECT equipment_id, move_id, count(*) FROM log_entries
-- WHERE movement_id IS NULL GROUP BY 1, 2 ORDER BY 3 DESC;
