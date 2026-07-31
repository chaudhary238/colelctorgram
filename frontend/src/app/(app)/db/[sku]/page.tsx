"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Flag, ShieldCheck, Users, Plus, Check, Star, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel } from "@/components/ui";
import { ReportCatalogueSheet } from "@/components/ReportCatalogueSheet";
import { DbPeopleModal, type DbPeopleMode } from "@/components/DbPeopleModal";
import { formatMoney, CAT_META } from "@/lib/catalog";

// Scorred DB entry page — the shared library record for one SKU (NOT a user's item).
// Web-first surface, not in design_v6 (see DECISIONS.md 2026-07-11): search results
// navigate here like every other result type, and this page carries the actions —
// add to collection / view your copy / report the entry.

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
  is_official: boolean;
  tone: string;
  collectors_count: number;
  wishlists_count: number;
  viewer_item: { id: string; status: string } | null;
  submitted_by_handle: string | null;
}

const VIEWER_STATUS_LABEL: Record<string, string> = {
  owned: "In your collection",
  preorder: "On pre-order",
  wishlist: "On your wishlist",
  intel: "Your DB contribution",
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

export default function DbEntryPage() {
  const { sku } = useParams<{ sku: string }>();
  const [entry, setEntry] = useState<DbEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [people, setPeople] = useState<DbPeopleMode | null>(null);

  // Star = wishlist (casual "might want someday"; taxonomy 2026-07-11). Active when
  // the viewer's copy of this SKU is a wishlist item; hidden once they own it.
  const wishlisted = entry?.viewer_item?.status === "wishlist";
  async function toggleWishlist() {
    if (!entry || wishBusy) return;
    setWishBusy(true);
    try {
      await api.post(`/catalogue/${encodeURIComponent(entry.sku)}/wishlist`);
      const fresh = await api.get<DbEntry>(`/catalogue/${encodeURIComponent(entry.sku)}`);
      setEntry(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setWishBusy(false);
    }
  }

  useEffect(() => {
    api.get<DbEntry>(`/catalogue/${encodeURIComponent(sku)}`)
      .then(setEntry)
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

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/db" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Scorred DB</span>
        </div>
      </div>

      <ProductPhoto tone={entry.tone || "ink"} src={entry.thumbnail_url} ratio="1/1" rounded={0} label="catalogue reference" />

      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          {entry.is_official ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--verified-teal)", background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 5, padding: "2px 7px" }}>
              <ShieldCheck size={11} /> Official
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-mute)", background: "var(--bone)", borderRadius: 5, padding: "2px 7px" }}>Community</span>
          )}
          {entry.pending && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--grail-gold)", color: "var(--paper)" }}>
              Pending review
            </span>
          )}
          {entry.viewer_item && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--verified-teal)", color: "var(--paper)" }}>
              <Check size={11} /> {VIEWER_STATUS_LABEL[entry.viewer_item.status] ?? "In your collection"}
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>
          {entry.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)" }}>SKU {entry.sku}</span>
          <button type="button" onClick={() => setReporting(true)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-faint)" }}>
            <Flag size={12} /> Report
          </button>
        </div>

        {/* DV7-02 — the shelf-count row is tappable and opens the people list
            (design_v7 DbPeopleList). Stays a plain row when nobody holds it yet. */}
        {entry.collectors_count === 0 && entry.wishlists_count === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px", marginBottom: 16 }}>
            <Users size={16} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
              No collectors have this on their shelf yet — be the first.
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <CountTile
              n={entry.collectors_count}
              label="own this"
              icon={<Users size={13} style={{ color: "var(--ink-mute)" }} />}
              onClick={() => setPeople("owners")}
            />
            <CountTile
              n={entry.wishlists_count}
              label="wishlisted"
              icon={<Star size={13} style={{ color: "var(--ink-mute)" }} />}
              onClick={() => setPeople("wishlist")}
            />
          </div>
        )}

        <SectionLabel>Details</SectionLabel>
        <div style={{ marginTop: 4, marginBottom: 18 }}>
          <SpecRow label="Brand" value={entry.brand} />
          <SpecRow label="Category" value={catLabel} />
          {entry.scale && <SpecRow label="Scale" value={entry.scale} />}
          {entry.year && <SpecRow label="Year" value={entry.year} />}
          {entry.est_retail_price > 0 && <SpecRow label="Est. retail" value={formatMoney(entry.est_retail_price)} />}
        </div>

        {entry.description && (
          <>
            <SectionLabel>About this entry</SectionLabel>
            <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", marginTop: 10, marginBottom: 18 }}>
              {entry.description}
            </div>
          </>
        )}

        {!entry.is_official && entry.submitted_by_handle && (
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 18 }}>
            Added to the Scorred DB by{" "}
            <Link href={`/profile/${entry.submitted_by_handle}`} style={{ color: "var(--verified-teal)", fontWeight: 600, textDecoration: "none" }}>
              @{entry.submitted_by_handle}
            </Link>
          </div>
        )}
      </div>

      <div className="ch-cta-bar">
        {entry.viewer_item && entry.viewer_item.status !== "wishlist" ? (
          <Link href={`/item/${entry.viewer_item.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--ink)", textDecoration: "none" }}>
            <Check size={17} /> {VIEWER_STATUS_LABEL[entry.viewer_item.status] ?? "In your collection"} — view your item
          </Link>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {/* Single add flow: deep-link into /add/catalogue with this SKU — the form arrives
                prefilled with the shared facts locked (DV6-13), same as picking it in search. */}
            <Link href={`/add/catalogue?sku=${encodeURIComponent(entry.sku)}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
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

/* ── Tappable shelf-count tile (v7 ExploreItemDetail stat row) ── */
function CountTile({ n, label, icon, onClick }: { n: number; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, textAlign: "left", cursor: "pointer", border: "1px solid var(--border)",
        background: "var(--paper-soft)", borderRadius: 13, padding: "12px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}
    >
      <span>
        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: "var(--ink)", lineHeight: 1.1, fontFeatureSettings: '"tnum" 1' }}>
          {n.toLocaleString("en-IN")}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
          {icon}
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-mute)" }}>{label}</span>
        </span>
      </span>
      <ChevronRight size={16} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
    </button>
  );
}
