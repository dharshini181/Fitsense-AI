"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { visibleNavGroups } from "@/lib/nav-config";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  role?: string;
}

export function MobileNavDrawer({ open, onClose, role }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const groups = visibleNavGroups(role);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 left-0 h-full w-[80%] max-w-xs bg-surface z-[70] md:hidden flex flex-col overflow-y-auto hide-scrollbar"
          >
            <div className="flex items-center justify-between px-5 h-20 shrink-0 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Image src="/logo/fitsense-logo.png" alt="" width={26} height={26} className="rounded-md" />
                <span className="font-display text-lg font-medium tracking-tight text-on-surface">
                  FitSense AI
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="text-on-surface p-2 rounded-full hover:bg-[#595800]/6 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-5 space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-2 text-caption font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                            isActive
                              ? "bg-primary-container text-on-primary-container"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-[#595800]/6"
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0" />
                          <span className="text-body-md font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}