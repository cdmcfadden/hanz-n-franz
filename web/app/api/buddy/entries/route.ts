import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { BUDDY_COLORS, type BuddyUser } from "@/lib/buddy";

export async function GET() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminSupabase();

  const { data: myProfile } = await admin
    .from("profiles")
    .select("id, display_name, short_name, buddy_group_id")
    .eq("id", user.id)
    .single();

  type ProfileRow = { id: string; display_name: string; short_name: string };
  let groupProfiles: ProfileRow[] = [];

  if (myProfile?.buddy_group_id) {
    const { data } = await admin
      .from("profiles")
      .select("id, display_name, short_name")
      .eq("buddy_group_id", myProfile.buddy_group_id)
      .order("display_name");
    groupProfiles = (data ?? []) as ProfileRow[];
  } else {
    groupProfiles = myProfile ? [myProfile as ProfileRow] : [];
  }

  // Put self first so self always gets the first color slot
  const sorted = [
    ...groupProfiles.filter((p) => p.id === user.id),
    ...groupProfiles.filter((p) => p.id !== user.id),
  ];

  const users: BuddyUser[] = sorted.map((p, i) => ({
    id: p.id,
    name: p.display_name,
    shortName: p.short_name,
    color: BUDDY_COLORS[i % BUDDY_COLORS.length],
  }));

  const userIds = sorted.map((p) => p.id);

  const { data: rows, error } = await admin
    .from("log_entries")
    .select("user_id, equipment_id, move_id, log_date, weight")
    .in("user_id", userIds)
    .order("log_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    users,
    rows: (rows ?? []).map((r) => ({
      userId: r.user_id,
      equipmentId: r.equipment_id,
      moveId: r.move_id,
      date: r.log_date,
      weight: Number(r.weight),
    })),
  });
}
