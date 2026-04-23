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
import {
  ALL_GROUP_IDS,
  groupsForItem,
  groupsForMove,
  GROUP_BY_ID,
} from "@/lib/muscle-groups";

const IMG_VERSION = "2";

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
      <div className="sticky top-[5.5rem] z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-1 bg-[var(--bg)]/85 backdrop-blur-md">
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
        <div className="text-center py-16 text-violet-400">
          <div className="text-4xl mb-2">·</div>
          <p className="text-sm">No equipment matches the selected filters.</p>
          <button
            onClick={() => setSelected(new Set(ALL_GROUP_IDS))}
            className="mt-3 text-xs text-violet-200 hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      <div className="space-y-12">
        {CATEGORIES.map((cat) => {
          const list = filteredByCategory[cat];
          if (!list || list.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-4">
                {categoryLabels[cat]}
                <span className="ml-2 normal-case font-normal tracking-normal text-violet-500">
                  · {list.length}
                </span>
              </h2>
              <ul className="space-y-3">
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
  const itemGroupIds = groupsForItem(item.muscles ?? []);
  const totalMoves = item.moves?.length ?? 0;
  const hidden = totalMoves - visibleMoves.length;

  return (
    <li className="flex gap-3 sm:gap-4 rounded-2xl bg-[var(--surface-soft)] p-3 sm:p-4 ring-1 ring-violet-800/40 shadow-sm hover:ring-violet-700/60 hover:bg-[var(--surface)]/60 transition">
      <div className="shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-violet-950/60 flex items-center justify-center ring-1 ring-violet-800/40">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/equipment/${item.id}.jpg?v=${IMG_VERSION}`}
            alt={item.name}
            width={240}
            height={240}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-violet-400 text-center px-1">
            no photo
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-violet-50 truncate tracking-tight">
              {item.name}
            </h3>
            {item.brand_guess && (
              <div className="text-xs text-violet-400">{item.brand_guess}</div>
            )}
          </div>
          {item.count !== undefined && (
            <span className="text-xs font-medium text-violet-400 whitespace-nowrap tabular-nums">
              ×{item.count}
            </span>
          )}
        </div>

        {itemGroupIds.size > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {[...itemGroupIds].map((gid) => {
              const g = GROUP_BY_ID[gid];
              if (!g) return null;
              return (
                <span
                  key={gid}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-300"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${g.dotClass}`}
                  />
                  {g.label}
                </span>
              );
            })}
          </div>
        )}

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
              <p className="text-[11px] text-violet-500 italic pl-1">
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
