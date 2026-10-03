"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { TopTabBar } from "@/components/TopTabBar";

interface TopAppBarProps {
  role?: string;
}

export function TopAppBar({ role }: TopAppBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="md:hidden fixed top-0 w-full z-50 bg-surface border-b border-border flex items-center justify-between px-container-padding-mobile h-20 left-0">
        <Link
          href="/dashboard"
          className="text-headline-lg-mobile font-bold tracking-tight text-on-surface"
        >
          FitSense AI
        </Link>

        <Link
          href="/dashboard/shopping"
          className="text-on-surface hover:bg-secondary-container/50 transition-colors rounded-full p-2 active:scale-95 duration-200"
          aria-label="Shopping"
        >
          <ShoppingBag className="w-6 h-6" />
        </Link>
      </header>

      <TopTabBar onMoreClick={() => setDrawerOpen(true)} />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} role={role} />
    </>
  );
}