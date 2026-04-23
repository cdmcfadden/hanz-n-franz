"use client";

import { useUser } from "@/contexts/UserContext";
import { USERS } from "@/lib/users";

export function UserSwitcher() {
  const { currentUser, setCurrentUserId, hydrated } = useUser();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700">
      {USERS.map((u) => {
        const active = hydrated && u.id === currentUser.id;
        return (
          <button
            key={u.id}
            onClick={() => setCurrentUserId(u.id)}
            title={u.name}
            aria-pressed={active}
            className={[
              "inline-flex items-center gap-2 rounded-full transition",
              active
                ? "bg-white dark:bg-zinc-950 pl-1 pr-3 py-1 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
                : "p-1 hover:bg-white/60 dark:hover:bg-zinc-700/40",
            ].join(" ")}
          >
            <span
              className={[
                "block w-7 h-7 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700",
                active
                  ? "ring-2 ring-zinc-900 dark:ring-zinc-100"
                  : "opacity-70 grayscale group-hover:opacity-100",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.avatar}
                alt={u.name}
                width={56}
                height={56}
                className="w-full h-full object-cover object-top"
              />
            </span>
            {active && (
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {u.shortName}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
