"use client";

const LOG_PREFIX = "h360:log:";

export function ResetButton() {
  function reset() {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Clear ALL logged weights for both users? This cannot be undone.",
    );
    if (!ok) return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LOG_PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
    window.location.reload();
  }
  return (
    <button
      onClick={reset}
      className="text-xs text-zinc-400 hover:text-red-500 hover:underline"
    >
      Clear all logs
    </button>
  );
}
