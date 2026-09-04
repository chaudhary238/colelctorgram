"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Flag, Plus, Check, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { BackButton } from "@/components/BackButton";
import { ReportCatalogueSheet } from "@/components/ReportCatalogueSheet";
import { DbPeopleModal, type DbPeopleMode } from "@/components/DbPeopleModal";
import {
  ItemPageBody, OwnershipCard, type RatingAggregate, type SpecEntry,
} from "@/components/ItemPageBody";
import { formatMoney, CAT_META } from "@/lib/catalog";

// Scorred DB entry page — the shared library record for one SKU (NOT a user's item).
// DV8-05: renders the SAME body as /item/[id] via ItemPageBody — only the ownership
// card variant and the footer CTA are page-specific. SKU is no longer shown in the
// UI (internal key only, DV8 §6).

interface DbEntry {
  sku: string;
  title: string;
  brand: string;
  category: string;
  scale: string | null;
  year: string | null;
  description: string | null;
  est_retail_price: number;
  thumbnail_url: string | null;
  pending: boolean;
  is_verified: boolean;
  tone: string;
  collectors_count: number;
  wishlists_count: number;
  viewer_item: { id: string; status: string } | null;
  submitted_by_handle: string | null;
  // DV8 §2 — catalogue-entry rating aggregate + the caller's own score.
  rating_avg: number | null;
  rating_count: number;
  my_rating: number | null;
}

// The viewer's own copy, when they hold one — fills the ownership card (DV8 §1).
interface OwnCopy {
  id: string;
  status: string;
  condition: string | null;
  value: number | null;
  value_currency?: string;
  is_listed: boolean;
  photo_count: number;
  preorder_ordered_at: string | null;
  preorder_eta: string | null;
  preorder_window_precision?: string | null;
  preorder_seller?: string | null;
  preorder_total?: number | null;
  preorder_deposit?: number | null;
}

const VIEWER_STATUS_LABEL: Record<string, string> = {
  owned: "In your collection",
  preorder: "On pre-order",
  wishlist: "On your wishlist",
  intel: "Your DB contribution",
};

