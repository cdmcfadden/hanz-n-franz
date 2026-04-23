"use client";

import { MUSCLE_GROUPS } from "@/lib/muscle-groups";

export function MuscleFilter({
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  shown,
  total,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  shown: number;
  total: number;
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] p-3 mb-6">
      <div className="flex flex-wrap gap-2 mb-3">
        {MUSCLE_GROUPS.map((g) => {
          const active = selected.has(g.id);
          return (
            <button
              key={g.id}
              onClick={() => onToggle(g.id)}
              aria-pressed={active}
              /* identical box model in both states — only colors swap, so the
                 chip never changes size between toggles */
              className={[
                "px-3 py-1.5 rounded-full text-sm font-medium ring-1 transition-colors",
                active
                  ? "bg-black text-white ring-black"
                  : "bg-neutral-900 text-neutral-500 ring-neutral-800 hover:text-neutral-300",
              ].join(" ")}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <button
          onClick={onSelectAll}
          className="text-neutral-400 hover:text-white hover:underline"
        >
          Select all
        </button>
        <button
          onClick={onClearAll}
          className="text-neutral-400 hover:text-white hover:underline"
        >
          Clear all
        </button>
        <span className="ml-auto tabular-nums text-neutral-400">
          <span className="font-medium text-white">{shown}</span>
          {" / "}
          {total} items
        </span>
      </div>
    </div>
  );
}
