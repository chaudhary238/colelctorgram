"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { Segmented, CategoryChip } from "@/components/ui";
import { PostCard, AdminCard, ListingFeedCard, FeedEventCard, ApiPost, ApiListing, ApiEvent } from "@/components/cards";
import { RightRail } from "@/components/RightRail";

type StreamItem =
  | { t: "post"; key: string; data: ApiPost }
  | { t: "admin"; key: string; data: ApiPost }
  | { t: "listing"; key: string; data: ApiListing }
  | { t: "event"; key: string; data: ApiEvent };

const SORTS = [
  { id: "foryou", label: "For You" },
  { id: "latest", label: "Latest" },
  { id: "top", label: "Top" },
] as const;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "following", label: "Following" },
  { id: "posts", label: "Discussions" },
  { id: "hidelistings", label: "Hide listings" },
] as const;

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

export default function FeedPage() {
  const { user } = useUser();
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("foryou");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ items: ApiPost[] }>("/feed?limit=20"),
      api.get<{ items: ApiListing[] }>("/listings?limit=4"),
      api.get<ApiEvent[]>("/events?limit=2"),
    ])
      .then(([p, l, e]) => {
        setPosts(p?.items ?? []);
        setListings(l?.items ?? []);
        setEvents(e ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stream = useMemo<StreamItem[]>(() => {
    const base: StreamItem[] = [];
    let li = 0, ei = 0;
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      base.push(p.is_admin_post
        ? { t: "admin", key: `a-${p.id}`, data: p }
        : { t: "post", key: `p-${p.id}`, data: p });
      if ((i + 1) % 3 === 0 && li < listings.length) {
        base.push({ t: "listing", key: `l-${listings[li].id}`, data: listings[li] });
        li++;
      }
      if (i === 4 && ei < events.length) {
        base.push({ t: "event", key: `e-${events[ei].id}`, data: events[ei] });
        ei++;
      }
    }
    return base;
  }, [posts, listings, events]);

  const filtered = useMemo<StreamItem[]>(() => {
    let s = stream;
    if (sort === "latest") {
      const sorted = [...posts].reverse();
      s = sorted.map(p => p.is_admin_post
        ? { t: "admin" as const, key: `a-${p.id}`, data: p }
        : { t: "post" as const, key: `p-${p.id}`, data: p });
    }
    if (sort === "top") {
      const sorted = [...posts].sort((a, b) => b.likes_count - a.likes_count);
      s = sorted.map(p => p.is_admin_post
        ? { t: "admin" as const, key: `a-${p.id}`, data: p }
        : { t: "post" as const, key: `p-${p.id}`, data: p });
    }
    if (filter === "hidelistings") s = s.filter((x) => x.t !== "listing");
    if (filter === "posts") s = s.filter((x) => x.t === "post" || x.t === "admin");
    if (filter === "following") s = s.filter((x) => (x.t === "post" || x.t === "admin") && x.data.is_following);
    return s;
  }, [stream, sort, filter, posts]);

  return (
    <div className="flex justify-start gap-8">
      <div className="w-full max-w-[600px] min-h-screen border-r border-[var(--border)]">
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 16px" }}>
          <Segmented options={SORTS as unknown as { id: string; label: string }[]} value={sort} onChange={(v) => setSort(v as typeof sort)} />
          <div className="flex gap-[7px] mt-[10px] overflow-x-auto">
            {FILTERS.map((f) => (
              <CategoryChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </CategoryChip>
            ))}
          </div>
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => <FeedSkeleton key={i} />)
          : filtered.length === 0
            ? <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Nothing to show here.</div>
            : filtered.map((x) => {
                if (x.t === "post") return <PostCard key={x.key} post={x.data} showFollow />;
                if (x.t === "admin") return <AdminCard key={x.key} post={x.data} />;
                if (x.t === "listing") return <ListingFeedCard key={x.key} listing={x.data} />;
                if (x.t === "event") return <FeedEventCard key={x.key} event={x.data} />;
                return null;
              })}

        {!loading && filtered.length > 0 && (
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