export default function DbEntryPage() {
  const { sku } = useParams<{ sku: string }>();
  const { user } = useUser();
  const [entry, setEntry] = useState<DbEntry | null>(null);
  const [ownCopy, setOwnCopy] = useState<OwnCopy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [people, setPeople] = useState<DbPeopleMode | null>(null);

  function load(e: DbEntry) {
    setEntry(e);
    // Held copy → fetch its private facts so the ownership card can render the
    // collapsed "Owned · Sealed · ₹4,800" line. Wishlist/intel rows get no card.
    if (e.viewer_item && (e.viewer_item.status === "owned" || e.viewer_item.status === "preorder")) {
      api.get<OwnCopy>(`/items/${e.viewer_item.id}`).then(setOwnCopy).catch(() => setOwnCopy(null));
    } else {
      setOwnCopy(null);
    }
  }

  // Star = wishlist (casual "might want someday"; taxonomy 2026-07-11). Active when
  // the viewer's copy of this SKU is a wishlist item; hidden once they own it.
  const wishlisted = entry?.viewer_item?.status === "wishlist";
  async function toggleWishlist() {
    if (!entry || wishBusy) return;
    setWishBusy(true);
    try {
      await api.post(`/catalogue/${encodeURIComponent(entry.sku)}/wishlist`);
      const fresh = await api.get<DbEntry>(`/catalogue/${encodeURIComponent(entry.sku)}`);
      load(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setWishBusy(false);
    }
  }

  useEffect(() => {
    api.get<DbEntry>(`/catalogue/${encodeURIComponent(sku)}`)
      .then(load)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [sku]);

  if (loading) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "1/1", background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)" }} />
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="w-full max-w-[680px] flex flex-col">
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BackButton fallback="/db" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Scorred DB</span>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-faint)", fontSize: 14 }}>
          This entry doesn&rsquo;t exist or was removed.
        </div>
      </div>
    );
  }

  const catLabel = CAT_META[entry.category]?.label ?? entry.category;
  const specs: SpecEntry[] = [
    { label: "Brand", value: entry.brand },
    { label: "Category", value: catLabel },
    entry.scale ? { label: "Scale", value: entry.scale } : null,
    entry.year ? { label: "Year", value: entry.year } : null,
    entry.est_retail_price > 0 ? { label: "Est. retail", value: formatMoney(entry.est_retail_price) } : null,
  ].filter((s): s is SpecEntry => s != null);
  const rating: RatingAggregate = {
    rating_avg: entry.rating_avg,
    rating_count: entry.rating_count,
    my_rating: entry.my_rating,
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/db" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Scorred DB</span>
          <button type="button" onClick={() => setReporting(true)} title="Report this entry" aria-label="Report this entry"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-faint)", padding: 6 }}>
            <Flag size={14} />
          </button>
        </div>
      </div>

      <ItemPageBody
        images={entry.thumbnail_url ? [entry.thumbnail_url] : []}
        tone={entry.tone || "ink"}
        photoLabel="catalogue reference"
        title={entry.title}
        metaLine={[entry.brand, entry.scale, entry.year].filter(Boolean).join(" · ")}
        provenance={{
          isVerified: entry.is_verified,
          addedBy: entry.submitted_by_handle,
          isYou: !!user?.handle && user.handle === entry.submitted_by_handle,
        }}
        ownershipCard={
          ownCopy && (ownCopy.status === "owned" || ownCopy.status === "preorder") ? (
            <OwnershipCard
              status={ownCopy.status === "preorder" ? "preorder" : "owned"}
              viewerIsOwner
              condition={ownCopy.condition}
              value={ownCopy.value}
              currency={ownCopy.value_currency}
              photoCount={ownCopy.photo_count}
              isListed={ownCopy.is_listed}
              preorder={ownCopy.status === "preorder" ? {
                orderedAt: ownCopy.preorder_ordered_at,
                eta: ownCopy.preorder_eta,
                precision: ownCopy.preorder_window_precision ?? null,
                seller: ownCopy.preorder_seller ?? null,
                total: ownCopy.preorder_total ?? null,
                deposit: ownCopy.preorder_deposit ?? null,
              } : null}
            />
          ) : null
        }
        stats={{ owners: entry.collectors_count, wishlisted: entry.wishlists_count, onOpen: (m) => setPeople(m) }}
        about={{ description: entry.description, specs }}
        rating={{ sku: entry.sku, initial: rating }}
        sku={entry.sku}
      />

      <div className="ch-cta-bar">
        {entry.viewer_item && entry.viewer_item.status !== "wishlist" ? (
          <Link href={`/item/${entry.viewer_item.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--ink)", textDecoration: "none" }}>
            <Check size={17} /> {VIEWER_STATUS_LABEL[entry.viewer_item.status] ?? "In your collection"} — view your item
          </Link>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {/* Single add flow: deep-link into /add/catalogue with this SKU — the form arrives
                prefilled with the shared facts locked (DV6-13), same as picking it in search. */}
            <Link href={`/add/collection?sku=${encodeURIComponent(entry.sku)}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              <Plus size={18} /> Add to my collection
            </Link>
            {/* Star = wishlist (icon law 2026-07-11): casual intent, lands in Saved → Wishlist */}
            <button
              type="button"
              onClick={toggleWishlist}
              disabled={wishBusy}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                width: 48, height: 48, borderRadius: 13, flexShrink: 0, cursor: wishBusy ? "wait" : "pointer",
                border: `1px solid ${wishlisted ? "var(--stamp-red)" : "var(--border-strong)"}`,
                background: wishlisted ? "var(--stamp-red)" : "var(--paper)",
                color: wishlisted ? "var(--paper)" : "var(--ink)",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 140ms",
              }}
            >
              <Star size={19} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>

      {reporting && <ReportCatalogueSheet sku={entry.sku} onClose={() => setReporting(false)} />}
      {people && (
        <DbPeopleModal sku={entry.sku} title={entry.title} mode={people} onClose={() => setPeople(null)} />
      )}
    </div>
  );
}
