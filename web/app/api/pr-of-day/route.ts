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

  // Track the max weight and date it was achieved per (equipment_id, move_id)
  const prMap = new Map<string, { maxWeight: number; maxDate: string }>();
  for (const entry of entries) {
    const key = `${entry.equipment_id}::${entry.move_id}`;
    const existing = prMap.get(key);
    if (!existing || entry.weight > existing.maxWeight) {
      prMap.set(key, { maxWeight: entry.weight, maxDate: entry.log_date });
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const candidates: Array<{ equipmentId: string; moveId: string }> = [];
  for (const [key, { maxDate }] of prMap) {
    if (maxDate <= cutoffStr) {
      const sep = key.indexOf("::");
      candidates.push({
        equipmentId: key.slice(0, sep),
        moveId: key.slice(sep + 2),
      });
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ candidate: null });
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  const equipment = await loadEquipmentData();
  let equipmentName = "";
  let moveName = "";

  for (const cat of CATEGORIES) {
    const item = equipment[cat].find((e) => e.id === picked.equipmentId);
    if (item) {
      equipmentName = item.name;
      const move = item.moves?.find((m) => m.id === picked.moveId);
      moveName = move?.name ?? picked.moveId;
      break;
    }
  }

  if (!equipmentName) {
    return NextResponse.json({ candidate: null });
  }

  return NextResponse.json({
    candidate: {
      equipmentId: picked.equipmentId,
      moveId: picked.moveId,
      moveName,
      equipmentName,
    },
  });
}
