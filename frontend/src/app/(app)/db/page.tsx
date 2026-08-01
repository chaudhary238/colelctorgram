"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Plus, Star, Check, ShieldCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { ProductPhoto, SectionLabel, Button } from "@/components/ui";
import { fireToast } from "@/components/gamification";
import { ContributeGuidelines } from "@/components/ContributeGuidelines";
import { ADD_CATEGORIES, CAT_SCALES } from "@/lib/catalog";

/**
 * Database tab — the Scorred DB (design_v7 app/ExploreView.jsx, DV7-02 + DV7-07 + DV7-08).
 * Route is `/db`.
 *
 * NAME: v7's handoff renamed this tab Database → "Explore"; the founder reverted it to
 * **Database** on 2026-08-01. Don't re-apply the v7 rename.
 *
 * SCOPE: the search box matches **catalogue items only** — title, brand, SKU. DV7-06 briefly
 * made it global (scope chips across Posts / People / Communities / Events); that was
 * reverted (Change Spec §3), so there is no `/search` call here any more. Global search is
 * its own screen at `/search`, reached from the header.
 *
 * Layout (Change Spec §3.1) — ONE row of three controls:
 *   [ 🔍 search field …………………………… ⚙ ] [ ＋ Add item ]
 * The filter trigger lives INSIDE the field at its right edge (icon only, no divider, no
 * container of its own) so the field reads as a single object; it carries the active-filter
 * count inline when filters are on. The field may shrink; Add item may not — that pairing is
 * what keeps all three visible at the 390px baseline without wrapping or clipping. The item
 * count sits BELOW the row, and the old full-width "Add item" footer button is gone.
 *
 * Web deviations from v7 (deliberate):
 *  - Star = wishlist, not Bookmark. The web icon law (2026-07-11) reserves Bookmark for
 *    saving CONTENT; v7's prototype uses a bookmark glyph here. Star keeps /db, /db/[sku]
 *    and the profile grid consistent.
 *  - No star-rating row: ratings were removed app-wide in the 2026-07-18 QA pass.
 *  - 3-up grid from `sm` (the web column is 680px, not a 390px phone).
 */

interface DbItem {
  sku: string;
  title: string;
  brand: string;
  category: string;
  scale: string | null;
  year: string | null;
  thumbnail_url: string | null;
  est_retail_price: number;
  pending: boolean;
  is_official: boolean;
  owners_count: number;
  wishlists_count: number;
  viewer_status: string | null;
}

type SortId = "owned" | "wishlisted" | "newest";
const SORTS: { id: SortId; label: string }[] = [
  { id: "owned", label: "Most owned" },
  { id: "wishlisted", label: "Most wishlisted" },
  { id: "newest", label: "Newest" },
];
const DEFAULT_SORT: SortId = "owned";

// Change Spec §3.2 — 8 up front, +8 per tap. Server-side paging, so "show more" is one
// request for one page rather than a slice of an oversized payload.
const PAGE_SIZE = 8;
const OWNS = (s: string | null) => s === "owned" || s === "preorder";

/** Sort scales the way a collector reads them: 1/6 before 1/12 before 1/144, text last. */
const scaleRank = (s: string) => {
  const m = /^1\s*\/\s*(\d+)$/.exec(s.trim());
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
};
const sortScales = (xs: string[]) =>
  [...new Set(xs)].sort((a, b) => scaleRank(a) - scaleRank(b) || a.localeCompare(b));

function FilterChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "7px 13px", borderRadius: 999, cursor: "pointer", transition: "all 120ms",
      border: `1px solid ${active ? "var(--ink)" : "var(--border-strong)"}`,
      background: active ? "var(--ink)" : "var(--paper-soft)", color: active ? "var(--paper)" : "var(--ink)",
      fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap", lineHeight: 1.2,
    }}>
      {children}
    </button>
  );
}

/**
 * Category chip for the filter sheet (Change Spec §4.1). A TICK chip, not a radio row:
 * the check mark is what tells you at a glance that several can be on at once. There is
 * deliberately no "All categories" option — an empty selection already means unrestricted,
 * and an explicit "all" alongside real ticks reads like a sixth category.
 */
function TickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: active ? "7px 13px 7px 10px" : "7px 13px",
        borderRadius: 999, cursor: "pointer", transition: "all 120ms",
        border: `1px solid ${active ? "var(--stamp-red)" : "var(--border-strong)"}`,
        background: active ? "var(--stamp-red)" : "var(--paper-soft)",
        color: active ? "var(--paper)" : "var(--ink)",
        fontFamily: "var(--font-body)", fontWeight: active ? 700 : 500, fontSize: 12.5,
        whiteSpace: "nowrap", lineHeight: 1.2,
      }}
    >
      {active && <Check size={13} strokeWidth={3} />}
      {children}
    </button>
  );
}

export default function DatabasePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // applied filters. `cats` is a LIST — category is multi-select (DV7-08).
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [scale, setScale] = useState("");
  const [sort, setSort] = useState<SortId>(DEFAULT_SORT);

  // filter panel (draft until Apply, like v7)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dCats, setDCats] = useState<string[]>([]);
  const [dScale, setDScale] = useState("");
  const [dSort, setDSort] = useState<SortId>(DEFAULT_SORT);
  const [dbScales, setDbScales] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<DbItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [guidelines, setGuidelines] = useState(false);
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Change Spec §4.3 — the sheet opens with the categories you picked at sign-up already
  // ticked, live AND drafted. A collector who signed up for Diecast shouldn't have to
  // filter to Diecast on every visit.
  //
  // Seeded exactly once, and DURING RENDER rather than in an effect: `user` arrives async,
  // so an effect would paint (and fetch) the unfiltered grid first and then immediately
  // refetch the filtered one. This is React's "adjusting state when a prop changes"
  // pattern — the guarded setState re-renders before anything commits, so no request is
  // wasted. After the seed the user's own selection owns this state, including a
  // deliberately empty one — which is why the guard is a flag, not `cats.length === 0`.
  // Clear still empties the selection; it does NOT restore these.
  const [seeded, setSeeded] = useState(false);
  if (!seeded && !userLoading) {
    setSeeded(true);
    const known = new Set<string>(ADD_CATEGORIES.map((c) => c.id));
    const picks = (user?.interests ?? []).filter((c) => known.has(c));
    if (picks.length) { setCats(picks); setDCats(picks); }
  }

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (deb.current) clearTimeout(deb.current);
    deb.current = setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => { if (deb.current) clearTimeout(deb.current); };
  }, [q]);

  // `cats` joins with commas — the backend ORs them (DV7-08).
  const catKey = cats.join(",");
  const query = useCallback((p: number) => {
    const s = new URLSearchParams({ sort, page: String(p), limit: String(PAGE_SIZE) });
    if (debouncedQ) s.set("q", debouncedQ);
    if (catKey) s.set("category", catKey);
    if (scale) s.set("scale", scale);
    return s.toString();
  }, [debouncedQ, catKey, scale, sort]);

  // First page — refetches whenever the query or a filter changes, which is also what
  // resets the page size back to 8 (Change Spec §3.2): paging deep and then filtering must
  // not drop you into the middle of a different list.
  useEffect(() => {
    let alive = true;
    api.get<{ items: DbItem[]; total: number }>(`/catalogue/browse?${query(1)}`)
      .then((d) => { if (alive) { setItems(d.items); setTotal(d.total); setPage(1); } })
      .catch(() => { if (alive) { setItems([]); setTotal(0); setPage(1); } });
    return () => { alive = false; };
  }, [query]);

  // ── Scale options follow the drafted categories (Change Spec §4.4) ──
  // Designer toys and TCG have no scale at all (CAT_SCALES[cat] === null) — hide the block
  // only when EVERY picked category is scaleless, since a mixed selection still has scales.
  const dCatKey = dCats.join(",");
  const scaleless = dCats.length > 0 && dCats.every((k) => CAT_SCALES[k] === null);
  useEffect(() => {
    if (scaleless) return;
    let alive = true;
    api.get<{ scales: string[] }>(`/catalogue/scales${dCatKey ? `?category=${encodeURIComponent(dCatKey)}` : ""}`)
      .then((d) => { if (alive) setDbScales(d.scales); })
      .catch(() => { if (alive) setDbScales([]); });
    return () => { alive = false; };
  }, [dCatKey, scaleless]);

  // Exactly ONE category → that category's own scale vocabulary (1/6·1/12 for figures,
  // 1/64·1/18 for diecast — the two lists barely overlap, so offering both is noise).
  // Zero or several → the union of what's actually in the filtered set, which is what the
  // backend's /scales returns. Even in the single-category case we union in the DB's own
  // values, so a seeded scale outside the canonical list stays filterable.
  const scaleOptions = useMemo(() => {
    if (scaleless) return [];
    if (dCats.length === 1) return sortScales([...(CAT_SCALES[dCats[0]] ?? []), ...dbScales]);
    return sortScales(dbScales);
  }, [scaleless, dCats, dbScales]);

  // Close the filter panel on an outside click / Escape (it's an anchored dropdown now,
  // not a modal sheet, so there's no backdrop to catch the click).
  useEffect(() => {
    if (!sheetOpen) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setSheetOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  async function showMore() {
    if (loadingMore || !items) return;
    setLoadingMore(true);
    try {
      const d = await api.get<{ items: DbItem[]; total: number }>(`/catalogue/browse?${query(page + 1)}`);
      setItems((prev) => [...(prev ?? []), ...d.items]);
      setTotal(d.total);
      setPage((p) => p + 1);
    } catch {
      /* keep what we have */
    } finally {
      setLoadingMore(false);
    }
  }

  // Wishlist toggle — mirrors the entry page: the server flips a status="wishlist" Item,
  // and refuses (400) once the SKU is already on your shelf, so the star is hidden then.
  async function toggleWishlist(it: DbItem) {
    const on = it.viewer_status === "wishlist";
    setItems((prev) => prev?.map((x) => x.sku === it.sku
      ? { ...x, viewer_status: on ? null : "wishlist", wishlists_count: Math.max(0, x.wishlists_count + (on ? -1 : 1)) }
      : x) ?? prev);
    try {
      const res = await api.post<{ wishlisted: boolean }>(`/catalogue/${encodeURIComponent(it.sku)}/wishlist`);
      fireToast(res.wishlisted ? "Added to your wishlist" : "Removed from your wishlist");
    } catch {
      setItems((prev) => prev?.map((x) => x.sku === it.sku
        ? { ...x, viewer_status: on ? "wishlist" : null, wishlists_count: Math.max(0, x.wishlists_count + (on ? 1 : -1)) }
        : x) ?? prev);
      fireToast("Couldn't update your wishlist");
    }
  }

  // Change Spec §4.5 — one per picked category, plus one each for a non-default scale and
  // sort. Drives both the trigger's active state and the number it shows.
  const activeFilters = cats.length + (scale ? 1 : 0) + (sort !== DEFAULT_SORT ? 1 : 0);
  const filtersOn = activeFilters > 0;
  const draftDirty = dCats.length > 0 || !!dScale || dSort !== DEFAULT_SORT;
  const openSheet = () => { setDCats(cats); setDScale(scale); setDSort(sort); setSheetOpen(true); };
  const applySheet = () => { setCats(dCats); setScale(dScale); setSort(dSort); setSheetOpen(false); };
  // Clear empties the selection outright — it does NOT restore the sign-up defaults, which
  // would make "unrestricted" unreachable for anyone who picked interests (§4.3).
  // It resets the DRAFT only; Apply commits, so it never silently changes the grid.
  const clearSheet = () => { setDCats([]); setDScale(""); setDSort(DEFAULT_SORT); };
  // Any category change resets scale to "all": scale vocabularies differ per category, so
  // a stale scale would silently zero the results (§4.4).
  const toggleDraftCat = (id: string) => {
    setDCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));
    setDScale("");
  };

  const shown = items?.length ?? 0;
  const hasMore = !!items && shown < total;
  // "how many more will be shown", not "how many are left" (§3.2) — the last page is short.
  const nextBatch = Math.min(PAGE_SIZE, total - shown);

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      {/* ── Search row: field (with the filter trigger inside it) + Add item ── */}
      <div ref={panelRef} className="sticky top-0 z-20 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px", position: "sticky" }}>
        <div className="hidden lg:block" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, letterSpacing: "-0.03em", marginBottom: 10 }}>
          Database
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {/* The field must be allowed to SHRINK (flex:1 + minWidth:0) — without minWidth:0
              its content sets a floor and Add item clips off the right at 390px. */}
          <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 6px 0 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
            <Search size={17} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              /* Short on purpose: the field is the one control here allowed to shrink, so
                 at 390px with a filter count showing, a longer string truncates mid-word. */
              placeholder="Search items"
              aria-label="Search the database"
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)" }}
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "var(--ink-ghost)", display: "flex", flexShrink: 0 }}>
                <X size={15} strokeWidth={2} />
              </button>
            )}
            {/* Filter trigger — INSIDE the field, at its right edge (§3.1). Icon only: no
                divider, no border, no background of its own, so the field stays one object.
                Neutral when nothing is applied; accent + inline count when filters are on. */}
            <button
              type="button"
              onClick={() => (sheetOpen ? setSheetOpen(false) : openSheet())}
              aria-label={filtersOn ? `Filters — ${activeFilters} applied` : "Filters"}
              aria-expanded={sheetOpen}
              style={{
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                height: 32, padding: "0 8px", borderRadius: 9, cursor: "pointer",
                border: "none", background: "transparent",
                color: filtersOn || sheetOpen ? "var(--stamp-red)" : "var(--ink-mute)",
              }}
            >
              <SlidersHorizontal size={18} strokeWidth={filtersOn ? 2.3 : 1.9} />
              {filtersOn && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Add item — LABELLED (§3.1). The old icon-only plus wasn't understandable as
              "contribute to the shared catalogue". Never shrinks, never wraps. */}
          <button
            type="button"
            onClick={() => setGuidelines(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap",
              height: 44, padding: "0 14px", borderRadius: 12, cursor: "pointer",
              border: "1px solid var(--stamp-red)", background: "var(--stamp-red-soft)", color: "var(--stamp-red)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5,
            }}
          >
            <Plus size={17} strokeWidth={2.4} />Add item
          </button>

          {/* ── Filters — an anchored dropdown directly beneath the search row (DV7-08).
              Was a bottom sheet pinned to the viewport floor, which read as unrelated to the
              control that opened it and buried Apply off-screen (founder QA 2026-08-01). */}
          {sheetOpen && (
            <div
              role="dialog"
              aria-label="Filters"
              style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 30,
                background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 16,
                boxShadow: "var(--shadow-4)", padding: "14px 16px 16px",
                maxHeight: "min(70vh, 560px)", overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Filters</span>
                {/* Disabled when there's nothing to clear — previously it looked live but was a
                    no-op at defaults, which read as "Clear is broken". */}
                <button
                  type="button"
                  onClick={clearSheet}
                  disabled={!draftDirty}
                  style={{
                    border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 11px",
                    background: "var(--paper-soft)",
                    cursor: draftDirty ? "pointer" : "not-allowed", opacity: draftDirty ? 1 : 0.45,
                    color: draftDirty ? "var(--stamp-red)" : "var(--ink-faint)",
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
                  }}
                >
                  Clear
                </button>
              </div>

              <SectionLabel>Sort by</SectionLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                {SORTS.map((s) => (
                  <FilterChip key={s.id} active={dSort === s.id} onClick={() => setDSort(s.id)}>{s.label}</FilterChip>
                ))}
              </div>

              <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 8 }}>
                <SectionLabel>Category</SectionLabel>
                <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                  {dCats.length ? `${dCats.length} selected` : "all categories"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
                {ADD_CATEGORIES.map((cg) => (
                  <TickChip key={cg.id} active={dCats.includes(cg.id)} onClick={() => toggleDraftCat(cg.id)}>
                    {cg.label}
                  </TickChip>
                ))}
              </div>

              {scaleOptions.length > 0 && (
                <>
                  <div style={{ marginTop: 18 }}><SectionLabel>Scale</SectionLabel></div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                    <FilterChip active={!dScale} onClick={() => setDScale("")}>All scales</FilterChip>
                    {scaleOptions.map((s) => (
                      <FilterChip key={s} active={dScale === s} onClick={() => setDScale(s)}>{s}</FilterChip>
                    ))}
                  </div>
                </>
              )}

              <Button variant="dark" size="block" style={{ marginTop: 18 }} onClick={applySheet}>Apply</Button>
            </div>
          )}
        </div>
      </div>

      {/* ── The catalogue grid ── */}
      <div style={{ padding: "12px 20px 28px" }}>
        {/* item count — below the search row (§3.1) */}
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 10 }}>
          {items === null ? "Loading…" : `${total.toLocaleString("en-IN")} item${total === 1 ? "" : "s"}`}
          {filtersOn && items !== null && (
            <button onClick={() => { setCats([]); setScale(""); setSort(DEFAULT_SORT); }} style={{ marginLeft: 8, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12 }}>
              Clear filters
            </button>
          )}
        </div>

        {items === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-[var(--bone-deep)] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "28px 4px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>
              {debouncedQ ? "No items match that search." : "No entries match these filters."}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((it) => (
              <DbTile key={it.sku} item={it} onWishlist={() => toggleWishlist(it)} />
            ))}
          </div>
        )}

        {/* §3.2 — full-width "Show N more"; disappears once everything is on screen. */}
        {hasMore && (
          <button
            type="button"
            onClick={showMore}
            disabled={loadingMore}
            style={{
              width: "100%", marginTop: 14, height: 46, borderRadius: 13, cursor: loadingMore ? "wait" : "pointer",
              border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
            }}
          >
            {loadingMore ? "Loading…" : `Show ${nextBatch} more`}
          </button>
        )}

        {/* §3.3 — "Can't find it?" — the LAST thing in the list, after the pagination
            button. Dashed border so it never reads as another result tile. Third and final
            entry point into the add-to-database flow (search row · here · profile). */}
        {items !== null && (
          <div
            style={{
              marginTop: 20, padding: "20px 18px", borderRadius: 16, textAlign: "center",
              border: "1.5px dashed var(--border-strong)", background: "transparent",
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16.5, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              Didn&apos;t find what you were looking for?
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 6, lineHeight: 1.5 }}>
              Add it to the Scorred DB — you earn XP once it passes review.
            </div>
            <button
              type="button"
              onClick={() => setGuidelines(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, marginTop: 14,
                height: 42, padding: "0 18px", borderRadius: 12, cursor: "pointer", border: "none",
                background: "var(--stamp-red)", color: "var(--paper)",
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
              }}
            >
              <Plus size={17} strokeWidth={2.4} />Add an item
            </button>
          </div>
        )}
      </div>

      {guidelines && (
        <ContributeGuidelines
          onCancel={() => setGuidelines(false)}
          onAccept={() => router.push("/add/catalogue?mode=intel&new=1")}
        />
      )}
    </div>
  );
}

