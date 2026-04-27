"use client";

import { getBrowserSupabase as getSupabase } from "@/lib/supabase-browser";

export type Note = {
  id: number;
  equipmentId: string;
  transcript: string;
  summary: string;
  createdAt: string;
};

type Row = {
  id: number;
  user_id: string;
  equipment_id: string;
  transcript: string;
  summary: string;
  created_at: string;
};

function rowToNote(r: Row): Note {
  return {
    id: r.id,
    equipmentId: r.equipment_id,
    transcript: r.transcript,
    summary: r.summary,
    createdAt: r.created_at,
  };
}

// Returns a Map<equipmentId, Note> holding the most recent note per equipment
// for the given user. Single query — we let the DB do the ordering and pick
// the first row per equipment client-side.
export async function fetchLatestNotesForUser(
  userId: string,
): Promise<Map<string, Note>> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("equipment_notes")
    .select("id, user_id, equipment_id, transcript, summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const latest = new Map<string, Note>();
  for (const r of (data ?? []) as Row[]) {
    if (!latest.has(r.equipment_id)) latest.set(r.equipment_id, rowToNote(r));
  }
  return latest;
}

// Posts to /api/note so the server-side LLM + insert happens with the
// AI Gateway key, not the client's anon key.
export async function saveNote(
  equipmentId: string,
  transcript: string,
): Promise<Note> {
  const res = await fetch("/api/note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipmentId, transcript }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Note;
}
