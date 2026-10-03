"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { bottomNavItems } from "@/lib/nav-config";

interface TopTabBarProps {
  onMoreClick: () => void;
}

export function TopTabBar({ onMoreClick }: TopTabBarProps) {
  const pathname = usePathname();
  // Reuse the same short list as before, minus Profile (that lives under More).
  const tabs = bottomNavItems.filter((item) => item.name !== "Profile");

  return (
    <div className="md:hidden fixed top-20 left-0 w-full z-40 bg-surface border-b border-border">
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto hide-scrollbar">
        {tabs.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium text-on-surface-variant"
        >
          <Menu className="w-3.5 h-3.5" />
          More
        </button>
      </div>
    </div>
  );
}