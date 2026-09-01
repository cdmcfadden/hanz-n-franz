import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { hasGymRole, resolveGymId } from "@/lib/gym";
import { loadEquipmentData, saveEquipmentData } from "@/lib/equipment-server";
import type { EquipmentData } from "@/lib/equipment";
import { CATEGORIES } from "@/lib/equipment";

/**
 * Editing a catalog is a question about *which* catalog: a gym owner may edit
 * their own gym and nobody else's. The global ADMIN_USER_IDS allowlist stays as
 * a platform-operator escape hatch and as the answer before tenancy is
 * migrated, when there is no gym to hold a role in.
 */
async function requireCatalogOwner() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return { user: null, gymId: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const gymId = await resolveGymId(user.id);
  const permitted = gymId ? (await hasGymRole(user.id, gymId, ["owner"])) || isAdmin(user.id) : isAdmin(user.id);

  if (!permitted) {
    return { user: null, gymId: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, gymId, error: null };
}

function validateShape(data: unknown): data is EquipmentData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  for (const cat of CATEGORIES) {
    if (!Array.isArray(d[cat])) return false;
  }
  return true;
}

export async function GET() {
  const { gymId, error } = await requireCatalogOwner();
  if (error) return error;

  const data = await loadEquipmentData(gymId);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { user, gymId, error } = await requireCatalogOwner();
  if (error) return error;

  const body = await req.json();
  if (!validateShape(body)) {
    return NextResponse.json({ error: "Invalid equipment data shape" }, { status: 400 });
  }

  await saveEquipmentData(body as EquipmentData, user!.id, gymId);
  revalidatePath("/equipment", "layout");
  revalidatePath("/trends", "layout");
  revalidatePath("/qr", "layout");
  return NextResponse.json({ ok: true });
}
