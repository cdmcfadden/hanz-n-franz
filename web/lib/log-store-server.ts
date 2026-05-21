import { getServerSupabase } from "@/lib/supabase-server";

export type ActivityMaps = {
  lastActivityMap: Record<string, string>;
  lastMoveActivityMap: Record<string, string>;
};

export async function fetchLastActivityMaps(
  userId: string,
): Promise<ActivityMaps> {
  const sb = await getServerSupabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data } = await sb
    .from("log_entries")
    .select("equipment_id, move_id, log_date, created_at")
    .eq("user_id", userId)
    .gte("log_date", cutoffStr)
    .order("log_date", { ascending: true })
    .order("created_at", { ascending: true });

  const lastMoveActivityMap: Record<string, string> = {};
  const lastActivityMap: Record<string, string> = {};

  for (const row of data ?? []) {
    const moveKey = `${row.equipment_id}:${row.move_id}`;
    const value = `${row.log_date}|${row.created_at}`;
    lastMoveActivityMap[moveKey] = value;
    const prev = lastActivityMap[row.equipment_id];
    if (!prev || value > prev) lastActivityMap[row.equipment_id] = value;
  }

  return { lastActivityMap, lastMoveActivityMap };
}
