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

// All date math here is calendar-day math on YYYY-MM-DD strings. Parsing one of
// those into a Date yields UTC midnight, so subtracting a local timestamp from
// it drifts by a day depending on the hour — count epoch days instead.
function dayNumber(dateStr: string): number {
  return Math.round(Date.parse(`${dateStr}T00:00:00Z`) / DAY_MS);
}

function dateStr(dayNum: number): string {
  return new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
}

// Plain, non-AI recap used when the Haiku call fails, so a Gateway hiccup
// doesn't blank out the whole welcome/recap card.
function fallbackSummaryText(stats: {
  isReturning: boolean;
  daysSinceLastLog: number;
  sessionsInWindow: number;
  movesWorked: number;
  recentPRs: Array<{ equipmentName: string; moveName: string; weight: number }>;
}): string {
  if (stats.isReturning) {
    return `It's been ${stats.daysSinceLastLog} days since your last logged session — let's get back to it today.`;
  }
  const sessionWord = stats.sessionsInWindow === 1 ? "session" : "sessions";
  const top = stats.recentPRs[0];
  const prNote = top ? ` including a PR on ${top.moveName} at ${top.weight} lbs` : "";
  return `You've logged ${stats.sessionsInWindow} ${sessionWord} across ${stats.movesWorked} moves recently${prNote}.`;
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

  const lastLogDate = entries[entries.length - 1].log_date;
  const lastLogDay = dayNumber(lastLogDate);
  const daysSinceLastLog = dayNumber(new Date().toISOString().slice(0, 10)) - lastLogDay;
  const isReturning = daysSinceLastLog > RETURNING_THRESHOLD_DAYS;

  // Max weight ever hit per (equipment_id, move_id), and the date it was set.
  // `weight` is a Postgres `numeric` column, which PostgREST serializes as a
  // string — compare numerically or "100" < "95" lexicographically wins.
  const prMap = new Map<string, { maxWeight: number; maxDate: string }>();
  for (const entry of entries) {
    const key = `${entry.equipment_id}::${entry.move_id}`;
    const weight = Number(entry.weight);
    const existing = prMap.get(key);
    if (!existing || weight > existing.maxWeight) {
      prMap.set(key, { maxWeight: weight, maxDate: entry.log_date });
    }
  }

  // Look back from the last logged day rather than "today" so a returning
  // user's recap covers their last active stretch instead of an empty window.
  const statsWindowStartStr = dateStr(lastLogDay - RECENT_WINDOW_DAYS);
  const statsWindowEndStr = lastLogDate;

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
    const gap = dayNumber(sessionDates[i]) - dayNumber(sessionDates[i - 1]);
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

  let text: string;
  try {
    const result = await generateText({
      model: "anthropic/claude-haiku-4-5",
      system: buildSummarySystemPrompt(),
      prompt: buildSummaryUserPrompt(stats),
      temperature: 0.6,
    });
    text = result.text.trim();
  } catch (err) {
    // A model/Gateway hiccup shouldn't blank out the whole card — fall back
    // to a plain templated recap built from the same stats.
    console.error("[/api/summary] generateText failed, using fallback text:", err);
    text = "";
  }
  if (!text) text = fallbackSummaryText(stats);

  return NextResponse.json({
    text: text.trim().slice(0, 400),
    isReturning,
  });
}
