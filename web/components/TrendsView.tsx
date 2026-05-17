"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TrendChart } from "@/components/TrendChart";
import {
  CATEGORIES,
  categoryLabels,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { type EntryMap, type LogEntry, keys } from "@/lib/log-store";
import { type BuddyUser } from "@/lib/buddy";
import { ALL_GROUP_IDS, MUSCLE_GROUPS, groupsForMove } from "@/lib/muscle-groups";

type Row = {
  userId: string;
  equipmentId: string;
  moveId: string;
  date: string;
  weight: number;
};

export function TrendsView({
  itemsByCategory,
}: {
  itemsByCategory: Partial<Record<EquipmentCategory, EquipmentItem[]>>;
}) {
  const [allEntries, setAllEntries] = useState<EntryMap>(() => new Map());
  const [users, setUsers] = useState<BuddyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/buddy/entries")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { rows: Row[]; users: BuddyUser[] };
        const loadedUsers = data.users ?? [];
        setUsers(loadedUsers);
        setSelectedUsers(new Set(loadedUsers.map((u) => u.id)));
        const map = new Map<string, LogEntry[]>();
        for (const row of data.rows ?? []) {
          const k = keys.userMoveKey(row.userId, row.equipmentId, row.moveId);
          const list = map.get(k) ?? [];
          list.push({ id: 0, date: row.date, createdAt: "", weight: row.weight });
          map.set(k, list);
        }
        for (const list of map.values()) {
          list.sort((a, b) => a.date.localeCompare(b.date));
        }
        setAllEntries(map);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-neutral-500 text-center py-12">
        Loading entries…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-[var(--accent-strong)] text-center py-12">
        Could not load entries: {error}
      </p>
    );
  }

  const visibleUsers = users.filter((u) => selectedUsers.has(u.id));

  function moveHasEntries(equipmentId: string, moveId: string): boolean {
    for (const u of visibleUsers) {
      const list = allEntries.get(keys.userMoveKey(u.id, equipmentId, moveId));
      if (list && list.length > 0) return true;
    }
    return false;
  }

  function moveMatchesGroupFilter(item: EquipmentItem, moveId: string): boolean {
    if (selectedGroups.size === 0) return true;
    const groups = groupsForMove(moveId, item.muscles ?? []);
    for (const g of groups) if (selectedGroups.has(g)) return true;
    return false;
  }

  function toggleUser(id: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  let totalRendered = 0;

  const sections = CATEGORIES.map((cat) => {
    const items = itemsByCategory[cat] ?? [];
    const moves = items.flatMap((item) =>
      (item.moves ?? [])
        .filter(
          (mv) =>
            moveHasEntries(item.id, mv.id) &&
            moveMatchesGroupFilter(item, mv.id),
        )
        .map((mv) => ({ item, mv })),
    );
    if (moves.length === 0) return null;
    totalRendered += moves.length;
    return (
      <section key={cat}>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-3">
          {categoryLabels[cat]}
        </h2>
        <div className="space-y-2">
          {moves.map(({ item, mv }) => (
            <TrendChart
              key={`${item.id}:${mv.id}`}
              equipmentId={item.id}
              moveId={mv.id}
              moveName={`${mv.name} — ${item.name}`}
              allEntries={allEntries}
              users={visibleUsers}
            />
          ))}
        </div>
      </section>
    );
  });

  let emptyMessage: ReactNode = null;
  if (visibleUsers.length === 0) {
    emptyMessage = (
      <p className="text-sm text-neutral-500 text-center py-12">
        Select at least one user above to see trends.
      </p>
    );
  } else if (totalRendered === 0 && selectedGroups.size > 0) {
    emptyMessage = (
      <p className="text-sm text-neutral-500 text-center py-12">
        No exercises match the selected filters. Try clearing the exercise type
        filter.
      </p>
    );
  } else if (totalRendered === 0) {
    emptyMessage = (
      <p className="text-sm text-neutral-500 text-center py-12">
        No logged entries yet. Head to{" "}
        <a href="/equipment" className="underline hover:text-white">
          Equipment
        </a>{" "}
        and log a few weights to see trends here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {users.length > 1 && (
        <div className="rounded-xl bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] p-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {users.map((u) => {
              const active = selectedUsers.has(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  aria-pressed={active}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm font-medium ring-1 transition-colors flex items-center gap-1.5",
                    active
                      ? "bg-black text-white ring-black"
                      : "bg-neutral-900 text-neutral-500 ring-neutral-800 hover:text-neutral-300",
                  ].join(" ")}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: u.color }}
                  />
                  {u.shortName}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setSelectedUsers(new Set(users.map((u) => u.id)))}
              className="text-neutral-400 hover:text-white hover:underline"
            >
              Select all
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-neutral-400 hover:text-white hover:underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] p-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {MUSCLE_GROUPS.map((g) => {
            const active = selectedGroups.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGroup(g.id)}
                aria-pressed={active}
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
            onClick={() => setSelectedGroups(new Set(ALL_GROUP_IDS))}
            className="text-neutral-400 hover:text-white hover:underline"
          >
            Select all
          </button>
          <button
            onClick={() => setSelectedGroups(new Set())}
            className="text-neutral-400 hover:text-white hover:underline"
          >
            Clear all
          </button>
          <span className="ml-auto tabular-nums text-neutral-400">
            <span className="font-medium text-white">{totalRendered}</span>
            {" exercises"}
          </span>
        </div>
      </div>

      {emptyMessage ?? <div className="space-y-10">{sections}</div>}
    </div>
  );
}
