import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string(),
  equipment: z.string().describe("id from equipment.json or a free-form accessory name"),
  sets: z.number().int().min(1).max(10),
  reps: z.string().describe("e.g. '8-12', '5', 'AMRAP', '30s'"),
  rest_seconds: z.number().int().min(15).max(300),
  notes: z.string().optional(),
});

export const workoutSchema = z.object({
  title: z.string(),
  focus: z.string().describe("e.g. 'upper push', 'full body', 'lower + conditioning'"),
  estimated_minutes: z.number().int().min(10).max(180),
  warmup: z.array(exerciseSchema).min(1).max(5),
  main: z.array(exerciseSchema).min(3).max(10),
  finisher: z.array(exerciseSchema).max(3).optional(),
  coach_note: z.string().describe("one short paragraph: why this workout today"),
});

export type Workout = z.infer<typeof workoutSchema>;

export const requestSchema = z.object({
  goal: z.enum(["strength", "hypertrophy", "conditioning", "general"]).default("general"),
  minutes: z.number().int().min(20).max(120).default(60),
  fatigue: z.enum(["fresh", "moderate", "tired"]).default("moderate"),
  focus_hint: z.string().optional().describe("optional user hint like 'legs' or 'upper body'"),
  avoid: z.array(z.string()).optional().describe("movements or equipment to skip"),
});
