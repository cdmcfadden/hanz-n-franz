import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { AdminView } from "./AdminView";

export default async function AdminPage() {
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6 w-full">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-6">
        Admin — Exercise Catalog
      </h1>
      <AdminView />
    </main>
  );
}
