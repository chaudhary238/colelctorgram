"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Calendar, Plus } from "lucide-react";
import { ScorredWordmark } from "@/components/ui";
import { useUnread } from "@/components/useUnread";
import { hideAppBar } from "@/lib/mobileChrome";

/**
 * Mobile top chrome (design_v7 Chrome.jsx AppBar — R-03 / DV7-04).
 *
 * Order: [create·red] [search] — wordmark/title — [events] [activity•]
 *
 *  - **Create is the only coloured control** — a filled stamp-red square, not a grey icon.
 *    Its glyph is a PLUS, not a pencil: everything else that creates something in this app
 *    (Add item, Add choice, Add a copy) is a plus, and Create is the same "add" verb.
 *    It renders on HOME ONLY: v7 passes it through `leading`, and `FeedView.jsx` is the
 *    single caller (`grep '<AppBar' design_v7/app` — Market/Community/Database/Profile all
 *    call `<AppBar title="…"/>` with no leading). Every other tab's left cluster is just
 *    Search. `leading` is a prop in the prototype because its AppBar is per-screen; this
 *    one is global chrome, so the same rule is expressed as a route check.
 *  - **Centre is wordmark OR title** — the wordmark is Home's identity; the other four tab
 *    roots name themselves. (v7 said "Screen title → Explore"; the founder reverted both the
 *    tab name AND its global search on 2026-08-01. Search across posts/people/communities/
 *    events lives behind THIS bar's search icon at `/search`; `/db` searches items only.)
 *  - **Messages merged into Activity.** One bell opening one screen, which splits into
 *    Activity / Messages segments. Its BADGE counts notifications only — design_v7's
 *    2026-08-09 batch changed `Chrome.jsx` from `badge={unread + msgUnread}` to
 *    `badge={unread}` in the same pass that gave My Space its own Messages button with
 *    the DM count on it. Unread DMs are surfaced there now, not here. `/inbox` stays
 *    routable for deep links (chat back button, "message seller" fallbacks).
 *
 * Shown only below `lg`; desktop keeps the 245px Sidebar (DELIBERATE WEB DEVIATION,
 * WEB_UI_GUIDELINES §2 — the AppBar is mobile-only chrome). Sticky, --paper, with a
 * safe-area-inset-top pad for notch/standalone (R-04).
 */

// The four tab roots that name themselves. /feed shows the wordmark instead.
const TAB_TITLES: Record<string, string> = {
  "/market": "Market",
  "/db": "Database",
  "/community": "Community",
  "/profile": "My Space",
};

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
  const title = TAB_TITLES[pathname];
  const isHome = !title;
  // Notifications only — DMs are badged on My Space (v7, 2026-08-09). Hidden at zero.
  const activityBadge = unread.notifs;

  return (
    <header
      className="lg:hidden sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--border)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-1.5 px-3" style={{ minHeight: 52 }}>
        {/* Create + Search — top left. Create is Home-only (v7 `leading`). */}
        {isHome && (
          <Link
            href="/compose?type=post"
            aria-label="Create post"
            className="flex items-center justify-center shrink-0 text-white"
            style={{
              width: 40, height: 40, borderRadius: 12, border: "none",
              background: "var(--stamp-red)", boxShadow: "0 2px 8px rgba(199,42,42,0.28)",
            }}
          >
            <Plus size={20} strokeWidth={2.4} />
          </Link>
        )}
        <IconBtn href="/search" label="Search" icon={Search} />

        {/* Wordmark (Home) or screen title — centred, ellipsised */}
        <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
          {isHome ? (
            <Link href="/feed" className="flex items-center min-w-0" aria-label="Home">
              <ScorredWordmark fontSize={19} />
            </Link>
          ) : (
            <h1
              className="truncate"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.03em", color: "var(--ink)", margin: 0 }}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Events + Activity — top right. Events lives here on mobile only (v7 gave its
            bottom-nav slot to the Database); desktop keeps it in the Sidebar. */}
        <IconBtn href="/events" label="Events" icon={Calendar} />
        <IconBtn href="/notifications" label="Activity" icon={Bell} badge={activityBadge || undefined} />
      </div>
    </header>
  );
}
