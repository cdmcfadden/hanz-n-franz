"use client";

import { useState } from "react";
import { useEntries } from "@/contexts/EntriesContext";
import { todayISO } from "@/lib/log-store";

export function MoveLogger({
  equipmentId,
  moveId,
  moveName,
}: {
  equipmentId: string;
  moveId: string;
  moveName: string;
}) {
  const { getEntries, add, remove, loading } = useEntries();
  const entries = getEntries(equipmentId, moveId);
  const latest = entries[entries.length - 1];

  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const w = parseFloat(weight);
    if (!w || Number.isNaN(w) || w <= 0) return;
    setSaving(true);
    setErr(null);
    try {
      await add(equipmentId, moveId, date, w);
      setWeight("");
      setDate(todayISO());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
  }

  const inputClass =
    "text-sm rounded-md border-0 bg-black ring-1 ring-[var(--ring)] text-white placeholder:text-neutral-600 px-2.5 py-1.5 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none";

  return (
    <div className="rounded-lg bg-black/40 px-3 py-2.5 ring-1 ring-[var(--ring)]">
      {/* Name line: move name + latest log. Always full width. */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-white truncate">
          {moveName}
        </span>
        <span className="text-[11px] text-neutral-500 tabular-nums shrink-0">
          {loading
            ? "loading…"
            : latest
              ? `${latest.weight} lb · ${latest.date}`
              : "no log yet"}
        </span>
      </div>

      {/* Input row — grid gives every card the same column sizes, so stacked
          rows line up perfectly regardless of the move name above. */}
      <div className="grid grid-cols-[4rem_1fr_auto_auto] gap-1.5 items-center">
        <input
          type="number"
          step="0.5"
          min="0"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={handleKey}
          placeholder="lb"
          className={`${inputClass} w-full`}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${inputClass} w-full min-w-0`}
        />
        <button
          onClick={save}
          disabled={!weight || saving}
          className="text-sm font-medium px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-colors"
        >
          {saving ? "…" : "Log"}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          disabled={entries.length === 0}
          className="text-[11px] w-8 text-center text-neutral-500 hover:text-white disabled:opacity-0 disabled:pointer-events-none"
          aria-label={expanded ? "hide history" : "show history"}
        >
          {expanded ? "×" : entries.length || ""}
        </button>
      </div>

      {err && <p className="mt-1 text-[11px] text-rose-300">{err}</p>}

      {expanded && entries.length > 0 && (
        <ul className="mt-2 pt-2 border-t border-[var(--ring)] text-xs space-y-1 tabular-nums">
          {[...entries].reverse().map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="text-neutral-500 w-20">{e.date}</span>
              <span className="font-medium text-white">{e.weight} lb</span>
              <button
                onClick={() => remove(equipmentId, moveId, e.id)}
                className="ml-auto text-neutral-600 hover:text-[var(--accent-strong)]"
                aria-label="delete entry"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
