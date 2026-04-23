"use client";

import { type EntryMap, type LogEntry, keys } from "@/lib/log-store";
import { USERS } from "@/lib/users";

const COLORS: Record<string, string> = {
  david: "#2563eb",
  chris: "#dc2626",
};

export function TrendChart({
  equipmentId,
  moveId,
  moveName,
  allEntries,
}: {
  equipmentId: string;
  moveId: string;
  moveName: string;
  allEntries: EntryMap;
}) {
  const series: Record<string, LogEntry[]> = {};
  for (const u of USERS) {
    series[u.id] =
      allEntries.get(keys.userMoveKey(u.id, equipmentId, moveId)) ?? [];
  }
  const hasAny = Object.values(series).some((s) => s.length > 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-sm hover:shadow-md transition">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {moveName}
        </h3>
        <div className="flex gap-3 text-[11px] tabular-nums shrink-0">
          {USERS.map((u) => {
            const entries = series[u.id] ?? [];
            const latest = entries[entries.length - 1];
            const first = entries[0];
            const delta =
              entries.length >= 2 && first ? latest.weight - first.weight : 0;
            return (
              <span key={u.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: COLORS[u.id] }}
                />
                <span className="text-zinc-500">{u.name.split(" ")[0]}:</span>
                {latest ? (
                  <>
                    <span className="font-medium">{latest.weight} lb</span>
                    {delta !== 0 && (
                      <span
                        className={
                          delta > 0 ? "text-emerald-600" : "text-orange-600"
                        }
                      >
                        ({delta > 0 ? "+" : ""}
                        {delta})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {hasAny ? (
        <Chart series={series} />
      ) : (
        <p className="text-xs text-zinc-400 italic py-4 text-center">
          no entries yet
        </p>
      )}
    </div>
  );
}

function Chart({ series }: { series: Record<string, LogEntry[]> }) {
  const w = 560;
  const h = 80;
  const padX = 4;
  const padY = 6;

  const all = Object.values(series).flat();
  const dates = all.map((e) => e.date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const dayMs = 86400000;
  const dateToTs = (s: string) => new Date(s + "T00:00:00").getTime();
  const tMin = dateToTs(minDate);
  const tMax = dateToTs(maxDate);
  const tRange = Math.max(tMax - tMin, dayMs);

  const ws = all.map((e) => e.weight);
  const wMin = Math.min(...ws);
  const wMax = Math.max(...ws);
  const wRange = Math.max(wMax - wMin, 1);

  function x(date: string): number {
    return padX + ((dateToTs(date) - tMin) / tRange) * (w - padX * 2);
  }
  function y(weight: number): number {
    return h - padY - ((weight - wMin) / wRange) * (h - padY * 2);
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      className="block"
      preserveAspectRatio="none"
      role="img"
      aria-label="weight progression chart"
    >
      {Object.entries(series).map(([uid, entries]) => {
        if (entries.length === 0) return null;
        const sorted = [...entries].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        const points = sorted
          .map((e) => `${x(e.date).toFixed(1)},${y(e.weight).toFixed(1)}`)
          .join(" ");
        const color = COLORS[uid] ?? "#6b7280";
        return (
          <g key={uid}>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              points={points}
            />
            {sorted.map((e, i) => (
              <circle
                key={i}
                cx={x(e.date)}
                cy={y(e.weight)}
                r="2.5"
                fill={color}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
