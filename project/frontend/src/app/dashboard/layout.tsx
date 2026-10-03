"use client";

import { useEffect, useState } from "react";
import { TopAppBar } from "@/components/TopAppBar";
import { IconRail } from "@/components/IconRail";
import { authApi } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only used to decide whether the Admin icon should render — every page
  // below still fetches whatever data it actually needs on its own.
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    authApi
      .me()
      .then((me) => setRole(me?.role))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background md:flex">
      <IconRail role={role} />

      <div className="flex-1 min-w-0">
        <TopAppBar role={role} />
        <main className="pb-8 pt-32 md:pt-10 md:pb-10 px-container-padding-mobile md:px-12 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}