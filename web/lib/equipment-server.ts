import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EquipmentData } from "@/lib/equipment";

const isDev = process.env.NODE_ENV !== "production";

let stringCache: string | null = null;
let parsedCache: EquipmentData | null = null;

export async function loadEquipmentJson(): Promise<string> {
  if (!isDev && stringCache) return stringCache;
  const p = path.join(process.cwd(), "equipment.json");
  const raw = await readFile(p, "utf8");
  stringCache = raw;
  return raw;
}

export async function loadEquipmentData(): Promise<EquipmentData> {
  if (!isDev && parsedCache) return parsedCache;
  const raw = await loadEquipmentJson();
  const parsed = JSON.parse(raw) as EquipmentData;
  parsedCache = parsed;
  return parsed;
}
