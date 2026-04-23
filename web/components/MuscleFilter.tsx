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
    <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 ring-1 ring-zinc-200/70 dark:ring-zinc-800 backdrop-blur-md shadow-sm p-4 mb-8">
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
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 ring-1 ring-zinc-200 dark:ring-zinc-700",
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
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
        >
          Select all
        </button>
        <button
          onClick={onClearAll}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
        >
          Clear all
        </button>
        <span className="ml-auto tabular-nums text-zinc-500">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {shown}
          </span>
          {" / "}
          {total} items
        </span>
      </div>
    </div>
  );
}
