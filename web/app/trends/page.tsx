import { TrendsView } from "@/components/TrendsView";
import {
  CATEGORIES,
  type EquipmentCategory,
  type EquipmentItem,
} from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";
import { getServerSupabase } from "@/lib/supabase-server";
import { fetchBuddyData } from "@/lib/buddy-server";
import { type EntryMap, keys } from "@/lib/log-store";

export default async function TrendsPage() {
  const [data, sb] = await Promise.all([loadEquipmentData(), getServerSupabase()]);
  const itemsByCategory: Partial<Record<EquipmentCategory, EquipmentItem[]>> =
    {};
  for (const cat of CATEGORIES) {
    if (data[cat]?.length) itemsByCategory[cat] = data[cat];
  }

  const { data: { user } } = await sb.auth.getUser();
  let initialEntries: EntryMap | undefined;
  let initialUsers = undefined;

  if (user) {
    try {
      const { users, rows } = await fetchBuddyData(user.id);
      initialUsers = users;
      const map: EntryMap = new Map();
      for (const row of rows) {
        const k = keys.userMoveKey(row.userId, row.equipmentId, row.moveId);
        const list = map.get(k) ?? [];
        list.push({ id: 0, date: row.date, createdAt: "", weight: row.weight });
        map.set(k, list);
      }
      for (const list of map.values()) {
        list.sort((a, b) => a.date.localeCompare(b.date));
      }
      initialEntries = map;
    } catch {
      // Fall through to client-side fetch
    }
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

      <TrendsView
        itemsByCategory={itemsByCategory}
        initialEntries={initialEntries}
        initialUsers={initialUsers}
      />
    </main>
  );
}
