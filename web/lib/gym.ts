import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/supabase-admin";

export type GymRole = "member" | "coach" | "owner";

/**
 * The gym a request acts on: the athlete's home gym, falling back to any gym
 * they belong to.
 *
 * Returns null when tenancy hasn't been migrated yet, or the user belongs to no
 * gym. Callers treat null as "use the legacy single-gym catalog", which keeps
 * the app working before migrate_008 has run and during the rollout.
 */
export async function resolveGymId(userId: string): Promise<string | null> {
  const admin = getAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("home_gym_id")
    .eq("id", userId)
    .maybeSingle();

  const homeGymId = profile?.home_gym_id as string | null | undefined;
  if (homeGymId) return homeGymId;

  const { data: membership } = await admin
    .from("gym_members")
    .select("gym_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (membership?.gym_id as string | undefined) ?? null;
}

/** Whether the user holds one of the given roles at a gym. */
export async function hasGymRole(
  userId: string,
  gymId: string,
  roles: GymRole[],
): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("gym_members")
    .select("role")
    .eq("user_id", userId)
    .eq("gym_id", gymId)
    .maybeSingle();

  const role = data?.role as GymRole | undefined;
  return role !== undefined && roles.includes(role);
}

/** Convenience for request handlers that already hold a session client. */
export async function resolveGymIdForSession(
  sb: SupabaseClient,
): Promise<{ userId: string; gymId: string | null } | null> {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  return { userId: user.id, gymId: await resolveGymId(user.id) };
}

/**
 * The acting gym for a server component. Returns null when signed out or before
 * tenancy is migrated, which callers pass straight to loadEquipmentData().
 *
 * Not usable from generateStaticParams and friends — those run without a
 * request, so there is no session to resolve a gym from.
 */
export async function currentGymId(): Promise<string | null> {
  const { getServerSupabase } = await import("@/lib/supabase-server");
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  return resolveGymId(user.id);
}
