"use client";

import { useUser } from "@/contexts/UserContext";
import { USERS } from "@/lib/users";

export function UserSwitcher() {
  const { currentUser, setCurrentUserId, hydrated } = useUser();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-neutral-900 ring-1 ring-[var(--ring)]">
      {USERS.map((u) => {
        const active = hydrated && u.id === currentUser.id;
        return (
          <button
            key={u.id}
            onClick={() => setCurrentUserId(u.id)}
            title={u.name}
            aria-pressed={active}
            className={[
              "inline-flex items-center gap-2 rounded-full transition-colors",
              active
                ? "bg-[var(--surface)] pl-1 pr-3 py-1 ring-1 ring-[var(--accent)]"
                : "p-1 hover:bg-neutral-800",
            ].join(" ")}
          >
            <span
              className={[
                "block w-7 h-7 rounded-full overflow-hidden bg-neutral-800",
                active ? "ring-2 ring-[var(--accent)]" : "opacity-60 grayscale",
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
              <span className="text-sm font-medium text-white">
                {u.shortName}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
