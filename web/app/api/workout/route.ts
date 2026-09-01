import { NextResponse, after } from "next/server";
import { generateObject } from "ai";
import { loadEquipmentJson } from "@/lib/equipment-server";
import { resolveGymId } from "@/lib/gym";
import { maybeAutoLearn } from "@/lib/memory-learn";
import { loadAthleteContext } from "@/lib/memory-store";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { requestSchema, workoutSchema } from "@/lib/schema";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // The catalog is per gym, so it has to be resolved from the athlete, not
  // loaded once for the whole app.
  const gymId = user ? await resolveGymId(user.id) : null;
  const equipmentJson = await loadEquipmentJson(gymId);
  const athleteContext = user ? await loadAthleteContext(sb, user.id) : null;

  const result = await generateObject({
    model: "anthropic/claude-sonnet-4-6",
    schema: workoutSchema,
    system: buildSystemPrompt(equipmentJson, athleteContext),
    prompt: buildUserPrompt(parsed.data),
    temperature: 0.7,
  });

  // Keep the memory current as the athlete keeps training. Runs after the
  // response is sent and no-ops unless the summary has gone stale.
  if (user) after(() => maybeAutoLearn(user.id));

  return NextResponse.json(result.object);
}
