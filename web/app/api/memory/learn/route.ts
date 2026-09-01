import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const learnedMemorySchema = z.object({
  summary: z
    .string()
    .describe(
      "3-5 short sentences capturing this athlete's goals, training preferences, and habits. Plain prose, no headers or bullet points. <= 700 chars.",
    ),
});

const SYSTEM_PROMPT = `You maintain a short running memory profile of a gym-goer for a workout-generating coach AI.

Given their existing memory, recent logged sets (equipment/move/weight/date), and any equipment voice-note summaries, write an updated memory profile.

Rules:
- Capture goals, preferences (e.g. "prefers free weights over machines", "dislikes burpees"), and habits (e.g. "trains legs on Mondays", "consistently increasing bench weight").
- Carry forward anything from the existing memory that still holds; drop anything the new data contradicts.
- Do not mention upcoming events — those are tracked separately.
- Do not invent facts not supported by the data. If there isn't enough data yet, say so briefly.
- Plain prose, 3-5 sentences, no headers or bullet points.`;

export async function POST() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [{ data: existingMemory }, { data: logs }, { data: notes }] = await Promise.all([
    sb.from("athlete_memory").select("summary").eq("user_id", user.id).maybeSingle(),
    sb
      .from("log_entries")
      .select("equipment_id, move_id, log_date, weight")
      .eq("user_id", user.id)
      .gte("log_date", cutoffStr)
      .order("log_date", { ascending: true })
      .limit(300),
    sb
      .from("equipment_notes")
      .select("equipment_id, summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!logs || logs.length === 0) {
    if (!notes || notes.length === 0) {
      return NextResponse.json(
        { error: "Not enough logged data yet — log a few workouts first." },
        { status: 400 },
      );
    }
  }

  const logLines = (logs ?? [])
    .map((l) => `- ${l.log_date}: ${l.equipment_id}/${l.move_id} @ ${l.weight}`)
    .join("\n");
  const noteLines = (notes ?? []).map((n) => `- ${n.equipment_id}: ${n.summary}`).join("\n");
  const existingSummary = (existingMemory?.summary as string | undefined)?.trim();

  const prompt = [
    existingSummary ? `Existing memory:\n${existingSummary}` : "Existing memory: (none yet)",
    `Recent logged sets (last 90 days):\n${logLines || "(none)"}`,
    `Recent voice-note summaries:\n${noteLines || "(none)"}`,
  ].join("\n\n");

  const { object } = await generateObject({
    model: "anthropic/claude-haiku-4-5",
    schema: learnedMemorySchema,
    system: SYSTEM_PROMPT,
    prompt,
    temperature: 0.4,
  });

  const summary = object.summary.slice(0, 2000);

  const { error } = await sb
    .from("athlete_memory")
    .upsert({ user_id: user.id, summary, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ summary });
}
