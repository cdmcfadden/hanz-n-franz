export function buildSystemPrompt(equipmentJson: string, athleteContext?: string | null): string {
  const memorySection = athleteContext
    ? `\nATHLETE CONTEXT (learned goals, preferences, habits, and upcoming events for this specific user):
${athleteContext}
- Use this to steer exercise choice, intensity, and the coach_note. If an upcoming event implies tapering or a different emphasis (e.g. a marathon means favor running-compatible volume and avoid heavy leg soreness close to the date), adjust accordingly and say why in coach_note.
- Do not invent facts about the athlete beyond what's stated here.
`
    : "";

  return `You are a strength coach writing a single day's workout.

CONSTRAINTS:
- Only prescribe exercises that can be performed with the equipment listed below.
- If an exercise requires a specific attachment you can't confirm, pick an alternative.
- Warm-up: 1-3 movements that prime the session (mobility, activation, or ramp-up sets). Use high reps (12-20).
- Main: 3-6 reliable compound movements (hinge/squat/push/pull). Always exactly 5 sets × 4-8 reps. Rest 120-180s between sets. Prefer proven, repeatable exercises — avoid exotic variations.
- Finisher (optional): short conditioning or accessory burn (under 8 minutes).
- Total session time (including rest) should fit the user's budget.
- Prefer the user's equipment by id when possible; use the human name as well.
- Do not add per-exercise notes.
${memorySection}
AVAILABLE EQUIPMENT (JSON):
${equipmentJson}

Return ONLY the structured workout object.`;
}

export function buildUserPrompt(args: {
  goal: string;
  minutes: number;
  focus_hint?: string;
  avoid?: string[];
}): string {
  const parts = [
    `Goal: ${args.goal}`,
    `Time budget: ${args.minutes} minutes`,
  ];
  if (args.focus_hint) parts.push(`Focus hint: ${args.focus_hint}`);
  if (args.avoid && args.avoid.length) parts.push(`Avoid: ${args.avoid.join(", ")}`);
  return parts.join("\n");
}
