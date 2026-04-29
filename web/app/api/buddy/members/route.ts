import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function GET() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("buddy_group_id")
    .eq("id", user.id)
    .single();

  if (!profile?.buddy_group_id) {
    const { data: self } = await admin
      .from("profiles")
      .select("id, display_name, short_name, avatar_url")
      .eq("id", user.id)
      .single();
    return NextResponse.json({ members: self ? [self] : [], groupId: null });
  }

  const { data: members } = await admin
    .from("profiles")
    .select("id, display_name, short_name, avatar_url")
    .eq("buddy_group_id", profile.buddy_group_id)
    .order("display_name");

  return NextResponse.json({ members: members ?? [], groupId: profile.buddy_group_id });
}
