"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { CategoryChip, ProductPhoto, Avatar, SectionLabel } from "@/components/ui";
import { AddToCollectionSheet } from "@/components/AddToCollectionSheet";

const CAT_TONE: Record<string, string> = { figures: "red", designer: "plum", kits: "forest", diecast: "teal" };
function toneForCat(category: string | null): string {
  return CAT_TONE[(category ?? "").toLowerCase()] ?? "ink";
}
function skuToneSearch(sku: string | null, category: string | null): string {
  const m = (sku ?? "").match(/SKU-([A-Z]+)-/);
  const byPrefix: Record<string, string> = { FIG: "red", DSN: "plum", KIT: "forest", DCS: "teal" };
  return (m && byPrefix[m[1]]) || toneForCat(category);
}

// DF-31 — TYPE scopes (v3 SearchOverlay), not the old category filter.
const SCOPES = [
  { id: "all", label: "All" },
  { id: "items", label: "Items" },
  { id: "posts", label: "Posts" },
  { id: "people", label: "People" },
  { id: "communities", label: "Communities" },
  { id: "events", label: "Events" },
];

interface TrendTerm { rank: number; term: string; count: number; hot: boolean }

interface SearchResult {
  users: { id: string; handle: string; name: string; tier: string; deals_count: number; vouches_count: number }[];
  posts: { id: string; type: string; snippet: string; handle: string; name: string; community: string | null }[];
  catalogue: { sku: string; title: string; brand: string; category: string; thumbnail_url: string | null }[];
  communities: { id: string; name: string; description: string | null; category: string; member_count: number }[];
  events: { id: string; title: string; city: string | null; mode: string; starts_at: string }[];
}

/* v3 ResRow — plain row, slate meta, subtle hover affordance for web. */
function ResRow({ media, title, sub, action, onClick }: {
  media: React.ReactNode; title: string; sub: string; action?: React.ReactNode; onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        background: hover ? "var(--slate-50)" : "transparent", border: "none", cursor: onClick ? "pointer" : "default",
        padding: "8px 10px", margin: "0 -10px", borderRadius: 12, transition: "background 120ms",
      }}
    >
      {media}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--slate-500)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      {action}
    </button>
  );
}

function ResGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [trending, setTrending] = useState<TrendTerm[]>([]);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  // v4 AddToCollection: tapping + on a catalogue hit opens the full mandatory-field
  // sheet (photo/status/etc.), not a silent owned-insert. `added` marks done SKUs.
  const [addTarget, setAddTarget] = useState<SearchResult["catalogue"][number] | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  // Trending now (empty-query state) — real, derived from recent post hashtags.
  useEffect(() => {
    api.get<{ trending: TrendTerm[] }>("/search/trending")
      .then((d) => setTrending(d?.trending ?? []))
      .catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      api.get<SearchResult>(`/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => setResults(r))
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  // design_v4: a catalogue result routes to the item's status-aware detail page when
  // it's already in your collection (owned → Modify/Sell, wishlist → Notify, etc.),
  // and only opens "Add to my collection" when it isn't. The "+" is a visual affordance
  // (whole row is the target), not a one-click silent add.
  async function openCatalogueItem(c: SearchResult["catalogue"][number]) {
    try {
      const res = await api.get<{ item: { id: string; status: string } | null }>(
        `/items/by-sku/${encodeURIComponent(c.sku)}`,
      );
      if (res.item) router.push(`/item/${res.item.id}`);
      else setAddTarget(c);
    } catch (e) {
      console.error(e);
      setAddTarget(c);
    }
  }

  const show = (id: string) => scope === "all" || scope === id;
  // scope-aware: "no results" reflects only the groups visible under the active scope
  const visibleCount = results
    ? (show("posts") ? results.posts.length : 0)
      + (show("items") ? results.catalogue.length : 0)
      + (show("people") ? results.users.length : 0)
      + (show("communities") ? results.communities.length : 0)
      + (show("events") ? results.events.length : 0)
    : 0;
  const empty = !!results && visibleCount === 0;

  return (
    <div className="w-full max-w-[1100px] flex flex-col">
      {/* search bar + scopes */}
      <div className="sticky top-0 z-10" style={{ background: "var(--canvas)", borderBottom: "1px solid var(--slate-200)", padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, height: 46, padding: "0 14px", borderRadius: 14, border: "1px solid var(--slate-200)", background: "var(--card-surface)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <Search size={18} style={{ color: "var(--slate-400)", flexShrink: 0 }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Items, posts, people, communities…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)" }}
          />
        </div>
        <div className="flex gap-[7px] mt-3 overflow-x-auto">
          {SCOPES.map((s) => (
            <CategoryChip key={s.id} active={scope === s.id} onClick={() => setScope(s.id)}>
              {s.label}
            </CategoryChip>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 20px 28px", background: "var(--canvas)", minHeight: "60vh" }}>
        {/* Trending now — empty query */}
        {!q && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--slate-400)", marginBottom: 12 }}>Trending now</div>
            {trending.map((t) => (
              <button
                key={t.rank}
                onClick={() => setQ(t.term)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                  background: "var(--card-surface)", border: "1px solid var(--slate-200)", borderRadius: 13,
                  padding: "11px 14px", marginBottom: 7, cursor: "pointer",
                  boxShadow: "var(--shadow-sm)", transition: "transform 120ms, box-shadow 120ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: "var(--stamp-red)", width: 26, flexShrink: 0, textAlign: "right" }}>{t.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--slate-900)", lineHeight: 1.2 }}>{t.term}</div>
                  <div style={{ fontSize: 11.5, color: "var(--slate-400)", marginTop: 2 }}>{t.count.toLocaleString("en-IN")} {t.count === 1 ? "post" : "posts"}</div>
                </div>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.hot ? "🔥" : "📈"}</span>
              </button>
            ))}
            {trending.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--slate-400)", fontSize: 13.5 }}>No trending topics yet — start searching above.</div>
            )}
          </div>
        )}

        {/* Search results */}
        {q && (
          <>
            {searching && !results && <div style={{ color: "var(--slate-400)", fontSize: 13, padding: "12px 0" }}>Searching…</div>}
            {results && (
              <>
                {show("posts") && results.posts.length > 0 && (
                  <ResGroup label="Posts">
                    {results.posts.map((p) => (
                      <ResRow
                        key={p.id}
                        onClick={() => router.push(`/post/${p.id}`)}
                        media={<Avatar name={p.name ?? p.handle} size={40} />}
                        title={p.snippet || "(no text)"}
                        sub={`@${p.handle}${p.community ? ` · ${p.community}` : ""}`}
                      />
                    ))}
                  </ResGroup>
                )}

                {show("items") && results.catalogue.length > 0 && (
                  <ResGroup label="Catalogue items">
                    {results.catalogue.map((c) => (
                      <ResRow
                        key={c.sku}
                        onClick={() => openCatalogueItem(c)}
                        media={<div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><ProductPhoto tone={skuToneSearch(c.sku, c.category)} src={c.thumbnail_url} ratio="1/1" rounded={8} /></div>}
                        title={c.title}
                        sub={`${c.sku} · ${c.brand}`}
                        action={
                          <span
                            aria-hidden
                            style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: added[c.sku] ? "var(--emerald)" : "var(--stamp-red)" }}
                          >
                            {added[c.sku] ? <Check size={20} /> : <Plus size={20} />}
                          </span>
                        }
                      />
                    ))}
                  </ResGroup>
                )}

                {show("people") && results.users.length > 0 && (
                  <ResGroup label="People">
                    {results.users.map((u) => (
                      <ResRow
                        key={u.id}
                        onClick={() => router.push(`/profile/${u.handle}`)}
                        media={<Avatar name={u.name ?? u.handle} size={40} verified={u.tier !== "verified"} />}
                        title={u.name}
                        sub={`@${u.handle} · ${u.deals_count} deals · ${u.vouches_count} vouches`}
                      />
                    ))}
                  </ResGroup>
                )}

                {show("communities") && results.communities.length > 0 && (
                  <ResGroup label="Communities">
                    {results.communities.map((c) => (
                      <ResRow
                        key={c.id}
                        onClick={() => router.push(`/community/${c.id}`)}
                        media={<div style={{ width: 40, height: 40, borderRadius: 9, background: `var(--${toneForCat(c.category)})`, color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>{c.name.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "C"}</div>}
                        title={c.name}
                        sub={`${c.member_count.toLocaleString("en-IN")} members`}
                      />
                    ))}
                  </ResGroup>
                )}

                {show("events") && results.events.length > 0 && (
                  <ResGroup label="Events">
                    {results.events.map((e) => (
                      <ResRow
                        key={e.id}
                        onClick={() => router.push(`/events/${e.id}`)}
                        media={<div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--plum-soft)", color: "var(--plum)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{new Date(e.starts_at).toLocaleString("en-IN", { month: "short" })}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>{new Date(e.starts_at).getDate()}</span>
                        </div>}
                        title={e.title}
                        sub={`${e.mode === "online" ? "Online" : e.city ?? "In person"} · ${new Date(e.starts_at).toLocaleString("en-IN", { day: "numeric", month: "short" })}`}
                      />
                    ))}
                  </ResGroup>
                )}

                {empty && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--slate-400)" }}>No results for &ldquo;{q}&rdquo;.</div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {addTarget && (
        <AddToCollectionSheet
          initialPick={addTarget}
          onClose={() => setAddTarget(null)}
          onAdded={() => setAdded((a) => ({ ...a, [addTarget.sku]: true }))}
        />
      )}
    </div>
  );
}
