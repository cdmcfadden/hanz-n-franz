"use client";

import { useState } from "react";
import { useEntries } from "@/contexts/EntriesContext";

export function ResetButton() {
  const { deleteAll } = useEntries();
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Clear ALL logged weights for both users on the server? This cannot be undone.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await deleteAll();
    } catch (e) {
      window.alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={reset}
      disabled={busy}
      className="text-xs text-neutral-500 hover:text-[var(--accent-strong)] hover:underline disabled:opacity-50"
    >
      {busy ? "Clearing…" : "Clear all logs"}
    </button>
  );
}
