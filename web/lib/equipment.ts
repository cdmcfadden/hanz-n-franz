// Pure types + constants. Safe to import from client and server components.
// Server-only loaders live in lib/equipment-server.ts.

export type Move = {
  id: string;
  name: string;
};

export type EquipmentItem = {
  id: string;
  name: string;
  muscles: string[];
  moves?: Move[];
  confidence?: string;
  count?: string | number;
  brand_guess?: string;
  range_lb?: [number, number];
  style?: string;
  colors?: string[];
  sizes?: string[];
  stored_in?: string;
};

export const CATEGORIES = [
  "free_weights",
  "racks_and_rigs",
  "benches",
  "plate_loaded_machines",
  "selectorized_machines",
  "cables",
  "cardio",
  "accessories",
] as const;

export type EquipmentCategory = (typeof CATEGORIES)[number];

export const categoryLabels: Record<EquipmentCategory, string> = {
  free_weights: "Free weights",
  racks_and_rigs: "Racks & rigs",
  benches: "Benches",
  plate_loaded_machines: "Plate-loaded machines",
  selectorized_machines: "Selectorized machines",
  cables: "Cables",
  cardio: "Cardio",
  accessories: "Accessories",
};

export type EquipmentData = {
  source_video: string;
  cataloged_at: string;
  gym_character: string;
} & Record<EquipmentCategory, EquipmentItem[]>;
