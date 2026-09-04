"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Bell, Check, Clock, Flag, MoreHorizontal, Pencil, Star, Tag, Trash2,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReportCatalogueSheet } from "@/components/ReportCatalogueSheet";
import { DbPeopleModal, type DbPeopleMode } from "@/components/DbPeopleModal";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { SectionLabel } from "@/components/ui";
import { ReleaseWindowPicker } from "@/components/forms";
import { fireToast, fireXpToast } from "@/components/gamification";
import {
  ItemPageBody, OwnershipCard, type RatingAggregate, type SpecEntry,
} from "@/components/ItemPageBody";
import { formatMoney, buildPoEta, ADD_CATEGORIES, type PoPrecision } from "@/lib/catalog";

// DV8-05/06/07 — the collection-item page renders the SAME body as /db/[sku]
// (ItemPageBody); only the ownership card variant + footer CTA differ. SKU is no
// longer shown anywhere in the UI (internal key only).

interface ApiItem {
  id: string;
  user_id: string;
  sku: string | null;
  custom_title: string | null;
  /** Server-resolved display name: custom_title → catalogue title → sku (QA §5/§6). */
  title?: string | null;
  catalogue_title?: string | null;
  brand?: string | null;
  scale?: string | null;
  release_year?: number | null;
  description?: string | null;
  category?: string | null;
  status: string;
  condition?: string | null;
  is_complete?: boolean;
  /** DV8 §1 — null for non-owners: what you paid is visible only to you. */
  value: number | null;
  value_currency?: string;
  is_listed: boolean;
  // DV8-17 — present when listed: the live listing's id/price so the ownership
  // card's Sale row can deep-link to /listing/{listing_id}.
  listing_id?: string | null;
  listing_price?: number | null;   // minor units
  listing_currency?: string | null;
  photo_count: number;
  images?: string[];
  preorder_ordered_at: string | null;
  preorder_eta: string | null;
  preorder_window_precision?: string | null;
  preorder_seller?: string | null;
  preorder_total?: number | null;
  preorder_deposit?: number | null;
  privacy: string;
  created_at: string;
  owner_handle?: string | null;
  owner_name?: string | null;
  catalogue_is_verified?: boolean;
  // viewer's wishlist state for this item's identity (Star toggle, taxonomy 2026-07-11)
  is_wishlisted?: boolean;
  // DV8 — XP actually granted by a PATCH (0 when deduped/capped); toast what the server says.
  complete_xp?: number;
}

// The linked catalogue entry — provenance, community stats and the rating aggregate
// all come from the shared record so this page reads identically to /db/[sku].
interface CatEntry {
  sku: string;
  is_verified: boolean;
  submitted_by_handle: string | null;
  collectors_count: number;
  wishlists_count: number;
  description: string | null;
  rating_avg: number | null;
  rating_count: number;
  my_rating: number | null;
}

// DV4-04: remove-from-collection reasons (design_v4 ItemDetail "Remove from collection?" sheet).
const REMOVE_REASONS: { id: string; label: string }[] = [
  { id: "sold", label: "Sold offline" },
  { id: "traded", label: "Traded offline" },
  { id: "lost", label: "Lost" },
  { id: "broken", label: "Broken or damaged" },
  { id: "gifted", label: "Gifted to someone" },
  { id: "other", label: "Other reason" },
];

const STATUS_LABEL: Record<string, string> = {
  owned: "In collection",
  wishlist: "Wishlist",
  preorder: "Pre-order",
  intel: "DB Contribution",
};

const TONES = ["teal", "plum", "forest", "gold", "red", "ink"];

// One wording per category app-wide (Change Spec §4.2) — read from the shared list.
const CAT_LABEL: Record<string, string> = Object.fromEntries(
  ADD_CATEGORIES.map((c) => [c.id, c.label]),
);

// DV4-04: "Remove from collection?" reason sheet.

