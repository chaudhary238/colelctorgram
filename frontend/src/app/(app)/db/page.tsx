"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Plus, Star, Check, ShieldCheck, Clock, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { ProductPhoto, SectionLabel, CategoryChip, Button, Avatar } from "@/components/ui";
import { fireToast } from "@/components/gamification";
import { ContributeGuidelines } from "@/components/ContributeGuidelines";
import { ADD_CATEGORIES, CAT_SCALES } from "@/lib/catalog";

/**
 * Explore tab — the Scorred DB plus global search (design_v7 app/ExploreView.jsx,
 * DV7-02 + DV7-06). Route stays `/db`; the tab was renamed Database → Explore once the
 * search field stopped being catalogue-only.
 *
 * Two modes, driven purely by whether the search box has text:
 *  - **Empty query** — the catalogue browse it always was: Filters sheet, item count,
 *    grid of entries with owner/want counts.
 *  - **Non-empty query** — scope chips appear (`Items N · Posts N · People N ·
 *    Communities N · Events N`, zeros included). Items keeps the grid, filtered by the
 *    query; the other four render result rows. Clearing the field resets to Items.
 *
 * Counts come from two places on purpose: **Items** from `/catalogue/browse`'s `total`
 * (the same query that fills the grid, so chip and grid can't disagree) and the rest from
 * `/search`'s `counts` (true totals, not `len(rows)` — rows cap at 20).
 *
 * Web deviations from v7 (deliberate):
 *  - Star = wishlist, not Bookmark. The web icon law (2026-07-11) reserves Bookmark for
 *    saving CONTENT; v7's prototype uses a bookmark glyph here. Star keeps /db, /db/[sku]
 *    and the profile grid consistent.
 *  - **People rows read `@handle · N vouches`, NOT v7's `N deals · N vouches`** — the deal
 *    flow was retired in DV6-07 and `users.deals_count` was dropped from the schema. v7's
 *    fixture data still carries `u.deals`; the product doesn't. Same reason its `verified`
 *    avatar state is gone (VerifyBadge/TierChip both removed 2026-07-18).
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

// GET /search — rows capped at `limit`, with true totals alongside in `counts`.
interface SearchResults {
  users: { id: string; handle: string; name: string; vouches_count: number }[];
  posts: { id: string; type: string; snippet: string; handle: string; name: string; community: string | null }[];
  communities: { id: string; name: string; description: string | null; category: string; member_count: number }[];
  events: { id: string; title: string; city: string | null; mode: string; starts_at: string }[];
  counts: { users: number; posts: number; catalogue: number; communities: number; events: number };
}

type SortId = "owned" | "wishlisted" | "newest";
const SORTS: { id: SortId; label: string }[] = [
  { id: "owned", label: "Most owned" },
  { id: "wishlisted", label: "Most wishlisted" },
  { id: "newest", label: "Newest" },
];

type ScopeId = "items" | "posts" | "people" | "communities" | "events";

const PAGE_SIZE = 24;
const ROW_CAP = 20; // v7: non-item scopes show at most 20 rows
const OWNS = (s: string | null) => s === "owned" || s === "preorder";

const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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

export default function ExplorePage() {
  const router = useRouter();

  // applied filters
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<ScopeId>("items");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [cat, setCat] = useState("");
  const [scale, setScale] = useState("");
  const [sort, setSort] = useState<SortId>("owned");

  // filter sheet (draft until Apply, like v7)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dCat, setDCat] = useState("");
  const [dScale, setDScale] = useState("");
  const [dSort, setDSort] = useState<SortId>("owned");
  const [dbScales, setDbScales] = useState<string[]>([]);

  const [items, setItems] = useState<DbItem[] | null>(null);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [guidelines, setGuidelines] = useState(false);
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (deb.current) clearTimeout(deb.current);
    deb.current = setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => { if (deb.current) clearTimeout(deb.current); };
  }, [q]);

  const query = useCallback((p: number) => {
    const s = new URLSearchParams({ sort, page: String(p), limit: String(PAGE_SIZE) });
    if (debouncedQ) s.set("q", debouncedQ);
    if (cat) s.set("category", cat);
    if (scale) s.set("scale", scale);
    return s.toString();
  }, [debouncedQ, cat, scale, sort]);

  // First page — refetches whenever a filter changes.
  useEffect(() => {
    let alive = true;
    api.get<{ items: DbItem[]; total: number }>(`/catalogue/browse?${query(1)}`)
      .then((d) => { if (alive) { setItems(d.items); setTotal(d.total); setPage(1); } })
      .catch(() => { if (alive) { setItems([]); setTotal(0); } });
    return () => { alive = false; };
  }, [query]);

  // Global search (DV7-06) — only fires once there's a query; one request covers all four
  // non-item scopes AND their counts, so the chips can show numbers before you tap them.
  const searching = debouncedQ.length > 0;
  useEffect(() => {
    if (!searching) return;
    let alive = true;
    api.get<SearchResults>(`/search?q=${encodeURIComponent(debouncedQ)}&limit=${ROW_CAP}`)
      .then((d) => { if (alive) setResults(d); })
      .catch(() => { if (alive) setResults(null); });
    return () => { alive = false; };
  }, [debouncedQ, searching]);

  // Clearing the field drops straight back to the catalogue browse (v7). `scope` itself is
  // reset in the input handler; this also covers the debounce window, where the field is
  // already empty but `debouncedQ` hasn't caught up yet.
  const activeScope: ScopeId = searching ? scope : "items";

  // Scale options for the sheet follow the drafted category. Designer toys and TCG have
  // no scale at all (CAT_SCALES[cat] === null), so skip the request and hide the block.
  const scaleless = !!dCat && CAT_SCALES[dCat] === null;
  const scaleOptions = scaleless ? [] : dbScales;
  useEffect(() => {
    if (scaleless) return;
    let alive = true;
    api.get<{ scales: string[] }>(`/catalogue/scales${dCat ? `?category=${dCat}` : ""}`)
      .then((d) => { if (alive) setDbScales(d.scales); })
      .catch(() => { if (alive) setDbScales([]); });
    return () => { alive = false; };
  }, [dCat, scaleless]);

  async function loadMore() {
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

  const activeFilters = (cat ? 1 : 0) + (scale ? 1 : 0) + (sort !== "owned" ? 1 : 0);
  const openSheet = () => { setDCat(cat); setDScale(scale); setDSort(sort); setSheetOpen(true); };
  const applySheet = () => { setCat(dCat); setScale(dScale); setSort(dSort); setSheetOpen(false); };
  const clearSheet = () => { setDCat(""); setDScale(""); setDSort("owned"); };
  const hasMore = !!items && items.length < total;

  // Items counts from the same query that fills the grid; the rest from /search's totals.
  const c = results?.counts;
  const SCOPES: { id: ScopeId; label: string; n: number }[] = [
    { id: "items", label: "Items", n: total },
    { id: "posts", label: "Posts", n: c?.posts ?? 0 },
    { id: "people", label: "People", n: c?.users ?? 0 },
    { id: "communities", label: "Communities", n: c?.communities ?? 0 },
    { id: "events", label: "Events", n: c?.events ?? 0 },
  ];
  // For the "Try Posts above." hint when Items comes back empty.
  const firstNonEmpty = SCOPES.find((s) => s.id !== "items" && s.n > 0);

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      {/* search + filters + add */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div className="hidden lg:block" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, letterSpacing: "-0.03em", marginBottom: 10 }}>
          Explore
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9, height: 44, padding: "0 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
            <Search size={17} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                // v7: clearing the field resets the scope, so the next search starts on Items.
                if (!e.target.value.trim()) setScope("items");
              }}
              placeholder="Items, posts, people, communities…"
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)" }}
            />
            {q && (
              <button onClick={() => { setQ(""); setScope("items"); }} aria-label="Clear search" style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "var(--ink-ghost)", display: "flex" }}>
                <X size={15} strokeWidth={2} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={openSheet}
            aria-label="Filters"
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: 12, cursor: "pointer", position: "relative",
              border: `1px solid ${activeFilters ? "var(--stamp-red)" : "var(--border-strong)"}`,
              background: activeFilters ? "var(--stamp-red-soft)" : "var(--paper-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <SlidersHorizontal size={18} style={{ color: activeFilters ? "var(--stamp-red)" : "var(--ink-mute)" }} />
            {activeFilters > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 999, background: "var(--stamp-red)", color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                {activeFilters}
              </span>
            )}
          </button>
          {/* DV7-07 — Add item moved up here from the old full-width footer button: one tap
              from the top of Explore, and it can't be missed at the bottom of a long grid. */}
          <button
            type="button"
            onClick={() => setGuidelines(true)}
            aria-label="Add item — can't find something?"
            title="Add item — can't find something?"
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: 12, cursor: "pointer",
              border: "1px solid var(--slate-200)", background: "var(--slate-50)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <PlusCircle size={18} strokeWidth={1.8} style={{ color: "var(--stamp-red)" }} />
          </button>
        </div>

        {/* scope chips — only while searching; every scope shows a count, zeros included */}
        {searching && (
          <div style={{ display: "flex", gap: 7, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
            {SCOPES.map((s) => (
              <CategoryChip key={s.id} active={activeScope === s.id} onClick={() => setScope(s.id)}>
                {s.label} {s.n.toLocaleString("en-IN")}
              </CategoryChip>
            ))}
          </div>
        )}
      </div>

      {/* ── Items: the catalogue browse ── */}
      {activeScope === "items" && (
        <div style={{ padding: "12px 20px 28px" }}>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 10 }}>
            {items === null ? "Loading…" : `${total.toLocaleString("en-IN")} item${total === 1 ? "" : "s"}`}
            {activeFilters > 0 && items !== null && (
              <button onClick={() => { setCat(""); setScale(""); setSort("owned"); }} style={{ marginLeft: 8, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12 }}>
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
                {searching ? "No items match that search." : "No entries match these filters."}
              </div>
              {searching && firstNonEmpty && (
                <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 8 }}>Try {firstNonEmpty.label} above.</div>
              )}
              {searching && !firstNonEmpty && (
                <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 8 }}>
                  Nothing in the Scorred DB yet — use <PlusCircle size={13} style={{ display: "inline", verticalAlign: "-2px", color: "var(--stamp-red)" }} /> to add it and earn XP for being first.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((it) => (
                <DbTile key={it.sku} item={it} onWishlist={() => toggleWishlist(it)} />
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : `Load more (${(total - items!.length).toLocaleString("en-IN")} left)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Posts / People / Communities / Events ── */}
      {activeScope !== "items" && (
        <div style={{ padding: "8px 20px 28px" }}>
          {results === null ? (
            <SearchRowSkeleton />
          ) : activeScope === "posts" ? (
            results.posts.length
              ? results.posts.slice(0, ROW_CAP).map((p) => (
                  <ResRow
                    key={p.id}
                    href={`/post/${p.id}`}
                    media={<Avatar name={p.name} size={40} />}
                    title={truncate(p.snippet, 72) || "(no text)"}
                    sub={`@${p.handle}${p.community ? ` · ${p.community}` : ""}`}
                  />
                ))
              : <EmptyScope label="posts" />
          ) : activeScope === "people" ? (
            results.users.length
              ? results.users.slice(0, ROW_CAP).map((u) => (
                  <ResRow
                    key={u.handle}
                    href={`/profile/${u.handle}`}
                    media={<Avatar name={u.name} size={40} />}
                    title={u.name}
                    /* v7 says "N deals · N vouches" — deals were retired in DV6-07 and the
                       column is gone, so vouches carry the trust signal on their own. */
                    sub={`@${u.handle} · ${u.vouches_count} vouch${u.vouches_count === 1 ? "" : "es"}`}
                  />
                ))
              : <EmptyScope label="people" />
          ) : activeScope === "communities" ? (
            results.communities.length
              ? results.communities.slice(0, ROW_CAP).map((cm) => (
                  <ResRow
                    key={cm.id}
                    href={`/community/${cm.id}`}
                    media={
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                        {cm.name.slice(0, 2).toUpperCase()}
                      </div>
                    }
                    title={cm.name}
                    sub={`${cm.member_count.toLocaleString("en-IN")} member${cm.member_count === 1 ? "" : "s"}`}
                  />
                ))
              : <EmptyScope label="communities" />
          ) : (
            results.events.length
              ? results.events.slice(0, ROW_CAP).map((ev) => {
                  const d = new Date(ev.starts_at);
                  return (
                    <ResRow
                      key={ev.id}
                      href={`/events/${ev.id}`}
                      media={
                        <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--plum)", color: "var(--paper)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.04em" }}>{MONTH_SHORT[d.getMonth()]}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{d.getDate()}</span>
                        </div>
                      }
                      title={ev.title}
                      sub={`${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}${ev.city ? ` · ${ev.city}` : ""}`}
                    />
                  );
                })
              : <EmptyScope label="events" />
          )}
        </div>
      )}

      {guidelines && (
        <ContributeGuidelines
          onCancel={() => setGuidelines(false)}
          onAccept={() => router.push("/add/catalogue?mode=intel&new=1")}
        />
      )}

      {/* filter bottom sheet — sort / category / scale, drafted then applied (v7) */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div
            className="relative z-10 w-full sm:max-w-[520px] bg-[var(--paper)] rounded-t-[20px] sm:rounded-[20px] sm:mb-8 shadow-[var(--shadow-4)] overflow-y-auto"
            style={{ maxHeight: "80vh", padding: "10px 18px calc(20px + env(safe-area-inset-bottom))" }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "4px auto 14px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Filters</span>
              <button onClick={clearSheet} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13 }}>
                Clear
              </button>
            </div>

            <SectionLabel>Sort by</SectionLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              {SORTS.map((s) => (
                <FilterChip key={s.id} active={dSort === s.id} onClick={() => setDSort(s.id)}>{s.label}</FilterChip>
              ))}
            </div>

            <div style={{ marginTop: 20 }}><SectionLabel>Category</SectionLabel></div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
              <CategoryChip active={!dCat} onClick={() => { setDCat(""); setDScale(""); }}>All categories</CategoryChip>
              {ADD_CATEGORIES.map((c) => (
                <CategoryChip key={c.id} active={dCat === c.id} onClick={() => { setDCat(c.id); setDScale(""); }}>{c.label}</CategoryChip>
              ))}
            </div>

            {scaleOptions.length > 0 && (
              <>
                <div style={{ marginTop: 20 }}><SectionLabel>Scale</SectionLabel></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                  <FilterChip active={!dScale} onClick={() => setDScale("")}>All scales</FilterChip>
                  {scaleOptions.map((s) => (
                    <FilterChip key={s} active={dScale === s} onClick={() => setDScale(s)}>{s}</FilterChip>
                  ))}
                </div>
              </>
            )}

            <Button variant="dark" size="block" style={{ marginTop: 22 }} onClick={applySheet}>Apply</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Search result row — 40px media, title, sub line (v7 ExploreView ResRow) ── */
function ResRow({ href, media, title, sub }: { href: string; media: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none", padding: "8px 0" }}>
      {media}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub}
        </span>
      </span>
    </Link>
  );
}

function EmptyScope({ label }: { label: string }) {
  return (
    <div style={{ padding: "32px 8px", textAlign: "center", fontSize: 13.5, color: "var(--ink-faint)" }}>
      No {label} match that search.
    </div>
  );
}

function SearchRowSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }} className="animate-pulse">
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--bone-deep)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "60%", height: 11, borderRadius: 6, background: "var(--bone)", marginBottom: 7 }} />
            <div style={{ width: "35%", height: 10, borderRadius: 6, background: "var(--bone)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);

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
