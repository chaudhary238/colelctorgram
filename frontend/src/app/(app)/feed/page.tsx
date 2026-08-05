"use client";

// Home feed — tabs: For You · Explore · Following.
//
// QA 2026-08-04 (DV7-09):
//  1. The hashtag pill slider under the tabs is GONE. It filtered the stream server-side
//     (`?tag=`) off a curated /feed/tags list; v7's FeedView has no such row and the founder
//     cut it. Hashtags are still rendered on each post and still link to /search.
//  2. The For You tab's LEADING icon is the settings/sliders glyph, and that is the only
//     icon on it — the house glyph and the trailing caret are both gone. The control is
//     unchanged: tap For You while it's active to open the Customize-feed popover.
//     Tried and rejected in QA: a standalone sliders button beside the tab group, and
//     keeping the house icon with a sliders glyph trailing the label.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Globe, SlidersHorizontal, UserPlus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useUser, AuthUser } from "@/lib/auth-context";
import { PostCard, ListingFeedCard, FeedEventCard, ApiPost, ApiListing, ApiEvent } from "@/components/cards";
import { cn } from "@/lib/utils";
import { ADD_CATEGORIES } from "@/lib/catalog";
import { MAX_SNAPSHOT_POSTS, readFeedSnapshot, writeFeedSnapshot } from "@/lib/feedSnapshot";

type StreamItem =
  | { t: "post"; key: string; data: ApiPost }
  | { t: "listing"; key: string; data: ApiListing }
  | { t: "event"; key: string; data: ApiEvent };

const TABS = [
  { id: "foryou", label: "For You", icon: SlidersHorizontal },
  { id: "explore", label: "Explore", icon: Globe },
  { id: "following", label: "Following", icon: UserPlus },
] as const;

type Tab = (typeof TABS)[number]["id"];

// v4 order (CATEGORIES in data.jsx): figures → diecast → kits → designer → tcg.
// Shared list — see lib/catalog.ts; one wording per category app-wide (Change Spec §4.2).
const CATEGORIES = ADD_CATEGORIES;

const PAGE_SIZE = 20;

function buildFeedQuery(tab: Tab, page: number): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  params.set("sort", tab === "foryou" ? "foryou" : "latest");
  if (tab === "following") params.set("following_only", "true");
  return `/feed?${params.toString()}`;
}

function FeedSkeleton() {
  return (
    <div style={{ background: "var(--card-surface)", borderRadius: 20, margin: "0 14px 12px", padding: 18, boxShadow: "var(--card-shadow)" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--slate-100)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: "40%", height: 12, borderRadius: 6, background: "var(--slate-100)", marginBottom: 6 }} />
          <div style={{ width: "60%", height: 10, borderRadius: 6, background: "var(--slate-100)" }} />
        </div>
      </div>
      <div style={{ height: 14, borderRadius: 6, background: "var(--slate-100)", marginBottom: 6 }} />
      <div style={{ height: 14, borderRadius: 6, background: "var(--slate-100)", width: "80%" }} />
    </div>
  );
}

function CheckSquare({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "w-6 h-6 rounded-[7px] shrink-0 flex items-center justify-center border-[1.5px] transition-colors",
        on
          ? "bg-[var(--stamp-red)] border-[var(--stamp-red)] text-[var(--paper)]"
          : "border-[var(--border-strong)]"
      )}
    >
      {on && <Check size={15} strokeWidth={3} />}
    </span>
  );
}

