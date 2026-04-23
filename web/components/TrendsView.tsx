"use client";

import { useEffect, useState } from "react";
import { TrendChart } from "@/components/TrendChart";
import {
  CATEGORIES,
  categoryLabels,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { fetchAllEntries, type EntryMap } from "@/lib/log-store";

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
      <p className="text-sm text-zinc-400 text-center py-12">
        Loading entries…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-red-600 text-center py-12">
        Could not load entries: {error}
      </p>
    );
  }

  return (
    <div className="space-y-12">
      {CATEGORIES.map((cat) => {
        const items = (itemsByCategory[cat] ?? []).filter(
          (i) => i.moves && i.moves.length > 0,
        );
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">
              {categoryLabels[cat]}
            </h2>
            <div className="space-y-3">
              {items.flatMap((item) =>
                (item.moves ?? []).map((mv) => (
                  <TrendChart
                    key={`${item.id}:${mv.id}`}
                    equipmentId={item.id}
                    moveId={mv.id}
                    moveName={`${mv.name} — ${item.name}`}
                    allEntries={allEntries}
                  />
                )),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
