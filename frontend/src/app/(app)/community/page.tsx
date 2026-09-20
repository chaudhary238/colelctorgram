"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, PlusCircle, Users, Compass, X, Filter } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { EmptyNote, Button, Segmented, SectionLabel } from "@/components/ui";
import { CommunityCard } from "@/components/cards";
import { ADD_CATEGORIES } from "@/lib/catalog";
import { fireToast } from "@/components/gamification";

// v4 CommunityView filter maps the global CATEGORIES with chipLabel (incl. TCG).
// ADD_CATEGORIES is that 5-category list in v4 order. Kept in lockstep.
const CATEGORIES = ADD_CATEGORIES;

// QA2 — pins live in localStorage (client-only) so keeping a community on top costs
// zero DB/memory. Pins float above whatever sort the filter sheet applies.
const PIN_KEY = "scorred:pinnedCommunities";
function loadPins(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "[]"); } catch { return []; }
}

type Tab = "discover" | "joined";
type Sort = "members" | "newest" | "name";

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

// ⚖ v8 Sep-13 override (CommunityView.jsx:36) — Most-members is the default order now;
// this retires the old hardcoded byActivity default (recent_post_count desc).
const SORT_FNS: Record<Sort, (a: ApiCommunity, b: ApiCommunity) => number> = {
  members: (a, b) => b.member_count - a.member_count,
  newest: (a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0),
  name: (a, b) => a.name.localeCompare(b.name),
};

/* DV8 §3#16 — v8's winning FilterChip definition, copied from db/page.tsx:107 (which
   carries the full provenance): r999, pad '7px 14px', fw600; idle = paper bg, ink-mute
   text, plain --border. Active stays solid ink. */
function FilterChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 999, cursor: "pointer", transition: "all 120ms",
      border: `1px solid ${active ? "var(--ink)" : "var(--border)"}`,
      background: active ? "var(--ink)" : "var(--paper)", color: active ? "var(--paper)" : "var(--ink-mute)",
      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", lineHeight: 1.2,
    }}>
      {children}
    </button>
  );
}

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
  const [sort, setSort] = useState<Sort>("members");
  const [q, setQ] = useState(""); // v8 in-page search — filters both lists locally
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [pins, setPins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // v8 Sep-13 filter sheet (CommunityView.jsx:13-21) — drafts seeded on open;
  // backdrop dismiss abandons them, Apply commits. One cats/sort state serves both tabs.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftCats, setDraftCats] = useState<string[]>([]);
  const [draftSort, setDraftSort] = useState<Sort>("members");
  const toggleDraftCat = (id: string) =>
    setDraftCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));
  const openSheet = () => { setDraftCats(cats); setDraftSort(sort); setSheetOpen(true); };
  const applySheet = () => { setCats(draftCats); setSort(draftSort); setSheetOpen(false); };
  const clearSheet = () => { setDraftCats([]); setDraftSort("members"); };
  const activeFilterCount = cats.length + (sort !== "members" ? 1 : 0);

  // v8 Sep-20 (Nav.jsx PIN_LIMIT) — at most 3 pins; a blocked 4th explains itself.
  const PIN_LIMIT = 3;
  const togglePin = (id: string) => {
    const has = pins.includes(id);
    if (!has && pins.length >= PIN_LIMIT) {
      fireToast("You can pin up to 3 communities — unpin one first");
      return;
    }
    const next = has ? pins.filter((x) => x !== id) : [id, ...pins];
    try { localStorage.setItem(PIN_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setPins(next);
  };

  useEffect(() => {
    const pinned = loadPins();
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => { setCommunities(data ?? []); setPins(pinned); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Everything on the "My communities" tab: created OR joined. A community you created
  // but somehow aren't a member of would still be yours, hence the `||`.
  // v8 (CommunityView.jsx:27) — the category filter applies to BOTH tabs now.
  const mine = useMemo(() => {
    const ours = communities.filter(
      (c) => (c.is_member || c.is_founder) && (cats.length === 0 || cats.includes(c.category)),
    );
    const isPinned = (c: ApiCommunity) => pins.includes(c.id);
    // v8-canonical since Sep-20 (CommunityView pinFn — the prototype adopted our QA2
    // pins): pinned float above everything; the sheet's sort orders within each
    // band — pinned and unpinned alike.
    const pinnedCards = (pins.map((id) => ours.find((c) => c.id === id)).filter(Boolean) as ApiCommunity[])
      .sort(SORT_FNS[sort]);
    const rest = ours.filter((c) => !isPinned(c)).sort(SORT_FNS[sort]);
    return [...pinnedCards, ...rest];
  }, [communities, pins, cats, sort]);

  const discover = useMemo(
    () =>
      communities
        .filter((c) => !c.is_member && !c.is_founder && (cats.length === 0 || cats.includes(c.category)))
        .sort(SORT_FNS[sort]),
    [communities, cats, sort],
  );

  // v8 CommunityView.jsx:26 — search matches name or description, across BOTH lists.
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
      {/* v8 (CommunityView.jsx:43-75) — search row + tabs live in ONE sticky header
          block: top 0, paper bg, slate-200 bottom rule. */}
      {/* QA #11 follow-up — the app bar is lg:hidden, so the offset must be
          responsive: 56px below lg (pin under the app bar), 0 on desktop
          (a fixed 56 left a gap cards scrolled through — the "overlap"). */}
      <div className="top-[56px] lg:top-0" style={{ position: "sticky", zIndex: 4, background: "var(--paper)", borderBottom: "1px solid var(--slate-200)", padding: "12px 16px 10px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          {/* v8 CommunityView.jsx:45-61 — a REAL search input (local filter),
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
            {/* v8 :54-60 — the filter trigger lives INSIDE the search box (market precedent). */}
            <button
              type="button"
              onClick={openSheet}
              aria-label={`Filters${activeFilterCount ? ` · ${activeFilterCount} active` : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0, padding: 0,
                background: "none", border: "none", cursor: "pointer",
                color: activeFilterCount ? "var(--stamp-red)" : "var(--slate-400)",
              }}
            >
              <Filter size={17} strokeWidth={2} />
              {activeFilterCount > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{activeFilterCount}</span>}
            </button>
          </div>
          <Button size="sm" variant="primary" icon={<PlusCircle size={15} />} onClick={() => router.push("/community/new")}>
            Create
          </Button>
        </div>

        {/* QA2 — Discover / Joined as explicit tabs so Discover stays reachable after you've
            joined several communities; the tab is URL-backed so back-navigation restores it.
            v8 :64 — the tabs hide while a search query is active (flat merged results). */}
        {!q && (
          <Segmented
            style={{ marginTop: 10 }}
            value={tab}
            onChange={(v) => selectTab(v as Tab)}
            options={[
              /* v8 (CommunityView.jsx:67-70) — yours first with its count in parentheses,
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
        /* v8 :78-84 — search mode: flat merged results (yours first) + mono counter. */
        <div style={{ padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Joined communities surfacing in search still carry their pin control
                (the card only renders it for members). */}
            {results.map((c) => <CommunityCard key={c.id} community={c} pinned={pins.includes(c.id)} onTogglePin={() => togglePin(c.id)} />)}
          </div>
          {results.length === 0 && <EmptyNote>No communities match &ldquo;{q}&rdquo;.</EmptyNote>}
        </div>
      ) : tab === "joined" ? (
        /* v8 :86-91 — a plain card list; no section headers, no helper prose.
           Pin-first ordering (v8 pinFn) is already baked into `mine`. */
        <div style={{ padding: "18px 16px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mine.map((c) => (
              <CommunityCard key={c.id} community={c} pinned={pins.includes(c.id)} onTogglePin={() => togglePin(c.id)} />
            ))}
            {mine.length === 0 && (
              /* v8 (CommunityView.jsx:90) exact copy. */
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
            {discover.map((c) => <CommunityCard key={c.id} community={c} pinned={pins.includes(c.id)} onTogglePin={() => togglePin(c.id)} />)}
            {/* v8 (CommunityView.jsx:97) exact copy for both Discover empties. */}
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

      {/* v8 CommunityView.jsx:102-129 — the filter sheet. Shell follows our responsive
          sheet convention (ReportSheet: bottom sheet on mobile, centered on sm+)
          rather than v8's mobile-only bottom sheet. */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            role="dialog"
            aria-label="Filters"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480, maxHeight: "78%", overflowY: "auto",
              background: "var(--paper)", borderRadius: "20px 20px 0 0",
              padding: "10px 18px 20px", boxShadow: "var(--shadow-4)",
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "4px auto 14px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Filters</div>
              <button
                type="button"
                onClick={clearSheet}
                style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13 }}
              >
                Clear
              </button>
            </div>

            <SectionLabel>Sort by</SectionLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              <FilterChip active={draftSort === "members"} onClick={() => setDraftSort("members")}>Most members</FilterChip>
              <FilterChip active={draftSort === "newest"} onClick={() => setDraftSort("newest")}>Newest</FilterChip>
              <FilterChip active={draftSort === "name"} onClick={() => setDraftSort("name")}>Name (A–Z)</FilterChip>
            </div>

            <div style={{ marginTop: 20 }}><SectionLabel>Category</SectionLabel></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              {CATEGORIES.map((c) => (
                <FilterChip key={c.id} active={draftCats.includes(c.id)} onClick={() => toggleDraftCat(c.id)}>
                  {c.chipLabel}
                </FilterChip>
              ))}
            </div>

            <Button variant="dark" size="block" style={{ marginTop: 22 }} onClick={applySheet}>
              Apply filters
            </Button>
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
