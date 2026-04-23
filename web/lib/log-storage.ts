"use client";

export type LogEntry = {
  date: string;
  weight: number;
};

const PREFIX = "h360:log:";

function key(userId: string, equipmentId: string, moveId: string): string {
  return `${PREFIX}${userId}:${equipmentId}:${moveId}`;
}

export function getEntries(
  userId: string,
  equipmentId: string,
  moveId: string,
): LogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(userId, equipmentId, moveId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LogEntry[];
  } catch {
    return [];
  }
}

export function setEntries(
  userId: string,
  equipmentId: string,
  moveId: string,
  entries: LogEntry[],
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    key(userId, equipmentId, moveId),
    JSON.stringify(entries),
  );
}

export function addEntry(
  userId: string,
  equipmentId: string,
  moveId: string,
  entry: LogEntry,
): LogEntry[] {
  if (typeof window === "undefined") return [];
  const current = getEntries(userId, equipmentId, moveId);
  const next = [...current, entry].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  setEntries(userId, equipmentId, moveId, next);
  return next;
}

export function removeEntry(
  userId: string,
  equipmentId: string,
  moveId: string,
  index: number,
): LogEntry[] {
  if (typeof window === "undefined") return [];
  const current = getEntries(userId, equipmentId, moveId);
  const next = current.filter((_, i) => i !== index);
  setEntries(userId, equipmentId, moveId, next);
  return next;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
