export type MuscleGroup = {
  id: string;
  label: string;
  muscles: readonly string[];
  // Tailwind class fragments for chip styling. activeBg/activeText apply when
  // the chip is selected; ringClass is used for the inactive outline.
  activeBg: string;
  activeText: string;
  dotClass: string;
};

// Muted, editorial palette — darker shades (700-900) so chips read as
// sophisticated tags rather than candy buttons. Each group still has a unique
// hue for quick scanning, but saturation is dialed back.
export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  { id: "chest", label: "Chest", muscles: ["chest", "upper chest", "lower chest"],
    activeBg: "bg-rose-900", activeText: "text-rose-50", dotClass: "bg-rose-800" },
  { id: "back", label: "Back", muscles: ["back", "lats", "rhomboids"],
    activeBg: "bg-slate-700", activeText: "text-slate-50", dotClass: "bg-slate-600" },
  { id: "shoulders", label: "Shoulders", muscles: ["shoulders", "front delts", "rear delts"],
    activeBg: "bg-amber-800", activeText: "text-amber-50", dotClass: "bg-amber-700" },
  { id: "arms", label: "Arms", muscles: ["biceps", "triceps", "brachialis", "grip"],
    activeBg: "bg-indigo-900", activeText: "text-indigo-50", dotClass: "bg-indigo-700" },
  { id: "legs", label: "Legs", muscles: ["legs", "quads", "hamstrings", "calves", "glutes", "glute medius", "adductors"],
    activeBg: "bg-emerald-900", activeText: "text-emerald-50", dotClass: "bg-emerald-800" },
  { id: "core", label: "Core", muscles: ["abs", "core"],
    activeBg: "bg-orange-900", activeText: "text-orange-50", dotClass: "bg-orange-800" },
  { id: "cardio", label: "Cardio", muscles: ["cardio"],
    activeBg: "bg-red-900", activeText: "text-red-50", dotClass: "bg-red-800" },
  { id: "fullbody", label: "Full-body", muscles: ["full-body power", "varies"],
    activeBg: "bg-stone-700", activeText: "text-stone-50", dotClass: "bg-stone-600" },
];

export const GROUP_BY_ID: Record<string, MuscleGroup> = Object.fromEntries(
  MUSCLE_GROUPS.map((g) => [g.id, g]),
);

export const ALL_GROUP_IDS: string[] = MUSCLE_GROUPS.map((g) => g.id);

export function groupsForItem(itemMuscles: string[]): Set<string> {
  const result = new Set<string>();
  for (const g of MUSCLE_GROUPS) {
    if (itemMuscles.some((m) => g.muscles.includes(m))) {
      result.add(g.id);
    }
  }
  return result;
}

// Per-move group mapping. Each move id maps to an array of group ids it
// targets. Some move ids appear under multiple equipment (e.g. "deadlift" on
// both power_rack and barbells_olympic) — same id, same target groups.
//
// For moves not in this table, callers fall back to the equipment-level
// muscle groups so nothing silently disappears.
export const MOVE_GROUPS: Record<string, string[]> = {
  // Power rack / barbell compound
  back_squat: ["legs", "core"],
  front_squat: ["legs", "core"],
  deadlift: ["legs", "back", "core"],
  bench_press: ["chest", "shoulders", "arms"],
  overhead_press: ["shoulders", "arms", "core"],
  barbell_row: ["back", "arms"],

  // Smith machine
  smith_squat: ["legs", "core"],
  smith_bench: ["chest", "shoulders", "arms"],
  smith_shoulder_press: ["shoulders", "arms"],
  smith_row: ["back", "arms"],

  // Benches (with dumbbells)
  db_bench_press: ["chest", "shoulders", "arms"],
  db_fly: ["chest"],
  incline_db_press: ["chest", "shoulders", "arms"],
  incline_db_curl: ["arms"],
  seal_row: ["back", "arms"],
  decline_db_press: ["chest", "arms"],
  preacher_curl: ["arms"],

  // Plate-loaded
  leg_press: ["legs"],
  hack_squat: ["legs"],
  reverse_hack_squat: ["legs"],
  incline_chest_press: ["chest", "shoulders", "arms"],
  iso_row: ["back", "arms"],
  iso_shoulder_press: ["shoulders", "arms"],
  iso_high_row: ["back"],
  iso_pulldown: ["back", "arms"],
  belt_squat: ["legs"],
  machine_squat: ["legs"],
  lat_pullover: ["back"],
  hip_thrust: ["legs"],
  glute_bridge: ["legs"],

  // Selectorized
  lat_pulldown: ["back", "arms"],
  close_grip_pulldown: ["back", "arms"],
  seated_row: ["back", "arms"],
  pec_fly: ["chest"],
  reverse_fly: ["shoulders", "back"],
  machine_chest_press: ["chest", "shoulders", "arms"],
  machine_shoulder_press: ["shoulders", "arms"],
  leg_extension: ["legs"],
  leg_curl: ["legs"],
  hip_abduction: ["legs"],
  hip_adduction: ["legs"],
  machine_crunch: ["core"],
  assisted_pullup: ["back", "arms"],
  assisted_dip: ["chest", "arms"],

  // Cables
  cable_row: ["back", "arms"],
  tricep_pushdown: ["arms"],
  face_pull: ["shoulders", "back"],
  cable_curl: ["arms"],
  cable_lateral_raise: ["shoulders"],
  cable_fly: ["chest"],
  cable_crossover: ["chest"],

  // Dumbbell free-weight moves
  flat_chest_press: ["chest", "shoulders", "arms"],
  inclined_chest_press: ["chest", "shoulders", "arms"],
  bent_over_rows: ["back", "arms"],
  bicep_curls: ["arms"],
  wide_bicep_curls: ["arms"],
  tricep_kickbacks: ["arms"],
  farmers_carry: ["arms", "core", "legs"],
  romanian_deadlifts: ["legs", "back"],

  // Kettlebell
  kb_romanian_deadlift: ["legs", "back"],
};

export function groupsForMove(
  moveId: string,
  fallbackMuscles: string[],
): Set<string> {
  const explicit = MOVE_GROUPS[moveId];
  if (explicit) return new Set(explicit);
  return groupsForItem(fallbackMuscles);
}
