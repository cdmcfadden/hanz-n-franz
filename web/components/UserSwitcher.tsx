"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext";

export function UserSwitcher() {
  const { currentUser, signOut, hydrated } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!hydrated || !currentUser) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={currentUser.name}
        className="inline-flex items-center gap-2 p-1 pr-3 rounded-full bg-neutral-900 ring-1 ring-[var(--ring)] hover:bg-neutral-800 transition-colors"
      >
        <span className="block w-7 h-7 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-[var(--accent)]">
          {currentUser.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              width={56}
              height={56}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-xs font-bold text-white">
              {currentUser.shortName[0]}
            </span>
          )}
        </span>
        <span className="text-sm font-medium text-white">
          {currentUser.shortName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-neutral-900 ring-1 ring-[var(--ring)] shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--ring)]">
            <p className="text-xs text-neutral-400 truncate">
              {currentUser.email}
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
