"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, ShoppingBag, Users, Calendar, LayoutGrid,
  Bell, Plus, Settings, User, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SealMark, ScorredWordmark } from "@/components/ui";
import { useUnread } from "@/components/useUnread";

// Desktop nav. DV7-04/05/06 apply here too — the handoff is written against the mobile
// AppBar, but "one Activity inbox" and "Create is the only coloured control" are product
// decisions, not viewport tricks. Leaving the sidebar on the old shape meant desktop had
// two Messages entry points and a half-merged inbox (caught in QA 2026-08-01).
// NOTE design_v7 web/Web.jsx was NOT re-synced in this batch — it still lists "Database"
// and a separate bell, so it is STALE here, not a contrary decision. Follow the handoff.
//   • Messages row REMOVED — merged into "Activity" (badge = msgs + notifs), which opens
//     /notifications where the Messages segment lives. /inbox stays routed for deep links
//     (chat back button, listing/post "message seller" fallbacks).
//   • Create is a PLAIN row here, styled exactly like Search (founder call 2026-08-01 — a
//     filled red row read as an ad against a quiet vertical list). The "only coloured
//     control" rule stays where the handoff put it: the mobile header, where Create has to
//     win against four grey icons on one line. The GLYPH is a plus, not a pencil — Create
//     is the same "add" verb as every other add affordance. `?type=post` opens the composer
//     straight on the four post types (the Post-vs-Add-item chooser no longer exists).
// badgeKey wires a live unread count (DF-38), not a hardcoded number.
type NavDef = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badgeKey?: "msgs" | "notifs" | "activity";
};
const NAV: NavDef[] = [
  { href: "/feed",          label: "Home",          icon: Home },
  { href: "/search",        label: "Search",        icon: Search },
  { href: "/compose?type=post", label: "Create",    icon: Plus },
  { href: "/market",        label: "Market",        icon: ShoppingBag },
  { href: "/community",     label: "Community",     icon: Users },
  // DV7-02 — the Scorred DB gets its own destination, slotted after Community exactly as
  // design_v7 web/Web.jsx orders it. v7 wanted it renamed "Explore" with a global search;
  // the founder reverted both on 2026-08-01 — it's the Database, and it searches items
  // only (global search is the Search row above). Events KEEPS its sidebar slot;
  // only the mobile bottom nav traded Events out (founder call 2026-07-30).
  { href: "/db",            label: "Database",      icon: LayoutGrid },
  { href: "/events",        label: "Events",        icon: Calendar },
  { href: "/notifications", label: "Activity",      icon: Bell,       badgeKey: "activity" as const },
  { href: "/saved",         label: "Stash",         icon: Bookmark },
  { href: "/profile",       label: "My Space",      icon: User },
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
  const unread = useUnread();
  const items = NAV;
  // DV7-05 — the merged inbox counts both, same as the mobile bell.
  const badgeFor = (key: NavDef["badgeKey"]) =>
    (key === "activity" ? unread.msgs + unread.notifs : key ? unread[key] : 0) || undefined;

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
        <span className="ch-brand-seal">
          <SealMark size={30} />
        </span>
        <span className="ch-nav-label">
          <ScorredWordmark fontSize={20} />
        </span>
      </Link>

      <div className="flex flex-col gap-1 flex-1">
        {items.map(({ href, label, icon, badgeKey }) => {
          // Compare against the path only — Create carries a ?type= query (DV7-04).
          const path = href.split("?")[0];
          return (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              badge={badgeFor(badgeKey)}
              active={pathname === path || (path !== "/" && pathname.startsWith(path))}
            />
          );
        })}
      </div>

      <NavItem href="/settings" label="Settings" icon={Settings} />
    </nav>
  );
}
