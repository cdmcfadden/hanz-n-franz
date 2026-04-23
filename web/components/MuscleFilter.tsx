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
    <div className="rounded-xl bg-[var(--surface-soft)] ring-1 ring-violet-800/40 backdrop-blur-md shadow-lg shadow-violet-950/40 p-4 mb-8">
      <div className="flex flex-wrap gap-2 mb-3">
        {MUSCLE_GROUPS.map((g) => {
          const active = selected.has(g.id);
          return (
            <button
              key={g.id}
              onClick={() => onToggle(g.id)}
              aria-pressed={active}
              className={[
                "inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition",
                active
                  ? `${g.activeBg} ${g.activeText} shadow-sm hover:opacity-90`
                  : "bg-violet-900/40 text-violet-300 hover:bg-violet-900/70 hover:text-violet-100 ring-1 ring-violet-800/60",
              ].join(" ")}
            >
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full",
                  active ? "bg-white/80" : g.dotClass,
                ].join(" ")}
              />
              {g.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <button
          onClick={onSelectAll}
          className="text-violet-400 hover:text-violet-100 hover:underline"
        >
          Select all
        </button>
        <button
          onClick={onClearAll}
          className="text-violet-400 hover:text-violet-100 hover:underline"
        >
          Clear all
        </button>
        <span className="ml-auto tabular-nums text-violet-400">
          <span className="font-medium text-violet-100">{shown}</span>
          {" / "}
          {total} items
        </span>
      </div>
    </div>
  );
}
