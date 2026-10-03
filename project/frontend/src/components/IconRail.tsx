"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navGroups } from "@/lib/nav-config";

interface IconRailProps {
  role?: string;
}

export function IconRail({ role }: IconRailProps) {
  const pathname = usePathname();

  // Flatten into two blocks: everything you use often, then account/admin
  // pinned to the bottom — no text labels, no group headers.
  const [mainGroup, toolsGroup, accountGroup] = navGroups;
  const topItems = [...mainGroup.items, ...toolsGroup.items];
  const bottomItems = accountGroup.items.filter(
    (item) => !item.requiresRole || item.requiresRole === role
  );

  return (
    <aside className="hidden md:flex w-14 h-screen sticky top-0 z-40 border-r border-border bg-surface flex-col items-center shrink-0 py-4">
      <Link href="/dashboard" className="mb-6 shrink-0" title="FitSense AI">
        <Image src="/logo/fitsense-logo.png" alt="FitSense AI" width={26} height={26} className="rounded-md" />
      </Link>

      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {topItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="group relative w-10 h-10 flex items-center justify-center shrink-0"
            >
              {isActive && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary" />
              )}
              <span
                className={`w-full h-full flex items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-container text-on-primary-container scale-100"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-[#595800]/6 active:scale-90"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-on-surface text-surface text-xs font-semibold px-3 py-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 shadow-lg z-[9999]"
                style={{ isolation: "isolate" }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="w-6 h-px bg-border my-2 shrink-0" />

      <div className="flex flex-col items-center gap-1 w-full px-2 shrink-0">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="group relative w-10 h-10 flex items-center justify-center shrink-0"
            >
              {isActive && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary" />
              )}
              <span
                className={`w-full h-full flex items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-container text-on-primary-container scale-100"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-[#595800]/6 active:scale-90"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-on-surface text-surface text-xs font-semibold px-3 py-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 shadow-lg z-[9999]"
                style={{ isolation: "isolate" }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}