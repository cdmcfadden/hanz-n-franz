import Link from "next/link";
import { TrendChart } from "@/components/TrendChart";
import { CATEGORIES, categoryLabels } from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";

export const dynamic = "force-static";

export default async function TrendsPage() {
  const data = await loadEquipmentData();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← Workout generator
          </Link>

          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
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

        <div className="space-y-12">
          {CATEGORIES.map((cat) => {
            const items = (data[cat] ?? []).filter(
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
                      />
                    )),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
