"use client";

const PLATES = [
  { weight: 45, size: 48, color: "#c0392b" },
  { weight: 35, size: 42, color: "#b8860b" },
  { weight: 25, size: 36, color: "#2e7d32" },
  { weight: 10, size: 30, color: "#37474f" },
  { weight: 5, size: 26, color: "#555" },
  { weight: 2.5, size: 22, color: "#333" },
] as const;

type PlateWeight = (typeof PLATES)[number]["weight"];
type Breakdown = { barbell: boolean; counts: Partial<Record<PlateWeight, number>> };

function calcBreakdown(target: number): Breakdown | null {
  // Work in half-pound units to avoid floating-point errors with 2.5 lb plates.
  const t = Math.round(target * 2);
  for (const useBarbell of [true, false]) {
    const bw = useBarbell ? 90 : 0; // 45 lb * 2
    if (t < bw) continue;
    let rem = t - bw;
    const counts: Partial<Record<PlateWeight, number>> = {};
    for (const { weight } of PLATES) {
      const wu = Math.round(weight * 2);
      const n = Math.floor(rem / wu);
      if (n > 0) {
        counts[weight] = n;
        rem -= n * wu;
      }
    }
    if (rem === 0) return { barbell: useBarbell, counts };
  }
  return null;
}

export function PlateBreakdownModal({
  weight,
  moveName,
  onClose,
}: {
  weight: number;
  moveName: string;
  onClose: () => void;
}) {
  const result = calcBreakdown(weight);
  const usedPlates = result
    ? PLATES.filter((p) => (result.counts[p.weight] ?? 0) > 0)
    : [];

  function onBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onBackdrop}
    >
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-[var(--bg-elev)] ring-1 ring-[var(--ring)] p-5">
        <header className="mb-4">
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-0.5">
            Plate Math
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight leading-tight">
            {moveName}
          </h2>
        </header>

        {result ? (
          <div className="space-y-3 mb-5">
            {result.barbell && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-0.5 shrink-0">
                  <span className="inline-block w-1.5 h-5 rounded-sm bg-neutral-400" />
                  <span className="inline-block w-7 h-2 rounded-sm bg-neutral-400" />
                  <span className="inline-block w-1.5 h-5 rounded-sm bg-neutral-400" />
                </span>
                <span className="text-sm text-white flex-1">45 lb barbell</span>
                <span className="text-sm text-neutral-400 tabular-nums">45 lb</span>
              </div>
            )}
            {usedPlates.map((p) => {
              const count = result.counts[p.weight]!;
              return (
                <div key={p.weight} className="flex items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{ width: p.size, height: p.size, background: p.color }}
                  >
                    <div
                      className="rounded-full bg-[var(--bg-elev)]"
                      style={{
                        width: Math.max(p.size * 0.22, 5),
                        height: Math.max(p.size * 0.22, 5),
                      }}
                    />
                  </div>
                  <span className="text-sm text-white flex-1">
                    {count} × {p.weight} lb
                  </span>
                  <span className="text-sm text-neutral-400 tabular-nums">
                    {count * p.weight} lb
                  </span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-[var(--ring)] flex justify-between text-sm font-semibold text-white tabular-nums">
              <span>Total</span>
              <span>{weight} lb</span>
            </div>
          </div>
        ) : (
          <p className="mb-5 text-sm text-rose-300">
            Can&apos;t build {weight} lb with standard plates.
          </p>
        )}

        <footer className="flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-neutral-400 hover:text-white px-3 py-2"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
