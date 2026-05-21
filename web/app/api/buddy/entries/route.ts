import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { fetchBuddyData } from "@/lib/buddy-server";

export async function GET() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await fetchBuddyData(user.id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
