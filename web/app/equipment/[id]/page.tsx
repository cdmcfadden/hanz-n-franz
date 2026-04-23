import { readdirSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { EquipmentDetail } from "@/components/EquipmentDetail";
import { CATEGORIES, type EquipmentItem } from "@/lib/equipment";
import { loadEquipmentData } from "@/lib/equipment-server";

export const dynamic = "force-static";

function hasImage(id: string): boolean {
  try {
    const dir = path.join(process.cwd(), "public", "equipment");
    return readdirSync(dir).includes(`${id}.jpg`);
  } catch {
    return false;
  }
}

function findItem(
  data: Awaited<ReturnType<typeof loadEquipmentData>>,
  id: string,
): EquipmentItem | null {
  for (const cat of CATEGORIES) {
    const found = (data[cat] ?? []).find((it) => it.id === id);
    if (found) return found;
  }
  return null;
}

export default async function EquipmentItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadEquipmentData();
  const item = findItem(data, id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <EquipmentDetail item={item} hasImage={hasImage(id)} />
    </main>
  );
}

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const data = await loadEquipmentData();
  const ids: string[] = [];
  for (const cat of CATEGORIES) {
    for (const item of data[cat] ?? []) ids.push(item.id);
  }
  return ids.map((id) => ({ id }));
}
