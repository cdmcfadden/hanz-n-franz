import { readdirSync } from "node:fs";
import path from "node:path";
import {
  EquipmentBrowser,
  type ItemsByCategory,
} from "@/components/EquipmentBrowser";
import { ResetButton } from "@/components/ResetButton";
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
    <main className="mx-auto max-w-3xl py-4 sm:py-6 w-full">
      <div className="px-4 sm:px-6 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Your gym
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Filter by what you're training. Log per-move weights.
        </p>
      </div>

      <EquipmentBrowser
        itemsByCategory={itemsByCategory}
        availableImageIds={availableImageIds}
      />

      <footer className="mt-12 px-4 sm:px-6 flex items-center justify-between text-xs text-neutral-600">
        <span>Cataloged {data.cataloged_at} from a video walkthrough.</span>
        <ResetButton />
      </footer>
    </main>
  );
}
