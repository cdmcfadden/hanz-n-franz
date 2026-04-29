import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function POST() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await sb
    .from("profiles")
    .update({ buddy_group_id: null })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
