"use client";

import Link from "next/link";
import { MoveLogger } from "@/components/MoveLogger";
import type { EquipmentItem } from "@/lib/equipment";

const IMG_VERSION = "2";

export function EquipmentDetail({
  item,
  hasImage,
}: {
  item: EquipmentItem;
  hasImage: boolean;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/equipment"
        className="inline-block text-xs text-neutral-500 hover:text-white"
      >
        ← All equipment
      </Link>

      <div className="rounded-2xl overflow-hidden bg-[var(--surface-soft)] ring-1 ring-[var(--ring)]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/equipment/${item.id}.jpg?v=${IMG_VERSION}`}
            alt={item.name}
            width={800}
            height={800}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center text-neutral-600 text-sm">
            no photo
          </div>
        )}
        <div className="p-4">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {item.name}
          </h1>
          {item.brand_guess && (
            <div className="text-sm text-neutral-500">{item.brand_guess}</div>
          )}
          {item.muscles && item.muscles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.muscles.map((m) => (
                <span
                  key={m}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-black text-neutral-300 ring-1 ring-[var(--ring)]"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {item.moves && item.moves.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
            Moves
          </h2>
          {item.moves.map((mv) => (
            <MoveLogger
              key={mv.id}
              equipmentId={item.id}
              moveId={mv.id}
              moveName={mv.name}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 italic">
          No designated moves for this item.
        </p>
      )}
    </div>
  );
}