/* ── Grid tile — full-bleed photo with wishlist + add overlays (v7 ExploreView) ── */
function DbTile({ item, onWishlist }: { item: DbItem; onWishlist: () => void }) {
  const owned = OWNS(item.viewer_status);
  const wishlisted = item.viewer_status === "wishlist";

  return (
    <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative" }}>
        <Link href={`/db/${encodeURIComponent(item.sku)}`} aria-label={item.title} style={{ display: "block" }}>
          <ProductPhoto tone={item.is_official ? "ink" : "bone"} src={item.thumbnail_url} ratio="1/1" rounded={0} label="catalogue reference" />
        </Link>

        {/* Star = wishlist (web icon law). Hidden once it's on your shelf — the server
            refuses to wishlist something you already own. */}
        {owned ? (
          <span title="In your collection" style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 999, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>
            <Check size={15} strokeWidth={2.6} />
          </span>
        ) : (
          <button
            type="button"
            onClick={onWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from your wishlist" : "Add to your wishlist"}
            style={{
              position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
              background: wishlisted ? "var(--stamp-red)" : "rgba(255,255,255,0.92)",
              color: wishlisted ? "var(--paper)" : "var(--ink-mute)",
              display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            }}
          >
            <Star size={14} fill={wishlisted ? "currentColor" : "none"} strokeWidth={wishlisted ? 0 : 1.9} />
          </button>
        )}

        {/* Add a copy — deep-links the add flow with the SKU already resolved */}
        <Link
          href={`/add/catalogue?sku=${encodeURIComponent(item.sku)}`}
          aria-label={`Add ${item.title} to your collection`}
          title="Add to my collection"
          style={{
            position: "absolute", bottom: 8, right: 8, width: 30, height: 30, borderRadius: 999,
            background: "var(--stamp-red)", color: "var(--paper)", boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Plus size={16} strokeWidth={2.4} />
        </Link>
      </div>

      <Link href={`/db/${encodeURIComponent(item.sku)}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ padding: "9px 10px 11px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 32 }}>
            {item.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.brand}
            </span>
            {item.is_official ? (
              <ShieldCheck size={12} style={{ color: "var(--verified-teal)", flexShrink: 0 }} aria-label="Scorred reviewed" />
            ) : item.pending ? (
              <Clock size={12} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} aria-label="Pending review" />
            ) : null}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
            {item.owners_count} own · {item.wishlists_count} want
          </div>
        </div>
      </Link>
    </div>
  );
}
