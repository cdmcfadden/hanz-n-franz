"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSwitcher } from "@/components/UserSwitcher";
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

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const { currentUser, hydrated } = useUser();
  const active = activeTab(pathname);

  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) return null;
  if (!hydrated || !currentUser) return null;

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-3 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--ring)]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 sm:mb-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cadet-icon.png"
              alt="C.A.D.E.T. logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg ring-1 ring-[var(--ring)] shrink-0"
            />
            <div className="leading-tight min-w-0">
              <div className="text-lg font-semibold tracking-tight text-white truncate">
                C.A.D.E.T.
              </div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-400 truncate">
                Chris &amp; Dave&apos;s Experimental Training
              </div>
            </div>
          </Link>

          <div className="ml-auto">
            <UserSwitcher />
          </div>
        </div>

        {/* Top tabs only on md+; mobile uses the bottom tab bar */}
        <nav className="hidden sm:flex items-center gap-1.5 text-base">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={
                  isActive
                    ? "px-4 py-2 rounded-full bg-white text-black font-semibold"
                    : "px-4 py-2 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors font-medium"
                }
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
