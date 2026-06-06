"use client";

import { useState } from "react";
import { Tag, Smartphone, Heart, Repeat2, MapPin, Star } from "lucide-react";
import { MOCK_LISTINGS, formatPrice, timeAgo } from "@/lib/mock";
import { cn } from "@/lib/utils";

const CONDITION_LABELS: Record<string, string> = {
  sealed: "Sealed",
  opened: "Opened",
  built: "Built",
  loose: "Loose",
  damaged: "Damaged",
};

const CONDITION_COLORS: Record<string, string> = {
  sealed: "bg-[var(--forest-soft)] text-[var(--forest)]",
  opened: "bg-[var(--grail-gold-soft)] text-[var(--grail-gold-deep)]",
  built: "bg-[var(--verified-teal-soft)] text-[var(--verified-teal)]",
  loose: "bg-[var(--bone-deep)] text-[var(--ink-mute)]",
  damaged: "bg-[var(--stamp-red-soft)] text-[var(--stamp-red-deep)]",
};

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits" },
  { id: "diecast", label: "Diecast" },
];

const CONDITION_FILTERS = [
  { id: "all", label: "Any condition" },
  { id: "sealed", label: "Sealed" },
  { id: "opened", label: "Opened" },
  { id: "built", label: "Built" },
];

function ListingCard({ listing }: { listing: typeof MOCK_LISTINGS[number] }) {
  const [saved, setSaved] = useState(false);
  const [saves, setSaves] = useState(listing.saves_count);

  function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setSaved((v) => {
      setSaves((n) => n + (v ? -1 : 1));
      return !v;
    });
  }

  const initials = listing.seller.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--paper)] overflow-hidden hover:shadow-[var(--shadow-2)] transition-shadow cursor-pointer">
      {/* Image */}
      <div className="aspect-square bg-[var(--bone-deep)] relative overflow-hidden">
        {listing.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.thumbnail} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none opacity-20">
            📦
          </div>
        )}

        {/* Condition badge */}
        <span className={cn(
          "absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full",
          CONDITION_COLORS[listing.condition] ?? CONDITION_COLORS.loose
        )}>
          {CONDITION_LABELS[listing.condition] ?? listing.condition}
        </span>

        {/* Trade badge */}
        {listing.trade_willing && (
          <span className="absolute top-2 right-2 bg-[var(--verified-teal)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Repeat2 size={9} strokeWidth={2.5} />
            Trade
          </span>
        )}

        {/* Save */}
        <button
          onClick={toggleSave}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          <Heart
            size={13}
            strokeWidth={2}
            className={cn("transition-colors", saved ? "fill-[var(--stamp-red)] text-[var(--stamp-red)]" : "text-[var(--ink-mute)]")}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-[var(--ink-faint)] truncate mb-0.5">{listing.sku ?? "Custom"}</p>
        <p className="text-sm font-semibold text-[var(--ink)] leading-tight line-clamp-2 mb-2">
          {listing.title}
        </p>
        <p className="text-base font-bold text-[var(--ink)]">{formatPrice(listing.price)}</p>

        {/* Seller */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[var(--border)]">
          <div className="w-6 h-6 rounded-full bg-[var(--stamp-red-soft)] flex items-center justify-center text-[9px] font-bold text-[var(--stamp-red)] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[var(--ink-mute)] truncate">{listing.seller.name}</span>
              {listing.seller.rating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-[var(--grail-gold-deep)] shrink-0">
                  <Star size={9} className="fill-[var(--grail-gold)] text-[var(--grail-gold)]" />
                  {listing.seller.rating}
                </span>
              )}
            </div>
          </div>
          {listing.ships_from_city && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--ink-ghost)] shrink-0">
              <MapPin size={9} />
              {listing.ships_from_city}
            </span>
          )}
        </div>

        <p className="text-[10px] text-[var(--ink-ghost)] mt-1">{timeAgo(listing.created_at)}</p>
      </div>
    </div>
  );
}

export default function MarketPage() {
  const [catFilter, setCatFilter] = useState("all");
  const [condFilter, setCondFilter] = useState("all");
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc">("recent");

  let listings = [...MOCK_LISTINGS];
  if (condFilter !== "all") listings = listings.filter((l) => l.condition === condFilter);
  if (sort === "price_asc") listings.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") listings.sort((a, b) => b.price - a.price);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Market
          </h1>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="text-xs border border-[var(--border-strong)] rounded-lg px-2 py-1.5 bg-[var(--surface)] text-[var(--ink)] outline-none"
            >
              <option value="recent">Most recent</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>

            {/* Sell — app only */}
            <div className="group relative">
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-strong)] text-[var(--ink-faint)] bg-[var(--bone)] cursor-not-allowed"
              >
                <Tag size={12} strokeWidth={2} />
                Sell
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--ink)] text-white text-xs px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                <span className="flex items-center gap-2">
                  <Smartphone size={12} className="shrink-0" />
                  Download the app to list items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCatFilter(f.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-colors",
                catFilter === f.id
                  ? "bg-[var(--ink)] text-white border-transparent"
                  : "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink-mute)] hover:border-[var(--ink-ghost)]"
              )}
            >
              {f.label}
            </button>
          ))}

          <div className="w-px bg-[var(--border-strong)] mx-1 shrink-0" />

          {CONDITION_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCondFilter(f.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-colors",
                condFilter === f.id
                  ? "bg-[var(--stamp-red)] text-white border-transparent"
                  : "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink-mute)] hover:border-[var(--ink-ghost)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}
