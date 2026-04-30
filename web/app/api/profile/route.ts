import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function PATCH(req: Request) {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const display_name = typeof body.display_name === "string" ? body.display_name.trim() : null;
  const short_name = typeof body.short_name === "string" ? body.short_name.trim() : null;

  if (!display_name || !short_name) {
    return NextResponse.json({ error: "display_name and short_name are required" }, { status: 400 });
  }

  const { error } = await sb
    .from("profiles")
    .update({ display_name, short_name })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
