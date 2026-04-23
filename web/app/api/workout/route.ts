import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { loadEquipmentJson } from "@/lib/equipment-server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { requestSchema, workoutSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const equipmentJson = await loadEquipmentJson();

  const result = await generateObject({
    model: "anthropic/claude-sonnet-4-6",
    schema: workoutSchema,
    system: buildSystemPrompt(equipmentJson),
    prompt: buildUserPrompt(parsed.data),
    temperature: 0.7,
  });

  return NextResponse.json(result.object);
}