function RemoveSheet({ reason, setReason, onConfirm, onClose, removing }: {
  reason: string; setReason: (r: string) => void; onConfirm: () => void; onClose: () => void; removing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] p-5">
        <h2 className="font-bold text-base text-[var(--ink)] mb-1" style={{ fontFamily: "var(--font-display)" }}>Remove from collection?</h2>
        <p className="text-xs text-[var(--ink-faint)] mb-4">Tell us why — it helps keep collection value and trade signals accurate.</p>
        <div className="space-y-2">
          {REMOVE_REASONS.map((r) => (
            <button key={r.id} onClick={() => setReason(r.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors"
              style={{ borderColor: reason === r.id ? "var(--stamp-red)" : "var(--border)", background: reason === r.id ? "var(--stamp-red-soft)" : "var(--surface)" }}>
              <span className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: reason === r.id ? "var(--stamp-red)" : "var(--border-strong)", background: reason === r.id ? "var(--stamp-red)" : "transparent" }}>
                {reason === r.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-sm font-medium text-[var(--ink)]">{r.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border-strong)] text-[var(--ink)] font-semibold text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={!reason || removing}
            className="flex-1 h-11 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm disabled:opacity-50">
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// DV4-03b: inline "Edit preorder details" editor → PATCH /items/{id}.
function EditPreorderSheet({ item, onClose, onSaved }: { item: ApiItem; onClose: () => void; onSaved: () => void }) {
  const [prec, setPrec] = useState<PoPrecision>((item.preorder_window_precision as PoPrecision) || "month");
  const [date, setDate] = useState("");
  const [monthIdx, setMonthIdx] = useState("");
  const [quarter, setQuarter] = useState("");
  const [year, setYear] = useState("2026");
  const [seller, setSeller] = useState(item.preorder_seller ?? "");
  const [total, setTotal] = useState(item.preorder_total != null ? String(Math.round(item.preorder_total / 100)) : "");
  const [deposit, setDeposit] = useState(item.preorder_deposit != null ? String(Math.round(item.preorder_deposit / 100)) : "");
  const [saving, setSaving] = useState(false);
  const balance = Math.max(0, (parseInt(total, 10) || 0) - (parseInt(deposit, 10) || 0));

  async function save() {
    setSaving(true);
    try {
      const out = await api.patch<ApiItem>(`/items/${item.id}`, {
        preorder_eta: buildPoEta(prec, { date, monthIdx, quarter, year }),
        preorder_window_precision: prec,
        preorder_seller: seller.trim() || null,
        preorder_total: total ? Number(total) * 100 : null,
        preorder_deposit: deposit ? Number(deposit) * 100 : null,
      });
      // DV8 — finishing a pre-order (ETA + total) earns +20, exactly once.
      if ((out.complete_xp ?? 0) > 0) fireXpToast(out.complete_xp as number, "Item complete");
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  const moneyInput = (value: string, set: (v: string) => void, placeholder = "0") => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 44, marginTop: 7, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
      <input value={value} onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
          <h2 className="font-bold text-base text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Edit preorder details</h2>
          <button onClick={onClose} className="text-[var(--ink-faint)] hover:text-[var(--ink)] p-1"><ArrowLeft size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4">
          <SectionLabel>Release window</SectionLabel>
          <div style={{ marginTop: 9 }}>
            <ReleaseWindowPicker prec={prec} onPrec={setPrec} date={date} onDate={setDate}
              monthIdx={monthIdx} onMonth={setMonthIdx} quarter={quarter} onQuarter={setQuarter} year={year} onYear={setYear} />
          </div>
          <div style={{ marginTop: 14 }}><SectionLabel>Seller / Store</SectionLabel></div>
          <input value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="e.g. BBToyStore, Bangalore"
            style={{ width: "100%", boxSizing: "border-box", height: 44, marginTop: 7, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }} />
          <div style={{ display: "flex", gap: 11, marginTop: 14 }}>
            <div style={{ flex: 1 }}><SectionLabel>Total price (₹)</SectionLabel>{moneyInput(total, setTotal)}</div>
            <div style={{ flex: 1 }}><SectionLabel>Deposit paid (₹)</SectionLabel>{moneyInput(deposit, setDeposit)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Balance due</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--stamp-red)" }}>₹{balance.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
          <button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm disabled:opacity-60">
            {saving ? "Saving…" : "Save preorder details"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [item, setItem] = useState<ApiItem | null>(null);
  const [cat, setCat] = useState<CatEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishAlert, setWishAlert] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  // remove-from-collection sheet (DV4-04)
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [removing, setRemoving] = useState(false);
  // DV8-07 — the owner's kebab / manage sheet
  const [manageOpen, setManageOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [people, setPeople] = useState<DbPeopleMode | null>(null);

  const [reporting, setReporting] = useState(false); // DV6-13 — report this catalogue entry
  // Star = wishlist (taxonomy 2026-07-11) — non-owner only; lands in Saved → Wishlist.
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  async function toggleWishlist() {
    if (!item || wishBusy) return;
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    setWishBusy(true);
    try { await api.post(`/items/${item.id}/wishlist`); }
    catch { setWishlisted(!next); }
    finally { setWishBusy(false); }
  }
  // edit pre-order details (DV4-03b)
  const [poEdit, setPoEdit] = useState(false);

  async function removeItem() {
    if (!item || removing) return;
    setRemoving(true);
    try {
      const qs = removeReason ? `?reason=${encodeURIComponent(removeReason)}` : "";
      await api.delete(`/items/${item.id}${qs}`);
      router.push("/profile");
    } catch (e) {
      console.error(e);
      setRemoving(false);
    }
  }

  async function addToCollection() {
    if (adding || added || !item) return;
    setAdding(true);
    try {
      await api.post("/items", item.sku ? { sku: item.sku } : { custom_title: item.custom_title });
      setAdded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  // DV8-07 — "Change to pre-order" / "It arrived — mark as owned". The server clears
  // the pre-order fields on the preorder → owned flip.
  async function setStatus(status: "owned" | "preorder") {
    if (!item || statusBusy) return;
    setStatusBusy(true);
    try {
      const out = await api.patch<ApiItem>(`/items/${item.id}`, { status });
      if ((out.complete_xp ?? 0) > 0) fireXpToast(out.complete_xp as number, "Item complete");
      fireToast(status === "owned" ? "It’s yours — moved to Owned" : "Moved to pre-orders");
      // Refetch: the PATCH response lacks the owner/catalogue enrichment GET adds.
      const fresh = await api.get<ApiItem>(`/items/${item.id}`);
      setItem(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setStatusBusy(false);
      setManageOpen(false);
    }
  }

  useEffect(() => {
    api.get<ApiItem>(`/items/${id}`)
      .then((i) => {
        setItem(i);
        setWishlisted(!!i.is_wishlisted);
        // DV8 §2 — provenance, community stats and the rating block read the shared
        // catalogue record, so this page shows them only when the item has a SKU.
        if (i.sku) {
          api.get<CatEntry>(`/catalogue/${encodeURIComponent(i.sku)}`).then(setCat).catch(() => setCat(null));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !item) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "1/1", background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
      </div>
    );
  }

  // Server-resolved name (custom_title → catalogue title → sku). The old chain stays as
  // a fallback for any cached/older payload (QA 2026-08-05 §5/§6).
  const title = item.title ?? item.custom_title ?? item.sku ?? "Item";
  const tone = TONES[parseInt(id, 16) % TONES.length] ?? "teal";
  const isOwned = item.status === "owned";
  const isWish = item.status === "wishlist";
  const isPreorder = item.status === "preorder";
  const isIntel = item.status === "intel"; // DV6-11h — DB Contribution (unowned catalogue seed)
  const isOwnItem = !!user && user.id === item.user_id;

  // DV8 §1 — intel/DB-contribution rows get NO ownership card (nobody owns them;
  // the "Added by" contributor line covers it). Wishlist rows get none either.
  const showCard = (isOwned || isPreorder) && !isIntel;

  const specs: SpecEntry[] = [
    item.brand ? { label: "Brand", value: item.brand } : null,
    item.category ? { label: "Category", value: CAT_LABEL[item.category] ?? item.category } : null,
    item.scale ? { label: "Scale", value: item.scale } : null,
    item.release_year != null ? { label: "Year", value: String(item.release_year) } : null,
    // A wishlist row has no ownership card; its cloned est. value lives in the specs.
    isWish && item.value != null && item.value > 0
      ? { label: "Est. market value", value: formatMoney(item.value, item.value_currency) }
      : null,
  ].filter((s): s is SpecEntry => s != null);

  const rating: RatingAggregate | null = cat
    ? { rating_avg: cat.rating_avg, rating_count: cat.rating_count, my_rating: cat.my_rating }
    : null;

  // Contributor line: catalogue submitter first; an intel row falls back to its owner.
  const addedBy = cat?.submitted_by_handle ?? (isIntel ? item.owner_handle ?? null : null);

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-20">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/profile" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Item detail</span>
          {item.sku && (
            <button type="button" onClick={() => setReporting(true)} title="Report this entry" aria-label="Report this entry"
              style={{ display: "inline-flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", padding: 6 }}>
              <Flag size={14} />
            </button>
          )}
          {isOwnItem && (
            <button type="button" onClick={() => setManageOpen(true)} title="Manage this item" aria-label="Manage this item"
              style={{ display: "inline-flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--ink)", padding: 6 }}>
              <MoreHorizontal size={19} />
            </button>
          )}
        </div>
      </div>

      <ItemPageBody
        images={item.images ?? []}
        tone={tone}
        photoLabel={item.photo_count > 0 ? "your photo" : "catalogue reference"}
        tags={
          item.status !== "owned" ? (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: isIntel ? "var(--verified-teal)" : isWish ? "var(--plum)" : "var(--grail-gold)", color: "var(--paper)" }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          ) : undefined
        }
        title={title}
        metaLine={[item.brand, item.scale, item.release_year != null ? String(item.release_year) : null].filter(Boolean).join(" · ")}
        provenance={
          item.sku
            ? {
                isVerified: cat ? cat.is_verified : !!item.catalogue_is_verified,
                addedBy,
                isYou: !!user?.handle && !!addedBy && user.handle === addedBy,
              }
            : null
        }
        ownershipCard={
          showCard ? (
            <OwnershipCard
              status={isPreorder ? "preorder" : "owned"}
              viewerIsOwner={isOwnItem}
              ownerHandle={item.owner_handle}
              condition={item.condition}
              value={item.value}
              currency={item.value_currency}
              photoCount={item.photo_count}
              isListed={item.is_listed}
              listingHref={item.listing_id ? `/listing/${item.listing_id}` : "/market"}
              listingPrice={item.listing_price ?? null}
              listingCurrency={item.listing_currency ?? null}
              preorder={isPreorder ? {
                orderedAt: item.preorder_ordered_at,
                eta: item.preorder_eta,
                precision: item.preorder_window_precision ?? null,
                seller: item.preorder_seller ?? null,
                total: item.preorder_total ?? null,
                deposit: item.preorder_deposit ?? null,
              } : null}
              onEditPreorder={isOwnItem ? () => setPoEdit(true) : undefined}
            />
          ) : null
        }
        stats={cat ? { owners: cat.collectors_count, wishlisted: cat.wishlists_count, onOpen: (m) => setPeople(m) } : null}
        about={{ description: item.description ?? cat?.description, specs }}
        rating={item.sku && rating ? { sku: item.sku, initial: rating } : null}
        sku={item.sku}
      />

      <div className="ch-cta-bar">
        {/* QA 6.5 / 7.2 — the primary action depends on whether the VIEWER owns the
            item, never on its status alone. Management/edit actions are for the
            owner only; everyone else gets "Add to my collection" (+ wishlist). */}
        {isOwnItem ? (
          isOwned ? (
            <div style={{ display: "flex", gap: 10 }}>
              {/* DV8-12 — one edit page: condition, price and the listing toggle live together. */}
              <Link
                href={`/item/${item.id}/sell`}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                <Pencil size={17} /> Edit item
              </Link>
              {item.is_listed && (
                <Link href={item.listing_id ? `/listing/${item.listing_id}` : "/market"} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--ink)", textDecoration: "none" }}>
                  <Tag size={17} /> Manage listing
                </Link>
              )}
            </div>
          ) : isPreorder ? (
            // Your own preorder → edit its details, not "Add to collection" (QA 6.5).
            <button onClick={() => setPoEdit(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              <Pencil size={17} /> Edit preorder details
            </button>
          ) : isWish ? (
            <button onClick={() => setWishAlert((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: wishAlert ? "var(--bone)" : "var(--verified-teal)", color: wishAlert ? "var(--ink)" : "var(--paper)", border: wishAlert ? "1px solid var(--border-strong)" : "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              <Bell size={17} />
              {wishAlert ? "Alert on" : "Notify when listed"}
            </button>
          ) : null
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addToCollection} disabled={adding || added} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: added ? "var(--bone)" : "var(--ink)", color: added ? "var(--ink)" : "var(--paper)", border: added ? "1px solid var(--border-strong)" : "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: adding || added ? "default" : "pointer" }}>
              {added ? "Added to collection ✓" : adding ? "Adding…" : "Add to my collection"}
            </button>
            {/* Star = wishlist (icon law 2026-07-11) */}
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

      {/* ── DV8-07 — Manage this item (owner kebab): every action for this copy in one
          sheet, each with a "what does this do" line. ── */}
      {manageOpen && isOwnItem && (() => {
        const rows: { icon: React.ReactNode; label: string; desc: string; danger?: boolean; onClick: () => void }[] = [];
        if (isPreorder) {
          rows.push({
            icon: <Check size={16} />, label: "It arrived — mark as owned",
            desc: "Moves it out of your pre-order calendar; the server clears the order details",
            onClick: () => setStatus("owned"),
          });
          rows.push({
            icon: <Pencil size={16} />, label: "Edit pre-order details",
            desc: "ETA, total, deposit and where you ordered from",
            onClick: () => { setManageOpen(false); setPoEdit(true); },
          });
        }
        if (isOwned) {
          rows.push({
            icon: <Pencil size={16} />, label: "Edit item",
            desc: item.is_listed ? "Condition, price paid and listing" : "Condition, price paid — and list it for sale",
            onClick: () => { setManageOpen(false); router.push(`/item/${item.id}/sell`); },
          });
          if (!item.is_listed) {
            // A listed copy is promised to the market in-hand — unlist it first.
            rows.push({
              icon: <Clock size={16} />, label: "Change to pre-order",
              desc: "You don’t have it in hand yet",
              onClick: () => setStatus("preorder"),
            });
          }
        }
        rows.push({
          icon: <Trash2 size={16} />, danger: true,
          label: isPreorder ? "Cancel pre-order" : "Remove from collection",
          desc: isPreorder ? "Cancelled, refunded or slot transferred" : "Sold offline, traded, lost or gifted",
          onClick: () => { setManageOpen(false); setRemoveReason(""); setRemoveOpen(true); },
        });
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setManageOpen(false)} />
            <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] pb-4">
              <div style={{ padding: "18px 20px 12px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Manage this item</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isPreorder ? "On pre-order" : item.is_listed ? "Owned · listed for sale" : "Owned"} · {title}
                </div>
              </div>
              {rows.map((row) => (
                <button key={row.label} onClick={row.onClick} disabled={statusBusy} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 20px", textAlign: "left",
                  background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: statusBusy ? "wait" : "pointer",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: row.danger ? "var(--stamp-red-soft)" : "var(--paper-soft)", color: row.danger ? "var(--stamp-red)" : "var(--ink-mute)" }}>
                    {row.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 600, color: row.danger ? "var(--stamp-red)" : "var(--ink)" }}>{row.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{row.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {removeOpen && (
        <RemoveSheet reason={removeReason} setReason={setRemoveReason} onConfirm={removeItem} onClose={() => setRemoveOpen(false)} removing={removing} />
      )}
      {reporting && item.sku && (
        <ReportCatalogueSheet sku={item.sku} onClose={() => setReporting(false)} />
      )}
      {people && item.sku && (
        <DbPeopleModal sku={item.sku} title={title} mode={people} onClose={() => setPeople(null)} />
      )}
      {poEdit && (
        <EditPreorderSheet item={item} onClose={() => setPoEdit(false)}
          onSaved={() => api.get<ApiItem>(`/items/${id}`).then(setItem).catch(console.error)} />
      )}
    </div>
  );
}
