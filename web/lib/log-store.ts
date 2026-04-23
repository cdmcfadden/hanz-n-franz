"use client";

import { getSupabase } from "@/lib/supabase";

export type LogEntry = {
  id: number;
  date: string;
  weight: number;
};

// key = `${equipmentId}:${moveId}` (single-user maps)
// key = `${userId}:${equipmentId}:${moveId}` (cross-user maps used on /trends)
export type EntryMap = Map<string, LogEntry[]>;

type Row = {
  id: number;
  user_id: string;
  equipment_id: string;
  move_id: string;
  log_date: string;
  weight: number;
};

function moveKey(equipmentId: string, moveId: string): string {
  return `${equipmentId}:${moveId}`;
}
function userMoveKey(
  userId: string,
  equipmentId: string,
  moveId: string,
): string {
  return `${userId}:${equipmentId}:${moveId}`;
}

function rowsByMove(rows: Row[]): EntryMap {
  const m: EntryMap = new Map();
  for (const r of rows) {
    const k = moveKey(r.equipment_id, r.move_id);
    const list = m.get(k) ?? [];
    list.push({ id: r.id, date: r.log_date, weight: Number(r.weight) });
    m.set(k, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }
  return m;
}

function rowsByUserMove(rows: Row[]): EntryMap {
  const m: EntryMap = new Map();
  for (const r of rows) {
    const k = userMoveKey(r.user_id, r.equipment_id, r.move_id);
    const list = m.get(k) ?? [];
    list.push({ id: r.id, date: r.log_date, weight: Number(r.weight) });
    m.set(k, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }
  return m;
}

export async function fetchEntriesForUser(
  userId: string,
): Promise<EntryMap> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("log_entries")
    .select("id, user_id, equipment_id, move_id, log_date, weight")
    .eq("user_id", userId)
    .order("log_date", { ascending: true });
  if (error) throw error;
  return rowsByMove((data ?? []) as Row[]);
}

export async function fetchAllEntries(): Promise<EntryMap> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("log_entries")
    .select("id, user_id, equipment_id, move_id, log_date, weight")
    .order("log_date", { ascending: true });
  if (error) throw error;
  return rowsByUserMove((data ?? []) as Row[]);
}

export async function addEntry(
  userId: string,
  equipmentId: string,
  moveId: string,
  date: string,
  weight: number,
): Promise<LogEntry> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("log_entries")
    .insert({
      user_id: userId,
      equipment_id: equipmentId,
      move_id: moveId,
      log_date: date,
      weight,
    })
    .select("id, log_date, weight")
    .single();
  if (error) throw error;
  return { id: data.id, date: data.log_date, weight: Number(data.weight) };
}

export async function removeEntry(entryId: number): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("log_entries").delete().eq("id", entryId);
  if (error) throw error;
}

export async function deleteAllEntries(): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("log_entries").delete().gt("id", 0);
  if (error) throw error;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const keys = { moveKey, userMoveKey };
