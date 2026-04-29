import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { JoinConfirmation } from "./JoinConfirmation";

type Props = { params: Promise<{ userId: string }> };

export default async function BuddyJoinPage({ params }: Props) {
  const { userId: inviterId } = await params;

  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const admin = getAdminSupabase();

  const [{ data: inviter }, { data: joiner }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, short_name, avatar_url, buddy_group_id")
      .eq("id", inviterId)
      .single(),
    admin
      .from("profiles")
      .select("buddy_group_id")
      .eq("id", user!.id)
      .single(),
  ]);

  if (!inviter) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16 text-center w-full">
        <p className="text-neutral-400">Buddy link not found.</p>
        <a href="/account" className="mt-4 block text-sm text-[var(--accent)] hover:underline">
          ← Back to Account
        </a>
      </main>
    );
  }

  let groupSize = 1;
  if (inviter.buddy_group_id) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("buddy_group_id", inviter.buddy_group_id);
    groupSize = count ?? 1;
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16 w-full">
      <JoinConfirmation
        inviterId={inviterId}
        inviterName={inviter.display_name}
        inviterAvatar={(inviter.avatar_url as string | null) ?? null}
        isSelf={user!.id === inviterId}
        alreadyInGroup={!!joiner?.buddy_group_id}
        groupFull={groupSize >= 4}
      />
    </main>
  );
}
