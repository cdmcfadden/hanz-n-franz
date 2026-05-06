import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EquipmentData } from "@/lib/equipment";
import { getAdminSupabase } from "@/lib/supabase-admin";

const isDev = process.env.NODE_ENV !== "production";

let parsedCache: EquipmentData | null = null;

export function invalidateEquipmentCache() {
  parsedCache = null;
}

async function loadFromFile(): Promise<EquipmentData> {
  const p = path.join(process.cwd(), "equipment.json");
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as EquipmentData;
}

export async function loadEquipmentData(): Promise<EquipmentData> {
  if (!isDev && parsedCache) return parsedCache;

  const admin = getAdminSupabase();
  const { data: row } = await admin
    .from("equipment_config")
    .select("data")
    .eq("id", 1)
    .single();

  if (row?.data) {
    const parsed = row.data as EquipmentData;
    parsedCache = parsed;
    return parsed;
  }

  // Table is empty — seed from equipment.json
  const fromFile = await loadFromFile();
  await admin.from("equipment_config").insert({ id: 1, data: fromFile });
  parsedCache = fromFile;
  return fromFile;
}

export async function saveEquipmentData(
  data: EquipmentData,
  userId: string,
): Promise<void> {
  const admin = getAdminSupabase();
  const { error } = await admin.from("equipment_config").upsert({
    id: 1,
    data,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  });
  if (error) throw new Error(error.message);
  invalidateEquipmentCache();
}

// Kept for backward compat — callers that want the raw JSON string
export async function loadEquipmentJson(): Promise<string> {
  const data = await loadEquipmentData();
  return JSON.stringify(data);
}
