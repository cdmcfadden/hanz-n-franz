import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { inviterId } = body as { inviterId: string };

  if (!inviterId || typeof inviterId !== "string") {
    return NextResponse.json({ error: "inviterId required" }, { status: 400 });
  }
  if (inviterId === user.id) {
    return NextResponse.json({ error: "Cannot buddy with yourself" }, { status: 400 });
  }

  const admin = getAdminSupabase();

  const [{ data: inviter }, { data: joiner }] = await Promise.all([
    admin.from("profiles").select("id, buddy_group_id").eq("id", inviterId).single(),
    admin.from("profiles").select("id, buddy_group_id").eq("id", user.id).single(),
  ]);

  if (!inviter) return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
  if (!joiner) return NextResponse.json({ error: "Your profile not found" }, { status: 404 });
  if (joiner.buddy_group_id) {
    return NextResponse.json(
      { error: "You are already in a buddy group. Leave first." },
      { status: 409 },
    );
  }

  const targetGroupId = inviter.buddy_group_id as string | null;

  if (targetGroupId) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("buddy_group_id", targetGroupId);
    if ((count ?? 0) >= 4) {
      return NextResponse.json({ error: "Buddy group is full (max 4)" }, { status: 409 });
    }
    const { error } = await admin
      .from("profiles")
      .update({ buddy_group_id: targetGroupId })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, groupId: targetGroupId });
  } else {
    const newGroupId = crypto.randomUUID();
    const { error } = await admin
      .from("profiles")
      .update({ buddy_group_id: newGroupId })
      .in("id", [inviter.id, user.id]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, groupId: newGroupId });
  }
}
