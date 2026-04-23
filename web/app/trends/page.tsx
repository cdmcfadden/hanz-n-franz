import { TopNav } from "@/components/TopNav";
import { TrendsView } from "@/components/TrendsView";
import {
  CATEGORIES,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";

export const dynamic = "force-static";

export default async function TrendsPage() {
  const data = await loadEquipmentData();
  const itemsByCategory: Partial<Record<EquipmentCategory, EquipmentItem[]>> =
    {};
  for (const cat of CATEGORIES) {
    if (data[cat]?.length) itemsByCategory[cat] = data[cat];
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
      <TopNav active="trends" />

      <div className="mt-6 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-violet-50">
          Trends
        </h1>
        <p className="text-sm text-violet-300/80 mt-1 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            David
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            Chris
          </span>
          <span className="text-violet-500">— overlaid per move</span>
        </p>
      </div>

      <TrendsView itemsByCategory={itemsByCategory} />
    </main>
  );
}
