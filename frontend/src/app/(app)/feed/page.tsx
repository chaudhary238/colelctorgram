"use client";

// Home feed — design feedback round 1 (DF-07..DF-09):
// Tabs: For You (caret → "Customize feed" popover) · Explore (was Latest) · Following.
// Hashtag pill slider below the tabs filters the stream; "Remove Listing posts"
// (default ON) hides interspersed listing cards from For You.

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Home, UserPlus, Check, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { useUser, AuthUser } from "@/lib/auth-context";
import { PostCard, ListingFeedCard, FeedEventCard, ApiPost, ApiListing, ApiEvent } from "@/components/cards";
import { RightRail } from "@/components/RightRail";
import { cn } from "@/lib/utils";

type StreamItem =
  | { t: "post"; key: string; data: ApiPost }
  | { t: "listing"; key: string; data: ApiListing }
  | { t: "event"; key: string; data: ApiEvent };

const TABS = [
  { id: "foryou", label: "For You", icon: Home },
  { id: "explore", label: "Explore", icon: Globe },
  { id: "following", label: "Following", icon: UserPlus },
] as const;

type Tab = (typeof TABS)[number]["id"];

// v4 order (CATEGORIES in data.jsx): figures → diecast → kits → designer → tcg.
const CATEGORIES = [
  { id: "figures", label: "Action Figures" },
  { id: "diecast", label: "Diecast" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "designer", label: "Designer Toys & Blind Boxes" },
  { id: "tcg", label: "Trading Cards (TCG)" },
];

const FALLBACK_TAGS = ["#NewDrops", "#Grails", "#Sealed", "#Restock", "#Meetups"];

const PAGE_SIZE = 20;

function buildFeedQuery(tab: Tab, tag: string, page: number): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  params.set("sort", tab === "foryou" ? "foryou" : "latest");
  if (tab === "following") params.set("following_only", "true");
  if (tag !== "All") params.set("tag", tag);
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
  const [tab, setTab] = useState<Tab>("foryou");
  const [tag, setTag] = useState("All");
  const [tags, setTags] = useState<string[]>(FALLBACK_TAGS);
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

  const hideListings = user?.feed_prefs?.hide_listings ?? true;

  // Hashtag slider: drag-to-scroll on desktop (DF-09)
  const tagBar = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0 });
  const onTagDown = (e: React.MouseEvent) => {
    const el = tagBar.current;
    if (!el) return;
    drag.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft };
  };
  const onTagMove = (e: React.MouseEvent) => {
    const el = tagBar.current;
    if (!el || !drag.current.down) return;
    el.scrollLeft = drag.current.startScroll - (e.pageX - drag.current.startX);
  };
  const endTagDrag = () => { drag.current.down = false; };

  // Popular hashtags (curated server-side, DF-10)
  useEffect(() => {
    api.get<{ tags: string[] }>("/feed/tags")
      .then((d) => { if (d?.tags?.length) setTags(d.tags); })
      .catch(() => {});
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

  // Posts reload whenever tab/tag/prefs change (server-side).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    api.get<{ items: ApiPost[] }>(buildFeedQuery(tab, tag, 1))
      .then((d) => {
        if (cancelled) return;
        const items = d?.items ?? [];
        setPosts(items);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((e) => { if (!cancelled) console.error(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, tag, prefsVersion]);

  // Keep the latest loadMore logic in a ref so the IntersectionObserver effect
  // (set up once) always calls the current closure without re-subscribing.
  const loadMoreRef = useRef<() => void>(() => {});
  loadMoreRef.current = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const d = await api.get<{ items: ApiPost[] }>(buildFeedQuery(tab, tag, next));
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

  // Build the display stream. Interspersed listing/event cards are untagged, so a
  // hashtag filter hides them; "Remove Listing posts" applies on For You (DF-08).
  const stream = useMemo<StreamItem[]>(() => {
    const base: StreamItem[] = [];
    let li = 0, ei = 0;
    const showExtras = tag === "All";
    const showListings = showExtras && !(tab === "foryou" && hideListings) && tab !== "following";
    const showEvents = showExtras && tab !== "following";
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
  }, [posts, listings, events, tab, tag, hideListings]);

  return (
    <div className="flex justify-start gap-8">
      <div className="w-full max-w-[600px] min-h-screen border-r border-[var(--slate-200)] bg-[var(--canvas)]">
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 16px" }}>
          {/* feed sort tabs (plain) + trailing Customise chip (DV6-08) */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-1 bg-[var(--slate-100)] rounded-[14px] p-1">
                {TABS.map((t) => {
                  const on = tab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setCustomOpen(false); }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2 px-1.5 text-[13.5px] whitespace-nowrap cursor-pointer border-none transition-all duration-150",
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
              <button
                onClick={() => setCustomOpen((o) => !o)}
                aria-label="Customise feed"
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full py-2 px-3 text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-all duration-150"
                style={{
                  border: `1px solid ${customOpen ? "var(--stamp-red)" : "var(--slate-200)"}`,
                  background: customOpen ? "var(--stamp-red-soft)" : "var(--card-surface)",
                  color: customOpen ? "var(--stamp-red)" : "var(--slate-500)",
                }}
              >
                <SlidersHorizontal size={14} strokeWidth={2.1} />
                Customise
              </button>
            </div>

            {customOpen && (
              <CustomizePopover
                user={user}
                onSaved={(u) => { setUser(u); setPrefsVersion((v) => v + 1); }}
                onClose={() => setCustomOpen(false)}
              />
            )}
          </div>

          {/* hashtag slider (DF-09) */}
          <div
            ref={tagBar}
            onMouseDown={onTagDown}
            onMouseMove={onTagMove}
            onMouseUp={endTagDrag}
            onMouseLeave={endTagDrag}
            className="flex gap-[7px] mt-[10px] overflow-x-auto select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {["All", ...tags].map((t) => {
              const on = tag === t;
              const isAll = t === "All";
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-[13px] leading-none whitespace-nowrap cursor-pointer border transition-colors",
                    on
                      ? isAll
                        ? "bg-[var(--stamp-red)] border-[var(--stamp-red)] text-white font-bold"
                        : "bg-[var(--slate-800)] border-[var(--slate-800)] text-[var(--paper)] font-bold"
                      : isAll
                        ? "bg-[var(--card-surface)] border-[var(--slate-200)] text-[var(--slate-500)] font-medium"
                        : "bg-[var(--rose-tint-bg)] border-[var(--rose-tint-border)] text-[var(--rose-tint-text)] font-medium"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ paddingTop: 8 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <FeedSkeleton key={i} />)
          : stream.length === 0
            ? <div style={{ padding: "52px 24px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
                  {tag !== "All"
                    ? `No posts under ${tag}`
                    : tab === "following"
                      ? "Nothing from your follows yet"
                      : "Nothing to show here"}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 5 }}>
                  {tag !== "All"
                    ? "Try another hashtag or tap All."
                    : tab === "following"
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

      <div className="hidden xl:block shrink-0">
        <div className="sticky top-0">
          <RightRail />
        </div>
      </div>
    </div>
  );
}