function CustomizePopover({
  user,
  onSaved,
  onClose,
}: {
  user: AuthUser | null;
  onSaved: (u: AuthUser) => void;
  onClose: () => void;
}) {
  const initialCats = user?.feed_prefs?.categories?.length
    ? user.feed_prefs.categories
    : user?.interests?.length
      ? user.interests
      : CATEGORIES.map((c) => c.id);
  const [draftCats, setDraftCats] = useState<string[]>(initialCats);
  // "Remove Listing posts" — checked by default (DF-08)
  const [draftHide, setDraftHide] = useState(user?.feed_prefs?.hide_listings ?? true);
  const [saving, setSaving] = useState(false);

  const allOn = CATEGORIES.every((c) => draftCats.includes(c.id));

  function toggleCat(id: string) {
    setDraftCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function save() {
    setSaving(true);
    try {
      const feed_prefs = { categories: draftCats, hide_listings: draftHide };
      const updated = await api.patch<AuthUser>("/users/me", { feed_prefs });
      onSaved(updated ?? ({ ...(user as AuthUser), feed_prefs }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute left-0 z-40 w-[min(320px,100%)] rounded-[20px] border border-[var(--slate-200)] bg-[var(--paper)] shadow-[var(--shadow-4)] p-[18px]"
        style={{ top: "calc(100% + 8px)" }}
      >
        <div
          className="font-bold text-[16.5px] text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          Customize feed
        </div>
        <div className="text-[12.5px] text-[var(--ink-faint)] mt-0.5 mb-3">
          Pick the categories you want to see.
        </div>

        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map((c) => {
            const on = draftCats.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCat(c.id)}
                className="flex items-center gap-3 w-full text-left rounded-lg px-1 py-[9px] cursor-pointer hover:bg-[var(--slate-50)] transition-colors"
              >
                <CheckSquare on={on} />
                <span className="text-[15px] font-medium text-[var(--ink)]">{c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-[var(--border)] mx-1 mt-2.5 mb-1" />

        <button
          onClick={() => setDraftHide((h) => !h)}
          className="flex items-center gap-3 w-full text-left rounded-lg px-1 py-[9px] cursor-pointer hover:bg-[var(--slate-50)] transition-colors"
        >
          <CheckSquare on={draftHide} />
          <span className="flex flex-col gap-px">
            <span className="text-[15px] font-medium text-[var(--ink)]">Remove Listing posts</span>
            <span className="text-[11.5px] text-[var(--ink-faint)]">Hide marketplace listings from your feed</span>
          </span>
        </button>

        <div className="flex gap-2.5 mt-3.5">
          <button
            onClick={() => setDraftCats(allOn ? [] : CATEGORIES.map((c) => c.id))}
            className="flex-1 py-[11px] rounded-[11px] border border-[var(--border-strong)] bg-[var(--paper)] text-sm font-semibold text-[var(--ink)] cursor-pointer"
          >
            {allOn ? "Clear all" : "Select all"}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-[1.4] py-[11px] rounded-[11px] bg-[var(--stamp-red)] text-white text-sm font-bold hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function FeedPage() {
  const { user, setUser } = useUser();

  // NOTE (hydration): the snapshot lives in sessionStorage, which the SERVER cannot see.
  // Seeding these useState calls from it — which is what this used to do, via a lazy
  // initializer — meant the server rendered skeletons while the first client render
  // rendered restored posts, and React threw "Hydration failed … server rendered HTML
  // didn't match the client" on every reload that had a snapshot. So the first client
  // render must match the server exactly (empty + loading), and the snapshot is applied
  // in a LAYOUT effect below: it runs before paint, so there's still no visible flash.
  const [tab, setTab] = useState<Tab>("foryou");
  const [customOpen, setCustomOpen] = useState(false);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // bump to refetch after Customize-feed save (For You filter is server-side)
  const [prefsVersion, setPrefsVersion] = useState(0);
  // Gate for the fetch effect: stays false until the restore below has had its say, so
  // a snapshot can never lose a race with a page-1 fetch.
  const [restoreChecked, setRestoreChecked] = useState(false);
  // When we've rehydrated posts from a snapshot, remember which tab/prefs
  // combo they belong to so the fetch effect can skip refetching it — kept as a
  // key (not a one-shot boolean) so React StrictMode's double-invoke doesn't
  // wipe the restored posts by refetching page 1.
  const restoredKeyRef = useRef<string | null>(null);

  const hideListings = user?.feed_prefs?.hide_listings ?? true;

  // Keep the latest feed state in a ref so the unmount cleanup can snapshot it.
  const stateRef = useRef({ tab, posts, page, hasMore });
  useEffect(() => { stateRef.current = { tab, posts, page, hasMore }; });
  const scrollTopRef = useRef(0);

  // Apply the restore snapshot, once, before the browser paints. Everything this sets
  // is guarded on there actually BEING a snapshot; with none, the feed just carries on
  // to its normal page-1 fetch.
  //
  // `set-state-in-effect` is disabled deliberately. The rule guards against cascading
  // renders hurting performance — here the single extra render is the entire point: it
  // is what lets the first render match the server (no hydration mismatch) while the
  // restored list still reaches the screen before paint. A layout effect, not a passive
  // one, so it also wins the race against the fetch effect below.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const s = readFeedSnapshot<ApiPost, Tab>();
    if (s) {
      restoredKeyRef.current = `${s.tab}|0`;
      scrollTopRef.current = s.scrollTop;
      setTab(s.tab);
      setPosts(s.posts);
      setPage(s.page);
      setHasMore(s.hasMore);
      setLoading(false);
    }
    setRestoreChecked(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Track scroll on the <main> scroll container; write a snapshot on leave, and
  // restore the saved scroll position on a snapshot rehydrate (issue #6).
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const ac = new AbortController();
    main.addEventListener("scroll", () => { scrollTopRef.current = main.scrollTop; },
      { passive: true, signal: ac.signal });

    // Restore the saved scroll position. A single frame isn't enough: the
    // <main> scroller is shared with the (short) post page, which clamps its
    // scrollTop to ~0, and the restored list needs a beat to lay out to full
    // height. So re-apply the target for a short window until it sticks, and
    // bail the moment the user scrolls themselves.
    let raf = 0;
    let userScrolled = false;
    if (scrollTopRef.current > 0) {
      const target = scrollTopRef.current;
      const deadline = performance.now() + 600;
      const bail = () => { userScrolled = true; };
      main.addEventListener("wheel", bail, { passive: true, signal: ac.signal });
      main.addEventListener("touchmove", bail, { passive: true, signal: ac.signal });
      const tick = () => {
        if (userScrolled) return;
        if (Math.abs(main.scrollTop - target) > 1) main.scrollTop = target;
        if (performance.now() < deadline && main.scrollTop !== target) {
          raf = requestAnimationFrame(tick);
        }
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ac.abort();
      const s = stateRef.current;
      writeFeedSnapshot({
        tab: s.tab,
        posts: s.posts.slice(0, MAX_SNAPSHOT_POSTS),
        page: Math.min(s.page, Math.ceil(MAX_SNAPSHOT_POSTS / PAGE_SIZE)),
        hasMore: s.hasMore,
        scrollTop: scrollTopRef.current,
        ts: Date.now(),
      });
    };
  }, []);

  // Side cards (listings + events) load once — they're interspersed, not paginated.
  useEffect(() => {
    Promise.all([
      api.get<{ items: ApiListing[] }>("/listings?limit=4"),
      api.get<ApiEvent[]>("/events?limit=2"),
    ])
      .then(([l, e]) => {
        setListings(l?.items ?? []);
        setEvents(e ?? []);
      })
      .catch(console.error);
  }, []);

  // Posts reload whenever tab/prefs change (server-side). Skip the fetch for
  // the exact combo we rehydrated from a snapshot (the posts are already there);
  // any other combo fetches normally.
  useEffect(() => {
    if (!restoreChecked) return;                  // snapshot hasn't been consulted yet
    const key = `${tab}|${prefsVersion}`;
    if (restoredKeyRef.current === key) return;   // restored — keep those posts
    restoredKeyRef.current = null;                // consumed; future changes refetch
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    api.get<{ items: ApiPost[] }>(buildFeedQuery(tab, 1))
      .then((d) => {
        if (cancelled) return;
        const items = d?.items ?? [];
        setPosts(items);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((e) => { if (!cancelled) console.error(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [restoreChecked, tab, prefsVersion]);

  // Keep the latest loadMore logic in a ref so the IntersectionObserver effect
  // (set up once) always calls the current closure without re-subscribing.
  const loadMoreRef = useRef<() => void>(() => {});
  loadMoreRef.current = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const d = await api.get<{ items: ApiPost[] }>(buildFeedQuery(tab, next));
      const items = d?.items ?? [];
      setPosts((prev) => [...prev, ...items]);
      setPage(next);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll: observe a sentinel near the bottom.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { rootMargin: "600px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  // Build the display stream. "Remove Listing posts" applies on For You (DF-08).
  const stream = useMemo<StreamItem[]>(() => {
    const base: StreamItem[] = [];
    let li = 0, ei = 0;
    const showListings = !(tab === "foryou" && hideListings) && tab !== "following";
    const showEvents = tab !== "following";
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      // Scorred/official posts render as normal posts (same as any user) —
      // the AdminCard "release" format is no longer used in the feed.
      base.push({ t: "post", key: `p-${p.id}`, data: p });
      if (showListings && (i + 1) % 3 === 0 && li < listings.length) {
        base.push({ t: "listing", key: `l-${listings[li].id}`, data: listings[li] });
        li++;
      }
      if (showEvents && i === 4 && ei < events.length) {
        base.push({ t: "event", key: `e-${events[ei].id}`, data: events[ei] });
        ei++;
      }
    }
    return base;
  }, [posts, listings, events, tab, hideListings]);

  return (
    <div className="w-full max-w-[680px] min-h-screen border-r border-[var(--slate-200)] bg-[var(--canvas)]">
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 16px" }}>
          {/* feed sort tabs — "For You" doubles as the Customise control: tapping it
              while active opens the Customize-feed popover (DF-07). No separate chip.
              QA 2026-08-04 §2 changed ONLY the trigger glyph: the caret is now the
              settings/sliders icon. Layout and behaviour are otherwise untouched. */}
          <div className="relative">
            <div className="flex gap-1 bg-[var(--slate-100)] rounded-[14px] p-1">
              {TABS.map((t) => {
                const on = tab === t.id;
                const Icon = t.icon;
                const isForYou = t.id === "foryou";
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isForYou && on) setCustomOpen((o) => !o);
                      else { setTab(t.id); setCustomOpen(false); }
                    }}
                    aria-label={isForYou ? "For You — tap again to customise feed" : t.label}
                    className={cn(
                      // gap-2.5 (10px), not the old 6px — the icon was crowding the label.
                      "flex-1 flex items-center justify-center gap-2.5 rounded-[10px] py-2 px-1.5 text-[13.5px] whitespace-nowrap cursor-pointer border-none transition-all duration-150",
                      on
                        ? "bg-[var(--paper)] text-[var(--ink)] font-bold shadow-[var(--shadow-2)]"
                        : "bg-transparent text-[var(--slate-500)] font-medium"
                    )}
                  >
                    <Icon size={16} strokeWidth={on ? 2.3 : 1.9} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {customOpen && (
              <CustomizePopover
                user={user}
                onSaved={(u) => { setUser(u); setPrefsVersion((v) => v + 1); }}
                onClose={() => setCustomOpen(false)}
              />
            )}
          </div>
        </div>

        <div style={{ paddingTop: 8 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <FeedSkeleton key={i} />)
          : stream.length === 0
            ? <div style={{ padding: "52px 24px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
                  {tab === "following" ? "Nothing from your follows yet" : "Nothing to show here"}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 5 }}>
                  {tab === "following"
                    ? "Posts from people you follow will show here."
                    : "Check back soon."}
                </div>
              </div>
            : stream.map((x) => {
                if (x.t === "post") return <PostCard key={x.key} post={x.data} showFollow />;
                if (x.t === "listing") return <ListingFeedCard key={x.key} listing={x.data} />;
                if (x.t === "event") return <FeedEventCard key={x.key} event={x.data} />;
                return null;
              })}
        </div>

        {/* Infinite-scroll sentinel + loading state */}
        {!loading && hasMore && (
          <div ref={sentinelRef}>
            {loadingMore && <FeedSkeleton />}
          </div>
        )}

        {!loading && !hasMore && stream.length > 0 && (
          <div style={{ padding: "24px 16px 40px", textAlign: "center", color: "var(--slate-400)", fontSize: 12, letterSpacing: "0.02em" }}>
            You&rsquo;re all caught up
            {user?.interests?.length ? ` · tuned to ${user.interests.length} interest${user.interests.length === 1 ? "" : "s"}` : ""}
          </div>
        )}
    </div>
  );
}
