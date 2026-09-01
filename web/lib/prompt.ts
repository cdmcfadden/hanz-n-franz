import { WEIGHT_INCREMENT_LB } from "@/lib/training-stats";

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

export function buildSummarySystemPrompt(): string {
  return `You are a strength coach writing the briefing at the top of an athlete's home screen. They see this before they train today.

Write 3-5 sentences, under 700 characters. Terse, specific, encouraging gym-coach voice. No preamble, no emoji, no markdown, no bullet points, no exclamation-point spam.

Cover, in this order, whichever apply:
- Time away. If they just came back from a layoff, name it plainly ("three weeks off") without guilt-tripping.
- Where they stand. If a lift is below their own best, say which one and give both numbers — what they last lifted and what they peaked at.
- What to do about it. Give a concrete next step using the figures provided: the suggested next weight, and roughly how many sessions of steady progression it takes to get back to their record. Frame regaining lost ground as fast work, because it is.
- Recent wins. If they set personal records lately, call out the most impressive one by name and weight.
- If a stale personal record is listed, suggest revisiting that lift today.

Rules:
- Use ONLY the figures given below. Never invent a weight, date, count, or exercise name.
- Every weight is in pounds.
- Do not repeat a number more than once; write like a coach talking, not a stats table.`;
}

export function buildSummaryUserPrompt(stats: {
  isReturning: boolean;
  daysSinceLastLog: number;
  lastGapDays: number;
  longestGapDays: number;
  sessionsInWindow: number;
  movesWorked: number;
  recentPRs: Array<{ equipmentName: string; moveName: string; weight: number }>;
  regressions: Array<{
    equipmentName: string;
    moveName: string;
    peakWeight: number;
    peakDate: string;
    currentWeight: number;
    currentDate: string;
    pctDown: number;
    suggestedNextWeight: number;
    sessionsToRegain: number;
  }>;
  suggestion: { equipmentName: string; moveName: string } | null;
}): string {
  const lines = [
    `Status: ${stats.isReturning ? "returning after a break" : "active"}`,
    `Days since last logged session: ${stats.daysSinceLastLog}`,
    `Sessions logged in the relevant window: ${stats.sessionsInWindow}`,
    `Distinct moves worked in that window: ${stats.movesWorked}`,
  ];

  if (stats.lastGapDays >= 10) {
    lines.push(`Break taken just before their most recent session: ${stats.lastGapDays} days`);
  }
  if (stats.longestGapDays >= 5 && stats.longestGapDays !== stats.lastGapDays) {
    lines.push(`Longest gap between sessions in that window: ${stats.longestGapDays} days`);
  }

  for (const r of stats.regressions) {
    lines.push(
      `Lift below their best: ${r.moveName} on ${r.equipmentName} — last lifted ${r.currentWeight} lbs on ${r.currentDate}, personal record ${r.peakWeight} lbs set ${r.peakDate} (${r.pctDown}% below). Suggested next working weight: ${r.suggestedNextWeight} lbs. At ${WEIGHT_INCREMENT_LB} lbs added per session that is about ${r.sessionsToRegain} sessions back to the record.`,
    );
  }

  if (stats.recentPRs.length > 0) {
    lines.push(
      `Personal records set in that window: ${stats.recentPRs
        .map((pr) => `${pr.moveName} on ${pr.equipmentName} at ${pr.weight} lbs`)
        .join("; ")}`,
    );
  }

  if (stats.suggestion) {
    lines.push(
      `Personal record that has stood untouched for a while, worth another attempt: ${stats.suggestion.moveName} on ${stats.suggestion.equipmentName}`,
    );
  }

  return lines.join("\n");
}
