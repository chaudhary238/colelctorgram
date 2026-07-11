"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, Search, ShoppingBag, Users, Calendar,
  Bell, PlusCircle, Settings, User, MessageSquare, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SealMark, ScorredWordmark } from "@/components/ui";
import { api } from "@/lib/api";

// Order mirrors the DF-12 header: create+search cluster up top (mobile top-left),
// Messages paired directly with Notifications (mobile top-right: message btn + bell).
// badgeKey wires a live unread count (DF-38) instead of a hardcoded number.
type NavDef = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badgeKey?: "msgs" | "notifs";
};
const NAV: NavDef[] = [
  { href: "/feed",          label: "Home",          icon: Home },
  { href: "/search",        label: "Search",        icon: Search },
  { href: "/compose",       label: "Create",        icon: PlusCircle },
  { href: "/market",        label: "Market",        icon: ShoppingBag },
  { href: "/community",     label: "Community",     icon: Users },
  { href: "/events",        label: "Events",        icon: Calendar },
  { href: "/inbox",         label: "Messages",      icon: MessageSquare, badgeKey: "msgs" as const },
  { href: "/notifications", label: "Notifications", icon: Bell,       badgeKey: "notifs" as const },
  { href: "/saved",         label: "Stash",         icon: Bookmark },
  { href: "/profile",       label: "Profile",       icon: User },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-xl px-3 py-[11px] transition-colors duration-100 group",
        "text-[var(--ink)] hover:bg-[var(--bone)]",
        active && "font-semibold"
      )}
    >
      <span className="relative shrink-0">
        <Icon size={25} strokeWidth={active ? 2.4 : 1.8} />
        {badge ? (
          <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--stamp-red)] text-white text-[10px] font-bold font-mono flex items-center justify-center border-[1.5px] border-[var(--paper)]">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="ch-nav-label text-base leading-none whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  // Live unread counts (DF-38) — replaces the old hardcoded badge:3.
  const [unread, setUnread] = useState<{ msgs: number; notifs: number }>({ msgs: 0, notifs: 0 });
  useEffect(() => {
    Promise.all([
      api.get<{ unread: number }[]>("/threads").catch(() => []),
      api.get<{ is_read: boolean }[]>("/notifications").catch(() => []),
    ]).then(([threads, notifs]) => {
      setUnread({
        msgs: threads.reduce((s, t) => s + (t.unread || 0), 0),
        notifs: notifs.filter((n) => !n.is_read).length,
      });
    });
  }, [pathname]);
  const items = NAV;

  return (
    <nav
      className="ch-sidebar shrink-0 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--paper)] py-6 px-3.5"
      style={{ width: 245 }}
    >
      {/* Wordmark */}
      <Link
        href="/feed"
        className="flex items-center gap-2.5 px-3 pt-1.5 pb-1 mb-[22px]"
      >
        <SealMark size={30} />
        <span className="ch-nav-label">
          <ScorredWordmark fontSize={20} />
        </span>
      </Link>

      <div className="flex flex-col gap-1 flex-1">
        {items.map(({ href, label, icon, badgeKey }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            badge={badgeKey ? unread[badgeKey] || undefined : undefined}
            active={pathname === href || (href !== "/" && pathname.startsWith(href))}
          />
        ))}
      </div>

      <NavItem href="/settings" label="Settings" icon={Settings} />
    </nav>
  );
}
