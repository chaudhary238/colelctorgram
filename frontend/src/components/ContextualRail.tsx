"use client";

/* Contextual right rail — mounted once in app/(app)/layout.tsx so it appears on
 * every page (replaces the feed-only RightRail). Fixed skeleton: the viewer's
 * rank card is always slot 1, slots 2–3 swap per route (ROUTE_WIDGETS), footer
 * last. Widgets that come back empty render nothing rather than a hollow card. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { Avatar, Money, ProductPhoto } from "@/components/ui";
import { ApiCommunity, ApiEvent, ApiListing } from "@/components/cards";
import {
  RewardCard, EarnRow, type LbRow, type Standing, type EarnAction,
} from "@/components/gamification";

/* Focused flows where a rail would compete with the task at hand. */
const HIDDEN_PREFIXES = ["/compose", "/add", "/chat"];

type WidgetId =
  | "top_collectors" | "next_event" | "watchlist" | "trending_tags"
  | "communities" | "suggested" | "my_events" | "ways_to_earn";

/* First prefix match wins; anything unmatched gets DEFAULT_WIDGETS. */
const ROUTE_WIDGETS: [string, WidgetId[]][] = [
  ["/feed",        ["top_collectors", "next_event"]],
  ["/market",      ["watchlist", "trending_tags"]],
  ["/listing",     ["watchlist", "trending_tags"]],
  ["/community",   ["communities", "suggested"]],
  ["/events",      ["my_events", "suggested"]],
  ["/profile",     ["ways_to_earn", "suggested"]],
  ["/rewards",     ["top_collectors", "next_event"]],
  ["/leaderboard", ["ways_to_earn", "next_event"]],
];
const DEFAULT_WIDGETS: WidgetId[] = ["suggested", "trending_tags"];

const fmt = (n: number) => n.toLocaleString("en-IN");

export function ContextualRail() {
  const pathname = usePathname();
  const { user } = useUser();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const widgets =
    ROUTE_WIDGETS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? DEFAULT_WIDGETS;

  const displayName = user?.name ?? "You";
  const displayHandle = user?.handle ?? "…";

  return (
    <aside className="w-80 shrink-0" style={{ paddingTop: 28, paddingBottom: 32, boxSizing: "border-box" }}>
      {/* slot 1 — always the viewer: who am I + where's my rank */}
      <Link href="/profile" className="flex items-center gap-[13px] w-full px-1">
        <Avatar name={displayName} color="var(--ink)" size={50} photo={user?.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--ink)] truncate">@{displayHandle}</div>
          <div className="text-[13px] text-[var(--ink-faint)] truncate capitalize">
            {displayName} · {user?.tier ?? "collector"}
          </div>
        </div>
      </Link>
      {user?.handle && <RewardCard handle={user.handle} isMe />}

      {/* slots 2–3 — page-aware */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
        {widgets.map((id) => {
          const W = WIDGET_MAP[id];
          return <W key={id} />;
        })}
      </div>

      <div className="px-1.5 pt-6 text-[11.5px] text-[var(--ink-ghost)]" style={{ lineHeight: 1.7 }}>
        About · Help · Press · API · Communities · Events · Privacy · Terms
        <br />
        <span style={{ letterSpacing: "0.04em" }}>© 2026 Scorred</span>
      </div>
    </aside>
  );
}

/* ── Shared widget shell ─────────────────────────────────────────── */

