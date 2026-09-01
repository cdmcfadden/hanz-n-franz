import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { loadEquipmentData } from "@/lib/equipment-server";
import { CATEGORIES } from "@/lib/equipment";

export async function GET() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ candidate: null }, { status: 401 });
  }

  const { data: entries } = await supabase
    .from("log_entries")
    .select("equipment_id, move_id, weight, log_date")
    .eq("user_id", user.id)
    .order("log_date", { ascending: true });

  if (!entries || entries.length === 0) {
    return NextResponse.json({ candidate: null });
  }

  // Track the max weight and date it was achieved per (equipment_id, move_id).
  // `weight` is a Postgres `numeric` column, which PostgREST serializes as a
  // string — coerce before comparing or this becomes lexicographic ("9" > "80").
  const prMap = new Map<string, { maxWeight: number; maxDate: string }>();
  for (const entry of entries) {
    const key = `${entry.equipment_id}::${entry.move_id}`;
    const weight = Number(entry.weight);
    const existing = prMap.get(key);
    if (!existing || weight > existing.maxWeight) {
      prMap.set(key, { maxWeight: weight, maxDate: entry.log_date });
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Build a flat lookup of all resolvable (equipmentId::moveId) → names from catalog
  const equipment = await loadEquipmentData();
  const catalogLookup = new Map<string, { equipmentName: string; moveName: string }>();
  for (const cat of CATEGORIES) {
    for (const item of equipment[cat]) {
      for (const move of item.moves ?? []) {
        catalogLookup.set(`${item.id}::${move.id}`, {
          equipmentName: item.name,
          moveName: move.name,
        });
      }
    }
  }

  // Candidates: PR was set ≥ 14 days ago AND both equipment and move exist in catalog
  const candidates: Array<{
    equipmentId: string;
    moveId: string;
    equipmentName: string;
    moveName: string;
  }> = [];

  for (const [key, { maxDate }] of prMap) {
    if (maxDate <= cutoffStr) {
      const names = catalogLookup.get(key);
      if (!names) continue;
      const sep = key.indexOf("::");
      candidates.push({
        equipmentId: key.slice(0, sep),
        moveId: key.slice(sep + 2),
        ...names,
      });
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ candidate: null });
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return NextResponse.json({ candidate: picked });
}
