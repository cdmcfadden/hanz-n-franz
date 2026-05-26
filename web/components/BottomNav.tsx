"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

const TABS = [
  { id: "workout", label: "Workout", href: "/" },
  { id: "equipment", label: "Equipment", href: "/equipment" },
  { id: "trends", label: "Trends", href: "/trends" },
  { id: "account", label: "Account", href: "/account" },
] as const;

function activeTab(pathname: string): string | null {
  if (pathname.startsWith("/equipment")) return "equipment";
  if (pathname.startsWith("/trends")) return "trends";
  if (pathname.startsWith("/account") || pathname.startsWith("/buddy")) return "account";
  if (pathname === "/" || pathname === "") return "workout";
  return null;
}

function Icon({ id, active }: { id: string; active: boolean }) {
  const stroke = active ? "currentColor" : "currentColor";
  const fill = active ? "currentColor" : "none";
  const common = {
    viewBox: "0 0 24 24",
    fill,
    stroke,
    strokeWidth: active ? 0 : 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-5 h-5",
    "aria-hidden": true,
  };
  if (id === "workout") {
    return (
      <svg {...common}>
        <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />
      </svg>
    );
  }
  if (id === "equipment") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (id === "trends") {
    return (
      <svg {...common}>
        <path d="M3 17l6-6 4 4 7-8" />
        <path d="M14 7h6v6" />
      </svg>
    );
  }
  // account
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { currentUser, hydrated } = useUser();
  const active = activeTab(pathname);

  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) return null;
  if (!hydrated || !currentUser) return null;

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--ring)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] transition-colors " +
                  (isActive
                    ? "text-white font-semibold"
                    : "text-neutral-500 hover:text-white font-medium")
                }
              >
                <Icon id={tab.id} active={isActive} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
