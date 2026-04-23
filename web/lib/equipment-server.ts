import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EquipmentData } from "@/lib/equipment";

let stringCache: string | null = null;
let parsedCache: EquipmentData | null = null;

export async function loadEquipmentJson(): Promise<string> {
  if (stringCache) return stringCache;
  const p = path.join(process.cwd(), "equipment.json");
  stringCache = await readFile(p, "utf8");
  return stringCache;
}

export async function loadEquipmentData(): Promise<EquipmentData> {
  if (parsedCache) return parsedCache;
  const raw = await loadEquipmentJson();
  parsedCache = JSON.parse(raw) as EquipmentData;
  return parsedCache;
}
