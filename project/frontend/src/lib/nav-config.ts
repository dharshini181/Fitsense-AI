import {
  LayoutDashboard,
  Sparkles,
  Shirt,
  CalendarDays,
  ShoppingBag,
  BarChart3,
  Plane,
  UserCircle2,
  SlidersHorizontal,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Only shown to users whose role matches (defaults to everyone). */
  requiresRole?: "admin";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Primary flows — what most users touch every day.
const mainGroup: NavGroup = {
  label: "Main",
  items: [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Stylist", href: "/dashboard/stylist", icon: Sparkles },
    { name: "My Wardrobe", href: "/dashboard/wardrobe", icon: Shirt },
    { name: "Planner", href: "/dashboard/planner", icon: CalendarDays },
  ],
};

// Supporting tools — used less often, but still first-class features.
const toolsGroup: NavGroup = {
  label: "Tools",
  items: [
    { name: "Before You Buy", href: "/dashboard/shopping", icon: ShoppingBag },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Travel Packing", href: "/dashboard/travel", icon: Plane },
    { name: "My Style", href: "/dashboard/analysis", icon: UserCircle2 },
  ],
};

// Account-level settings, plus admin (only rendered for admins).
const accountGroup: NavGroup = {
  label: "Account",
  items: [
    { name: "Personalization", href: "/dashboard/personalization", icon: SlidersHorizontal },
    { name: "Profile", href: "/dashboard/settings", icon: Settings },
    { name: "Admin", href: "/dashboard/admin", icon: ShieldCheck, requiresRole: "admin" },
  ],
};

export const navGroups: NavGroup[] = [mainGroup, toolsGroup, accountGroup];

// A short, fixed set for the mobile bottom bar — the four things people
// reach for constantly, plus their profile.
export const bottomNavItems: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Stylist", href: "/dashboard/stylist", icon: Sparkles },
  { name: "Wardrobe", href: "/dashboard/wardrobe", icon: Shirt },
  { name: "Planner", href: "/dashboard/planner", icon: CalendarDays },
  { name: "Profile", href: "/dashboard/settings", icon: Settings },
];

export function visibleNavGroups(role?: string): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requiresRole || item.requiresRole === role),
    }))
    .filter((group) => group.items.length > 0);
}