import { getAdminSupabase } from "@/lib/supabase-admin";
import { BUDDY_COLORS, type BuddyUser } from "@/lib/buddy";

export type BuddyRow = {
  userId: string;
  equipmentId: string;
  moveId: string;
  date: string;
  weight: number;
};

export type BuddyData = {
  users: BuddyUser[];
  rows: BuddyRow[];
};

export async function fetchBuddyData(userId: string): Promise<BuddyData> {
  const admin = getAdminSupabase();

  const { data: myProfile } = await admin
    .from("profiles")
    .select("id, display_name, short_name, buddy_group_id")
    .eq("id", userId)
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

  const sorted = [
    ...groupProfiles.filter((p) => p.id === userId),
    ...groupProfiles.filter((p) => p.id !== userId),
  ];

  const users: BuddyUser[] = sorted.map((p, i) => ({
    id: p.id,
    name: p.display_name,
    shortName: p.short_name,
    color: BUDDY_COLORS[i % BUDDY_COLORS.length],
  }));

  const userIds = sorted.map((p) => p.id);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data: entries, error } = await admin
    .from("log_entries")
    .select("user_id, equipment_id, move_id, log_date, weight")
    .in("user_id", userIds)
    .gte("log_date", cutoffStr)
    .order("log_date", { ascending: true });

  if (error) throw error;

  return {
    users,
    rows: (entries ?? []).map((r) => ({
      userId: r.user_id,
      equipmentId: r.equipment_id,
      moveId: r.move_id,
      date: r.log_date,
      weight: Number(r.weight),
    })),
  };
}
