import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getServerSupabase } from "@/lib/supabase-server";
import { buildSummarySystemPrompt, buildSummaryUserPrompt } from "@/lib/prompt";
import {
  buildCatalogLookup,
  buildMoveHistory,
  dateStr,
  dayNumber,
  findRegressions,
  pickStalePr,
  today,
  type LogEntry,
} from "@/lib/training-stats";

export const runtime = "nodejs";

const RECENT_WINDOW_DAYS = 60;
const RETURNING_THRESHOLD_DAYS = 14;

export async function GET() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ text: null }, { status: 401 });
  }

  const { data } = await supabase
    .from("log_entries")
    .select("equipment_id, move_id, weight, log_date")
    .eq("user_id", user.id)
    .order("log_date", { ascending: true });

  const entries = (data ?? []) as LogEntry[];
  if (entries.length === 0) {
    return NextResponse.json({ text: null });
  }

  const lastLogDate = entries[entries.length - 1].log_date;
  const lastLogDay = dayNumber(lastLogDate);
  const daysSinceLastLog = dayNumber(today()) - lastLogDay;
  const isReturning = daysSinceLastLog > RETURNING_THRESHOLD_DAYS;

  // Look back from the last logged day rather than "today" so a returning
  // user's recap covers their last active stretch instead of an empty window.
  const windowStart = dateStr(lastLogDay - RECENT_WINDOW_DAYS);
  const windowEntries = entries.filter((e) => e.log_date >= windowStart);

  const sessionDates = Array.from(new Set(windowEntries.map((e) => e.log_date))).sort();
  if (sessionDates.length === 0) {
    return NextResponse.json({ text: null });
  }

  let longestGapDays = 0;
  for (let i = 1; i < sessionDates.length; i++) {
    const gap = dayNumber(sessionDates[i]) - dayNumber(sessionDates[i - 1]);
    if (gap > longestGapDays) longestGapDays = gap;
  }
  // The gap immediately before the most recent session — this is the layoff the
  // athlete just came back from, as opposed to the worst one in the window.
  const lastGapDays =
    sessionDates.length > 1
      ? dayNumber(sessionDates[sessionDates.length - 1]) -
        dayNumber(sessionDates[sessionDates.length - 2])
      : 0;

  const catalog = await buildCatalogLookup();
  const history = buildMoveHistory(entries);

  const recentPRs = [];
  for (const [key, h] of history) {
    if (h.peakDate < windowStart) continue;
    const names = catalog.get(key);
    if (!names) continue;
    recentPRs.push({ ...names, weight: h.peakWeight });
  }
  recentPRs.sort((a, b) => b.weight - a.weight);

  const regressions = findRegressions(history, catalog, windowStart);
  const suggestion = pickStalePr(history, catalog, today());

  const stats = {
    isReturning,
    daysSinceLastLog,
    lastGapDays,
    longestGapDays,
    sessionsInWindow: sessionDates.length,
    movesWorked: new Set(windowEntries.map((e) => `${e.equipment_id}::${e.move_id}`)).size,
    recentPRs: recentPRs.slice(0, 3),
    regressions: regressions.slice(0, 2),
    suggestion: suggestion
      ? { equipmentName: suggestion.equipmentName, moveName: suggestion.moveName }
      : null,
  };

  const { text } = await generateText({
    model: "anthropic/claude-haiku-4-5",
    system: buildSummarySystemPrompt(),
    prompt: buildSummaryUserPrompt(stats),
    temperature: 0.6,
  });

  return NextResponse.json({
    text: text.trim().slice(0, 900),
    isReturning,
    suggestion,
  });
}
