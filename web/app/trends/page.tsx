import { TrendsView } from "@/components/TrendsView";
import {
  CATEGORIES,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";

export default async function TrendsPage() {
  const data = await loadEquipmentData();
  const itemsByCategory: Partial<Record<EquipmentCategory, EquipmentItem[]>> =
    {};
  for (const cat of CATEGORIES) {
    if (data[cat]?.length) itemsByCategory[cat] = data[cat];
  }

  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Trends
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Overlaid per move — buddy group members shown together.
        </p>
      </div>

      <TrendsView itemsByCategory={itemsByCategory} />
    </main>
  );
}
