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
    "text-sm rounded-md border-0 bg-black ring-1 ring-[var(--ring)] text-white placeholder:text-neutral-600 px-2 py-1 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none";

  return (
    <div className="rounded-lg bg-black/40 px-3 py-2 ring-1 ring-[var(--ring)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {moveName}
          </div>
          <div className="text-[11px] text-neutral-500 tabular-nums">
            {loading
              ? "loading…"
              : latest
                ? `${latest.weight} lb · ${latest.date}`
                : "no log yet"}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <input
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={handleKey}
            placeholder="lb"
            className={`${inputClass} w-16`}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={save}
            disabled={!weight || saving}
            className="text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-colors"
          >
            {saving ? "…" : "Log"}
          </button>
          {entries.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-neutral-500 hover:text-white hover:underline px-1"
            >
              {expanded ? "hide" : entries.length}
            </button>
          )}
        </div>
      </div>

      {err && <p className="mt-1 text-[11px] text-[var(--accent-strong)]">{err}</p>}

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
