"use client";

import Link from "next/link";
import { useState } from "react";
import type { Workout } from "@/lib/schema";

type Goal = "strength" | "hypertrophy" | "conditioning" | "general";
type Fatigue = "fresh" | "moderate" | "tired";

export default function Home() {
  const [goal, setGoal] = useState<Goal>("general");
  const [minutes, setMinutes] = useState(60);
  const [fatigue, setFatigue] = useState<Fatigue>("moderate");
  const [focusHint, setFocusHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setWorkout(null);
    try {
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          minutes,
          fatigue,
          focus_hint: focusHint || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setWorkout(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Daily workout
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Generated around the equipment at your gym.
          </p>
          <nav className="mt-5 flex items-center gap-1 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium">
              Workout
            </span>
            <Link
              href="/equipment"
              className="px-3 py-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Equipment
            </Link>
            <Link
              href="/trends"
              className="px-3 py-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Trends
            </Link>
          </nav>
        </header>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-sm">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Goal">
              <select
                className="w-full text-sm rounded-md border-0 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
              >
                <option value="general">General</option>
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="conditioning">Conditioning</option>
              </select>
            </Field>
            <Field label="Fatigue">
              <select
                className="w-full text-sm rounded-md border-0 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
                value={fatigue}
                onChange={(e) => setFatigue(e.target.value as Fatigue)}
              >
                <option value="fresh">Fresh</option>
                <option value="moderate">Moderate</option>
                <option value="tired">Tired</option>
              </select>
            </Field>
            <Field label="Minutes">
              <input
                type="number"
                min={20}
                max={120}
                className="w-full text-sm rounded-md border-0 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 60)}
              />
            </Field>
            <Field label="Focus hint">
              <input
                type="text"
                placeholder="legs, upper push…"
                className="w-full text-sm rounded-md border-0 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
                value={focusHint}
                onChange={(e) => setFocusHint(e.target.value)}
              />
            </Field>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-40 transition"
          >
            {loading ? "Generating…" : "Generate today's workout"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600">Error: {error}</p>
          )}
        </div>

        {workout && (
          <section className="mt-10 space-y-6">
            <header>
              <h2 className="text-2xl font-semibold tracking-tight">
                {workout.title}
              </h2>
              <p className="text-sm text-zinc-500">
                {workout.focus} · ~{workout.estimated_minutes} min
              </p>
            </header>

            <Block title="Warm-up" items={workout.warmup} />
            <Block title="Main" items={workout.main} />
            {workout.finisher && workout.finisher.length > 0 && (
              <Block title="Finisher" items={workout.finisher} />
            )}

            <p className="text-sm italic text-zinc-600 dark:text-zinc-400 border-l-2 border-zinc-300 dark:border-zinc-700 pl-3">
              {workout.coach_note}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="block text-xs font-medium text-zinc-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function Block({
  title,
  items,
}: {
  title: string;
  items: Workout["main"];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
        {title}
      </h3>
      <ol className="space-y-2">
        {items.map((ex, i) => (
          <li
            key={i}
            className="rounded-xl bg-white dark:bg-zinc-900 p-3 text-sm ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-sm"
          >
            <div className="font-medium">{ex.name}</div>
            <div className="text-zinc-500 text-xs mb-1">{ex.equipment}</div>
            <div className="tabular-nums">
              {ex.sets} × {ex.reps}
              <span className="text-zinc-500"> · rest {ex.rest_seconds}s</span>
            </div>
            {ex.notes && (
              <div className="text-zinc-600 dark:text-zinc-400 mt-1">
                {ex.notes}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
