"use client";

import { useEffect, useState } from "react";
import { TrendChart } from "@/components/TrendChart";
import {
  CATEGORIES,
  categoryLabels,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { fetchAllEntries, keys, type EntryMap } from "@/lib/log-store";
import { USERS } from "@/lib/users";

export function TrendsView({
  itemsByCategory,
}: {
  itemsByCategory: Partial<Record<EquipmentCategory, EquipmentItem[]>>;
}) {
  const [allEntries, setAllEntries] = useState<EntryMap>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllEntries()
      .then((m) => {
        setAllEntries(m);
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

  function moveHasEntries(equipmentId: string, moveId: string): boolean {
    for (const u of USERS) {
      const list = allEntries.get(keys.userMoveKey(u.id, equipmentId, moveId));
      if (list && list.length > 0) return true;
    }
    return false;
  }

  let totalRendered = 0;

  const sections = CATEGORIES.map((cat) => {
    const items = itemsByCategory[cat] ?? [];
    const moves = items.flatMap((item) =>
      (item.moves ?? [])
        .filter((mv) => moveHasEntries(item.id, mv.id))
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
            />
          ))}
        </div>
      </section>
    );
  });

  if (totalRendered === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-12">
        No logged entries yet. Head to{" "}
        <a href="/equipment" className="underline hover:text-white">
          Equipment
        </a>{" "}
        and log a few weights to see trends here.
      </p>
    );
  }

  return <div className="space-y-10">{sections}</div>;
}
