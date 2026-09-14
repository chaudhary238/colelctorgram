"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, PlusCircle, Users, Compass, X } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { CategoryChip, EmptyNote, Button, Segmented } from "@/components/ui";
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

/**
 * QA #11 full v8 revert (founder 2026-09-13) — this page now matches
 * design_v8/app/CommunityView.jsx: a REAL in-page search input (local filter,
 * tabs hidden while searching, flat merged results + mono counter) and a plain
 * card list per tab with no section headers or helper prose. This supersedes
 * QA 2026-08-04 §15's "Created by you" section split — the teal Admin badge on
 * the card carries the created-vs-joined distinction now. ONE deliberate
 * divergence stays by founder call: the pin button + pin-first ordering.
 *
 * The tab is called "Your communities" (v8 §8) rather than "Joined" because it holds both.
 */

// Most-active first: fresh (last-24h) posts, then total members. Pins float above all.
const byActivity = (a: ApiCommunity, b: ApiCommunity) =>
  (b.recent_post_count ?? 0) - (a.recent_post_count ?? 0) || b.member_count - a.member_count;

function CommunityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The active tab lives in the URL so BackButton (router.back) returns you to the
  // SAME tab you left from (QA2). v8 flips the default: "Your communities" leads and
  // Discover is the explicit ?tab=discover destination.
  const tab: Tab = searchParams.get("tab") === "discover" ? "discover" : "joined";
  const selectTab = (t: Tab) =>
    router.replace(t === "discover" ? "/community?tab=discover" : "/community", { scroll: false });

  const [cats, setCats] = useState<string[]>([]); // [] = all
  const [q, setQ] = useState(""); // v8 in-page search — filters both lists locally
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

  // Everything on the "My communities" tab: created OR joined. A community you created
  // but somehow aren't a member of would still be yours, hence the `||`.
  // v8 (CommunityView.jsx:24) — the category filter applies to BOTH tabs now.
  const mine = useMemo(() => {
    const ours = communities.filter(
      (c) => (c.is_member || c.is_founder) && (cats.length === 0 || cats.includes(c.category)),
    );
    const isPinned = (c: ApiCommunity) => pins.includes(c.id);
    // Pinned first (in pin order), then the rest by activity.
    const pinnedCards = pins.map((id) => ours.find((c) => c.id === id)).filter(Boolean) as ApiCommunity[];
    const rest = ours.filter((c) => !isPinned(c)).sort(byActivity);
    return [...pinnedCards, ...rest];
  }, [communities, pins, cats]);

  const discover = useMemo(
    () =>
      communities
        .filter((c) => !c.is_member && !c.is_founder && (cats.length === 0 || cats.includes(c.category)))
        .sort(byActivity),
    [communities, cats],
  );

  // v8 CommunityView.jsx:17 — search matches name or description, across BOTH lists.
  const qNorm = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!qNorm) return [];
    const qMatch = (c: ApiCommunity) =>
      c.name.toLowerCase().includes(qNorm)
      || (c.short_desc ?? c.description ?? "").toLowerCase().includes(qNorm);
    return [...mine, ...discover].filter(qMatch);
  }, [mine, discover, qNorm]);

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-7">
      {/* v8 (CommunityView.jsx:31-60) — search row + category chips + tabs live in ONE
          sticky header block: top 0, paper bg, slate-200 bottom rule. */}
      {/* QA #11 follow-up — the app bar is lg:hidden, so the offset must be
          responsive: 56px below lg (pin under the app bar), 0 on desktop
          (a fixed 56 left a gap cards scrolled through — the "overlap"). */}
      <div className="top-[56px] lg:top-0" style={{ position: "sticky", zIndex: 4, background: "var(--paper)", borderBottom: "1px solid var(--slate-200)", padding: "12px 16px 10px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          {/* v8 CommunityView.jsx:33-42 — a REAL search input (local filter),
              not a link to the global search page. */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 9, height: 40, padding: "0 14px",
            borderRadius: 13, border: "1px solid var(--slate-200)", background: "var(--card-surface)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <Search size={17} style={{ color: "var(--slate-400)", flexShrink: 0 }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search communities…"
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }}
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "var(--slate-400)", display: "flex", alignItems: "center" }}>
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
          <Button size="sm" variant="primary" icon={<PlusCircle size={15} />} onClick={() => router.push("/community/new")}>
            Create
          </Button>
        </div>

        {/* v8 (CommunityView.jsx:45-48) — chips filter BOTH tabs; no "All" chip — a red
            text "Clear" appears once any category is active. Chips read chipLabel. */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, paddingBottom: 2 }}>
          {CATEGORIES.map((c) => (
            <CategoryChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>
              {c.chipLabel}
            </CategoryChip>
          ))}
          {cats.length > 0 && (
            <button
              type="button"
              onClick={() => setCats([])}
              style={{ background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}
            >
              Clear
            </button>
          )}
        </div>

        {/* QA2 — Discover / Joined as explicit tabs so Discover stays reachable after you've
            joined several communities; the tab is URL-backed so back-navigation restores it.
            v8 :49 — the tabs hide while a search query is active (flat merged results). */}
        {!q && (
          <Segmented
            style={{ marginTop: 10 }}
            value={tab}
            onChange={(v) => selectTab(v as Tab)}
            options={[
              /* v8 (CommunityView.jsx:50-58) — yours first with its count in parentheses,
                 Discover second; each segment carries its glyph. */
              { id: "joined", label: mine.length ? `Your communities (${mine.length})` : "Your communities", icon: <Users size={14} /> },
              { id: "discover", label: "Discover", icon: <Compass size={14} /> },
            ]}
          />
        )}
      </div>

      {loading ? (
        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 76, borderRadius: 14, background: "var(--bone)" }} />
          ))}
        </div>
      ) : q ? (
        /* v8 :64-70 — search mode: flat merged results (yours first) + mono counter. */
        <div style={{ padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((c) => <CommunityCard key={c.id} community={c} />)}
          </div>
          {results.length === 0 && <EmptyNote>No communities match &ldquo;{q}&rdquo;.</EmptyNote>}
        </div>
      ) : tab === "joined" ? (
        /* v8 :72-77 — a plain card list; no section headers, no helper prose.
           Pin-first ordering (the kept divergence) is already baked into `mine`. */
        <div style={{ padding: "18px 16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mine.map((c) => (
              <CommunityCard key={c.id} community={c} pinned={pins.includes(c.id)} onTogglePin={() => togglePin(c.id)} />
            ))}
            {mine.length === 0 && (
              /* v8 (CommunityView.jsx:75) exact copy. */
              <EmptyNote>
                {cats.length > 0
                  ? "No communities in this category yet."
                  : "You haven't joined any communities yet — check Discover."}
              </EmptyNote>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: "18px 16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {discover.map((c) => <CommunityCard key={c.id} community={c} />)}
            {/* v8 (CommunityView.jsx:82) exact copy for both Discover empties. */}
            {discover.length === 0 && (
              <EmptyNote>
                {cats.length > 0
                  ? "No communities in this category yet."
                  : "You've joined everything — check back soon."}
              </EmptyNote>
            )}
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
