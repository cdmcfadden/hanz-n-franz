import { readdirSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  EquipmentBrowser,
  type ItemsByCategory,
} from "@/components/EquipmentBrowser";
import { ResetButton } from "@/components/ResetButton";
import { UserSwitcher } from "@/components/UserSwitcher";
import { UserProvider } from "@/contexts/UserContext";
import { CATEGORIES } from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";

export const dynamic = "force-static";

function getAvailableImageIds(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "equipment");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".jpg"))
      .map((f) => f.replace(/\.jpg$/, ""));
  } catch {
    return [];
  }
}

export default async function EquipmentPage() {
  const data = await loadEquipmentData();
  const availableImageIds = getAvailableImageIds();

  const itemsByCategory: ItemsByCategory = {};
  for (const cat of CATEGORIES) {
    if (data[cat]?.length) itemsByCategory[cat] = data[cat];
  }

  return (
    <UserProvider>
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
                <h1 className="text-3xl font-semibold tracking-tight">
                  Your gym
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Filter by what you're training and log per-move weights.
                </p>
              </div>
              <UserSwitcher />
            </div>

            <nav className="mt-5 flex items-center gap-1 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium">
                Equipment
              </span>
              <Link
                href="/trends"
                className="px-3 py-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Trends
              </Link>
              <span className="ml-auto">
                <ResetButton />
              </span>
            </nav>
          </header>

          <EquipmentBrowser
            itemsByCategory={itemsByCategory}
            availableImageIds={availableImageIds}
          />

          <footer className="mt-16 text-xs text-zinc-400 text-center">
            Cataloged {data.cataloged_at} from a video walkthrough.
          </footer>
        </main>
      </div>
    </UserProvider>
  );
}
