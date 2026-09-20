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
 *    EVERY tab root gets one now, each with its own target (v8 Sep-20 drop — reverses
 *    v7's Home-only rule: Market/Community/Database/ProfileView all pass an identical
 *    40×40 radius-12 red plus through `leading`). `leading` is a prop in the prototype
 *    because its AppBar is per-screen; this one is global chrome, so the per-tab target
 *    lives in CREATE_ACTIONS keyed by route:
 *      /feed      → compose a post
 *      /market    → /add/catalogue        (v8 'add-listing' — the add/list-for-sale form)
 *      /db        → /db?add=1             (v8 'add-to-db'; the db page opens its
 *                                          ContributeGuidelines gate on the flag — the
 *                                          rules must land before the contribute form)
 *      /community → /community/new        (v8 'create-community')
 *      /profile   → /db                   (v8 'add-item' = AddToCollection's search-the-
 *                                          catalogue-first screen; DV7-01 mapped that
 *                                          entry to the Database tab)
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

// v8 Sep-20 — the leading red plus is per-tab now, not Home-only. Same button,
// different verb per surface (see the header comment for the v8 route mapping).
const CREATE_ACTIONS: Record<string, { href: string; label: string }> = {
  "/feed": { href: "/compose?type=post", label: "Create post" },
  "/market": { href: "/add/catalogue", label: "Create listing" },
  "/db": { href: "/db?add=1", label: "Add item" },
  "/community": { href: "/community/new", label: "Create community" },
  "/profile": { href: "/db", label: "Add item" },
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
  // v8 IconButton.jsx — 40px square, radius 13, 1px --border outline, red
  // focus-visible ring; badge sits at -3/-3 with a 1.5px paper ring.
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex items-center justify-center w-10 h-10 text-[var(--ink)] active:bg-[var(--bone)] outline-none focus-visible:shadow-[0_0_0_3px_rgba(255,36,66,0.30)]"
      style={{ borderRadius: 13, border: "1px solid var(--border)" }}
    >
      <Icon size={20} strokeWidth={1.9} />
      {badge ? (
        <span
          className="absolute min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--stamp-red)] text-white text-[10px] font-bold font-mono flex items-center justify-center border-[1.5px] border-[var(--paper)]"
          style={{ top: -3, right: -3 }}
        >
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
  const create = CREATE_ACTIONS[pathname];
  // Notifications only — DMs are badged on My Space (v7, 2026-08-09). Hidden at zero.
  const activityBadge = unread.notifs;

  return (
    <header
      className="lg:hidden sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--border)]"
      style={{ paddingTop: "env(safe-area-inset-top)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-1.5 px-3" style={{ minHeight: 52 }}>
        {/* Create + Search — top left. Every tab root carries its own create verb (v8 Sep-20). */}
        {create && (
          <Link
            href={create.href}
            aria-label={create.label}
            className="flex items-center justify-center shrink-0 text-white outline-none shadow-[0_2px_8px_rgba(199,42,42,0.28)] focus-visible:shadow-[0_0_0_3px_rgba(255,36,66,0.30)]"
            style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "var(--stamp-red)" }}
          >
            <Plus size={20} strokeWidth={2.4} />
          </Link>
        )}
        <IconBtn href="/search" label="Search" icon={Search} />

        {/* Wordmark (Home) or screen title — centred, ellipsised */}
        <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
          {/* v8 Chrome.jsx AppBar — wordmark 22, title 24/800 */}
          {isHome ? (
            <Link href="/feed" className="flex items-center min-w-0" aria-label="Home">
              <ScorredWordmark fontSize={22} />
            </Link>
          ) : (
            <h1
              className="truncate"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "var(--ink)", margin: 0 }}
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
