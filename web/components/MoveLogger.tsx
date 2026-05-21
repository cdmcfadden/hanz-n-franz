"use client";

import Link from "next/link";
import { useState } from "react";
import { useEntries } from "@/contexts/EntriesContext";
import { todayISO } from "@/lib/log-store";
import { WeightPickerModal } from "@/components/WeightPickerModal";
import { PlateBreakdownModal } from "@/components/PlateBreakdownModal";
import type { WeightType } from "@/lib/equipment";

export function MoveLogger({
  equipmentId,
  moveId,
  moveName,
  weightType,
}: {
  equipmentId: string;
  moveId: string;
  moveName: string;
  weightType?: WeightType;
}) {
  const { getEntries, add, remove, loading } = useEntries();
  const entries = getEntries(equipmentId, moveId);
  const latest = entries[entries.length - 1];

  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [breakdownWeight, setBreakdownWeight] = useState<number | null>(null);

  async function save(w?: number, d?: string) {
    const entered = w ?? parseFloat(weight);
    const weightVal = weightType === "dumbbell_pair" ? entered * 2 : entered;
    const dateVal = d ?? date;
    if (!weightVal || Number.isNaN(weightVal) || weightVal <= 0) return;
    setSaving(true);
    setErr(null);
    try {
      await add(equipmentId, moveId, dateVal, weightVal);
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

  const usesPicker = weightType === "barbell" || weightType === "plates";
  const hasBreakdown = weightType === "barbell" || weightType === "plates";
  const isPair = weightType === "dumbbell_pair";
  const isDumbbell = weightType === "dumbbell_single" || isPair;

  function displayWeight(stored: number) {
    return isPair ? `${stored / 2} lb ea, ${stored} lb total` : `${stored} lb`;
  }

  return (
    <div id={`move-${equipmentId}-${moveId}`} className="rounded-lg bg-black/40 px-3 py-2.5 ring-1 ring-[var(--ring)]">
      {/* Name line: move name + latest log. Always full width. */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <Link
          href={`/trends?eq=${equipmentId}&mv=${moveId}`}
          className="text-sm font-medium text-white truncate hover:underline"
        >
          {moveName}
        </Link>
        <span className="text-[11px] text-neutral-500 tabular-nums shrink-0">
          {loading ? (
            "loading…"
          ) : latest ? (
            <>
              {hasBreakdown ? (
                <button
                  onClick={() => setBreakdownWeight(latest.weight)}
                  className="text-white hover:text-[var(--accent)] transition-colors"
                >
                  {displayWeight(latest.weight)}
                </button>
              ) : (
                <span className="text-white">{displayWeight(latest.weight)}</span>
              )}
              {" · "}
              {latest.date}
            </>
          ) : (
            "no log yet"
          )}
        </span>
      </div>

      {/* Input row — grid gives every card the same column sizes, so stacked
          rows line up perfectly regardless of the move name above. */}
      <div className={`grid gap-1.5 items-center ${isDumbbell ? "grid-cols-[11rem_1fr_auto_auto]" : "grid-cols-[4rem_1fr_auto_auto]"}`}>
        <input
          type="number"
          step="0.5"
          min="0"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={handleKey}
          onClick={usesPicker ? () => setShowPicker(true) : undefined}
          placeholder={isDumbbell ? "lb per dumbbell" : "lb"}
          className={`${inputClass} w-full${usesPicker ? " cursor-pointer" : ""}`}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${inputClass} w-full min-w-0`}
        />
        <button
          onClick={() => save()}
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
              {hasBreakdown ? (
                <button
                  onClick={() => setBreakdownWeight(e.weight)}
                  className="font-medium text-white hover:text-[var(--accent)] transition-colors"
                >
                  {displayWeight(e.weight)}
                </button>
              ) : (
                <span className="font-medium text-white">{displayWeight(e.weight)}</span>
              )}
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

      {breakdownWeight !== null && (
        <PlateBreakdownModal
          weight={breakdownWeight}
          moveName={moveName}
          allowBarbell={weightType === "barbell"}
          onClose={() => setBreakdownWeight(null)}
        />
      )}

      {showPicker && (
        <WeightPickerModal
          moveName={moveName}
          initialDate={date}
          showBarbell={weightType === "barbell"}
          onClose={() => setShowPicker(false)}
          onLog={(w, d) => {
            setWeight(String(w));
            setDate(d);
            setShowPicker(false);
            save(w, d);
          }}
        />
      )}
    </div>
  );
}
