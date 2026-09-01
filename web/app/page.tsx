"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import type { Workout } from "@/lib/schema";

type Focus = "push" | "pull" | "legs" | "chest" | "back" | "shoulders/arms" | "core" | "";

type PrOfDay = {
  equipmentId: string;
  moveId: string;
  moveName: string;
  equipmentName: string;
} | null;

type Summary = {
  text: string;
  isReturning: boolean;
} | null;

function todayKey() {
  return `cadet:workout:${new Date().toISOString().slice(0, 10)}`;
}

function prKey() {
  return `cadet:pr-of-day:${new Date().toISOString().slice(0, 10)}`;
}

function summaryKey() {
  return `cadet:summary:${new Date().toISOString().slice(0, 10)}`;
}

export default function Home() {
  const [minutes, setMinutes] = useState(60);
  const [focusHint, setFocusHint] = useState<Focus>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [prOfDay, setPrOfDay] = useState<PrOfDay | undefined>(undefined);
  const [summary, setSummary] = useState<Summary | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(todayKey());
      if (stored) startTransition(() => setWorkout(JSON.parse(stored)));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function loadPrOfDay() {
    const key = prKey();
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        // v:1 marks values cached after catalog-filter fix; discard older entries
        if (parsed?.v === 1) {
          setPrOfDay(parsed.data);
          return;
        }
      }
    } catch {
      // ignore corrupt storage
    }
    fetch("/api/pr-of-day")
      .then((r) => r.json())
      .then((data) => {
        const val: PrOfDay = data.candidate ?? null;
        try {
          localStorage.setItem(key, JSON.stringify({ v: 1, data: val }));
        } catch {
          // ignore storage errors
        }
        setPrOfDay(val);
      })
      .catch(() => setPrOfDay(null));
  }

  useEffect(() => {
    loadPrOfDay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadSummary() {
    const key = summaryKey();
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (parsed?.v === 1) {
          setSummary(parsed.data);
          return;
        }
      }
    } catch {
      // ignore corrupt storage
    }
    fetch("/api/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const val: Summary = data?.text
          ? { text: data.text, isReturning: !!data.isReturning }
          : null;
        // Only cache a real summary. Caching a null — from a 401 before the
        // session cookie is live, a network blip, or a model error — would
        // suppress the card for the rest of the day.
        if (val) {
          try {
            localStorage.setItem(key, JSON.stringify({ v: 1, data: val }));
          } catch {
            // ignore storage errors
          }
        }
        setSummary(val);
      })
      .catch(() => setSummary(null));
  }

  useEffect(() => {
    loadSummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "strength",
          minutes,
          focus_hint: focusHint || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: Workout = await res.json();
      localStorage.setItem(todayKey(), JSON.stringify(data));
      setWorkout(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function clearWorkout() {
    localStorage.removeItem(todayKey());
    localStorage.removeItem(prKey());
    setWorkout(null);
    loadPrOfDay();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      {summary && (
        <div className="mb-4 rounded-xl bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] p-4 glow-fade-in">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1.5">
            {summary.isReturning ? "Welcome back" : "Recap"}
          </span>
          <p className="text-sm text-neutral-200 leading-relaxed">{summary.text}</p>
        </div>
      )}

      {prOfDay && (
        <Link
          href={`/equipment/${prOfDay.equipmentId}`}
          className="card-lift mb-4 rounded-xl bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] p-3 flex items-center gap-3 group glow-fade-in"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] shrink-0">
            <span
              className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
              aria-hidden="true"
            />
            PR
          </span>
          <span className="text-sm font-medium text-white truncate group-hover:text-[var(--accent)] transition-colors">
            {prOfDay.equipmentName}
            <span className="text-neutral-500 font-normal"> · {prOfDay.moveName}</span>
          </span>
        </Link>
      )}

      {!workout && (
        <div className="rounded-2xl bg-[var(--surface-soft)] p-5 ring-1 ring-[var(--ring)]">
          <div className="grid grid-cols-2 gap-3 mb-4">
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
            <Field label="Focus">
              <select
                className="form-control"
                value={focusHint}
                onChange={(e) => setFocusHint(e.target.value as Focus)}
              >
                <option value="">No preference</option>
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs">Legs</option>
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="shoulders/arms">Shoulders / Arms</option>
                <option value="core">Core</option>
              </select>
            </Field>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="relative w-full bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white py-3 rounded-lg font-semibold text-base disabled:opacity-40 transition-[background-color,box-shadow,transform] shadow-[0_8px_24px_-12px_var(--accent-glow)] hover:shadow-[0_12px_32px_-10px_var(--accent-glow)] active:translate-y-[1px] active:shadow-none"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Generating…
              </span>
            ) : (
              "Generate today's workout"
            )}
          </button>

          {error && (
            <p className="mt-4 text-sm text-[var(--accent-strong)]">
              Error: {error}
            </p>
          )}
        </div>
      )}

      {workout && (
        <section className="mt-0 space-y-6">
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

          <button
            onClick={clearWorkout}
            className="w-full py-3 rounded-lg text-sm font-medium text-neutral-500 ring-1 ring-[var(--ring)] hover:text-[var(--accent-strong)] hover:ring-[var(--accent-strong)] transition-colors"
          >
            Clear today&apos;s workout
          </button>
        </section>
      )}

      <style jsx>{`
        .form-control {
          width: 100%;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          border: 0;
          box-shadow: 0 0 0 1px var(--ring);
          background: #000;
          color: var(--text);
          padding: 0.55rem 0.65rem;
          transition: box-shadow 150ms ease;
        }
        .form-control:hover {
          box-shadow: 0 0 0 1px var(--ring-strong);
        }
        .form-control:focus {
          outline: none;
          box-shadow:
            0 0 0 1px var(--accent),
            0 0 0 4px rgba(217, 32, 39, 0.18);
        }
        .form-control::placeholder {
          color: var(--text-faint);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`text-sm${className ? ` ${className}` : ""}`}>
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
  items: Workout["warmup"];
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
            <Link
              href={`/equipment/${ex.equipment}`}
              className="font-medium text-white hover:text-[var(--accent)] transition-colors"
            >
              {ex.name}
            </Link>
            <div className="tabular-nums text-neutral-200 mt-1">
              {ex.sets} × {ex.reps}
              <span className="text-neutral-500"> · rest {ex.rest_seconds}s</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
