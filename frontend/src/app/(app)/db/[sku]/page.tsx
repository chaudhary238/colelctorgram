"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, PlusCircle, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { fireToast, fireXpToast } from "@/components/gamification";
import { BackButton } from "@/components/BackButton";
import { ReportCatalogueSheet } from "@/components/ReportCatalogueSheet";
import { Tag } from "@/components/ui";
import { ItemPageBody, type RatingAggregate } from "@/components/ItemPageBody";

// Scorred DB entry page — the shared library record for one SKU (NOT a user's item).
//
// v8 has ONE page per sku ('explore-item' → ItemDetail, App.jsx:26) that resolves the
// viewer's relationship. Our web split means: when the viewer HOLDS a copy (owned /
// pre-order) this page REDIRECTS to /item/{id} — that page carries v8's owner scenario
// exactly (your photos, ownership card, red Manage footer + sheet, sold treatment).
// What renders HERE is v8's mine-less page: no row / wishlist row / intel row.
// SKU is never shown in the UI (internal key only, DV8 §6). Audit: .claude/DV8_DB_AUDIT.md.

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

export default function DbEntryPage() {
  const { sku } = useParams<{ sku: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [entry, setEntry] = useState<DbEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback((e: DbEntry): boolean => {
    // v8 = one page per sku: a held copy means THIS entry's page is your copy's page.
    // /item/[id] carries that scenario verbatim (red Manage footer, your photos, sold
    // treatment), so hand over and keep the skeleton up while the route swaps.
    if (e.viewer_item && (e.viewer_item.status === "owned" || e.viewer_item.status === "preorder")) {
      router.replace(`/item/${e.viewer_item.id}`);
      return false;
    }
    setEntry(e);
    return true;
  }, [router]);


  // v8 ItemDetail :63-89 — the entry-page CTA QUICK-ADDS (+5 XP, finish later via the
  // ownership card's gap rows); it never opens a form. A wishlist row converts
  // server-side; an intel row stays as contribution credit beside the new copy.
  // (Pre-order tracking still starts from Create → Add item, same as v8's search flow.)
  async function quickAddOwned() {
    if (!entry || adding) return;
    setAdding(true);
    const converting = !!entry.viewer_item;
    try {
      const res = await api.post<{ id: string; add_xp?: number; complete_xp?: number }>(
        "/items", { sku: entry.sku, quick: true, status: "owned" },
      );
      const label = converting ? "Moved to your collection" : "Added to collection";
      if (res.add_xp && res.add_xp > 0) fireXpToast(res.add_xp, label);
      else fireToast(label);
      if (!(res.complete_xp && res.complete_xp > 0)) {
        setTimeout(() => fireToast("+20 XP when you add condition & price"), 2500);
      }
      const fresh = await api.get<DbEntry>(`/catalogue/${encodeURIComponent(entry.sku)}`);
      load(fresh);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      fireToast(msg.includes("Already") ? "Already in your collection" : msg || "Could not add this item");
    } finally {
      setAdding(false);
    }
  }
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
      // A redirecting load keeps the skeleton up — flipping to "not found" or the
      // stranger view for a frame would flash the wrong page while the route swaps.
      .then((e) => { if (load(e)) setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [sku, load]);

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

  const rating: RatingAggregate = {
    rating_avg: entry.rating_avg,
    rating_count: entry.rating_count,
    my_rating: entry.my_rating,
  };
  // Owned / pre-order rows never reach the render — load() hands them to /item/{id}.
  const viewerStatus = entry.viewer_item?.status ?? null;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      {/* v8 :162-166 — the header floats transparent over the photo: a scrimmed back
          button, no "Scorred DB" title bar. The report flag keeps the same scrim chrome. */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <BackButton fallback="/db" transparent />
          <button type="button" onClick={() => setReporting(true)} title="Report this entry" aria-label="Report this entry"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 12, border: "none",
              background: "rgba(20,17,15,0.5)", backdropFilter: "blur(6px)", color: "var(--paper)", cursor: "pointer" }}>
            <Flag size={16} />
          </button>
        </div>

        <ItemPageBody
          images={entry.thumbnail_url ? [entry.thumbnail_url] : []}
          tone={entry.tone || "ink"}
          photoLabel="catalogue reference"
          tags={
            viewerStatus === "wishlist" ? (
              <Tag kind="teal">Wishlist</Tag>
            ) : viewerStatus === "intel" ? (
              <Tag kind="teal">DB Contribution</Tag>
            ) : undefined
          }
          title={entry.title}
          metaLine={[entry.brand, entry.scale !== "—" ? entry.scale : null, entry.year].filter(Boolean).join(" · ")}
          provenance={{
            isVerified: entry.is_verified,
            addedBy: entry.submitted_by_handle,
            isYou: !!user?.handle && user.handle === entry.submitted_by_handle,
          }}
          // v8 :200 — hidden only on YOUR DB-contribution rows (isWish = the intel
          // status — the teal attribution pill covers those); star-wishlisting never
          // hides it, and owned copies read theirs on /item/{id}.
          estValue={viewerStatus !== "intel" ? entry.est_retail_price : null}
          // v8 pushes the full db-people SCREEN (ExploreView.jsx:529), not a modal.
          stats={{ owners: entry.collectors_count, wishlisted: entry.wishlists_count, onOpen: (m) => router.push(`/db/${encodeURIComponent(entry.sku)}/people?mode=${m}`) }}
          about={{ description: entry.description, brand: entry.brand, year: entry.year }}
          rating={{ sku: entry.sku, initial: rating }}
          sku={entry.sku}
        />
      </div>

      <div className="ch-cta-bar">
        <div style={{ display: "flex", gap: 10 }}>
            {/* v8 ItemDetail :63-89 — one dark button that quick-adds. Fresh viewers read
                "Add to collection"; a wishlist or DB-contribution row reads "I own this now"
                (both convert to an owned copy; finish via the ownership card's gap rows). */}
            <button
              type="button"
              onClick={quickAddOwned}
              disabled={adding}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: adding ? "wait" : "pointer" }}
            >
              {/* v8 :64/:75 — the CTA glyph is the plus-CIRCLE, not a bare plus. */}
              <PlusCircle size={18} /> {adding ? "Adding…" : entry.viewer_item ? "I own this now" : "Add to collection"}
            </button>
            {/* Star = wishlist (icon law 2026-07-11): casual intent, lands in Saved → Wishlist.
                v8 :92-98 — only offered while the viewer holds NO row of this SKU (once one
                exists the CTA owns the slot), so it only ever draws idle: a wishlist row
                hides it, and un-wishing lives on Saved → Wishlist. */}
            {!entry.viewer_item && (
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishBusy}
                title="Add to wishlist"
                aria-label="Add to wishlist"
                style={{
                  width: 52, height: 48, borderRadius: 12, flexShrink: 0, cursor: wishBusy ? "wait" : "pointer",
                  border: "1px solid var(--border-strong)",
                  background: "var(--paper)",
                  color: "var(--ink-faint)",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 140ms",
                }}
              >
                <Star size={21} />
              </button>
            )}
        </div>
      </div>

      {reporting && <ReportCatalogueSheet sku={entry.sku} onClose={() => setReporting(false)} />}
    </div>
  );
}
