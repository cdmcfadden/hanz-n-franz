"use client";

import { useState } from "react";

const PLATES = [
  { weight: 45, size: 80, color: "#c0392b" },
  { weight: 35, size: 70, color: "#b8860b" },
  { weight: 25, size: 60, color: "#2e7d32" },
  { weight: 10, size: 52, color: "#37474f" },
  { weight: 5, size: 44, color: "#555" },
  { weight: 2.5, size: 36, color: "#333" },
] as const;

type PlateWeight = (typeof PLATES)[number]["weight"];

const INIT_COUNTS = Object.fromEntries(
  PLATES.map((p) => [p.weight, 0]),
) as Record<PlateWeight, number>;

export function WeightPickerModal({
  moveName,
  initialDate,
  onLog,
  onClose,
}: {
  moveName: string;
  initialDate: string;
  onLog: (weight: number, date: string) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [barbellOn, setBarbellOn] = useState(false);
  const [plateCounts, setPlateCounts] = useState<Record<PlateWeight, number>>(INIT_COUNTS);
  const [rawWeight, setRawWeight] = useState("");

  function calcTotal(barbell: boolean, counts: Record<PlateWeight, number>) {
    let total = barbell ? 45 : 0;
    for (const p of PLATES) {
      total += counts[p.weight] * p.weight;
    }
    return total;
  }

  function toggleBarbell() {
    const next = !barbellOn;
    setBarbellOn(next);
    const total = calcTotal(next, plateCounts);
    setRawWeight(total > 0 ? String(total) : "");
  }

  function tapPlate(weight: PlateWeight) {
    const next = { ...plateCounts, [weight]: plateCounts[weight] + 1 };
    setPlateCounts(next);
    const total = calcTotal(barbellOn, next);
    setRawWeight(total > 0 ? String(total) : "");
  }

  function removePlate(e: React.MouseEvent, weight: PlateWeight) {
    e.stopPropagation();
    const next = { ...plateCounts, [weight]: Math.max(0, plateCounts[weight] - 1) };
    setPlateCounts(next);
    const total = calcTotal(barbellOn, next);
    setRawWeight(total > 0 ? String(total) : "");
  }

  function clear() {
    setBarbellOn(false);
    setPlateCounts(INIT_COUNTS);
    setRawWeight("");
  }

  function handleLog() {
    const w = parseFloat(rawWeight);
    if (!w || w <= 0) return;
    onLog(w, date);
  }

  function onBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const canLog = !!rawWeight && parseFloat(rawWeight) > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onBackdrop}
    >
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-[var(--bg-elev)] ring-1 ring-[var(--ring)] p-5">
        {/* Header */}
        <header className="mb-4">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-0.5">
            Log Weight
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight leading-tight">
            {moveName}
          </h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 text-sm rounded-md border-0 bg-black ring-1 ring-[var(--ring)] text-white px-2.5 py-1.5 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
          />
        </header>

        {/* Barbell */}
        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
            Barbell
          </div>
          <button
            onClick={toggleBarbell}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ring-1 ${
              barbellOn
                ? "bg-[var(--accent)] text-white ring-[var(--accent)]"
                : "bg-transparent text-neutral-400 ring-[var(--ring)] hover:text-white"
            }`}
          >
            {/* barbell shape */}
            <span className="flex items-center gap-0.5">
              <span
                className="inline-block rounded-sm"
                style={{
                  width: 6,
                  height: 20,
                  background: barbellOn ? "white" : "#555",
                }}
              />
              <span
                className="inline-block rounded-sm"
                style={{
                  width: 28,
                  height: 8,
                  background: barbellOn ? "white" : "#555",
                }}
              />
              <span
                className="inline-block rounded-sm"
                style={{
                  width: 6,
                  height: 20,
                  background: barbellOn ? "white" : "#555",
                }}
              />
            </span>
            45 lb barbell
          </button>
        </div>

        {/* Plates */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
            Plates
          </div>
          <div className="grid grid-cols-3 gap-4">
            {PLATES.map((p) => {
              const count = plateCounts[p.weight];
              return (
                <button
                  key={p.weight}
                  onClick={() => tapPlate(p.weight)}
                  className="flex flex-col items-center gap-1 w-full group"
                >
                  <div className="relative">
                    {/* plate circle */}
                    <div
                      className="rounded-full flex items-center justify-center transition-transform active:scale-95"
                      style={{
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        boxShadow: count > 0 ? `0 0 0 2px white` : undefined,
                      }}
                    >
                      {/* center hole */}
                      <div
                        className="rounded-full bg-[var(--bg-elev)]"
                        style={{
                          width: Math.max(p.size * 0.22, 6),
                          height: Math.max(p.size * 0.22, 6),
                        }}
                      />
                    </div>
                    {/* count badge — tap to remove one */}
                    {count > 0 && (
                      <span
                        onClick={(e) => removePlate(e, p.weight)}
                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center px-1 leading-none cursor-pointer hover:bg-red-300"
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 tabular-nums">
                    {p.weight} lb
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weight input */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5">
            Total Weight
          </div>
          <input
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            value={rawWeight}
            onChange={(e) => setRawWeight(e.target.value)}
            placeholder="lb"
            className="w-full text-sm rounded-md border-0 bg-black ring-1 ring-[var(--ring)] text-white placeholder:text-neutral-600 px-2.5 py-2 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none tabular-nums"
          />
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-white px-3 py-2"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={clear}
              className="text-sm text-neutral-300 hover:text-white px-3 py-2 rounded-lg ring-1 ring-[var(--ring)]"
            >
              Clear
            </button>
            <button
              onClick={handleLog}
              disabled={!canLog}
              className="bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--accent-strong)] disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-colors"
            >
              Log
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
