"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import {
  addEntry,
  getEntries,
  removeEntry,
  todayISO,
  type LogEntry,
} from "@/lib/log-storage";

export function MoveLogger({
  equipmentId,
  moveId,
  moveName,
}: {
  equipmentId: string;
  moveId: string;
  moveName: string;
}) {
  const { currentUser, hydrated: userHydrated } = useUser();
  const userId = currentUser.id;

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userHydrated) return;
    setEntries(getEntries(userId, equipmentId, moveId));
    setHydrated(true);
  }, [userId, equipmentId, moveId, userHydrated]);

  const latest = entries[entries.length - 1];

  function save() {
    const w = parseFloat(weight);
    if (!w || Number.isNaN(w) || w <= 0) return;
    const next = addEntry(userId, equipmentId, moveId, { date, weight: w });
    setEntries(next);
    setWeight("");
    setDate(todayISO());
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
  }

  return (
    <div className="group rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 ring-1 ring-zinc-200/60 dark:ring-zinc-700/60">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{moveName}</div>
          <div className="text-[11px] text-zinc-500 tabular-nums">
            {hydrated && latest
              ? `${latest.weight} lb · ${latest.date}`
              : hydrated
                ? "no log yet"
                : ""}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            step="0.5"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={handleKey}
            placeholder="lb"
            className="w-16 text-sm rounded-md border-0 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm rounded-md border-0 ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
          />
          <button
            onClick={save}
            disabled={!weight}
            className="text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-900 transition"
          >
            Log
          </button>
          {entries.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline px-1"
            >
              {expanded ? "hide" : entries.length}
            </button>
          )}
        </div>
      </div>

      {expanded && entries.length > 0 && (
        <ul className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs space-y-1 tabular-nums">
          {[...entries].reverse().map((e, idx) => {
            const realIdx = entries.length - 1 - idx;
            return (
              <li key={realIdx} className="flex items-center gap-2">
                <span className="text-zinc-500 w-20">{e.date}</span>
                <span className="font-medium">{e.weight} lb</span>
                <button
                  onClick={() => {
                    const next = removeEntry(
                      userId,
                      equipmentId,
                      moveId,
                      realIdx,
                    );
                    setEntries(next);
                  }}
                  className="ml-auto text-zinc-400 hover:text-red-500"
                  aria-label="delete entry"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
