"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrendChart } from "@/components/TrendChart";
import { MuscleFilter } from "@/components/MuscleFilter";
import {
  CATEGORIES,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { type EntryMap, type LogEntry, keys } from "@/lib/log-store";
import { type BuddyUser } from "@/lib/buddy";
import { ALL_GROUP_IDS, groupsForMove } from "@/lib/muscle-groups";

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
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const scrolled = useRef(false);

  useEffect(() => {
    fetch("/api/buddy/entries")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { rows: Row[]; users: BuddyUser[] };
        const fetchedUsers = data.users ?? [];
        setUsers(fetchedUsers);
        setSelectedUsers(new Set(fetchedUsers.map((u) => u.id)));
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

  useEffect(() => {
    if (loading || scrolled.current) return;
    const params = new URLSearchParams(window.location.search);
    const eq = params.get("eq");
    scrolled.current = true;
    if (!eq) return;
    const mv = params.get("mv");
    const el = mv
      ? document.getElementById(`trend-${eq}-${mv}`)
      : document.querySelector(`[id^="trend-${eq}-"]`);
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading]);

  const visibleUsers = useMemo(
    () => users.filter((u) => selectedUsers.has(u.id)),
    [users, selectedUsers],
  );

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

  const totalMoves = useMemo(() => {
    let count = 0;
    for (const cat of CATEGORIES) {
      for (const item of itemsByCategory[cat] ?? []) {
        count += item.moves?.length ?? 0;
      }
    }
    return count;
  }, [itemsByCategory]);

  const totalVisible = useMemo(() => {
    if (selectedGroups.size === 0) return totalMoves;
    let count = 0;
    for (const cat of CATEGORIES) {
      for (const item of itemsByCategory[cat] ?? []) {
        for (const mv of item.moves ?? []) {
          const groups = groupsForMove(mv.id, item.muscles ?? []);
          for (const g of groups) {
            if (selectedGroups.has(g)) {
              count++;
              break;
            }
          }
        }
      }
    }
    return count;
  }, [itemsByCategory, selectedGroups, totalMoves]);

  const equipmentGroups = useMemo(() => {
    const latestMoveDate = (item: EquipmentItem, mvId: string) => {
      let best = "";
      for (const u of visibleUsers) {
        const list = allEntries.get(keys.userMoveKey(u.id, item.id, mvId));
        if (list && list.length > 0) {
          const d = list[list.length - 1].date;
          if (d > best) best = d;
        }
      }
      return best;
    };
    const groups = CATEGORIES.flatMap((cat) =>
      (itemsByCategory[cat] ?? []).flatMap((item) => {
        const moves = (item.moves ?? [])
          .map((mv, catalogIdx) => ({ mv, catalogIdx }))
          .filter(({ mv }) => {
            const hasEntry = visibleUsers.some((u) => {
              const list = allEntries.get(
                keys.userMoveKey(u.id, item.id, mv.id),
              );
              return list && list.length > 0;
            });
            if (!hasEntry) return false;
            if (selectedGroups.size === 0) return true;
            const groups = groupsForMove(mv.id, item.muscles ?? []);
            for (const g of groups) if (selectedGroups.has(g)) return true;
            return false;
          })
          .sort((a, b) => {
            const ra = latestMoveDate(item, a.mv.id);
            const rb = latestMoveDate(item, b.mv.id);
            if (ra !== rb) return rb.localeCompare(ra);
            return a.catalogIdx - b.catalogIdx;
          })
          .map(({ mv }) => mv);
        if (moves.length === 0) return [];
        const itemLatest = moves.reduce((best, mv) => {
          const d = latestMoveDate(item, mv.id);
          return d > best ? d : best;
        }, "");
        return [{ item, moves, itemLatest }];
      }),
    );
    groups.sort((a, b) => b.itemLatest.localeCompare(a.itemLatest));
    return groups;
  }, [itemsByCategory, allEntries, visibleUsers, selectedGroups]);

  const totalRendered = useMemo(
    () => equipmentGroups.reduce((acc, g) => acc + g.moves.length, 0),
    [equipmentGroups],
  );

  if (loading) {
    return (
      <p className="text-sm text-neutral-500 text-center py-12">
        Loading entries...
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

  return (
    <div className="space-y-6">
      {users.length >= 2 && (
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ring-1 transition-colors",
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

      <MuscleFilter
        selected={selectedGroups}
        onToggle={toggleGroup}
        onSelectAll={() => setSelectedGroups(new Set(ALL_GROUP_IDS))}
        onClearAll={() => setSelectedGroups(new Set())}
        shown={totalVisible}
        total={totalMoves}
      />

      {totalRendered === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-12">
          {selectedUsers.size === 0 ? (
            "Select at least one user above to see trends."
          ) : selectedGroups.size > 0 ? (
            "No logged entries match the selected filters."
          ) : (
            <>
              No logged entries yet. Head to{" "}
              <Link href="/equipment" className="underline hover:text-white">
                Equipment
              </Link>{" "}
              and log a few weights to see trends here.
            </>
          )}
        </p>
      ) : (
        <div className="space-y-6">
          {equipmentGroups.map(({ item, moves }) => (
            <div key={item.id}>
              <h3 className="text-sm font-semibold text-neutral-300 mb-2">
                <Link href={`/equipment?eq=${item.id}`} className="hover:text-white hover:underline">
                  {item.name}
                </Link>
              </h3>
              <div className="space-y-2">
                {moves.map((mv) => (
                  <TrendChart
                    key={`${item.id}:${mv.id}`}
                    equipmentId={item.id}
                    moveId={mv.id}
                    moveName={mv.name}
                    equipmentName={item.name}
                    allEntries={allEntries}
                    users={visibleUsers}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
