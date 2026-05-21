"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

const SEEN_KEY = "cadet_seen_about";

export function FirstVisitRedirect() {
  const { currentUser, hydrated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !currentUser) return;
    if (localStorage.getItem(SEEN_KEY)) return;
    localStorage.setItem(SEEN_KEY, "1");
    router.replace("/about");
  }, [hydrated, currentUser, router]);

  return null;
}
