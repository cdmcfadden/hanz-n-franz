import Link from "next/link";

type Tab = "workout" | "equipment" | "trends";

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "workout", label: "Workout", href: "/" },
  { id: "equipment", label: "Equipment", href: "/equipment" },
  { id: "trends", label: "Trends", href: "/trends" },
];

export function TopNav({
  active,
  right,
}: {
  active: Tab;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-3 bg-[var(--bg)]/85 backdrop-blur-md border-b border-violet-900/40">
      <div className="flex items-center gap-3 mb-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/max-icon.png"
            alt="Max logo"
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg ring-1 ring-violet-700/50"
          />
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-violet-50">
              Max
            </div>
            <div className="text-[10px] uppercase tracking-widest text-violet-400">
              by Hanz &amp; Franz
            </div>
          </div>
        </Link>

        {right && (
          <div className="ml-auto flex items-center gap-3">{right}</div>
        )}
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
                  ? "px-3 py-1.5 rounded-full bg-violet-500 text-white font-medium shadow-sm shadow-violet-900/40"
                  : "px-3 py-1.5 rounded-full text-violet-300 hover:text-violet-50 hover:bg-violet-900/40 transition"
              }
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
