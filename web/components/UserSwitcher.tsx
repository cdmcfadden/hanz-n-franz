"use client";

import { useUser } from "@/contexts/UserContext";
import { USERS } from "@/lib/users";

export function UserSwitcher() {
  const { currentUser, setCurrentUserId, hydrated } = useUser();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-violet-950/60 ring-1 ring-violet-800/60">
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
                ? "bg-violet-700/60 pl-1 pr-3 py-1 shadow-sm ring-1 ring-violet-500/60"
                : "p-1 hover:bg-violet-900/60",
            ].join(" ")}
          >
            <span
              className={[
                "block w-7 h-7 rounded-full overflow-hidden bg-violet-900",
                active
                  ? "ring-2 ring-violet-200"
                  : "opacity-60 grayscale",
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
              <span className="text-sm font-medium text-violet-50">
                {u.shortName}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
