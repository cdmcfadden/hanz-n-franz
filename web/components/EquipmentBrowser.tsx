"use client";

import { useMemo, useState } from "react";
import { MoveLogger } from "@/components/MoveLogger";
import { MuscleFilter } from "@/components/MuscleFilter";
import {
  CATEGORIES,
  categoryLabels,
  type EquipmentCategory,
  type EquipmentItem,
  type Move,
} from "@/lib/equipment";
import { ALL_GROUP_IDS, groupsForItem, groupsForMove } from "@/lib/muscle-groups";

const IMG_VERSION = "3";

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
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_GROUP_IDS),
  );

  const available = useMemo(
    () => new Set(availableImageIds),
    [availableImageIds],
  );

  const total = useMemo(
    () =>
      CATEGORIES.reduce(
        (sum, cat) => sum + (itemsByCategory[cat]?.length ?? 0),
        0,
      ),
    [itemsByCategory],
  );

  const filteredByCategory: Partial<Record<EquipmentCategory, FilteredItem[]>> =
    useMemo(() => {
      const out: Partial<Record<EquipmentCategory, FilteredItem[]>> = {};
      for (const cat of CATEGORIES) {
        const list = itemsByCategory[cat];
        if (!list) continue;
        const kept: FilteredItem[] = [];
        for (const item of list) {
          if (item.moves && item.moves.length > 0) {
            const visibleMoves = item.moves.filter((mv) => {
              const groups = groupsForMove(mv.id, item.muscles ?? []);
              for (const g of groups) {
                if (selected.has(g)) return true;
              }
              return false;
            });
            if (visibleMoves.length > 0) kept.push({ item, visibleMoves });
          } else {
            const groups = groupsForItem(item.muscles ?? []);
            for (const g of groups) {
              if (selected.has(g)) {
                kept.push({ item, visibleMoves: [] });
                break;
              }
            }
          }
        }
        if (kept.length > 0) out[cat] = kept;
      }
      return out;
    }, [itemsByCategory, selected]);

  const shown = useMemo(
    () =>
      CATEGORIES.reduce(
        (sum, cat) => sum + (filteredByCategory[cat]?.length ?? 0),
        0,
      ),
    [filteredByCategory],
  );

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
      {/* Filter card stays in the padded column */}
      <div className="px-4 sm:px-6">
        <MuscleFilter
          selected={selected}
          onToggle={toggle}
          onSelectAll={() => setSelected(new Set(ALL_GROUP_IDS))}
          onClearAll={() => setSelected(new Set())}
          shown={shown}
          total={total}
        />
      </div>

      {shown === 0 && (
        <div className="px-4 sm:px-6 text-center py-16 text-neutral-500">
          <p className="text-sm">No equipment matches the selected filters.</p>
          <button
            onClick={() => setSelected(new Set(ALL_GROUP_IDS))}
            className="mt-3 text-xs text-white hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Cards extend to the LEFT viewport edge (no left padding on the list) */}
      <div className="space-y-10 pr-3 sm:pr-6">
        {CATEGORIES.map((cat) => {
          const list = filteredByCategory[cat];
          if (!list || list.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="px-4 sm:px-6 text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-3">
                {categoryLabels[cat]}
                <span className="ml-2 normal-case font-normal tracking-normal text-neutral-600">
                  · {list.length}
                </span>
              </h2>
              <ul className="space-y-2">
                {list.map(({ item, visibleMoves }) => (
                  <EquipmentRow
                    key={item.id}
                    item={item}
                    visibleMoves={visibleMoves}
                    hasImage={available.has(item.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
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
      {/* Image floats in the upper-right corner of the card */}
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

      {/* Content reserves room for the floating image on the right */}
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
