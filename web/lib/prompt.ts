export function buildSystemPrompt(equipmentJson: string): string {
  return `You are a strength coach writing a single day's workout.

CONSTRAINTS:
- Only prescribe exercises that can be performed with the equipment listed below.
- If an exercise requires a specific attachment you can't confirm, pick an alternative.
- Warm-up: 1-3 movements that prime the session (mobility, activation, or ramp-up sets).
- Main: 3-6 compound or hinge/squat/push/pull movements appropriate to the focus.
- Finisher (optional): short conditioning or accessory burn (under 8 minutes).
- Rest periods match goal: strength 120-180s, hypertrophy 60-90s, conditioning 15-45s.
- Total session time (including rest) should fit the user's budget.
- Prefer the user's equipment by id when possible; use the human name as well.

AVAILABLE EQUIPMENT (JSON):
${equipmentJson}

Return ONLY the structured workout object.`;
}

export function buildUserPrompt(args: {
  goal: string;
  minutes: number;
  fatigue: string;
  focus_hint?: string;
  avoid?: string[];
}): string {
  const parts = [
    `Goal: ${args.goal}`,
    `Time budget: ${args.minutes} minutes`,
    `Fatigue: ${args.fatigue}`,
  ];
  if (args.focus_hint) parts.push(`Focus hint: ${args.focus_hint}`);
  if (args.avoid && args.avoid.length) parts.push(`Avoid: ${args.avoid.join(", ")}`);
  return parts.join("\n");
}
