import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AthleteEvent = {
  id: number;
  title: string;
  eventDate: string;
  notes: string | null;
};

// Renders the athlete's learned memory + upcoming events into a short block
// the workout prompt can drop straight into the system prompt. Missing rows
// are treated as "nothing known yet" rather than an error — most users won't
// have filled this in.
export async function loadAthleteContext(
  sb: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const [{ data: memory }, { data: events }] = await Promise.all([
    sb.from("athlete_memory").select("summary").eq("user_id", userId).maybeSingle(),
    sb
      .from("athlete_events")
      .select("id, title, event_date, notes")
      .eq("user_id", userId)
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .order("event_date", { ascending: true })
      .limit(5),
  ]);

  const summary = (memory?.summary as string | undefined)?.trim();
  const upcoming = (events ?? []) as { id: number; title: string; event_date: string; notes: string | null }[];

  if (!summary && upcoming.length === 0) return null;

  const parts: string[] = [];
  if (summary) parts.push(summary);
  if (upcoming.length > 0) {
    const today = new Date();
    const lines = upcoming.map((e) => {
      const days = Math.ceil(
        (new Date(e.event_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const notes = e.notes ? ` — ${e.notes}` : "";
      return `- ${e.title} on ${e.event_date} (${days} days away)${notes}`;
    });
    parts.push(`Upcoming events:\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
}
