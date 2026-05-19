import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const moveInputSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const bodySchema = z.object({
  equipmentId: z.string().min(1),
  transcript: z.string().min(1).max(4000),
  moves: z.array(moveInputSchema).optional(),
});

const noteExtractionSchema = z.object({
  summary: z
    .string()
    .describe(
      "1-2 short sentences, <= 140 chars. Lead with facts (weight, sets, reps, PR, pain, form cue). No preamble. Terse gym-floor tone. If unintelligible use exactly: (no usable detail in the recording)",
    ),
  weight_lbs: z
    .number()
    .nullable()
    .describe(
      "Numeric weight in lbs the user mentioned (e.g. 45 for '45 lbs'). null if no weight mentioned.",
    ),
  move_id: z
    .string()
    .nullable()
    .describe(
      "ID of the move being performed, matched from the available moves list. null if unclear or no moves provided.",
    ),
});

const SYSTEM_PROMPT = `You analyze a gym-goer's voice note about a piece of equipment.

Return:
1. summary: 1-2 short sentences, <= 140 chars total. Lead with facts (weight, sets, reps, PR, pain, form cue). No preamble. Terse gym-floor tone. If unintelligible use exactly: (no usable detail in the recording)
2. weight_lbs: The numeric weight in pounds they mentioned. null if none.
3. move_id: The ID of the move from the provided list that matches what they described. null if unclear or no list provided.`;

export async function POST(req: Request) {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { equipmentId, transcript, moves } = parsed.data;

  const movesContext =
    moves && moves.length > 0
      ? `\nAvailable moves:\n${moves.map((m) => `- ${m.id}: ${m.name}`).join("\n")}`
      : "";

  const { object } = await generateObject({
    model: "anthropic/claude-haiku-4-5",
    schema: noteExtractionSchema,
    system: SYSTEM_PROMPT,
    prompt: `Transcript:\n${transcript}${movesContext}`,
    temperature: 0.3,
  });

  const summary = object.summary.slice(0, 200);

  const { data, error } = await sb
    .from("equipment_notes")
    .insert({
      user_id: user.id,
      equipment_id: equipmentId,
      transcript,
      summary,
    })
    .select("id, equipment_id, transcript, summary, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    equipmentId: data.equipment_id,
    transcript: data.transcript,
    summary: data.summary,
    createdAt: data.created_at,
    extractedWeight: object.weight_lbs,
    extractedMoveId: object.move_id,
  });
}
