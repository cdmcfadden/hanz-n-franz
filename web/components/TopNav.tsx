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
    <header className="sticky top-0 z-30 px-4 sm:px-6 pt-3 pb-2 sm:pt-4 sm:pb-3 bg-[var(--bg)]/85 backdrop-blur-md border-b border-[var(--ring)]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cadet-icon.png"
              alt="C.A.D.E.T. logo"
              width={40}
              height={40}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg ring-1 ring-[var(--ring)] shrink-0 group-hover:ring-[var(--accent)] transition-[box-shadow,border-color]"
            />
            <div className="leading-tight min-w-0">
              <div className="text-base sm:text-lg font-semibold tracking-tight text-white truncate">
                C.A.D.E.T.
              </div>
              <div className="hidden sm:block text-[10px] uppercase tracking-widest text-neutral-400 truncate">
                Chris &amp; Dave&apos;s Experimental Training
              </div>
            </div>
          </Link>

          <div className="ml-auto">
            <UserSwitcher />
          </div>
        </div>

        <nav
          className="grid grid-cols-4 sm:flex sm:items-center gap-1 sm:gap-1.5"
          aria-label="Primary"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "relative text-center px-2 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white text-black font-semibold text-[13px] sm:text-base truncate shadow-[0_0_0_1px_rgba(217,32,39,0.45),0_8px_24px_-8px_rgba(217,32,39,0.55)]"
                    : "text-center px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors font-medium text-[13px] sm:text-base truncate"
                }
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
