"use client";

// Home feed — design feedback round 1 (DF-07..DF-09):
// Tabs: For You (caret → "Customize feed" popover) · Explore (was Latest) · Following.
// Hashtag pill slider below the tabs filters the stream; "Remove Listing posts"
// (default ON) hides interspersed listing cards from For You.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Globe, Home, UserPlus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useUser, AuthUser } from "@/lib/auth-context";
import { PostCard, AdminCard, ListingFeedCard, FeedEventCard, ApiPost, ApiListing, ApiEvent } from "@/components/cards";
import { RightRail } from "@/components/RightRail";
import { cn } from "@/lib/utils";

type StreamItem =
  | { t: "post"; key: string; data: ApiPost }
  | { t: "admin"; key: string; data: ApiPost }
  | { t: "listing"; key: string; data: ApiListing }
  | { t: "event"; key: string; data: ApiEvent };

const TABS = [
  { id: "foryou", label: "For You", icon: Home, caret: true },
  { id: "explore", label: "Explore", icon: Globe },
  { id: "following", label: "Following", icon: UserPlus },
] as const;

type Tab = (typeof TABS)[number]["id"];

const CATEGORIES = [
  { id: "figures", label: "Action Figures" },
  { id: "designer", label: "Designer Toys & Blind Boxes" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "diecast", label: "Diecast & Scale Models" },
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
    <div style={{ borderBottom: "8px solid var(--bone)", padding: "16px" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bone)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: "40%", height: 12, borderRadius: 6, background: "var(--bone)", marginBottom: 6 }} />
          <div style={{ width: "60%", height: 10, borderRadius: 6, background: "var(--bone)" }} />
        </div>
      </div>
      <div style={{ height: 14, borderRadius: 6, background: "var(--bone)", marginBottom: 6 }} />
      <div style={{ height: 14, borderRadius: 6, background: "var(--bone)", width: "80%" }} />
    </div>
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

  function CheckSquare({ on }: { on: boolean }) {
    return (
      <span
        className={cn(
          "w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center border-[1.5px] transition-colors",
          on
            ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]"
            : "border-[var(--border-strong)]"
        )}
      >
        {on && <Check size={14} strokeWidth={3} />}
      </span>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute left-0 z-40 w-[min(320px,100%)] rounded-[17px] border border-[var(--border)] bg-[var(--paper-soft)] shadow-[var(--shadow-4)] p-4"
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
                className="flex items-center gap-3 w-full text-left rounded-lg px-1 py-[9px] cursor-pointer hover:bg-[var(--bone)] transition-colors"
              >
                <CheckSquare on={on} />
                <span className="text-sm font-medium text-[var(--ink)]">{c.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() =>
            setDraftCats(allOn ? [] : CATEGORIES.map((c) => c.id))
          }
          className="text-[12.5px] font-semibold text-[var(--stamp-red)] mt-1.5 px-1 cursor-pointer bg-transparent border-none"
        >
          {allOn ? "Clear all" : "Select all"}
        </button>

        <div className="border-t border-[var(--border)] my-3" />

        <button
          onClick={() => setDraftHide((h) => !h)}
          className="flex items-center gap-3 w-full text-left rounded-lg px-1 py-[9px] cursor-pointer hover:bg-[var(--bone)] transition-colors"
        >
          <CheckSquare on={draftHide} />
          <span className="text-sm font-medium text-[var(--ink)]">Remove Listing posts</span>
        </button>

        <div className="flex gap-2 mt-3.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[11px] border border-[var(--border-strong)] bg-transparent text-sm font-semibold text-[var(--ink)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-[11px] bg-[var(--stamp-red)] text-white text-sm font-semibold hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60 cursor-pointer"
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
      base.push(p.is_admin_post
        ? { t: "admin", key: `a-${p.id}`, data: p }
        : { t: "post", key: `p-${p.id}`, data: p });
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
      <div className="w-full max-w-[600px] min-h-screen border-r border-[var(--border)]">
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 16px" }}>
          {/* feed tabs: For You (customisable) · Explore · Following (DF-07) */}
          <div className="relative">
            <div className="flex gap-1 bg-[var(--bone)] rounded-[13px] p-1">
              {TABS.map((t) => {
                const on = tab === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.id === "foryou" && on) setCustomOpen((o) => !o);
                      else { setTab(t.id); setCustomOpen(false); }
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2 px-1.5 text-[13.5px] whitespace-nowrap cursor-pointer border-none transition-all duration-150",
                      on
                        ? "bg-[var(--paper)] text-[var(--ink)] font-bold shadow-[var(--shadow-1)]"
                        : "bg-transparent text-[var(--ink-faint)] font-medium"
                    )}
                  >
                    <Icon size={16} strokeWidth={on ? 2.3 : 1.9} />
                    {t.label}
                    {"caret" in t && t.caret && (
                      <ChevronDown
                        size={13}
                        strokeWidth={2.4}
                        className="transition-transform duration-150 -ml-px"
                        style={{ transform: customOpen ? "rotate(180deg)" : "none" }}
                      />
                    )}
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
                    "shrink-0 rounded-full px-3.5 py-[7px] text-[13px] leading-none whitespace-nowrap cursor-pointer border transition-colors",
                    on
                      ? isAll
                        ? "bg-[var(--stamp-red)] border-[var(--stamp-red)] text-white font-semibold"
                        : "bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)] font-semibold"
                      : "bg-[var(--paper-soft)] border-[var(--border-strong)] text-[var(--ink)] font-medium"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => <FeedSkeleton key={i} />)
          : stream.length === 0
            ? <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>
                {tag !== "All"
                  ? `No posts under ${tag} yet.`
                  : tab === "following"
                    ? "Posts from people you follow will show here."
                    : "Nothing to show here."}
              </div>
            : stream.map((x) => {
                if (x.t === "post") return <PostCard key={x.key} post={x.data} showFollow />;
                if (x.t === "admin") return <AdminCard key={x.key} post={x.data} />;
                if (x.t === "listing") return <ListingFeedCard key={x.key} listing={x.data} />;
                if (x.t === "event") return <FeedEventCard key={x.key} event={x.data} />;
                return null;
              })}

        {/* Infinite-scroll sentinel + loading state */}
        {!loading && hasMore && (
          <div ref={sentinelRef}>
            {loadingMore && <FeedSkeleton />}
          </div>
        )}

        {!loading && !hasMore && stream.length > 0 && (
          <div style={{ padding: "24px 16px 32px", textAlign: "center", color: "var(--ink-ghost)", fontSize: 12.5 }}>
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
