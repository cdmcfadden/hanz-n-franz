"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoveLogger } from "@/components/MoveLogger";
import { MuscleFilter } from "@/components/MuscleFilter";
import { VoiceNoteButton } from "@/components/VoiceNoteButton";
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const { lastActivity } = useEntries();

  const available = useMemo(
    () => new Set(availableImageIds),
    [availableImageIds],
  );

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
      <MuscleFilter
        selected={selected}
        onToggle={toggle}
        onSelectAll={() => setSelected(new Set(ALL_GROUP_IDS))}
        onClearAll={() => setSelected(new Set())}
        shown={filteredItems.length}
        total={total}
      />

      {filteredItems.length === 0 && (
        <div className="text-center py-16 text-neutral-500">
          <p className="text-sm">
            {selected.size === 0
              ? "Tap a muscle group above to see matching equipment."
              : "No equipment matches the selected filters."}
          </p>
        </div>
      )}

      {filteredItems.length > 0 && (
        <ul className="space-y-3">
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
    <li className="rounded-2xl bg-[var(--surface-soft)] ring-1 ring-[var(--ring)] p-4 sm:p-5">
      {/* Header: name + voice-note row on the left, clickable image top-right */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 pt-1">
          <h3 className="font-semibold text-white tracking-tight text-lg sm:text-xl truncate">
            {item.name}
          </h3>
          <VoiceNoteButton equipmentId={item.id} />
        </div>

        <Link
          href={`/equipment/${item.id}`}
          aria-label={`Open ${item.name} details`}
          className="shrink-0 block rounded-xl overflow-hidden bg-black ring-1 ring-[var(--ring)] hover:ring-[var(--accent)] transition-[box-shadow,ring] w-28 h-28 sm:w-36 sm:h-36"
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/equipment/${item.id}.jpg?v=${IMG_VERSION}`}
              alt={item.name}
              width={288}
              height={288}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
              no photo
            </div>
          )}
        </Link>
      </header>

      {visibleMoves.length > 0 && (
        <div className="space-y-2">
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
              +{hidden} other {hidden === 1 ? "move" : "moves"} hidden by filter
            </p>
          )}
        </div>
      )}
    </li>
  );
}
