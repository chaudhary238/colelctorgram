"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Bookmark, X, Plus, Send, ShoppingBag, Edit3 } from "lucide-react";
import { api } from "@/lib/api";
import { ApiListing, ApiPost, MarketCard, PostCard } from "@/components/cards";
import { Segmented } from "@/components/ui";

// Category multi-select (design: [] = All). ids match the substring stored on listings.
// v4 MarketView renders these from the global CATEGORIES using chipLabel, in this
// order (figures → diecast → kits → designer → tcg). Kept in lockstep with v4.
const CATEGORIES = [
  { id: "figures", label: "Action Figure" },
  { id: "diecast", label: "Diecast" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "designer", label: "Designer Toys & Blind Boxes" },
  { id: "tcg", label: "Trading Cards (TCG)" },
];

const SORTS = [
  { id: "new", label: "Newest" },
  { id: "low", label: "Price ↑" },
  { id: "high", label: "Price ↓" },
  { id: "saved", label: "Most Saved" },
  { id: "watched", label: "Most Watched" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

// Condition chips → canonical listing.condition keys (mirrors AddListing's mapping).
const COND_OPTIONS = ["Sealed", "MIB", "BIB", "Loose"];
const COND_MAP: Record<string, string> = { Sealed: "sealed_misb", MIB: "mint", BIB: "like_new", Loose: "good" };

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-400)", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children, icon: Icon, center }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ElementType; center?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: 5,
      padding: "7px 13px", borderRadius: 10, cursor: "pointer", transition: "all 120ms",
      border: `1px solid ${active ? "var(--slate-900)" : "var(--slate-200)"}`,
      background: active ? "var(--slate-900)" : "var(--slate-50)", color: active ? "var(--paper)" : "var(--slate-700)",
      fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap", lineHeight: 1,
    }}>
      {Icon && <Icon size={13} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

// Boxed ₹ numeric input for the From/To price range (v3 dropped the dual-thumb slider).
function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 12px", borderRadius: 11, border: "1px solid var(--slate-200)", background: "var(--card-surface)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-faint)" }}>₹</span>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14.5, color: "var(--ink)" }} />
    </div>
  );
}

const PAGE_SIZE = 24;

// ── ISO Board — v3 ISOBoardContent: all live ISO posts ("N collectors looking" + Post ISO).
// Sources from the feed with type=iso; renders via PostCard (→ ISOCard for type 'iso').
function IsoBoard() {
  const [isos, setIsos] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<{ items: ApiPost[] }>("/feed?type=iso&sort=latest&limit=50")
      .then((d) => { if (!cancelled) setIsos(d?.items ?? []); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    // QA 9.1 — sits directly inside Market's 680px column (like the Browse grid),
    // not a nested column of its own, so the ISO board reads consistently with Market.
    <div className="w-full" style={{ paddingBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>
          {isos.length} {isos.length === 1 ? "COLLECTOR" : "COLLECTORS"} LOOKING
        </span>
        <Link href="/compose?type=iso" style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13 }}>
          <Edit3 size={14} strokeWidth={2.2} />Post ISO
        </Link>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 14px" }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ borderRadius: 20, background: "var(--slate-100)", height: 132 }} />)}
        </div>
      ) : isos.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 32px", textAlign: "center", gap: 12, color: "var(--ink-faint)" }}>
          <Search size={28} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>No ISOs yet</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, maxWidth: 260 }}>Be the first — let collectors know what you&apos;re hunting.</div>
          <Link href="/compose?type=iso" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 4, height: 44, padding: "0 18px", borderRadius: 12, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5 }}>
            <Edit3 size={16} strokeWidth={2.2} />Post an ISO
          </Link>
        </div>
      ) : (
        <div>{isos.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}
    </div>
  );
}

