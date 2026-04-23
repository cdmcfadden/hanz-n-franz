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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hanz-icon.png"
              alt="Hanz logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-lg ring-1 ring-[var(--ring)]"
            />
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-white">
                Max
              </div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-400">
                by Hanz &amp; Franz
              </div>
            </div>
          </Link>

          <div className="ml-auto">
            <UserSwitcher />
          </div>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={
                  isActive
                    ? "px-3 py-1.5 rounded-full bg-white text-black font-medium"
                    : "px-3 py-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
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
