"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { CategoryChip, SectionLabel, EmptyNote, Button, Segmented } from "@/components/ui";
import { CommunityCard } from "@/components/cards";
import { ADD_CATEGORIES } from "@/lib/catalog";

// v4 CommunityView filter maps the global CATEGORIES with chipLabel (incl. TCG).
// ADD_CATEGORIES is that 5-category list in v4 order. Kept in lockstep.
const CATEGORIES = ADD_CATEGORIES;

// QA2 — pins live in localStorage (client-only) so keeping a community on top costs
// zero DB/memory. Most-active ordering uses the recent_post_count the API returns.
const PIN_KEY = "scorred:pinnedCommunities";
function loadPins(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "[]"); } catch { return []; }
}

type Tab = "discover" | "joined";

// Most-active first: fresh (last-24h) posts, then total members. Pins float above all.
const byActivity = (a: ApiCommunity, b: ApiCommunity) =>
  (b.recent_post_count ?? 0) - (a.recent_post_count ?? 0) || b.member_count - a.member_count;

function CommunityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The active tab lives in the URL (?tab=joined) so BackButton (router.back) returns
  // you to the SAME tab you left from — a joined community's back goes to Joined, not
  // Discover (QA2). The URL is the single source of truth.
  const tab: Tab = searchParams.get("tab") === "joined" ? "joined" : "discover";
  const selectTab = (t: Tab) =>
    router.replace(t === "joined" ? "/community?tab=joined" : "/community", { scroll: false });

  const [cats, setCats] = useState<string[]>([]); // [] = all
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [pins, setPins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleCat = (id: string) =>
    setCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  const togglePin = (id: string) =>
    setPins((ps) => {
      const next = ps.includes(id) ? ps.filter((x) => x !== id) : [id, ...ps];
      try { localStorage.setItem(PIN_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  useEffect(() => {
    const pinned = loadPins();
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => { setCommunities(data ?? []); setPins(pinned); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const joined = useMemo(() => {
    const mine = communities.filter((c) => c.is_member);
    const isPinned = (c: ApiCommunity) => pins.includes(c.id);
    // Pinned first (in pin order), then the rest by activity.
    const pinnedCards = pins.map((id) => mine.find((c) => c.id === id)).filter(Boolean) as ApiCommunity[];
    const rest = mine.filter((c) => !isPinned(c)).sort(byActivity);
    return [...pinnedCards, ...rest];
  }, [communities, pins]);

  const discover = useMemo(
    () =>
      communities
        .filter((c) => !c.is_member && (cats.length === 0 || cats.includes(c.category)))
        .sort(byActivity),
    [communities, cats],
  );

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-7">
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "14px 20px 0" }}>
        <Link
          href="/search?scope=communities"
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 9,
            height: 40, padding: "0 14px", borderRadius: 11,
            border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
            color: "var(--ink-faint)", fontSize: 14,
          }}
        >
          <Search size={18} />
          Find a community…
        </Link>
        <Button size="sm" variant="primary" icon={<PlusCircle size={15} />} onClick={() => router.push("/community/new")}>
          Create
        </Button>
      </div>

      {/* QA2 — Discover / Joined as explicit tabs so Discover stays reachable after you've
          joined several communities; the tab is URL-backed so back-navigation restores it. */}
      <div style={{ padding: "14px 20px 0" }}>
        <Segmented
          value={tab}
          onChange={(v) => selectTab(v as Tab)}
          options={[
            { id: "discover", label: "Discover" },
            { id: "joined", label: joined.length ? `Joined · ${joined.length}` : "Joined" },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 76, borderRadius: 14, background: "var(--bone)" }} />
          ))}
        </div>
      ) : tab === "joined" ? (
        <div style={{ padding: "16px 20px 0" }}>
          <SectionLabel>Your communities</SectionLabel>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", margin: "5px 0 12px" }}>
            Pin a community to keep it on top; otherwise the most active (last 24h) leads.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {joined.map((c) => (
              <CommunityCard key={c.id} community={c} pinned={pins.includes(c.id)} onTogglePin={() => togglePin(c.id)} />
            ))}
            {joined.length === 0 && <EmptyNote>You haven&rsquo;t joined any communities yet — head to Discover.</EmptyNote>}
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", gap: 7, margin: "0 0 12px", overflowX: "auto", paddingBottom: 2 }}>
            <CategoryChip active={cats.length === 0} onClick={() => setCats([])}>All</CategoryChip>
            {CATEGORIES.map((c) => (
              <CategoryChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>
                {c.label}
              </CategoryChip>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {discover.map((c) => <CommunityCard key={c.id} community={c} />)}
            {discover.length === 0 && <EmptyNote>Nothing new to discover in this category — check back soon.</EmptyNote>}
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams must sit under a Suspense boundary for the production build.
export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[680px]" style={{ padding: 20 }} />}>
      <CommunityPageInner />
    </Suspense>
  );
}
