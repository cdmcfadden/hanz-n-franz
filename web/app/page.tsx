"use client";

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
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      {/* Hanz hero — fixed dimensions reserve layout space before decode */}
      <section className="mb-8 rounded-2xl overflow-hidden ring-1 ring-[var(--ring)] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hanz.png"
          alt="Hanz and Franz logo"
          width={600}
          height={471}
          className="w-full h-auto block"
        />
        <div className="px-4 py-3 border-t border-[var(--ring)]">
          <h1 className="text-base font-semibold tracking-tight text-white">
            Daily workout
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generated around the equipment at your gym.
          </p>
        </div>
      </section>

      <div className="rounded-2xl bg-[var(--surface-soft)] p-5 ring-1 ring-[var(--ring)]">
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
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white py-2.5 rounded-lg font-medium disabled:opacity-40 transition-colors"
        >
          {loading ? "Generating…" : "Generate today's workout"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-[var(--accent-strong)]">
            Error: {error}
          </p>
        )}
      </div>

      {workout && (
        <section className="mt-10 space-y-6">
          <header>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {workout.title}
            </h2>
            <p className="text-sm text-neutral-500">
              {workout.focus} · ~{workout.estimated_minutes} min
            </p>
          </header>

          <Block title="Warm-up" items={workout.warmup} />
          <Block title="Main" items={workout.main} />
          {workout.finisher && workout.finisher.length > 0 && (
            <Block title="Finisher" items={workout.finisher} />
          )}

          <p className="text-sm italic text-neutral-400 border-l-2 border-[var(--accent)] pl-3">
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
          box-shadow: 0 0 0 1px var(--ring);
          background: #000;
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
      <span className="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">
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
      <h3 className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-3">
        {title}
      </h3>
      <ol className="space-y-2">
        {items.map((ex, i) => (
          <li
            key={i}
            className="rounded-xl bg-[var(--surface-soft)] p-3 text-sm ring-1 ring-[var(--ring)]"
          >
            <div className="font-medium text-white">{ex.name}</div>
            <div className="text-neutral-500 text-xs mb-1">{ex.equipment}</div>
            <div className="tabular-nums text-neutral-200">
              {ex.sets} × {ex.reps}
              <span className="text-neutral-500"> · rest {ex.rest_seconds}s</span>
            </div>
            {ex.notes && (
              <div className="text-neutral-400 mt-1">{ex.notes}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
