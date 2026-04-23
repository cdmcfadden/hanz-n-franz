"use client";

import { useState } from "react";
import { TopNav } from "@/components/TopNav";
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
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-4 sm:py-6">
      <TopNav active="workout" />

      {/* Hero with the brand banner — sets the tone the moment the page loads */}
      <section className="mt-6 mb-8 rounded-2xl overflow-hidden ring-1 ring-violet-800/60 bg-gradient-to-b from-violet-950 to-[var(--bg-elev)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/max.png"
          alt="Max — Hanz and Franz flexing"
          className="w-full h-auto block"
        />
        <div className="px-4 py-3 border-t border-violet-900/60">
          <h1 className="text-base font-semibold tracking-tight text-violet-50">
            Daily workout
          </h1>
          <p className="text-xs text-violet-300/80 mt-0.5">
            Generated around the equipment at your gym.
          </p>
        </div>
      </section>

      <div className="rounded-2xl bg-[var(--surface-soft)] p-5 ring-1 ring-violet-800/40 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Goal">
            <select
              className="form-control"
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
              className="form-control"
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
              className="form-control"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 60)}
            />
          </Field>
          <Field label="Focus hint">
            <input
              type="text"
              placeholder="legs, upper push…"
              className="form-control"
              value={focusHint}
              onChange={(e) => setFocusHint(e.target.value)}
            />
          </Field>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-violet-500 hover:bg-violet-400 text-white py-2.5 rounded-lg font-medium disabled:opacity-40 transition shadow-sm shadow-violet-900/40"
        >
          {loading ? "Generating…" : "Generate today's workout"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-rose-300">Error: {error}</p>
        )}
      </div>

      {workout && (
        <section className="mt-10 space-y-6">
          <header>
            <h2 className="text-2xl font-semibold tracking-tight text-violet-50">
              {workout.title}
            </h2>
            <p className="text-sm text-violet-300/80">
              {workout.focus} · ~{workout.estimated_minutes} min
            </p>
          </header>

          <Block title="Warm-up" items={workout.warmup} />
          <Block title="Main" items={workout.main} />
          {workout.finisher && workout.finisher.length > 0 && (
            <Block title="Finisher" items={workout.finisher} />
          )}

          <p className="text-sm italic text-violet-300/80 border-l-2 border-violet-700 pl-3">
            {workout.coach_note}
          </p>
        </section>
      )}

      <style jsx>{`
        .form-control {
          width: 100%;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          border: 0;
          box-shadow: 0 0 0 1px rgba(76, 42, 122, 0.6);
          background: rgba(20, 8, 45, 0.6);
          color: var(--text);
          padding: 0.5rem 0.625rem;
        }
        .form-control:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--accent);
        }
        .form-control::placeholder {
          color: var(--text-faint);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="block text-xs font-medium text-violet-400 mb-1 uppercase tracking-wider">
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
      <h3 className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-3">
        {title}
      </h3>
      <ol className="space-y-2">
        {items.map((ex, i) => (
          <li
            key={i}
            className="rounded-xl bg-[var(--surface-soft)] p-3 text-sm ring-1 ring-violet-800/40"
          >
            <div className="font-medium text-violet-50">{ex.name}</div>
            <div className="text-violet-400 text-xs mb-1">{ex.equipment}</div>
            <div className="tabular-nums text-violet-200">
              {ex.sets} × {ex.reps}
              <span className="text-violet-500"> · rest {ex.rest_seconds}s</span>
            </div>
            {ex.notes && (
              <div className="text-violet-300/80 mt-1">{ex.notes}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
