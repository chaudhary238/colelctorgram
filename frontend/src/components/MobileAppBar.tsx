"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, MessageSquare, PlusCircle } from "lucide-react";
import { ScorredWordmark } from "@/components/ui";
import { useUnread } from "@/components/useUnread";
import { hideAppBar } from "@/lib/mobileChrome";

/**
 * Mobile top chrome (design_v6 Chrome.jsx AppBar — R-03).
 * Ported for web: Create (left) · Wordmark (center) · Search + Messages + Bell (right).
 * Sticky, --paper, with a safe-area-inset-top pad for notch/standalone (R-04).
 * Shown only below `lg`; desktop keeps the 245px Sidebar (DELIBERATE WEB DEVIATION,
 * WEB_UI_GUIDELINES §2 — the AppBar is mobile-only chrome).
 */
function IconBtn({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex items-center justify-center w-11 h-11 rounded-xl text-[var(--ink)] active:bg-[var(--bone)]"
    >
      <Icon size={22} strokeWidth={1.9} />
      {badge ? (
        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--stamp-red)] text-white text-[9px] font-bold font-mono flex items-center justify-center border-[1.5px] border-[var(--paper)]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function MobileAppBar() {
  const pathname = usePathname();
  const unread = useUnread();
  if (hideAppBar(pathname)) return null;
  return (
    <header
      className="lg:hidden sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--border)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-1 px-3" style={{ minHeight: 52 }}>
        {/* Create — top left */}
        <IconBtn href="/compose" label="Add" icon={PlusCircle} />

        {/* Wordmark — center */}
        <Link href="/feed" className="flex-1 flex items-center justify-center min-w-0" aria-label="Home">
          <ScorredWordmark fontSize={19} />
        </Link>

        {/* Search + Messages + Bell — top right */}
        <IconBtn href="/search" label="Search" icon={Search} />
        <IconBtn href="/inbox" label="Messages" icon={MessageSquare} badge={unread.msgs || undefined} />
        <IconBtn href="/notifications" label="Notifications" icon={Bell} badge={unread.notifs || undefined} />
      </div>
    </header>
  );
}
