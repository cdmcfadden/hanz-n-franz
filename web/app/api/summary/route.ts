import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getServerSupabase } from "@/lib/supabase-server";
import { loadEquipmentData } from "@/lib/equipment-server";
import { CATEGORIES } from "@/lib/equipment";
import { buildSummarySystemPrompt, buildSummaryUserPrompt } from "@/lib/prompt";

export const runtime = "nodejs";

const RECENT_WINDOW_DAYS = 60;
const RETURNING_THRESHOLD_DAYS = 14;
const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / DAY_MS);
}

export async function GET() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ text: null }, { status: 401 });
  }

  const { data: entries } = await supabase
    .from("log_entries")
    .select("equipment_id, move_id, weight, log_date")
    .eq("user_id", user.id)
    .order("log_date", { ascending: true });

  if (!entries || entries.length === 0) {
    return NextResponse.json({ text: null });
  }

  const today = new Date();
  const lastLogDate = entries[entries.length - 1].log_date;
  const daysSinceLastLog = daysBetween(today, new Date(lastLogDate));
  const isReturning = daysSinceLastLog > RETURNING_THRESHOLD_DAYS;

  // Max weight ever hit per (equipment_id, move_id), and the date it was set.
  const prMap = new Map<string, { maxWeight: number; maxDate: string }>();
  for (const entry of entries) {
    const key = `${entry.equipment_id}::${entry.move_id}`;
    const existing = prMap.get(key);
    if (!existing || entry.weight > existing.maxWeight) {
      prMap.set(key, { maxWeight: entry.weight, maxDate: entry.log_date });
    }
  }

  // Look back from the last logged day rather than "today" so a returning
  // user's recap covers their last active stretch instead of an empty window.
  const statsWindowEnd = new Date(lastLogDate);
  const statsWindowStart = new Date(statsWindowEnd.getTime() - RECENT_WINDOW_DAYS * DAY_MS);
  const statsWindowStartStr = statsWindowStart.toISOString().slice(0, 10);
  const statsWindowEndStr = statsWindowEnd.toISOString().slice(0, 10);

  const windowEntries = entries.filter(
    (e) => e.log_date >= statsWindowStartStr && e.log_date <= statsWindowEndStr,
  );

  const sessionDates = Array.from(new Set(windowEntries.map((e) => e.log_date))).sort();
  const sessionsInWindow = sessionDates.length;

  if (sessionsInWindow === 0) {
    return NextResponse.json({ text: null });
  }

  let longestGapDays = 0;
  for (let i = 1; i < sessionDates.length; i++) {
    const gap = daysBetween(new Date(sessionDates[i]), new Date(sessionDates[i - 1]));
    if (gap > longestGapDays) longestGapDays = gap;
  }

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

  const recentPRs: Array<{ equipmentName: string; moveName: string; weight: number }> = [];
  for (const [key, { maxWeight, maxDate }] of prMap) {
    if (maxDate >= statsWindowStartStr && maxDate <= statsWindowEndStr) {
      const names = catalogLookup.get(key);
      if (!names) continue;
      recentPRs.push({ ...names, weight: maxWeight });
    }
  }
  recentPRs.sort((a, b) => b.weight - a.weight);

  const movesWorked = new Set(windowEntries.map((e) => `${e.equipment_id}::${e.move_id}`)).size;

  const stats = {
    isReturning,
    daysSinceLastLog,
    sessionsInWindow,
    movesWorked,
    longestGapDays,
    recentPRs: recentPRs.slice(0, 3),
  };

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4-5",
    system: buildSummarySystemPrompt(),
    prompt: buildSummaryUserPrompt(stats),
    temperature: 0.6,
  });

  return NextResponse.json({
    text: text.trim().slice(0, 400),
    isReturning,
  });
}
