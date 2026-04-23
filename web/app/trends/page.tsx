import Link from "next/link";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-8">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← Workout generator
          </Link>

          <div className="mt-3">
            <h1 className="text-3xl font-semibold tracking-tight">Trends</h1>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                David
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Chris
              </span>
              <span className="text-zinc-400">— overlaid per move</span>
            </p>
          </div>

          <nav className="mt-5 flex items-center gap-1 text-sm">
            <Link
              href="/equipment"
              className="px-3 py-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Equipment
            </Link>
            <span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium">
              Trends
            </span>
          </nav>
        </header>

        <TrendsView itemsByCategory={itemsByCategory} />
      </main>
    </div>
  );
}
