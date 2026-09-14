"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, Heart, X, Plus, ShoppingBag, Eye, Tag, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { timeAgo } from "@/lib/utils";
import { ApiListing, ApiPost, MarketCard, refTone } from "@/components/cards";
import { Avatar, Button, Money, ProductPhoto } from "@/components/ui";
import { goldFrameRing, hasGoldFrame } from "@/components/gamification";
import { ADD_CATEGORIES, conditionsFor } from "@/lib/catalog";

// Category multi-select (design: [] = All). ids match the substring stored on listings.
// v8 MarketView renders these from the global CATEGORIES using chipLabel, in this
// order (figures → diecast → kits → designer → tcg). Read from the shared list rather
// than re-typed here — a local copy is how "Action Figure" and "Action Figures" ended up
// naming the same category on two screens (Change Spec §4.2).
const CATEGORIES = ADD_CATEGORIES;

// QA 2026-08-04 §6 — the keep-for-later action is a LIKE that lives exactly as long
// as the listing (the browse query is pinned to status == "available"). Saving-for-later
// across time is what the catalogue wishlist is for. DV8 §6 settled the surface WORD:
// the heart reads "Saved" everywhere (quick filter, sort, header, empty state) while
// the mechanism stays the like endpoint.
const SORTS = [
  { id: "new", label: "Newest" },
  { id: "low", label: "Price ↑" },
  { id: "high", label: "Price ↓" },
  { id: "liked", label: "Most saved" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

type IsoSort = "new" | "budgetHigh" | "budgetLow";

const PAGE_SIZE = 24;

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-400)", marginBottom: 8 }}>
      {children}
    </div>
  );
}

// `red` = the v8 quick-filter treatment (Saved / Listed by me light up stamp-red);
// every other chip keeps the slate-900 active state from the Database sheet.
function FilterChip({ active, onClick, children, icon: Icon, red, fillIcon }: {
  active?: boolean; onClick: () => void; children: React.ReactNode;
  icon?: React.ElementType; red?: boolean; fillIcon?: boolean;
}) {
  const activeBg = red ? "var(--stamp-red)" : "var(--slate-900)";
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: red ? 6 : 5,
      padding: "7px 13px", borderRadius: 10, cursor: "pointer", transition: "all 120ms",
      border: `1px solid ${active ? activeBg : "var(--slate-200)"}`,
      background: active ? activeBg : "var(--slate-50)", color: active ? "var(--paper)" : "var(--slate-700)",
      fontFamily: "var(--font-body)", fontWeight: active && red ? 700 : 500, fontSize: 12.5, whiteSpace: "nowrap", lineHeight: 1,
    }}>
      {Icon && <Icon size={red ? 14 : 13} strokeWidth={1.75} fill={fillIcon && active ? "currentColor" : "none"} />}
      {children}
    </button>
  );
}

// Boxed ₹ numeric input (From/To price range + the ISO Max budget field).
// v8:281,287,349 — border-strong on paper-soft, same tokens as the search field.
function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-faint)" }}>₹</span>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14.5, color: "var(--ink)" }} />
    </div>
  );
}

// ── Search field with the filter trigger living INSIDE it (v8 Database pattern),
// plus the board's red primary action to its right (v8 MarketView MarketSearchRow).
function MarketSearchRow({ q, onQ, placeholder, activeCount, onFilter, actionLabel, actionHref, actionIcon: ActionIcon }: {
  q: string; onQ: (v: string) => void; placeholder: string;
  activeCount: number; onFilter: () => void;
  actionLabel: string; actionHref: string; actionIcon: React.ElementType;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9, height: 44, padding: "0 14px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
        <Search size={18} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
        <input value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)" }} />
        {q && (
          <button type="button" onClick={() => onQ("")} aria-label="Clear search" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink-faint)", display: "flex", flexShrink: 0 }}>
            <X size={15} />
          </button>
        )}
        <button type="button" onClick={onFilter} aria-label={`Filters${activeCount ? ` · ${activeCount} active` : ""}`} style={{
          display: "flex", alignItems: "center", gap: 4, flexShrink: 0, padding: 0, marginRight: -2,
          background: "none", border: "none", cursor: "pointer",
          color: activeCount ? "var(--stamp-red)" : "var(--ink-faint)",
        }}>
          <Filter size={18} strokeWidth={2} />
          {activeCount > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{activeCount}</span>}
        </button>
      </div>
      <Link href={actionHref} style={{
        display: "flex", alignItems: "center", gap: 5, height: 44, padding: "0 13px", flexShrink: 0,
        borderRadius: 12, background: "var(--stamp-red)", textDecoration: "none",
        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", whiteSpace: "nowrap",
      }}>
        <ActionIcon size={15} strokeWidth={2.4} />
        {actionLabel}
      </Link>
    </div>
  );
}

