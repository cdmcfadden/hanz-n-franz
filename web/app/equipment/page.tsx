import { readdirSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  EquipmentBrowser,
  type ItemsByCategory,
} from "@/components/EquipmentBrowser";
import { ResetButton } from "@/components/ResetButton";
import { CATEGORIES } from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";
import { currentGymId } from "@/lib/gym";
import { getServerSupabase } from "@/lib/supabase-server";
import { fetchLastActivityMaps } from "@/lib/log-store-server";

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
  const [data, sb] = await Promise.all([
    currentGymId().then(loadEquipmentData),
    getServerSupabase(),
  ]);
  const availableImageIds = getAvailableImageIds();

  const itemsByCategory: ItemsByCategory = {};
  for (const cat of CATEGORIES) {
    if (data[cat]?.length) itemsByCategory[cat] = data[cat];
  }

  const { data: { user } } = await sb.auth.getUser();
  const { lastActivityMap, lastMoveActivityMap } = user
    ? await fetchLastActivityMaps(user.id)
    : { lastActivityMap: {}, lastMoveActivityMap: {} };

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Your gym
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Filter by what you&apos;re training. Log per-move weights.
        </p>
      </div>

      <EquipmentBrowser
        itemsByCategory={itemsByCategory}
        availableImageIds={availableImageIds}
        initialLastActivity={lastActivityMap}
        initialLastMoveActivity={lastMoveActivityMap}
      />

      <footer className="mt-12 flex items-center justify-between gap-4 text-xs text-neutral-600">
        <span>Cataloged {data.cataloged_at} from a video walkthrough.</span>
        <div className="flex items-center gap-4">
          <Link href="/qr" className="hover:text-white">
            Print QR sheet
          </Link>
          <ResetButton />
        </div>
      </footer>
    </main>
  );
}
