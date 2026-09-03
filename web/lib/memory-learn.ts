import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { fetchLogEntries } from "@/lib/training-stats";

// How stale the learned summary has to be before a workout request triggers a
// background refresh. Learning is cheap (Haiku, one call) but not free, and an
// athlete's goals/habits don't shift day to day.
const AUTO_LEARN_INTERVAL_DAYS = 7;

// Below this, there isn't enough signal to say anything useful about habits.
const MIN_LOGS_TO_LEARN = 5;

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
- Carry forward anything from the existing memory that still holds; drop anything the new data contradicts. The existing memory may have been hand-edited by the athlete — treat those statements as authoritative unless the data plainly contradicts them.
- Do not mention upcoming events — those are tracked separately.
- Do not invent facts not supported by the data. If there isn't enough data yet, say so briefly.
- Plain prose, 3-5 sentences, no headers or bullet points.`;

export class NotEnoughDataError extends Error {
  constructor() {
    super("Not enough logged data yet — log a few workouts first.");
    this.name = "NotEnoughDataError";
  }
}

/**
 * Regenerates the athlete's learned memory summary from their recent training
 * data and writes it back.
 *
 * Uses the admin client rather than the caller's session so it can also run
 * from a background `after()` task, where the request cookies are gone.
 *
 * Throws NotEnoughDataError when the athlete has almost no history yet.
 */
export async function refreshAthleteMemory(userId: string): Promise<string> {
  const sb = getAdminSupabase();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [{ data: existingMemory }, logs, { data: notes }] = await Promise.all([
    sb.from("athlete_memory").select("summary").eq("user_id", userId).maybeSingle(),
    fetchLogEntries(sb, userId, { since: cutoffStr, limit: 300 }),
    sb
      .from("equipment_notes")
      .select("equipment_id, summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const logRows = logs;
  const noteRows = notes ?? [];
  if (logRows.length < MIN_LOGS_TO_LEARN && noteRows.length === 0) {
    throw new NotEnoughDataError();
  }

  const logLines = logRows
    .map((l) => `- ${l.log_date}: ${l.movement_id ?? `${l.equipment_id}/${l.move_id}`} @ ${l.weight}`)
    .join("\n");
  const noteLines = noteRows.map((n) => `- ${n.equipment_id}: ${n.summary}`).join("\n");
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
  const now = new Date().toISOString();

  const { error } = await sb
    .from("athlete_memory")
    .upsert({ user_id: userId, summary, updated_at: now, auto_learned_at: now });

  if (error) throw new Error(error.message);

  return summary;
}

/**
 * Background re-learn: this is what makes the memory actually accumulate over
 * time rather than only when someone taps the button on /account. Called from
 * the workout route via `after()`, so it costs the user nothing in latency.
 *
 * Silent by design — a failed refresh must never affect the workout that
 * triggered it.
 */
export async function maybeAutoLearn(userId: string): Promise<void> {
  try {
    const sb = getAdminSupabase();
    const { data } = await sb
      .from("athlete_memory")
      .select("auto_learned_at")
      .eq("user_id", userId)
      .maybeSingle();

    const lastLearned = data?.auto_learned_at ? new Date(data.auto_learned_at as string) : null;
    if (lastLearned) {
      const ageDays = (Date.now() - lastLearned.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < AUTO_LEARN_INTERVAL_DAYS) return;
    }

    await refreshAthleteMemory(userId);
  } catch (e) {
    if (e instanceof NotEnoughDataError) return;
    console.error("[memory] auto-learn failed", e);
  }
}