function Widget({ title, href, linkLabel, children }: {
  title: string; href?: string; linkLabel?: string; children: React.ReactNode;
}) {
  return (
    <section style={{ border: "1px solid var(--border)", background: "var(--paper-soft)", borderRadius: 16, padding: "13px 15px 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{title}</span>
        {href && (
          <Link href={href} className="hover:underline" style={{ fontSize: 11.5, fontWeight: 650, color: "var(--rose-tint-text)", whiteSpace: "nowrap" }}>
            {linkLabel ?? "See all"} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const rowDivider = { borderTop: "1px solid var(--border)" } as const;

/* ── Top collectors this week (feed, rewards) ────────────────────── */

function TopCollectorsWidget() {
  const [rows, setRows] = useState<LbRow[] | null>(null);
  useEffect(() => {
    api.get<{ rows: LbRow[]; me: Standing | null }>("/rewards/leaderboard?period=week")
      .then((b) => setRows(b.rows.slice(0, 3)))
      .catch(() => setRows([]));
  }, []);
  if (!rows?.length) return null;
  return (
    <Widget title="Top collectors this week" href="/leaderboard" linkLabel="Leaderboard">
      {rows.map((r, i) => (
        <Link key={r.key} href={`/profile/${r.handle}`}
          className="flex items-center gap-2.5 py-[7px]" style={i > 0 ? rowDivider : undefined}>
          <span style={{ width: 20, textAlign: "center", fontSize: 15, flexShrink: 0 }}>{["🥇", "🥈", "🥉"][i]}</span>
          <Avatar name={r.name} size={28} photo={r.avatar_url} />
          <span className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{r.is_me ? "You" : `@${r.handle}`}</span>
          <span style={{ marginLeft: "auto", flexShrink: 0, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--grail-gold-deep)" }}>
            +{fmt(r.points)}
          </span>
        </Link>
      ))}
    </Widget>
  );
}

/* ── Upcoming events (feed, rewards, leaderboard) ────────────────── */

function EventRow({ e, divider }: { e: ApiEvent; divider?: boolean }) {
  const d = new Date(e.starts_at);
  const mo = d.toLocaleString("en", { month: "short" }).toUpperCase();
  const going = e.going_count ?? 0;
  return (
    <Link href={`/events/${e.id}`} className="flex items-center gap-3 py-[7px]" style={divider ? rowDivider : undefined}>
      <span style={{ width: 44, flexShrink: 0, borderRadius: 10, textAlign: "center", padding: "5px 0", background: "var(--rose-tint-bg)", color: "var(--rose-tint-text)" }}>
        <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em" }}>{mo}</span>
        <span style={{ display: "block", fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{d.getDate()}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold text-[var(--ink)]" style={{ lineHeight: 1.3 }}>{e.title}</span>
        <span className="block truncate text-xs text-[var(--ink-faint)]">
          {e.mode === "online" ? "Online" : e.city ?? "TBA"}{going > 0 ? ` · ${going} going` : ""}
        </span>
      </span>
    </Link>
  );
}

function NextEventWidget() {
  const [events, setEvents] = useState<ApiEvent[] | null>(null);
  useEffect(() => {
    api.get<ApiEvent[]>("/events?limit=2").then(setEvents).catch(() => setEvents([]));
  }, []);
  if (!events?.length) return null;
  return (
    <Widget title="Upcoming events" href="/events" linkLabel="All events">
      {events.map((e, i) => <EventRow key={e.id} e={e} divider={i > 0} />)}
    </Widget>
  );
}

/* ── Your RSVPs (events page) ────────────────────────────────────── */

function MyEventsWidget() {
  const [events, setEvents] = useState<ApiEvent[] | null>(null);
  useEffect(() => {
    api.get<ApiEvent[]>("/events?scope=mine&limit=2").then(setEvents).catch(() => setEvents([]));
  }, []);
  if (!events?.length) return null;
  return (
    <Widget title="You’re going">
      {events.map((e, i) => <EventRow key={e.id} e={e} divider={i > 0} />)}
    </Widget>
  );
}

/* ── Watchlist (market, listing detail) ──────────────────────────── */

function WatchlistWidget() {
  const [items, setItems] = useState<ApiListing[] | null>(null);
  useEffect(() => {
    api.get<{ items: ApiListing[] }>("/listings?saved=true&limit=3")
      .then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);
  if (!items?.length) return null;
  return (
    <Widget title="Your watchlist" href="/saved" linkLabel="Stash">
      {items.map((l, i) => (
        <Link key={l.id} href={`/listing/${l.id}`} className="flex items-center gap-3 py-[7px]" style={i > 0 ? rowDivider : undefined}>
          <span style={{ width: 38, flexShrink: 0 }}>
            <ProductPhoto tone="ink" src={l.cover_url} ratio="1/1" rounded={8} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-[var(--ink)]" style={{ lineHeight: 1.3 }}>{l.title}</span>
            <span className="block text-xs text-[var(--ink)]">
              <Money value={Math.round(l.price / 100)} currency={l.currency ?? "₹"} size={12} />
              {l.watching_count > 0 && <span style={{ color: "var(--ink-faint)" }}> · {l.watching_count} watching</span>}
            </span>
          </span>
        </Link>
      ))}
    </Widget>
  );
}

/* ── Trending tags (market, default) ─────────────────────────────── */

function TrendingTagsWidget() {
  const [tags, setTags] = useState<string[] | null>(null);
  useEffect(() => {
    api.get<{ tags: string[] }>("/feed/tags").then((d) => setTags(d.tags.slice(0, 6))).catch(() => setTags([]));
  }, []);
  if (!tags?.length) return null;
  return (
    <Widget title="Trending tags">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {tags.map((t, i) => {
          const label = t.startsWith("#") ? t : `#${t}`; // /feed/tags terms already carry "#"
          return (
            <Link key={t} href={`/search?q=${encodeURIComponent(label)}`}
              style={{
                borderRadius: 999, padding: "5px 11px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
                background: i === 0 ? "var(--rose-tint-bg)" : "var(--paper)",
                color: i === 0 ? "var(--rose-tint-text)" : "var(--ink-mute)",
                border: `1px solid ${i === 0 ? "var(--rose-tint-border)" : "var(--border)"}`,
              }}>
              {label}
            </Link>
          );
        })}
      </div>
    </Widget>
  );
}

/* ── Communities for you (community page) ────────────────────────── */

function CommunitiesWidget() {
  const [comms, setComms] = useState<ApiCommunity[] | null>(null);
  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((all) => setComms(
        all.filter((c) => !c.is_member)
          .sort((a, b) => b.member_count - a.member_count)
          .slice(0, 3)
      ))
      .catch(() => setComms([]));
  }, []);
  if (!comms?.length) return null;
  return (
    <Widget title="Communities for you" href="/community" linkLabel="Browse">
      {comms.map((c, i) => {
        const tone = c.tone || "plum";
        const toneVar = tone.startsWith("var(--") ? tone : `var(--${tone})`;
        return (
          <Link key={c.id} href={`/community/${c.id}`} className="flex items-center gap-2.5 py-[7px]" style={i > 0 ? rowDivider : undefined}>
            <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: toneVar, color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
              {c.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold text-[var(--ink)]">{c.name}</span>
              <span className="block truncate text-xs text-[var(--ink-faint)]">{fmt(c.member_count)} members</span>
            </span>
          </Link>
        );
      })}
    </Widget>
  );
}

/* ── Suggested collectors (community, events, profile, default) ──── */

interface SuggestedUser {
  id: string; handle: string; name: string; tier: string;
  followers_count: number; verified_items_count: number;
}

function SuggestedRow({ u, divider }: { u: SuggestedUser; divider?: boolean }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleFollow() {
    if (busy) return;
    const next = !following;
    setFollowing(next); // optimistic
    setBusy(true);
    try {
      if (next) await api.post(`/users/${u.handle}/follow`);
      else await api.delete(`/users/${u.handle}/follow`);
    } catch {
      setFollowing(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5 py-[7px]" style={divider ? rowDivider : undefined}>
      <Link href={`/profile/${u.handle}`} className="shrink-0">
        <Avatar name={u.name} size={36} verified={u.verified_items_count > 10} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${u.handle}`} className="block truncate text-[13.5px] font-semibold text-[var(--ink)] hover:underline">
          @{u.handle}
        </Link>
        <div className="truncate text-xs text-[var(--ink-faint)] capitalize">
          {u.tier} · {u.followers_count.toLocaleString()} followers
        </div>
      </div>
      <button onClick={toggleFollow} disabled={busy} className="shrink-0 font-bold text-[12.5px]"
        style={{ color: following ? "var(--ink-faint)" : "var(--stamp-red)", cursor: busy ? "default" : "pointer" }}>
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function SuggestedWidget() {
  const [users, setUsers] = useState<SuggestedUser[] | null>(null);
  useEffect(() => {
    api.get<{ items: SuggestedUser[] }>("/users/me/suggested?limit=4")
      .then((d) => setUsers(Array.isArray(d) ? d : d.items ?? []))
      .catch(() => setUsers([]));
  }, []);
  if (!users?.length) return null;
  return (
    <Widget title="Suggested collectors" href="/search" linkLabel="Search">
      {users.map((u, i) => <SuggestedRow key={u.handle} u={u} divider={i > 0} />)}
    </Widget>
  );
}

/* ── Ways to earn (profile, leaderboard) ─────────────────────────── */

interface RewardsLite { earn_actions: EarnAction[] }

const EARN_LINK: Record<string, string> = {
  refer: "/refer", profile: "/profile", db_new: "/add/catalogue",
  showcase: "/compose?type=post", review: "/compose?type=review",
  rsvp: "/events", comment: "/feed", like: "/feed", vouch: "/search",
};

function EarnWidget() {
  const router = useRouter();
  const [actions, setActions] = useState<EarnAction[] | null>(null);
  useEffect(() => {
    api.get<RewardsLite>("/rewards/me")
      .then((d) => setActions(d.earn_actions.slice(0, 3)))
      .catch(() => setActions([]));
  }, []);
  if (!actions?.length) return null;
  return (
    <Widget title="Ways to earn" href="/rewards" linkLabel="Rewards">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((a) => (
          <EarnRow key={a.id} action={a} onClick={EARN_LINK[a.id] ? () => router.push(EARN_LINK[a.id]) : undefined} />
        ))}
      </div>
    </Widget>
  );
}

const WIDGET_MAP: Record<WidgetId, () => React.ReactElement | null> = {
  top_collectors: TopCollectorsWidget,
  next_event: NextEventWidget,
  watchlist: WatchlistWidget,
  trending_tags: TrendingTagsWidget,
  communities: CommunitiesWidget,
  suggested: SuggestedWidget,
  my_events: MyEventsWidget,
  ways_to_earn: EarnWidget,
};
