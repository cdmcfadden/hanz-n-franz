import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { loadEquipmentData, saveEquipmentData } from "@/lib/equipment-server";
import type { EquipmentData } from "@/lib/equipment";
import { CATEGORIES } from "@/lib/equipment";

async function requireAdmin() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isAdmin(user.id)) return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, error: null };
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
  const { error } = await requireAdmin();
  if (error) return error;

  const data = await loadEquipmentData();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  if (!validateShape(body)) {
    return NextResponse.json({ error: "Invalid equipment data shape" }, { status: 400 });
  }

  await saveEquipmentData(body as EquipmentData, user!.id);
  return NextResponse.json({ ok: true });
}