// ── Wanted card — an ISO shown as a product tile, mirroring MarketCard (v8 WantedCard).
// "I have this" opens a DM to the author with the wanted item as context — the exact
// mechanism ISOCard uses on the feed (POST /threads → /chat/{id}); hidden on own posts.
function WantedCard({ post }: { post: ApiPost }) {
  const router = useRouter();
  const { user } = useUser();
  const [dmBusy, setDmBusy] = useState(false);
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeBusy, setLikeBusy] = useState(false);
  const isOwn = !!user && user.id === post.user_id;

  const title = post.iso_item ?? post.title ?? post.body.slice(0, 60);
  const firstName = (post.name ?? post.handle ?? "Collector").split(" ")[0];

  // Same glass heart as MarketCard, on the post's own like endpoint.
  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (likeBusy) return;
    const next = !liked;
    setLiked(next); // optimistic
    setLikeBusy(true);
    try { await api.post(`/posts/${post.id}/like`); }
    catch { setLiked(!next); }
    finally { setLikeBusy(false); }
  }

  // DV8 §10#22 (v8 Chat.jsx:90) — an EDITABLE draft, never auto-sent: create/reuse
  // the pair thread with NO initial_message, then open the chat composer pre-filled
  // + focused (?draft=1&intent=iso); a referenced catalogue sku rides the first send.
  async function haveThis(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (dmBusy) return;
    setDmBusy(true);
    try {
      const thread = await api.post<{ id: string }>("/threads", {
        other_user_id: post.user_id,
      });
      const skuQs = post.ref_sku ? `&sku=${encodeURIComponent(post.ref_sku)}` : "";
      router.push(`/chat/${thread.id}?draft=1&intent=iso&title=${encodeURIComponent(title)}${skuQs}`);
    } catch {
      router.push("/inbox");
    } finally {
      setDmBusy(false);
    }
  }

  // QA design-consistency (founder 2026-09-13, round 2) — the Wanted tile is a
  // STRUCTURAL TWIN of MarketCard: same Link shell with hover lift + shadow,
  // same glass heart on the photo, same body rows (title → money → author →
  // 34px ink CTA). The condition/city pills moved to the post detail page —
  // MarketCard shows none on the tile either. Wanted keeps only the BUDGET
  // micro-label and the "I have this" wording.
  return (
    <Link
      href={`/post/${post.id}`}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.025) translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--card-shadow-lifted)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; e.currentTarget.style.boxShadow = "none"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      style={{
        background: "var(--card-surface)",
        border: `1px solid ${isOwn ? "var(--verified-teal)" : "var(--slate-200)"}`,
        borderRadius: 16, overflow: "hidden", textAlign: "left",
        padding: 0, display: "flex", flexDirection: "column", textDecoration: "none",
        boxShadow: "var(--card-shadow)", transition: "transform 80ms var(--ease-out), box-shadow 80ms",
      }}
    >
      <div style={{ position: "relative" }}>
        <ProductPhoto tone={refTone(post.ref_sku ?? null)} src={post.images[0]} ratio="1/1" rounded={0} />
        <div
          onClick={toggleLike}
          title={liked ? "Unlike" : "Like"}
          style={{
            position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: 10,
            background: liked ? "rgba(255,36,66,0.80)" : "rgba(15,23,42,0.46)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--paper)", cursor: likeBusy ? "default" : "pointer", transition: "background 150ms",
          }}
        >
          <Heart size={16} fill={liked ? "var(--stamp-red)" : "none"} />
        </div>
      </div>

      <div style={{ padding: "11px 12px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 32 }}>{title}</div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>BUDGET</span>
          {/* iso_budget arrives in PAISE (same as ISOCard) — divide before rendering. */}
          <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
            {post.iso_budget ? <Money value={Math.round(Number(post.iso_budget) / 100)} /> : "Open"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-faint)" }}>
          {/* v8:474 avatarFrame — Pioneer/Early Believer authors ring gold, the
              same First-Start rule the feed's comment rows use. */}
          <span style={{ display: "inline-flex", flexShrink: 0, ...(hasGoldFrame(post.badge) ? goldFrameRing : {}) }}>
            <Avatar name={post.name ?? "?"} photo={post.avatar_url} size={16} />
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName} · {timeAgo(post.created_at)}</span>
        </div>

        {!isOwn && (
          <div
            role="button"
            tabIndex={0}
            onClick={haveThis}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "auto", height: 34,
              borderRadius: 11, background: "var(--ink)", color: "var(--paper)", cursor: dmBusy ? "default" : "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
            }}
          >
            <MessageSquare size={14} />{dmBusy ? "Opening…" : "I have this"}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MarketPage() {
  const [board, setBoard] = useState<"sale" | "wanted">("sale");

  // ── For-sale board state ──
  const [list, setList] = useState<ApiListing[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saleTabCount, setSaleTabCount] = useState(0);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState<SortId>("new");
  const [cats, setCats] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conds, setConds] = useState<string[]>([]);
  // DV8 quick filters — Saved rides the like endpoint (liked=true, server-side);
  // "Listed by me" has no /listings query param, so it filters the fetched pages
  // client-side on the is_mine flag the browse payload already carries.
  const [savedOnly, setSavedOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

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
    // DV8-10 — chips carry the stored condition ids directly (per-category vocabulary);
    // the backend stores the same ids for new listings, conditionLabel handles legacy.
    conds.forEach((c) => p.append("condition", c));
    if (minPrice) p.set("min_price", String(Number(minPrice) * 100));
    if (maxPrice) p.set("max_price", String(Number(maxPrice) * 100));
    if (savedOnly) p.set("liked", "true");
    return p.toString();
  }, [sort, debouncedQuery, cats, conds, minPrice, maxPrice, savedOnly]);

  // Refetch from page 1 whenever a filter/search/sort changes.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flips the loading flag for the fetch this effect starts; resolved async in .finally
    setLoading(true);
    api.get<{ items: ApiListing[]; total: number; has_more: boolean }>(`/listings?${buildParams(1)}`)
      .then((d) => { if (!cancelled) { setList(d?.items ?? []); setTotal(d?.total ?? 0); setHasMore(d?.has_more ?? false); setPage(1); } })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [buildParams]);

  // Board-tab count — the UNFILTERED listing total (v8 shows it beside "For sale").
  useEffect(() => {
    api.get<{ total: number }>("/listings?limit=1").then((d) => setSaleTabCount(d?.total ?? 0)).catch(() => {});
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

  // Condition vocabulary is category-specific (figures use MISB/MIB, TCG uses
  // Mint/Played) — chips only appear once a category narrows them down, and with
  // ≥2 categories selected each category gets its own sub-headed group (v8
  // MarketView.jsx:296-311) instead of one deduped soup.
  // Sub-heads use chipLabel (singular) — same wording as the chips (v8:98).
  const condsByCat = useMemo(() => cats.map((id) => ({
    cat: id,
    label: CATEGORIES.find((c) => c.id === id)?.chipLabel ?? id,
    options: conditionsFor(id),
  })), [cats]);

  // Deselecting a category drops its now-orphaned condition picks (v8 MarketView) —
  // done in the toggle handler, not an effect, so state settles in one render.
  const toggleCat = (val: string) => {
    const next = cats.includes(val) ? cats.filter((x) => x !== val) : [...cats, val];
    setCats(next);
    if (next.length > 0) {
      const allowed = next.flatMap((cid) => conditionsFor(cid).map((c) => c.id));
      setConds((cs) => cs.filter((c) => allowed.includes(c)));
    }
  };

  const activeCount = [
    sort !== "new", cats.length > 0, minPrice !== "", maxPrice !== "",
    conds.length > 0, savedOnly, mineOnly,
  ].filter(Boolean).length;

  const resetAll = () => {
    setSort("new"); setCats([]); setMinPrice(""); setMaxPrice("");
    setConds([]); setSavedOnly(false); setMineOnly(false); setQuery("");
  };

  const filtersActive = activeCount > 0 || debouncedQuery.trim() !== "";
  const isEmpty = !loading && total === 0 && !filtersActive;

  // "Listed by me" is a client-side pass over the fetched pages (no server param).
  const shown = useMemo(() => (mineOnly ? list.filter((l) => l.is_mine) : list), [list, mineOnly]);
  const shownCount = mineOnly ? shown.length : total;

  // ── Wanted (ISO) board state ──
  // Data source: the feed with its server-side type filter (routers/feed.py takes
  // `type` and pins Post.type == "iso"); there is no /posts list endpoint. Search,
  // category, sort and budget then run client-side over that page (v8 parity).
  const [allIso, setAllIso] = useState<ApiPost[]>([]);
  const [isoLoading, setIsoLoading] = useState(true);
  const [isoQuery, setIsoQuery] = useState("");
  const [isoFilterOpen, setIsoFilterOpen] = useState(false);
  const [isoCats, setIsoCats] = useState<string[]>([]);
  const [isoSort, setIsoSort] = useState<IsoSort>("new");
  const [isoMaxBudget, setIsoMaxBudget] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get<{ items: ApiPost[] }>("/feed?type=iso&sort=latest&limit=50")
      .then((d) => { if (!cancelled) setAllIso(d?.items ?? []); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setIsoLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isoActiveCount = [isoCats.length > 0, isoSort !== "new", isoMaxBudget !== ""].filter(Boolean).length;
  const isoReset = () => { setIsoCats([]); setIsoSort("new"); setIsoMaxBudget(""); setIsoQuery(""); };

  const isoList = useMemo(() => {
    let l = allIso;
    if (isoQuery.trim()) {
      const q = isoQuery.toLowerCase();
      l = l.filter((p) => `${p.iso_item ?? ""} ${p.body} ${p.name ?? ""} ${p.handle ?? ""} ${p.iso_city ?? ""}`.toLowerCase().includes(q));
    }
    if (isoCats.length > 0) l = l.filter((p) => isoCats.includes(p.category ?? ""));
    // Budget input is rupees; iso_budget is paise. Open-budget posts (no figure)
    // pass a max-budget filter — v8 treats them as 0.
    if (isoMaxBudget !== "") l = l.filter((p) => (p.iso_budget ?? 0) / 100 <= Number(isoMaxBudget));
    if (isoSort === "budgetHigh") l = [...l].sort((a, b) => (b.iso_budget ?? 0) - (a.iso_budget ?? 0));
    else if (isoSort === "budgetLow") l = [...l].sort((a, b) => (a.iso_budget ?? 0) - (b.iso_budget ?? 0));
    return l;
  }, [allIso, isoQuery, isoCats, isoSort, isoMaxBudget]);

  const BOARDS = [
    { id: "sale" as const, label: "For sale", icon: ShoppingBag, count: saleTabCount },
    { id: "wanted" as const, label: "Wanted", icon: Eye, count: allIso.length },
  ];

  return (
    // Unified 680px column (founder, 2026-07-11) — was the 1100px grid width,
    // which made Market read wider than every sibling page.
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]">

        {/* Board tabs — selling vs looking (v8 MarketView.jsx:197). Not the shared
            Segmented: v8 gives Market its own slate-100 pill group with icon+count. */}
        <div style={{ display: "flex", gap: 4, margin: "12px 16px 0", background: "var(--slate-100)", borderRadius: 14, padding: 4 }}>
          {BOARDS.map((b) => {
            const on = board === b.id;
            const BIcon = b.icon;
            return (
              <button key={b.id} type="button" onClick={() => setBoard(b.id)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: "none", cursor: "pointer", borderRadius: 10, padding: "8px 6px",
                background: on ? "var(--paper)" : "transparent",
                color: on ? "var(--ink)" : "var(--slate-500)",
                fontFamily: "var(--font-body)", fontWeight: on ? 700 : 500, fontSize: 13.5,
                boxShadow: on ? "var(--shadow-2)" : "none", transition: "all 130ms", whiteSpace: "nowrap",
              }}>
                <BIcon size={16} strokeWidth={on ? 2.3 : 1.9} />
                {b.label}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: on ? "var(--ink-faint)" : "var(--slate-400)" }}>{b.count}</span>
              </button>
            );
          })}
        </div>

        {/* One search row per board: funnel INSIDE the field + red primary action.
            "Sell item" → your own profile (opens on the Collection tab — our sell
            flow starts from an item's List-for-sale toggle, not a standalone form). */}
        {board === "sale" ? (
          <MarketSearchRow q={query} onQ={setQuery} placeholder="Search listings, brands, sellers…"
            activeCount={activeCount} onFilter={() => setShowFilter((v) => !v)}
            actionLabel="Sell item" actionIcon={Tag} actionHref="/profile" />
        ) : (
          <MarketSearchRow q={isoQuery} onQ={setIsoQuery} placeholder="Search what collectors want…"
            activeCount={isoActiveCount} onFilter={() => setIsoFilterOpen((v) => !v)}
            actionLabel="Post wanted" actionIcon={Plus} actionHref="/compose?type=iso" />
        )}

        {board === "sale" && showFilter && (
          <div style={{ borderTop: "1px solid var(--slate-200)", padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 20, maxHeight: 460, overflowY: "auto" }}>
            {/* Quick filters lead the sheet (v8) — Saved replaces the old header
                heart button; "Listed by me" replaces nothing (new in v8). */}
            <div>
              <FilterLabel>Quick filters</FilterLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <FilterChip red fillIcon active={savedOnly} onClick={() => setSavedOnly((v) => !v)} icon={Heart}>Saved</FilterChip>
                <FilterChip red active={mineOnly} onClick={() => setMineOnly((v) => !v)} icon={Tag}>Listed by me</FilterChip>
              </div>
            </div>
            <div>
              <FilterLabel>Category</FilterLabel>
              {/* v8:257 — chip row sits 8px under the label (sale sheet only);
                  chips read chipLabel (singular — v8:259). */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
                {CATEGORIES.map((c) => <FilterChip key={c.id} active={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.chipLabel}</FilterChip>)}
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
              {cats.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 12px", borderRadius: 10, background: "var(--slate-50)", border: "1px dashed var(--slate-200)" }}>
                  <Filter size={13} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.4 }}>Pick a category above — conditions differ by category.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {condsByCat.map((group) => (
                    <div key={group.cat}>
                      {condsByCat.length > 1 && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", marginBottom: 6 }}>{group.label}</div>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {group.options.map((o) => (
                          <FilterChip key={group.cat + o.id} active={conds.includes(o.id)} onClick={() => toggleArr(setConds, o.id)}>{o.label}</FilterChip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {activeCount > 0 && (
              <button type="button" onClick={resetAll} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, textAlign: "left" }}>Reset all filters</button>
            )}
          </div>
        )}

        {board === "wanted" && isoFilterOpen && (
          <div style={{ borderTop: "1px solid var(--slate-200)", padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 20, maxHeight: 420, overflowY: "auto" }}>
            <div>
              <FilterLabel>Category</FilterLabel>
              {/* v8:335 — wanted sheet keeps no marginTop; chips read chipLabel. */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {CATEGORIES.map((c) => <FilterChip key={c.id} active={isoCats.includes(c.id)} onClick={() => toggleArr(setIsoCats, c.id)}>{c.chipLabel}</FilterChip>)}
              </div>
            </div>
            <div>
              <FilterLabel>Sort by</FilterLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <FilterChip active={isoSort === "new"} onClick={() => setIsoSort("new")}>Newest</FilterChip>
                <FilterChip active={isoSort === "budgetHigh"} onClick={() => setIsoSort("budgetHigh")}>Budget ↓</FilterChip>
                <FilterChip active={isoSort === "budgetLow"} onClick={() => setIsoSort("budgetLow")}>Budget ↑</FilterChip>
              </div>
            </div>
            <div>
              <FilterLabel>Max budget</FilterLabel>
              <div style={{ display: "flex" }}>
                <PriceInput value={isoMaxBudget} onChange={setIsoMaxBudget} placeholder="Any" />
              </div>
            </div>
            {isoActiveCount > 0 && (
              <button type="button" onClick={isoReset} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, textAlign: "left" }}>Reset all filters</button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {board === "wanted" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>
              {isoList.length} {isoList.length === 1 ? "ITEM WANTED" : "ITEMS WANTED"}
            </span>
            {isoActiveCount > 0 && (
              <button type="button" onClick={isoReset} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>Clear filters</button>
            )}
          </div>
          {isoLoading ? (
            /* QA design-consistency — same responsive grid as the For-sale board
               (2-up mobile, 3-up from sm), not a hardcoded 2-up. */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 px-3.5 pb-8">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ borderRadius: 16, background: "var(--slate-100)", aspectRatio: "1/1.5" }} />)}
            </div>
          ) : isoList.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 32px", textAlign: "center", gap: 11, color: "var(--ink-faint)" }}>
              <Eye size={28} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{allIso.length === 0 ? "Nobody’s hunting yet" : "Nothing matches these filters"}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, maxWidth: 260 }}>
                {allIso.length === 0 ? "Post an ISO and collectors with the piece will reach out." : "Try widening the category or budget."}
              </div>
              {allIso.length === 0 ? (
                <Link href="/compose?type=iso" style={{ textDecoration: "none" }}>
                  <Button variant="primary" icon={<Plus size={16} />}>Post an ISO</Button>
                </Link>
              ) : (
                <button type="button" onClick={isoReset} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stamp-red)", fontWeight: 600, fontFamily: "var(--font-body)", fontSize: 13 }}>Clear filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 px-3.5 pb-8">
              {isoList.map((p) => <WantedCard key={p.id} post={p} />)}
            </div>
          )}
        </>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 px-3.5 py-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ borderRadius: 20, background: "var(--slate-100)", aspectRatio: "1/1.4" }} />)}
        </div>
      ) : isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 32px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--slate-100)", border: "1px solid var(--slate-200)", color: "var(--slate-400)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <ShoppingBag size={28} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>Nothing listed yet</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 7, maxWidth: 270, lineHeight: 1.55 }}>
            Pick something from your collection and flip <b style={{ color: "var(--ink-soft)" }}>List for sale</b> — it shows up here instantly.
          </div>
          <Link href="/profile" style={{ textDecoration: "none", marginTop: 20 }}>
            <Button variant="primary" icon={<Tag size={17} />}>Sell an item</Button>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>
              {savedOnly ? `${shownCount} SAVED` : mineOnly ? `${shownCount} LISTED BY YOU` : `${shownCount} ${shownCount === 1 ? "LISTING" : "LISTINGS"}`}
            </span>
            {filtersActive && (
              <button type="button" onClick={resetAll} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>Clear filters</button>
            )}
          </div>
          {/* v8:420 — gap 14, 14px sides, 32px bottom: byte-matches the Wanted
              board's grid so the two boards agree (sm:grid-cols-3 kept — web). */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 px-3.5 pb-8">
            {shown.map((l) => <MarketCard key={l.id} listing={l} />)}
            {shown.length === 0 && (
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 0", color: "var(--ink-faint)", textAlign: "center" }}>
                {savedOnly ? <Heart size={26} style={{ opacity: 0.35 }} /> : mineOnly ? <Tag size={26} style={{ opacity: 0.35 }} /> : <Filter size={26} style={{ opacity: 0.35 }} />}
                <div style={{ fontSize: 13.5, marginTop: 10 }}>
                  {savedOnly ? "Nothing saved yet." : mineOnly ? "You have nothing listed right now." : "No listings match these filters."}
                </div>
                {savedOnly && !mineOnly ? (
                  <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--ink-ghost)" }}>Tap the heart on any listing to keep it here while it&rsquo;s live.</div>
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
