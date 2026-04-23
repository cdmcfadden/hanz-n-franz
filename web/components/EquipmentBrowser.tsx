"use client";

import { useMemo, useState } from "react";
import { MoveLogger } from "@/components/MoveLogger";
import { MuscleFilter } from "@/components/MuscleFilter";
import { useEntries } from "@/contexts/EntriesContext";
import {
  CATEGORIES,
  type EquipmentCategory,
  type EquipmentItem,
  type Move,
} from "@/lib/equipment";
import { ALL_GROUP_IDS, groupsForItem, groupsForMove } from "@/lib/muscle-groups";

const IMG_VERSION = "4";

export type ItemsByCategory = Partial<Record<EquipmentCategory, EquipmentItem[]>>;

type FilteredItem = {
  item: EquipmentItem;
  visibleMoves: Move[];
};

export function EquipmentBrowser({
  itemsByCategory,
  availableImageIds,
}: {
  itemsByCategory: ItemsByCategory;
  availableImageIds: string[];
}) {
  // Default: no chips selected. The user opts in to what they're training.
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const { lastActivity } = useEntries();

  const available = useMemo(
    () => new Set(availableImageIds),
    [availableImageIds],
  );

  // Flatten the catalog once and remember each item's catalog index so we
  // can use it as a stable tiebreaker after the recency sort.
  const catalogOrder = useMemo(() => {
    const order: { item: EquipmentItem; idx: number }[] = [];
    let i = 0;
    for (const cat of CATEGORIES) {
      for (const item of itemsByCategory[cat] ?? []) {
        order.push({ item, idx: i++ });
      }
    }
    return order;
  }, [itemsByCategory]);

  const total = catalogOrder.length;

  const filteredItems: FilteredItem[] = useMemo(() => {
    if (selected.size === 0) return [];

    const withOrder: { f: FilteredItem; idx: number; recency: string }[] = [];
    for (const { item, idx } of catalogOrder) {
      let visibleMoves: Move[] = [];
      if (item.moves && item.moves.length > 0) {
        visibleMoves = item.moves.filter((mv) => {
          const groups = groupsForMove(mv.id, item.muscles ?? []);
          for (const g of groups) if (selected.has(g)) return true;
          return false;
        });
        if (visibleMoves.length === 0) continue;
      } else {
        const groups = groupsForItem(item.muscles ?? []);
        let any = false;
        for (const g of groups) if (selected.has(g)) { any = true; break; }
        if (!any) continue;
      }
      withOrder.push({
        f: { item, visibleMoves },
        idx,
        recency: lastActivity(item.id) ?? "",
      });
    }

    // Sort: most-recent log date descending; items without any log fall to
    // the bottom; catalog order breaks ties.
    withOrder.sort((a, b) => {
      if (a.recency !== b.recency) return b.recency.localeCompare(a.recency);
      return a.idx - b.idx;
    });

    return withOrder.map((x) => x.f);
  }, [catalogOrder, selected, lastActivity]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="px-4 sm:px-6">
        <MuscleFilter
          selected={selected}
          onToggle={toggle}
          onSelectAll={() => setSelected(new Set(ALL_GROUP_IDS))}
          onClearAll={() => setSelected(new Set())}
          shown={filteredItems.length}
          total={total}
        />
      </div>

      {filteredItems.length === 0 && (
        <div className="px-4 sm:px-6 text-center py-16 text-neutral-500">
          <p className="text-sm">
            {selected.size === 0
              ? "Tap a muscle group above to see matching equipment."
              : "No equipment matches the selected filters."}
          </p>
        </div>
      )}

      {filteredItems.length > 0 && (
        <ul className="space-y-2 pr-3 sm:pr-6">
          {filteredItems.map(({ item, visibleMoves }) => (
            <EquipmentRow
              key={item.id}
              item={item}
              visibleMoves={visibleMoves}
              hasImage={available.has(item.id)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function EquipmentRow({
  item,
  visibleMoves,
  hasImage,
}: {
  item: EquipmentItem;
  visibleMoves: Move[];
  hasImage: boolean;
}) {
  const totalMoves = item.moves?.length ?? 0;
  const hidden = totalMoves - visibleMoves.length;

  return (
    <li className="relative bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] rounded-r-2xl pl-4 pr-3 sm:pl-6 py-3 sm:py-4">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black ring-1 ring-[var(--ring)] flex items-center justify-center">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/equipment/${item.id}.jpg?v=${IMG_VERSION}`}
            alt={item.name}
            width={160}
            height={160}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-neutral-500 text-center px-1">
            no photo
          </span>
        )}
      </div>

      <div className="pr-20 sm:pr-24 min-w-0">
        <div className="flex items-baseline justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate tracking-tight">
              {item.name}
            </h3>
            {item.brand_guess && (
              <div className="text-xs text-neutral-500">{item.brand_guess}</div>
            )}
          </div>
          {item.count !== undefined && (
            <span className="text-xs font-medium text-neutral-500 whitespace-nowrap tabular-nums">
              ×{item.count}
            </span>
          )}
        </div>

        {visibleMoves.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {visibleMoves.map((mv) => (
              <MoveLogger
                key={mv.id}
                equipmentId={item.id}
                moveId={mv.id}
                moveName={mv.name}
              />
            ))}
            {hidden > 0 && (
              <p className="text-[11px] text-neutral-600 italic pl-1">
                +{hidden} other {hidden === 1 ? "move" : "moves"} hidden by
                filter
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
