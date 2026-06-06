"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Repeat2, Bell, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ApiListing } from "@/components/cards";
import { Segmented, CategoryChip } from "@/components/ui";
import { MarketCard } from "@/components/cards";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits & Lego" },
  { id: "diecast", label: "Diecast" },
];

const SORTS = [
  { id: "new", label: "Newest" },
  { id: "low", label: "Price ↑" },
  { id: "high", label: "Price ↓" },
] as const;

export default function MarketPage() {
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("new");
  const [tradeOnly, setTradeOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ items: ApiListing[] }>("/listings?limit=50")
      .then((data) => setListings(data?.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    let l = listings.filter((x) => x.status !== "sold");
    if (tradeOnly) l = l.filter((x) => x.trade_willing);
    if (cat !== "all") l = l.filter((x) => (x.category ?? "").toLowerCase().includes(cat));
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [listings, sort, tradeOnly, cat]);

  return (
    <div className="w-full max-w-[1100px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/search"
            style={{
              flex: 1, display: "flex", alignItems: "center", gap: 9, height: 40,
              padding: "0 14px", borderRadius: 11, border: "1px solid var(--border-strong)",
              background: "var(--paper-soft)", color: "var(--ink-faint)", fontSize: 14,
            }}
          >
            <Search size={18} />
            Search items, brands, sellers…
          </Link>
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid " + (showFilters || tradeOnly ? "var(--ink)" : "var(--border-strong)"),
              background: showFilters || tradeOnly ? "var(--ink)" : "var(--paper-soft)",
              color: showFilters || tradeOnly ? "var(--paper)" : "var(--ink)",
            }}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="flex gap-[7px] mt-[10px] overflow-x-auto">
          {CATEGORIES.map((c) => (
            <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </CategoryChip>
          ))}
        </div>

        {showFilters && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <Segmented options={SORTS as unknown as { id: string; label: string }[]} value={sort} onChange={(v) => setSort(v as typeof sort)} />
            </div>
            <button
              onClick={() => setTradeOnly((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px",
                borderRadius: 9, border: `1px solid ${tradeOnly ? "var(--ink)" : "var(--border-strong)"}`,
                background: tradeOnly ? "var(--ink)" : "var(--paper-soft)",
                color: tradeOnly ? "var(--paper)" : "var(--ink)",
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, whiteSpace: "nowrap",
              }}
            >
              <Repeat2 size={15} />
              Trade
            </button>
          </div>
        )}
      </div>

      <Link
        href="/search"
        style={{
          display: "flex", alignItems: "center", gap: 10, margin: "16px 20px 0",
          background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)",
          borderRadius: 12, padding: "10px 12px",
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--verified-teal)" }}>Wishlist alerts are live</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>Set up alerts for items you want — we'll notify you when they're listed.</div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--verified-teal)" }} />
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.04em" }}>
          {loading ? "…" : `${list.length} LISTINGS`}
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>tuned to your interests</span>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, padding: "0 20px 28px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 14, background: "var(--bone)", aspectRatio: "1/1.4" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-5 pb-7">
          {list.map((l) => <MarketCard key={l.id} listing={l} />)}
          {list.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: "var(--ink-faint)" }}>
              No results — try broadening your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
