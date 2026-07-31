"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Calendar, PencilLine } from "lucide-react";
import { ScorredWordmark } from "@/components/ui";
import { useUnread } from "@/components/useUnread";
import { hideAppBar } from "@/lib/mobileChrome";

/**
 * Mobile top chrome (design_v7 Chrome.jsx AppBar — R-03 / DV7-04).
 *
 * Order: [create·red] [search] — wordmark/title — [events] [activity•]
 *
 * Two v7 changes land here:
 *  - **Create is the only coloured control in the header** — a filled stamp-red square
 *    instead of a grey icon. It's the primary action, and on the web it's the ONLY
 *    compose entry point on mobile (v7's home composer bar was never ported, and v7
 *    itself removed it in this pass).
 *  - **Messages merged into Activity.** One bell, one badge = DMs + notifications; the
 *    Activity screen splits them into segments. `/inbox` stays routable for deep links
 *    and keeps its own desktop Sidebar entry.
 *
 * Shown only below `lg`; desktop keeps the 245px Sidebar (DELIBERATE WEB DEVIATION,
 * WEB_UI_GUIDELINES §2 — the AppBar is mobile-only chrome).
 * Sticky, --paper, with a safe-area-inset-top pad for notch/standalone (R-04).
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
      className="relative flex items-center justify-center w-10 h-11 rounded-xl text-[var(--ink)] active:bg-[var(--bone)]"
    >
      <Icon size={20} strokeWidth={1.9} />
      {badge ? (
        <span className="absolute top-1 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--stamp-red)] text-white text-[9px] font-bold font-mono flex items-center justify-center border-[1.5px] border-[var(--paper)]">
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
  // One badge for the merged inbox — DMs + activity, hidden at zero (DV7-05).
  const activityBadge = unread.msgs + unread.notifs;
  return (
    <header
      className="lg:hidden sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--border)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-1.5 px-3" style={{ minHeight: 52 }}>
        {/* Create + Search — top left */}
        <Link
          href="/compose"
          aria-label="Create post"
          className="flex items-center justify-center shrink-0 text-white"
          style={{
            width: 40, height: 40, borderRadius: 12, border: "none",
            background: "var(--stamp-red)", boxShadow: "0 2px 8px rgba(199,42,42,0.28)",
          }}
        >
          <PencilLine size={18} strokeWidth={2} />
        </Link>
        <IconBtn href="/search" label="Search" icon={Search} />

        {/* Wordmark — center */}
        <Link href="/feed" className="flex-1 flex items-center justify-center min-w-0 overflow-hidden" aria-label="Home">
          <ScorredWordmark fontSize={19} />
        </Link>

        {/* Events + Activity — top right. Events lives here on mobile only (v7 gave its
            bottom-nav slot to Explore); desktop keeps it in the Sidebar. */}
        <IconBtn href="/events" label="Events" icon={Calendar} />
        <IconBtn href="/notifications" label="Activity" icon={Bell} badge={activityBadge || undefined} />
      </div>
    </header>
  );
}
