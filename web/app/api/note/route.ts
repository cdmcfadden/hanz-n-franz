import { NextResponse } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const bodySchema = z.object({
  equipmentId: z.string().min(1),
  transcript: z.string().min(1).max(4000),
});

const SYSTEM_PROMPT = `You turn a gym-goer's dictation about a piece of
equipment into a short factual summary that will display on an equipment
card. Rules:
- 1-2 short sentences, <= 140 characters total.
- Lead with the facts (weight, sets, reps, PR, pain, form cue) if present.
- No preamble. No "The user said...". Just the summary itself.
- Keep the user's voice: terse, gym-floor tone.
- If the transcript is empty or unintelligible, reply with exactly:
  (no usable detail in the recording)`;

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
  const { equipmentId, transcript } = parsed.data;

  // Summarize via AI Gateway → Claude Haiku (cheap, fast, good at terse text).
  const { text } = await generateText({
    model: "anthropic/claude-haiku-4-5",
    system: SYSTEM_PROMPT,
    prompt: `Transcript:\n${transcript}`,
    temperature: 0.3,
  });
  const summary = text.trim().slice(0, 200);

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
  });
}
