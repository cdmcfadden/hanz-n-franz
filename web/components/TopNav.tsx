"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSwitcher } from "@/components/UserSwitcher";

const TABS = [
  { id: "workout", label: "Workout", href: "/" },
  { id: "equipment", label: "Equipment", href: "/equipment" },
  { id: "trends", label: "Trends", href: "/trends" },
] as const;

function activeTab(pathname: string): string {
  if (pathname.startsWith("/equipment")) return "equipment";
  if (pathname.startsWith("/trends")) return "trends";
  return "workout";
}

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const active = activeTab(pathname);

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-3 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--ring)]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hanz-icon.png"
              alt="C.A.D.E.T. logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg ring-1 ring-[var(--ring)]"
            />
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight text-white">
                C.A.D.E.T.
              </div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-400">
                Chris &amp; Dave&apos;s Experimental Training
              </div>
            </div>
          </Link>

          <div className="ml-auto">
            <UserSwitcher />
          </div>
        </div>

        <nav className="flex items-center gap-1.5 text-base">
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
