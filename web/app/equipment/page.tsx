import { readdirSync } from "node:fs";
import path from "node:path";
import {
  EquipmentBrowser,
  type ItemsByCategory,
} from "@/components/EquipmentBrowser";
import { ResetButton } from "@/components/ResetButton";
import { TopNav } from "@/components/TopNav";
import { UserSwitcher } from "@/components/UserSwitcher";
import { EntriesProvider } from "@/contexts/EntriesContext";
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
      <EntriesProvider>
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
          <TopNav
            active="equipment"
            right={
              <>
                <UserSwitcher />
                <ResetButton />
              </>
            }
          />

          <div className="mt-6 mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-violet-50">
              Your gym
            </h1>
            <p className="text-sm text-violet-300/80 mt-1">
              Filter by what you're training. Log per-move weights.
            </p>
          </div>

          <EquipmentBrowser
            itemsByCategory={itemsByCategory}
            availableImageIds={availableImageIds}
          />

          <footer className="mt-16 text-xs text-violet-500 text-center">
            Cataloged {data.cataloged_at} from a video walkthrough.
          </footer>
        </main>
      </EntriesProvider>
    </UserProvider>
  );
}
