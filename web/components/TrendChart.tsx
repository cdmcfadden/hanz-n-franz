"use client";

import { type EntryMap, type LogEntry, keys } from "@/lib/log-store";
import { type BuddyUser } from "@/lib/buddy";

export function TrendChart({
  equipmentId,
  moveId,
  moveName,
  allEntries,
  users,
}: {
  equipmentId: string;
  moveId: string;
  moveName: string;
  allEntries: EntryMap;
  users: BuddyUser[];
}) {
  const series: Record<string, LogEntry[]> = {};
  for (const u of users) {
    series[u.id] =
      allEntries.get(keys.userMoveKey(u.id, equipmentId, moveId)) ?? [];
  }
  const hasAny = Object.values(series).some((s) => s.length > 0);

  return (
    <div className="rounded-2xl bg-[var(--surface-soft)] p-3 ring-1 ring-[var(--ring)]">
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <h3 className="text-sm font-medium text-white truncate">{moveName}</h3>
        <div className="flex gap-3 text-[11px] tabular-nums shrink-0">
          {users.map((u) => {
            const entries = series[u.id] ?? [];
            const latest = entries[entries.length - 1];
            const first = entries[0];
            const delta =
              entries.length >= 2 && first ? latest.weight - first.weight : 0;
            return (
              <span key={u.id} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: u.color }}
                />
                <span className="text-neutral-500">{u.shortName}:</span>
                {latest ? (
                  <>
                    <span className="font-medium text-white">
                      {latest.weight} lb
                    </span>
                    {delta !== 0 && (
                      <span
                        className={
                          delta > 0 ? "text-emerald-400" : "text-orange-400"
                        }
                      >
                        ({delta > 0 ? "+" : ""}
                        {delta})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-neutral-600">—</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {hasAny ? (
        <Chart series={series} users={users} />
      ) : (
        <p className="text-xs text-neutral-600 italic py-3 text-center">
          no entries yet
        </p>
      )}
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso + "T00:00:00"));
}

function Chart({
  series,
  users,
}: {
  series: Record<string, LogEntry[]>;
  users: BuddyUser[];
}) {
  const colorMap = Object.fromEntries(users.map((u) => [u.id, u.color]));

  const w = 320;
  const h = 60;
  const padX = 2;
  const padY = 4;

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

  const sameDate = minDate === maxDate;
  const sameWeight = wMin === wMax;

  return (
    <div className="flex">
      <div className="flex flex-col justify-between text-[10px] text-neutral-500 pr-2 py-0.5 tabular-nums shrink-0">
        {sameWeight ? (
          <span className="my-auto">{wMax} lb</span>
        ) : (
          <>
            <span>{wMax} lb</span>
            <span>{wMin} lb</span>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <svg
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          className="block h-[60px]"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Weight progression from ${formatDate(minDate)} to ${formatDate(maxDate)}, ${wMin} to ${wMax} lb`}
        >
          {Object.entries(series).map(([uid, entries]) => {
            if (entries.length === 0) return null;
            const sorted = [...entries].sort((a, b) =>
              a.date.localeCompare(b.date),
            );
            const points = sorted
              .map((e) => `${x(e.date).toFixed(1)},${y(e.weight).toFixed(1)}`)
              .join(" ");
            const color = colorMap[uid] ?? "#6b7280";
            return (
              <g key={uid}>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={points}
                />
                {sorted.map((e, i) => (
                  <circle
                    key={i}
                    cx={x(e.date)}
                    cy={y(e.weight)}
                    r="2"
                    fill={color}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            );
          })}
        </svg>

        <div className="flex justify-between text-[10px] text-neutral-500 mt-1 tabular-nums">
          {sameDate ? (
            <span className="mx-auto">{formatDate(minDate)}</span>
          ) : (
            <>
              <span>{formatDate(minDate)}</span>
              <span>{formatDate(maxDate)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
