import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: memory }, { data: events }] = await Promise.all([
    sb.from("athlete_memory").select("summary, updated_at").eq("user_id", user.id).maybeSingle(),
    sb
      .from("athlete_events")
      .select("id, title, event_date, notes")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true }),
  ]);

  return NextResponse.json({
    summary: memory?.summary ?? "",
    updatedAt: memory?.updated_at ?? null,
    events: events ?? [],
  });
}

export async function PATCH(req: Request) {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 2000) : null;
  if (summary === null) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  const { error } = await sb
    .from("athlete_memory")
    .upsert({ user_id: user.id, summary, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
