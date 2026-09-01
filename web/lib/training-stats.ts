import "server-only";
import { loadEquipmentData } from "@/lib/equipment-server";
import { CATEGORIES } from "@/lib/equipment";

export type LogEntry = {
  equipment_id: string;
  move_id: string;
  movement_id?: string | null;
  weight: number;
  log_date: string;
};

/**
 * Postgres `numeric` can reach the client as a string depending on the driver
 * and column type, and `"95" > "100"` is true. Every comparison in this module
 * would be wrong above 99 lbs if that ever happened, so coerce once on the way
 * in rather than trusting the declared type.
 */
export function normalizeEntries(rows: unknown[]): LogEntry[] {
  return (rows as LogEntry[]).map((r) => ({ ...r, weight: Number(r.weight) }));
}

export type MoveNames = { equipmentName: string; moveName: string };

export const DAY_MS = 1000 * 60 * 60 * 24;

// Calendar-day math on YYYY-MM-DD strings. Parsing one into a Date yields UTC
// midnight, so subtracting a local timestamp drifts by a day depending on the
// hour — count epoch days instead.
export function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
}

export function dateStr(dayNum: number): string {
  return new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function moveKey(equipmentId: string, moveId: string): string {
  return `${equipmentId}::${moveId}`;
}

/** Flat (equipmentId::moveId) → display names for everything in the catalog. */
export async function buildCatalogLookup(gymId?: string | null): Promise<Map<string, MoveNames>> {
  const equipment = await loadEquipmentData(gymId);
  const lookup = new Map<string, MoveNames>();
  for (const cat of CATEGORIES) {
    for (const item of equipment[cat]) {
      for (const move of item.moves ?? []) {
        lookup.set(moveKey(item.id, move.id), {
          equipmentName: item.name,
          moveName: move.name,
        });
      }
    }
  }
  return lookup;
}

export type MoveHistory = {
  // Which gym equipment the most recent entry came from. History is grouped by
  // movement, but a member should read "Hammer Strength chest press", not
  // "barbell_bench_press", so display names resolve through this.
  equipmentId: string;
  moveId: string;
  peakWeight: number;
  peakDate: string;
  latestWeight: number;
  latestDate: string;
};

/**
 * Group by canonical movement when the row has one, and fall back to the gym's
 * own (equipment, move) pair when it doesn't. That fallback is what lets a
 * member's history survive changing gyms: two gyms' ids collapse onto one
 * movement, while an unmapped move still gets its own bucket instead of
 * disappearing.
 *
 * Entries must be sorted by log_date ascending.
 */
export function buildMoveHistory(entries: LogEntry[]): Map<string, MoveHistory> {
  const history = new Map<string, MoveHistory>();
  for (const entry of entries) {
    const key = entry.movement_id ?? moveKey(entry.equipment_id, entry.move_id);
    const existing = history.get(key);
    if (!existing) {
      history.set(key, {
        equipmentId: entry.equipment_id,
        moveId: entry.move_id,
        peakWeight: entry.weight,
        peakDate: entry.log_date,
        latestWeight: entry.weight,
        latestDate: entry.log_date,
      });
      continue;
    }
    if (entry.weight > existing.peakWeight) {
      existing.peakWeight = entry.weight;
      existing.peakDate = entry.log_date;
    }
    existing.latestWeight = entry.weight;
    existing.latestDate = entry.log_date;
    existing.equipmentId = entry.equipment_id;
    existing.moveId = entry.move_id;
  }
  return history;
}

export type StalePr = {
  equipmentId: string;
  moveId: string;
  equipmentName: string;
  moveName: string;
};

export const STALE_PR_DAYS = 14;

/**
 * A move whose personal record has stood untouched for a while — something
 * worth taking another crack at. Picked at random so it varies day to day.
 * Moves missing from the current catalog are skipped, so stale log rows never
 * surface as raw ids.
 */
export function pickStalePr(
  history: Map<string, MoveHistory>,
  catalog: Map<string, MoveNames>,
  asOf: string,
): StalePr | null {
  const cutoff = dateStr(dayNumber(asOf) - STALE_PR_DAYS);
  const candidates: StalePr[] = [];
  for (const h of history.values()) {
    if (h.peakDate > cutoff) continue;
    const names = catalog.get(moveKey(h.equipmentId, h.moveId));
    if (!names) continue;
    candidates.push({ equipmentId: h.equipmentId, moveId: h.moveId, ...names });
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Smallest plate/dumbbell jump worth suggesting. The catalog doesn't record
// per-machine increments, so this is a deliberate floor rather than a lookup.
export const WEIGHT_INCREMENT_LB = 5;

// Below this, a dip is noise (a deload, a bad night's sleep), not a regression
// worth building a comeback plan around.
const REGRESSION_MIN_PCT = 5;

export type Regression = {
  equipmentName: string;
  moveName: string;
  peakWeight: number;
  peakDate: string;
  currentWeight: number;
  currentDate: string;
  pctDown: number;
  suggestedNextWeight: number;
  sessionsToRegain: number;
};

/**
 * Moves the athlete is currently lifting below their own best. This is the
 * signal that makes a comeback recap concrete: which lift slipped, by how
 * much, and how many sessions of normal progression it takes to get back.
 */
export function findRegressions(
  history: Map<string, MoveHistory>,
  catalog: Map<string, MoveNames>,
  sinceDate: string,
): Regression[] {
  const out: Regression[] = [];
  for (const h of history.values()) {
    if (h.latestDate < sinceDate) continue;
    if (h.latestWeight >= h.peakWeight) continue;
    if (h.peakDate >= h.latestDate) continue;

    const pctDown = Math.round(((h.peakWeight - h.latestWeight) / h.peakWeight) * 100);
    if (pctDown < REGRESSION_MIN_PCT) continue;

    const names = catalog.get(moveKey(h.equipmentId, h.moveId));
    if (!names) continue;

    const deficit = h.peakWeight - h.latestWeight;
    out.push({
      ...names,
      peakWeight: h.peakWeight,
      peakDate: h.peakDate,
      currentWeight: h.latestWeight,
      currentDate: h.latestDate,
      pctDown,
      suggestedNextWeight: Math.min(h.latestWeight + WEIGHT_INCREMENT_LB, h.peakWeight),
      sessionsToRegain: Math.ceil(deficit / WEIGHT_INCREMENT_LB),
    });
  }
  return out.sort((a, b) => b.pctDown - a.pctDown);
}