export default function MarketPage() {
  const [tab, setTab] = useState<"browse" | "iso">("browse");

  const [list, setList] = useState<ApiListing[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState<SortId>("new");
  const [cats, setCats] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conds, setConds] = useState<string[]>([]);
  const [shipOnly, setShipOnly] = useState(false);

  // Debounce the search box so each keystroke doesn't hit the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const buildParams = useCallback((pageNum: number) => {
    const p = new URLSearchParams();
    p.set("limit", String(PAGE_SIZE));
    p.set("page", String(pageNum));
    p.set("sort", sort);
    if (debouncedQuery.trim()) p.set("q", debouncedQuery.trim());
    cats.forEach((c) => p.append("category", c));
    conds.forEach((c) => p.append("condition", COND_MAP[c]));
    if (minPrice) p.set("min_price", String(Number(minPrice) * 100));
    if (maxPrice) p.set("max_price", String(Number(maxPrice) * 100));
    if (shipOnly) p.set("ship", "true");
    if (showSaved) p.set("saved", "true");
    return p.toString();
  }, [sort, debouncedQuery, cats, conds, minPrice, maxPrice, shipOnly, showSaved]);

  // Refetch from page 1 whenever a filter/search/sort changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<{ items: ApiListing[]; total: number; has_more: boolean }>(`/listings?${buildParams(1)}`)
      .then((d) => { if (!cancelled) { setList(d?.items ?? []); setTotal(d?.total ?? 0); setHasMore(d?.has_more ?? false); setPage(1); } })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [buildParams]);

  // Saved-count badge (best-effort, fetched once).
  useEffect(() => {
    api.get<{ total: number }>("/listings?saved=true&limit=1").then((d) => setSavedCount(d?.total ?? 0)).catch(() => {});
  }, []);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    api.get<{ items: ApiListing[]; has_more: boolean }>(`/listings?${buildParams(next)}`)
      .then((d) => { setList((cur) => [...cur, ...(d?.items ?? [])]); setHasMore(d?.has_more ?? false); setPage(next); })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  };

  const toggleArr = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    set((a) => (a.includes(val) ? a.filter((x) => x !== val) : [...a, val]));

  const activeCount = [
    sort !== "new", cats.length > 0, minPrice !== "", maxPrice !== "",
    conds.length > 0, shipOnly,
  ].filter(Boolean).length;

  const resetAll = () => {
    setSort("new"); setCats([]); setMinPrice(""); setMaxPrice("");
    setConds([]); setShipOnly(false); setQuery("");
  };

  const filtersActive = activeCount > 0 || debouncedQuery.trim() !== "";
  const isEmpty = !loading && total === 0 && !filtersActive && !showSaved;

  // 44×44 slate icon button; saved active = stamp-red, filter active = slate-900.
  const iconBtn = (active: boolean, activeBg: string): React.CSSProperties => ({
    position: "relative", width: 44, height: 44, borderRadius: 13, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    border: `1px solid ${active ? activeBg : "var(--slate-200)"}`,
    background: active ? activeBg : "var(--card-surface)", color: active ? "var(--paper)" : "var(--slate-700)",
    boxShadow: active ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
  });
  const badge = (n: number) => (
    <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 3px", borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)", fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid var(--paper)" }}>{n}</span>
  );

  return (
    // Unified 680px column (founder, 2026-07-11) — was the 1100px grid width,
    // which made Market read wider than every sibling page.
    <div className="w-full max-w-[680px] flex flex-col">
      {/* Both tabs share the unified 680px column, so the header spans it always. */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]">
        <div style={{ padding: "12px 16px 0", boxSizing: "border-box" }}>
          <Segmented
            options={[{ id: "browse", label: "Browse" }, { id: "iso", label: "ISO Board" }]}
            value={tab}
            onChange={(t) => setTab(t)}
          />
        </div>

        {tab === "browse" && (
          <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, height: 44, padding: "0 14px", borderRadius: 13, border: "1px solid var(--slate-200)", background: "var(--card-surface)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <Search size={17} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings, brands, sellers…"
                style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }} />
              {query && (
                <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink-faint)", display: "flex" }}>
                  <X size={15} />
                </button>
              )}
            </div>
            <button type="button" onClick={() => { setShowSaved((v) => !v); setShowFilter(false); }} style={iconBtn(showSaved, "var(--stamp-red)")} aria-label="Saved listings">
              <Bookmark size={18} fill={showSaved ? "currentColor" : "none"} />
              {savedCount > 0 && !showSaved && badge(savedCount)}
            </button>
            <button type="button" onClick={() => { setShowFilter((v) => !v); setShowSaved(false); }} style={iconBtn(showFilter || activeCount > 0, "var(--slate-900)")} aria-label="Filters">
              <SlidersHorizontal size={18} />
              {activeCount > 0 && badge(activeCount)}
            </button>
          </div>
        )}

        {tab === "browse" && showFilter && (
          <div style={{ borderTop: "1px solid var(--slate-200)", padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 20, maxHeight: 460, overflowY: "auto" }}>
            <div>
              <FilterLabel>Category</FilterLabel>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {CATEGORIES.map((c) => <FilterChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleArr(setCats, c.id)}>{c.label}</FilterChip>)}
              </div>
              {cats.length > 0 && (
                <button type="button" onClick={() => setCats([])} style={{ marginTop: 7, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontSize: 12 }}>Clear category selection</button>
              )}
            </div>
            <div>
              <FilterLabel>Sort by</FilterLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SORTS.map((o) => <FilterChip key={o.id} active={sort === o.id} onClick={() => setSort(o.id)}>{o.label}</FilterChip>)}
              </div>
            </div>
            <div>
              <FilterLabel>Price range</FilterLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <PriceInput value={minPrice} onChange={setMinPrice} placeholder="From" />
                <span style={{ flexShrink: 0, color: "var(--ink-faint)", fontSize: 13 }}>–</span>
                <PriceInput value={maxPrice} onChange={setMaxPrice} placeholder="To" />
              </div>
            </div>
            <div>
              <FilterLabel>Condition</FilterLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {COND_OPTIONS.map((c) => <FilterChip key={c} active={conds.includes(c)} onClick={() => toggleArr(setConds, c)}>{c}</FilterChip>)}
              </div>
            </div>
            <div>
              <FilterLabel>Quick filters</FilterLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <FilterChip active={shipOnly} onClick={() => setShipOnly((v) => !v)} icon={Send}>Shipping incl.</FilterChip>
              </div>
            </div>
            {activeCount > 0 && (
              <button type="button" onClick={resetAll} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, textAlign: "left" }}>Reset all filters</button>
            )}
          </div>
        )}
      </div>

      {tab === "iso" ? (
        <IsoBoard />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 py-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ borderRadius: 20, background: "var(--slate-100)", aspectRatio: "1/1.4" }} />)}
        </div>
      ) : isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 32px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--slate-100)", border: "1px solid var(--slate-200)", color: "var(--slate-400)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <ShoppingBag size={28} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>Nothing listed yet</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 7, maxWidth: 270, lineHeight: 1.55 }}>
            Add an item and flip <b style={{ color: "var(--ink-soft)" }}>List for sale</b> — it shows up here instantly.
          </div>
          <Link href="/add/catalogue" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20, height: 44, padding: "0 18px", borderRadius: 12, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5 }}>
            <Plus size={17} strokeWidth={2.4} />Add an item
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>
              {showSaved ? `${total} SAVED` : `${total} ${total === 1 ? "LISTING" : "LISTINGS"}`}
            </span>
            {filtersActive && !showSaved && (
              <button type="button" onClick={resetAll} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>Clear filters</button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-3">
            {list.map((l) => <MarketCard key={l.id} listing={l} />)}
            {list.length === 0 && (
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 0", color: "var(--ink-faint)", textAlign: "center" }}>
                {showSaved ? <Bookmark size={26} style={{ opacity: 0.35 }} /> : <SlidersHorizontal size={26} style={{ opacity: 0.35 }} />}
                <div style={{ fontSize: 13.5, marginTop: 10 }}>{showSaved ? "No saved listings yet." : "No listings match these filters."}</div>
                {showSaved ? (
                  <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--ink-ghost)" }}>Tap the bookmark on any listing to save it here.</div>
                ) : (
                  <button type="button" onClick={resetAll} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "var(--stamp-red)", fontWeight: 600, fontFamily: "var(--font-body)", fontSize: 13 }}>Clear filters</button>
                )}
              </div>
            )}
          </div>
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 20px 28px" }}>
              <button type="button" onClick={loadMore} disabled={loadingMore} style={{ height: 42, padding: "0 22px", borderRadius: 13, border: "1px solid var(--slate-200)", background: "var(--card-surface)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: loadingMore ? "wait" : "pointer" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
