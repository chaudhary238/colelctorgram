"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { ApiListing } from "@/components/cards";
import { CategoryChip, ProductPhoto, Money, Avatar } from "@/components/ui";

const CAT_TONE: Record<string, string> = { figures: "red", designer: "plum", kits: "forest", diecast: "teal" };
function toneForCat(category: string | null): string {
  return CAT_TONE[(category ?? "").toLowerCase()] ?? "ink";
}
function skuToneSearch(sku: string | null, category: string | null): string {
  const m = (sku ?? "").match(/SKU-([A-Z]+)-/);
  const byPrefix: Record<string, string> = { FIG: "red", DSN: "plum", KIT: "forest", DCS: "teal" };
  return (m && byPrefix[m[1]]) || toneForCat(category);
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits & Lego" },
  { id: "diecast", label: "Diecast" },
];

const TONES = ["red", "gold", "teal", "plum", "forest", "ink"];

interface SearchResult {
  users: { id: string; handle: string; name: string }[];
  catalogue: { sku: string; title: string; brand: string; category: string; thumbnail_url: string | null }[];
  listings: { id: string; sku: string | null; price: number; condition: string; city: string | null }[];
  communities: { id: string; name: string; description: string | null; category: string; member_count: number }[];
  events: { id: string; title: string; city: string | null; mode: string; starts_at: string }[];
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  // Fetch explore grid listings on mount
  useEffect(() => {
    api.get<{ items: ApiListing[] }>("/listings?limit=24")
      .then((data) => setListings(data?.items ?? []))
      .catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      api.get<SearchResult>(`/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => setSearchResults(r))
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const exploreTiles = useMemo(() => {
    let l = listings;
    if (cat !== "all") l = l.filter((x) => (x.category ?? "").toLowerCase().includes(cat));
    return l;
  }, [listings, cat]);

  return (
    <div className="w-full max-w-[1100px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, height: 40, padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
          <Search size={18} style={{ color: "var(--ink-faint)" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, brands, collectors…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }}
          />
        </div>
        {!q && (
          <div className="flex gap-[7px] mt-[10px] overflow-x-auto">
            {CATEGORIES.map((c) => (
              <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </CategoryChip>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      {q && (
        <div style={{ padding: "12px 20px 24px" }}>
          {searching && <div style={{ color: "var(--ink-faint)", fontSize: 13 }}>Searching…</div>}
          {!searching && searchResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {searchResults.users.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 8 }}>People</div>
                  {searchResults.users.map((u) => (
                    <Link key={u.id} href={`/profile/${u.handle}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                      <Avatar name={u.name ?? u.handle} size={40} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{u.handle}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.catalogue.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 8 }}>Items</div>
                  {searchResults.catalogue.map((c) => (
                    <div key={c.sku} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        <ProductPhoto tone={skuToneSearch(c.sku, c.category)} src={c.thumbnail_url} ratio="1/1" rounded={8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{c.sku} · {c.brand}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.listings.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 8 }}>Listings</div>
                  {searchResults.listings.map((l) => (
                    <Link key={l.id} href={`/listing/${l.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        <ProductPhoto tone={skuToneSearch(l.sku, null)} ratio="1/1" rounded={8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{l.sku ?? "Listing"}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{l.condition}{l.city ? ` · ${l.city}` : ""}</div>
                      </div>
                      <Money value={Math.round(l.price / 100)} size={13} />
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.communities.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 8 }}>Communities</div>
                  {searchResults.communities.map((c) => (
                    <Link key={c.id} href={`/community/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: `var(--${toneForCat(c.category)})`, color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>
                        {c.name.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "C"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{c.member_count.toLocaleString("en-IN")} members</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {searchResults.events.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 8 }}>Events</div>
                  {searchResults.events.map((e) => (
                    <Link key={e.id} href={`/events/${e.id}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--plum-soft)", color: "var(--plum)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{new Date(e.starts_at).toLocaleString("en-IN", { month: "short" })}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>{new Date(e.starts_at).getDate()}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                          {e.mode === "online" ? "Online" : e.city ?? "In person"} · {new Date(e.starts_at).toLocaleString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {Object.values(searchResults).every((v) => v.length === 0) && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-faint)" }}>No results for &ldquo;{q}&rdquo;.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Explore grid (no query) */}
      {!q && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 p-1.5">
          {exploreTiles.map((l, i) => (
            <Link key={l.id} href={`/listing/${l.id}`} className="group relative block overflow-hidden rounded-md">
              <ProductPhoto tone={TONES[i % TONES.length]} ratio="1/1" rounded={6} />
              <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(20,17,15,0.82) 100%)", padding: 10 }}>
                <div style={{ color: "var(--paper)", fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {l.title}
                </div>
                <div style={{ color: "var(--grail-gold)", marginTop: 3 }}>
                  <Money value={Math.round(l.price / 100)} size={13} />
                </div>
              </div>
            </Link>
          ))}
          {exploreTiles.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", color: "var(--ink-faint)", fontSize: 14 }}>No listings to explore yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
