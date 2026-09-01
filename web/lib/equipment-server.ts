import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { EquipmentData } from "@/lib/equipment";
import { getAdminSupabase } from "@/lib/supabase-admin";

const isDev = process.env.NODE_ENV !== "production";

// Keyed by gym id, with LEGACY_KEY standing in for the pre-tenancy singleton.
// A single shared slot would mean one busy gym evicting every other gym's
// catalog on each request.
const LEGACY_KEY = "__legacy__";
const catalogCache = new Map<string, EquipmentData>();

export function invalidateEquipmentCache(gymId?: string | null) {
  if (gymId === undefined) {
    catalogCache.clear();
    return;
  }
  catalogCache.delete(gymId ?? LEGACY_KEY);
}

async function loadFromFile(): Promise<EquipmentData> {
  const p = path.join(process.cwd(), "equipment.json");
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as EquipmentData;
}

/**
 * The equipment catalog for one gym.
 *
 * Resolution order: the gym's own catalog, then the legacy single-gym
 * equipment_config row, then equipment.json as a seed. The middle step keeps
 * production working before migrate_008 has run — equipment.json is a seed
 * template, not the source of truth, once a gym exists.
 */
export async function loadEquipmentData(gymId?: string | null): Promise<EquipmentData> {
  const key = gymId ?? LEGACY_KEY;
  if (!isDev) {
    const cached = catalogCache.get(key);
    if (cached) return cached;
  }

  const admin = getAdminSupabase();

  if (gymId) {
    const { data: row } = await admin
      .from("gym_catalogs")
      .select("data")
      .eq("gym_id", gymId)
      .maybeSingle();

    if (row?.data) {
      const parsed = row.data as EquipmentData;
      catalogCache.set(key, parsed);
      return parsed;
    }
  }

  const { data: legacy } = await admin
    .from("equipment_config")
    .select("data")
    .eq("id", 1)
    .maybeSingle();

  if (legacy?.data) {
    const parsed = legacy.data as EquipmentData;
    catalogCache.set(key, parsed);
    return parsed;
  }

  // Nothing stored anywhere — seed from the checked-in catalog.
  const fromFile = await loadFromFile();
  if (gymId) {
    await admin.from("gym_catalogs").insert({ gym_id: gymId, data: fromFile });
  } else {
    await admin.from("equipment_config").insert({ id: 1, data: fromFile });
  }
  catalogCache.set(key, fromFile);
  return fromFile;
}

export async function saveEquipmentData(
  data: EquipmentData,
  userId: string,
  gymId?: string | null,
): Promise<void> {
  const admin = getAdminSupabase();

  if (gymId) {
    const { error } = await admin.from("gym_catalogs").upsert({
      gym_id: gymId,
      data,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("equipment_config").upsert({
      id: 1,
      data,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    });
    if (error) throw new Error(error.message);
  }

  invalidateEquipmentCache(gymId);
}

// Kept for backward compat — callers that want the raw JSON string
export async function loadEquipmentJson(gymId?: string | null): Promise<string> {
  const data = await loadEquipmentData(gymId);
  return JSON.stringify(data);
}
