export function buildSystemPrompt(equipmentJson: string): string {
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

export function buildSummarySystemPrompt(): string {
  return `You are a strength coach writing a one-line welcome note for the top of the app's home screen.

Rules:
- 1-2 short sentences, under 220 characters total.
- Terse, encouraging gym-coach tone. No preamble, no emoji, no markdown, no exclamation-point spam.
- If the status is "returning after a break", acknowledge the time away without guilt-tripping, then encourage them to jump back in today.
- If the status is "active" and personal records are listed, call out the single most impressive one by name and weight.
- Never invent facts beyond what's given below.`;
}

export function buildSummaryUserPrompt(stats: {
  isReturning: boolean;
  daysSinceLastLog: number;
  sessionsInWindow: number;
  movesWorked: number;
  longestGapDays: number;
  recentPRs: Array<{ equipmentName: string; moveName: string; weight: number }>;
}): string {
  const lines = [
    `Status: ${stats.isReturning ? "returning after a break" : "active"}`,
    `Days since last logged session: ${stats.daysSinceLastLog}`,
    `Sessions logged in the relevant window: ${stats.sessionsInWindow}`,
    `Distinct moves worked in that window: ${stats.movesWorked}`,
  ];
  if (stats.longestGapDays >= 5) {
    lines.push(`Longest gap between sessions in that window: ${stats.longestGapDays} days`);
  }
  if (stats.recentPRs.length > 0) {
    lines.push(
      `Personal records set in that window: ${stats.recentPRs
        .map((pr) => `${pr.moveName} on ${pr.equipmentName} at ${pr.weight} lbs`)
        .join("; ")}`,
    );
  }
  return lines.join("\n");
}
