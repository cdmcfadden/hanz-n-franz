import { NextResponse } from "next/server";
import { NotEnoughDataError, refreshAthleteMemory } from "@/lib/memory-learn";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Manual "Refresh from recent activity" from /account. The same routine runs
// on its own in the background — see maybeAutoLearn in lib/memory-learn.ts.
export async function POST() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summary = await refreshAthleteMemory(user.id);
    return NextResponse.json({ summary });
  } catch (e) {
    if (e instanceof NotEnoughDataError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[memory] manual learn failed", e);
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
  }
}
