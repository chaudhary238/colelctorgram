"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowLeftRight, Check, Clock, Flag, Gift, Lock, MoreHorizontal, Pencil, PlusCircle, Search, Send, SlidersHorizontal, Star, Tag as TagIcon, Trash2, X,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReportCatalogueSheet } from "@/components/ReportCatalogueSheet";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { ConfirmDialog, SectionLabel, Tag } from "@/components/ui";
import { ReleaseWindowPicker } from "@/components/forms";
import { fireToast, fireXpToast } from "@/components/gamification";
import {
  ItemPageBody, OwnershipCard, type RatingAggregate,
} from "@/components/ItemPageBody";
import { buildPoEta, formatMoney, type PoPrecision } from "@/lib/catalog";

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
  // v8 "Relist for sale" — the newest CLOSED listing's terms (owner-only, unlisted copies).
  closed_listing_id?: string | null;
  closed_listing_price?: number | null;
  closed_listing_currency?: string | null;
  // v8 sold treatment — sold_at stamps a closed copy (stays on the shelf, greyed);
  // sold_price is the closing price in minor units, owner-only (stripped for visitors).
  sold_at?: string | null;
  sold_price?: number | null;
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
  est_retail_price: number;
  rating_avg: number | null;
  rating_count: number;
  my_rating: number | null;
  /** The VIEWER's best copy of this sku (owned > preorder > wishlist) — powers the
      v8 "In your collection" visitor CTA (:70-73). */
  viewer_item: { id: string; status: string } | null;
}

// v8 ItemDetail :420-431 — the remove sheet's reason sets. Owned ids stay the
// backend's logged vocabulary (items.py REMOVE_REASONS); the pre-order variant's
// ids follow v8 (the reason is optional log data either way).
const REMOVE_REASONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "sold", label: "Sold offline", icon: <TagIcon size={16} /> },
  { id: "traded", label: "Traded offline", icon: <ArrowLeftRight size={16} /> },
  { id: "lost", label: "Lost", icon: <Search size={16} /> },
  { id: "broken", label: "Broken or damaged", icon: <X size={16} /> },
  { id: "gifted", label: "Gifted to someone", icon: <Gift size={16} /> },
  { id: "other", label: "Other reason", icon: <MoreHorizontal size={16} /> },
];
const PO_REMOVE_REASONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "po-cancelled", label: "Pre-order cancelled", icon: <X size={16} /> },
  { id: "po-refunded", label: "Refunded by the seller", icon: <ArrowLeftRight size={16} /> },
  { id: "po-transfer", label: "Slot transferred to someone", icon: <TagIcon size={16} /> },
  { id: "other", label: "Other reason", icon: <MoreHorizontal size={16} /> },
];

// v8 shared.jsx STATUS_LABEL vocabulary — "Owned", never "In collection".
const STATUS_LABEL: Record<string, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  preorder: "Pre-order",
  intel: "DB Contribution",
};

const TONES = ["teal", "plum", "forest", "gold", "red", "ink"];

// v8 ItemDetail :411-465 — "Remove from collection?" / "Cancel this pre-order?"
// reason sheet: 34px icon boxes, selected = bone row + solid red icon box +
// trailing check; the red confirm sits at 0.45 opacity until a reason is picked.

function RemoveSheet({ isPreorder, reason, setReason, onConfirm, onClose, removing }: {
  isPreorder: boolean; reason: string; setReason: (r: string) => void; onConfirm: () => void; onClose: () => void; removing: boolean;
}) {
  const reasons = isPreorder ? PO_REMOVE_REASONS : REMOVE_REASONS;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-[20px] sm:rounded-2xl shadow-[var(--shadow-4)]" style={{ padding: "8px 0 36px" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 18px" }} />
        <div style={{ padding: "0 20px 16px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            {isPreorder ? "Cancel this pre-order?" : "Remove from collection?"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 4 }}>
            {isPreorder ? "What happened? It leaves your pre-order calendar either way." : "Tell us why — this helps keep your collection accurate."}
          </div>
        </div>
        {reasons.map((r) => (
          <button key={r.id} type="button" onClick={() => setReason(r.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 20px",
            background: reason === r.id ? "var(--bone)" : "none", border: "none",
            borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: reason === r.id ? "var(--stamp-red)" : "var(--paper-soft)",
              color: reason === r.id ? "var(--paper)" : "var(--ink-mute)",
            }}>
              {r.icon}
            </div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: reason === r.id ? 600 : 400, color: "var(--ink)" }}>{r.label}</span>
            {reason === r.id && <Check size={16} style={{ marginLeft: "auto", color: "var(--stamp-red)", flexShrink: 0 }} />}
          </button>
        ))}
        <div style={{ padding: "16px 20px 0" }}>
          <button type="button" onClick={() => { if (reason && !removing) onConfirm(); }} style={{
            width: "100%", height: 46, borderRadius: 12, border: "none", background: "var(--stamp-red)", color: "var(--paper)",
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5,
            cursor: reason && !removing ? "pointer" : "default", opacity: reason && !removing ? 1 : 0.45,
          }}>
            {removing ? "Removing…" : isPreorder ? "Cancel pre-order" : "Remove item"}
          </button>
          <button type="button" onClick={onClose} style={{
            width: "100%", height: 46, marginTop: 8, borderRadius: 12, border: "1px solid var(--border-strong)",
            background: "var(--bone)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, cursor: "pointer",
          }}>
            Cancel
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
          {/* QA #22 — minWidth:0 so the uppercase mono labels can't force the
              columns wider than the sheet on small screens. */}
          <div style={{ display: "flex", gap: 11, marginTop: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}><SectionLabel>Total price (₹)</SectionLabel>{moneyInput(total, setTotal)}</div>
            <div style={{ flex: 1, minWidth: 0 }}><SectionLabel>Deposit paid (₹)</SectionLabel>{moneyInput(deposit, setDeposit)}</div>
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

// v8 ItemDetail :379-410 — "Mark as sold?" one-tap confirm that says what changes,
// plus an OPTIONAL closing price ("What did it go for?") the design's mock skipped.
function MarkSoldSheet({ isListed, busy, onConfirm, onClose }: {
  isListed: boolean; busy: boolean; onConfirm: (priceRupees: number | null) => void; onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  const bullets: { text: string; icon: React.ReactNode }[] = [
    ...(isListed ? [{ text: "Your listing closes and leaves the market", icon: <X size={15} /> }] : []),
    { text: "The item stays in your collection with a Sold tag", icon: <Check size={15} /> },
    { text: "It stops counting toward your portfolio value", icon: <Lock size={15} /> },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] p-5 pb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", textAlign: "center", color: "var(--ink)", margin: 0 }}>
          Mark as sold?
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center", margin: "5px 0 0", lineHeight: 1.5 }}>
          For a sale you settled in chat or offline — no buyer details needed.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, margin: "18px 0 2px" }}>
          {bullets.map((b) => (
            <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-soft)" }}>
              <span style={{ color: "var(--ink-faint)", flexShrink: 0, display: "flex" }}>{b.icon}</span>{b.text}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)" }}>What did it go for? <span style={{ fontWeight: 400, color: "var(--ink-faint)" }}>(optional)</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, height: 44, marginTop: 7, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
          </div>
        </div>
        <button onClick={() => onConfirm(price ? Number(price) : null)} disabled={busy}
          style={{ width: "100%", height: 46, marginTop: 18, borderRadius: 12, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Marking…" : "Mark as sold"}
        </button>
        {/* v8 Button secondary (shared.jsx :557) — bone ground. */}
        <button onClick={onClose} disabled={busy}
          style={{ width: "100%", height: 46, marginTop: 8, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--bone)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}>
          Cancel
        </button>
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
  const [adding, setAdding] = useState(false);
  // v8 :68-79 — the visitor's own fresh copy after "I own this too" flips the CTA
  // to the reactive secondary "In your collection" state (also covers skuless items
  // where there is no catalogue record to hang viewer_item on).
  const [myCopy, setMyCopy] = useState<{ id: string; status: string } | null>(null);
  // remove-from-collection sheet (DV4-04)
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [removing, setRemoving] = useState(false);
  // DV8-07 — the owner's kebab / manage sheet
  const [manageOpen, setManageOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmUnlist, setConfirmUnlist] = useState(false); // QA #27
  // v8 sold treatment — the Mark-as-sold confirm sheet + its POST/DELETE round trips
  const [soldOpen, setSoldOpen] = useState(false);
  const [soldBusy, setSoldBusy] = useState(false);

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

  // v8 "Mark as sold" — the server stamps sold_at, closes any live listing as sold
  // and unlists it; the optional closing price travels as minor units.
  async function markSold(priceRupees: number | null) {
    if (!item || soldBusy) return;
    setSoldBusy(true);
    try {
      await api.post(`/items/${item.id}/sold`, priceRupees != null && priceRupees > 0 ? { price: priceRupees * 100 } : {});
      setSoldOpen(false);
      // v8 :403 — two-line toast: title + what changed.
      fireToast("Marked as sold", "Greyed out in your collection — undo any time");
      const fresh = await api.get<ApiItem>(`/items/${item.id}`);
      setItem(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setSoldBusy(false);
    }
  }

  // v8 "Still have it — undo sold" → DELETE clears the stamp; back to a normal owned copy.
  async function undoSold() {
    if (!item || soldBusy) return;
    setSoldBusy(true);
    try {
      await api.delete(`/items/${item.id}/sold`);
      setManageOpen(false);
      // v8 :111 copy.
      fireToast("Back in your collection");
      const fresh = await api.get<ApiItem>(`/items/${item.id}`);
      setItem(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setSoldBusy(false);
    }
  }

  async function removeItem() {
    if (!item || removing) return;
    setRemoving(true);
    try {
      const qs = removeReason ? `?reason=${encodeURIComponent(removeReason)}` : "";
      await api.delete(`/items/${item.id}${qs}`);
      // v8 :455-456 — toast, then POP back to wherever the item was opened from
      // (never a hard /profile jump); /profile only as the cold-entry fallback.
      fireToast(item.status === "preorder" ? "Pre-order cancelled" : "Removed from your collection");
      if (window.history.length > 1) router.back();
      else router.push("/profile");
    } catch (e) {
      console.error(e);
      fireToast("Couldn't remove this item — try again"); // QA #3: failure was silent
      setRemoving(false);
    }
  }

  // DV8 "Ask about it" — POST /threads returns the existing pair thread or creates
  // one (privacy-gated on NEW threads only); then land in the chat composer in draft
  // mode so the FIRST send carries ref_sku. Errors deliberately propagate: the
  // ownership card turns a 403 detail into its quiet inline note.
  async function askOwner() {
    if (!item) return;
    const thread = await api.post<{ id: string }>("/threads", { other_user_id: item.user_id });
    const askTitle = item.title ?? item.custom_title ?? item.sku ?? "Item";
    const qs = item.sku
      ? `?draft=1&sku=${encodeURIComponent(item.sku)}&title=${encodeURIComponent(askTitle)}`
      : "";
    router.push(`/chat/${thread.id}${qs}`);
  }

  // v8 :75-78 — the visitor CTA QUICK-adds (+5 XP now, +20 when finished later);
  // the wishlist-conversion + duplicate guard live server-side behind quick:true.
  // Same staged toast pattern as the /db grid (db/page.tsx quickAdd).
  async function addToCollection() {
    if (adding || !item) return;
    setAdding(true);
    try {
      const res = await api.post<{ id: string; add_xp?: number; complete_xp?: number }>(
        "/items",
        item.sku ? { sku: item.sku, quick: true, status: "owned" } : { custom_title: item.custom_title, status: "owned" },
      );
      if (res.add_xp && res.add_xp > 0) fireXpToast(res.add_xp, "Added to collection");
      else fireToast("Added to collection");
      // Quick adds land without condition & price — teach the +20 XP finish, staggered
      // so the two toasts don't overlap (they share the same fixed slot).
      if (!(res.complete_xp && res.complete_xp > 0)) {
        setTimeout(() => fireToast("+20 XP when you add condition & price"), 2500);
      }
      // Flip the local state in place — the CTA re-renders as "In your collection".
      setMyCopy({ id: res.id, status: "owned" });
      setCat((c) => (c ? { ...c, viewer_item: { id: res.id, status: "owned" } } : c));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      fireToast(msg.includes("Already") ? "Already in your collection" : msg || "Could not add this item");
    } finally {
      setAdding(false);
    }
  }

  // DV8-07 — "Change to pre-order" / "It arrived — mark as owned" / wish-intel
  // conversion. The server clears the pre-order fields on the preorder → owned flip.
  async function setStatus(status: "owned" | "preorder") {
    if (!item || statusBusy) return;
    setStatusBusy(true);
    // v8 splits the owned-flip copy: a pre-order ARRIVING (:113) vs a wish/intel
    // row CONVERTING (:87) — the old code toasted the arrived line for both.
    const arrived = status === "owned" && item.status === "preorder";
    try {
      const out = await api.patch<ApiItem>(`/items/${item.id}`, { status });
      if ((out.complete_xp ?? 0) > 0) fireXpToast(out.complete_xp as number, "Item complete");
      if (status === "preorder") fireToast("Moved to pre-orders");
      else if (arrived) fireToast("It’s yours — moved to Owned", "Check the condition and what you paid");
      // Conversion: the PATCH grants no add XP (server truth — no invented "+5"),
      // and the finish teaching sub only while the copy is actually incomplete.
      else fireToast("Moved to your collection", out.is_complete ? undefined : "+20 XP when you add condition & price");
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

  // v8 :121 "Add another copy" — a second row of the same sku (different condition,
  // a resale copy, a gift). Non-quick POST: the duplicate guard only protects the
  // one-tap quick-add, so a deliberate second copy is allowed.
  async function addAnotherCopy() {
    if (!item?.sku || statusBusy) return;
    setStatusBusy(true);
    try {
      const res = await api.post<{ id: string; add_xp?: number }>("/items", {
        sku: item.sku, status: item.status === "preorder" ? "preorder" : "owned",
      });
      if (res.add_xp && res.add_xp > 0) {
        fireXpToast(res.add_xp, "Added a second copy");
        setTimeout(() => fireToast("Give it its own condition & price"), 2400);
      } else {
        fireToast("Added a second copy", "Give it its own condition & price");
      }
      setManageOpen(false);
      router.push(`/item/${res.id}`);
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Could not add a copy");
      setStatusBusy(false);
    }
  }

  // v8 :127 "Unlist from market" — the listing row stays (status closed), which is
  // exactly what makes one-tap Relist possible later.
  async function unlist() {
    if (!item?.listing_id || statusBusy) return;
    setStatusBusy(true);
    try {
      await api.patch(`/listings/${item.listing_id}`, { status: "closed" });
      // v8 flashToast(title, sub) — one toast, two lines.
      fireToast("Unlisted — stays in your collection", "Relist puts it back at these terms");
      setItem(await api.get<ApiItem>(`/items/${item.id}`));
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Could not unlist");
    } finally {
      setStatusBusy(false);
      setManageOpen(false);
    }
  }

  // v8 :114 "Relist for sale" — reopen the archived listing at its saved terms.
  async function relist() {
    if (!item?.closed_listing_id || statusBusy) return;
    setStatusBusy(true);
    try {
      await api.patch(`/listings/${item.closed_listing_id}`, { status: "available" });
      fireToast("Relisted at your previous terms");
      setItem(await api.get<ApiItem>(`/items/${item.id}`));
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Could not relist");
    } finally {
      setStatusBusy(false);
      setManageOpen(false);
    }
  }

  // v8 :129 offers "Change to pre-order" even on a LISTED copy — we close the
  // listing first so the market never carries a not-in-hand copy as available.
  async function changeToPreorder() {
    if (!item || statusBusy) return;
    if (item.is_listed && item.listing_id) {
      try { await api.patch(`/listings/${item.listing_id}`, { status: "closed" }); } catch { /* the status flip below still applies */ }
    }
    await setStatus("preorder");
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
  // v8 sold — a closed copy: stays on the shelf greyed out, excluded from portfolio
  // value, never "incomplete". Manage collapses to Undo sold + Remove.
  const isSold = item.sold_at != null;

  // DV8 §1 — intel/DB-contribution rows get NO ownership card (nobody owns them;
  // the "Added by" contributor line covers it). Wishlist rows get none either.
  const showCard = (isOwned || isPreorder) && !isIntel;

  const rating: RatingAggregate | null = cat
    ? { rating_avg: cat.rating_avg, rating_count: cat.rating_count, my_rating: cat.my_rating }
    : null;

  // Contributor line: catalogue submitter first; an intel row falls back to its owner.
  const addedBy = cat?.submitted_by_handle ?? (isIntel ? item.owner_handle ?? null : null);

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-20">
      {/* v8 :162-166 — the header floats transparent over the photo: a scrimmed back
          button, no "Item detail" title bar and no kebab (Manage lives in the footer
          CTA). The report flag keeps the same scrim chrome. */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <BackButton fallback="/profile" transparent />
          {item.sku && (
            <button type="button" onClick={() => setReporting(true)} title="Report this entry" aria-label="Report this entry"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 12, border: "none",
                background: "rgba(20,17,15,0.5)", backdropFilter: "blur(6px)", color: "var(--paper)", cursor: "pointer" }}>
              <Flag size={16} />
            </button>
          )}
        </div>

        <ItemPageBody
          images={item.images ?? []}
          tone={tone}
          // v8 :166 — "your photo · {i} of {n}" is the OWNER's label (mine.photos).
          // QA #20 — nobody else gets a stamp: "catalogue reference" over an owner's
          // real photos was wrong, and over an actual reference image it was noise.
          photoLabel={isOwnItem && item.photo_count > 0 ? "your photo" : undefined}
          photoCountInLabel={isOwnItem && item.photo_count > 0}
          tags={
            /* v8 :170-174 — tags describe YOUR copy only (status + Listed); a visitor
               sees a clean title. */
            isOwnItem ? (
              /* v8 :171-173 — sold STACKS the forest Sold tag beside the status tag;
                 only the "Listed" tag is suppressed (nothing is on the market). */
              <>
                <Tag kind={isPreorder ? "po" : (isWish || isIntel) ? "teal" : "default"}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Tag>
                {isSold && <Tag kind="sold">Sold</Tag>}
                {item.is_listed && isOwned && !isSold && <Tag kind="sale">Listed</Tag>}
              </>
            ) : undefined
          }
          title={title}
          metaLine={[item.brand, item.scale !== "—" ? item.scale : null, item.release_year != null ? String(item.release_year) : null].filter(Boolean).join(" · ")}
          provenance={
            item.sku
              ? {
                  isVerified: cat ? cat.is_verified : !!item.catalogue_is_verified,
                  addedBy,
                  isYou: !!user?.handle && !!addedBy && user.handle === addedBy,
                }
              : null
          }
          // v8 :200/:45 — "isWish" is the INTEL status: a DB-contribution row hides the
          // Est. value (the teal attribution pill covers it); a wishlist-status row
          // SHOWS it. Suppressed too when your card already carries a private price
          // (a visitor's payload has value nulled by the API). Mirrors /db/[sku].
          estValue={!isIntel && !(isOwnItem && item.value) ? cat?.est_retail_price ?? null : null}
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
                sold={isSold}
                soldPrice={item.sold_price ?? null}
                preorder={isPreorder ? {
                  orderedAt: item.preorder_ordered_at,
                  eta: item.preorder_eta,
                  precision: item.preorder_window_precision ?? null,
                  seller: item.preorder_seller ?? null,
                  total: item.preorder_total ?? null,
                  deposit: item.preorder_deposit ?? null,
                } : null}
                onEditPreorder={isOwnItem ? () => setPoEdit(true) : undefined}
                // v8 complete-items: gap "Add →" rows and the Finish CTA land on the
                // copy's editor — owned → the edit form, pre-order → its ETA sheet.
                onComplete={
                  isOwnItem
                    ? () => { if (isPreorder) setPoEdit(true); else router.push(`/item/${item.id}/sell`); }
                    : undefined
                }
                // DV8 "Ask about it" — visitor-only DM into the owner's pair thread.
                onAsk={!isOwnItem ? askOwner : undefined}
              />
            ) : null
          }
          // v8 pushes the full db-people SCREEN (ExploreView.jsx:529), not a modal.
          stats={cat && item.sku ? { owners: cat.collectors_count, wishlisted: cat.wishlists_count, onOpen: (m) => router.push(`/db/${encodeURIComponent(item.sku!)}/people?mode=${m}`) } : null}
          about={{
            description: item.description ?? cat?.description,
            brand: item.brand,
            year: item.release_year != null ? String(item.release_year) : null,
          }}
          rating={item.sku && rating ? { sku: item.sku, initial: rating } : null}
          sku={item.sku}
        />
      </div>

      <div className="ch-cta-bar">
        {/* QA 6.5 / 7.2 — the primary action depends on whether the VIEWER owns the
            item, never on its status alone. v8 :63-99: owner of an in-hand/pre-order
            copy gets ONE Manage button into the sheet; a wish/intel row gets
            "I own this now"; a visitor gets "I own this too" (or "In your collection"
            when they already hold the sku) plus the wishlist star. */}
        {isOwnItem ? (
          isOwned || isPreorder ? (
            /* v8 :81-83 — a sold copy's CTA drops to the SECONDARY treatment: nothing
               about it is urgent any more, but its record still opens the sheet. */
            <button onClick={() => setManageOpen(true)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13,
              /* v8 :81 — sold drops to the SECONDARY treatment: bone ground (shared.jsx :557). */
              background: isSold ? "var(--bone)" : "var(--stamp-red)",
              color: isSold ? "var(--ink)" : "var(--paper)",
              border: isSold ? "1px solid var(--border-strong)" : "none",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>
              <SlidersHorizontal size={18} />
              {isSold ? "Manage — sold" : isPreorder ? "Manage pre-order" : item.is_listed ? "Manage — listed" : "Manage this item"}
            </button>
          ) : (
            // v8 :86-89 — your own wish (or intel seed) converts with one tap.
            <button onClick={() => setStatus("owned")} disabled={statusBusy} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--ink)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: statusBusy ? "wait" : "pointer" }}>
              <PlusCircle size={18} /> I own this now
            </button>
          )
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {(() => {
              const viewerCopy = myCopy ?? cat?.viewer_item;
              return viewerCopy && (viewerCopy.status === "owned" || viewerCopy.status === "preorder") ? (
                /* v8 :70-73 — you already hold this sku yourself; don't offer to add it
                   twice. The secondary state deep-links to YOUR copy's page. */
                <Link href={`/item/${viewerCopy.id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--ink)", textDecoration: "none" }}>
                  <Check size={18} /> In your collection
                </Link>
              ) : (
                /* v8 :75-78 — dark quick-add with the plus-circle glyph. */
                <button onClick={addToCollection} disabled={adding} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--ink)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: adding ? "wait" : "pointer" }}>
                  <PlusCircle size={18} /> {adding ? "Adding…" : "I own this too"}
                </button>
              );
            })()}
            {/* Star = wishlist (icon law 2026-07-11); v8 :92-98 active = soft red tint, red star */}
            <button
              type="button"
              onClick={toggleWishlist}
              disabled={wishBusy}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                width: 52, height: 48, borderRadius: 12, flexShrink: 0, cursor: wishBusy ? "wait" : "pointer",
                border: "1px solid var(--border-strong)",
                background: wishlisted ? "var(--stamp-red-soft)" : "var(--paper)",
                color: wishlisted ? "var(--stamp-red)" : "var(--ink-faint)",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 140ms",
              }}
            >
              <Star size={21} fill={wishlisted ? "var(--stamp-red)" : "none"} />
            </button>
          </div>
        )}
      </div>

      {/* ── DV8-07 — Manage this item (owner kebab): every action for this copy in one
          sheet, each with a "what does this do" line. ── */}
      {confirmUnlist && (
        <ConfirmDialog
          title="Unlist from the market?"
          body="It stays in your collection; Relist brings it back at the same terms."
          confirmLabel="Unlist"
          busy={statusBusy}
          onConfirm={() => { setConfirmUnlist(false); unlist(); }}
          onCancel={() => setConfirmUnlist(false)}
        />
      )}

      {manageOpen && isOwnItem && (() => {
        // v8 ItemDetail :109-134 — EXACT row set and order:
        // undo-sold / arrived / relist / list-for-sale / edit / add-another-copy /
        // mark-as-sold / share-to-feed / unlist / change-to-preorder / remove.
        const rows: { icon: React.ReactNode; label: string; desc: string; danger?: boolean; onClick: () => void }[] = [];
        const canRelist = isOwned && !isSold && !item.is_listed && !!item.closed_listing_id;
        if (isSold) {
          rows.push({
            icon: <ArrowLeftRight size={16} />, label: "Still have it — undo sold",
            desc: "Back to a normal owned item, counting toward your value",
            onClick: undoSold,
          });
        }
        if (isPreorder && !isSold) {
          rows.push({
            icon: <Check size={16} />, label: "It arrived — mark as owned",
            desc: "Moves it out of your pre-order calendar",
            onClick: () => setStatus("owned"),
          });
        }
        if (canRelist) {
          rows.push({
            icon: <TagIcon size={16} />, label: "Relist for sale",
            desc: `Back on the market at ${formatMoney(item.closed_listing_price ?? 0, item.closed_listing_currency ?? "INR")}`,
            onClick: relist,
          });
        }
        if (isOwned && !isSold && !item.is_listed && !canRelist) {
          rows.push({
            icon: <TagIcon size={16} />, label: "List for sale",
            desc: "Set a price and put it on the market",
            // v8 :266 forSale:true — the sell form arrives with the toggle pre-ON.
            onClick: () => { setManageOpen(false); router.push(`/item/${item.id}/sell?list=1`); },
          });
        }
        if (!isSold && (isOwned || isPreorder)) {
          rows.push(isPreorder ? {
            icon: <Pencil size={16} />, label: "Edit pre-order details",
            desc: "ETA, total, deposit and where you ordered from",
            onClick: () => { setManageOpen(false); setPoEdit(true); },
          } : {
            icon: <Pencil size={16} />, label: "Edit item",
            desc: item.is_listed ? "Condition, price, photos and listing terms" : "Condition, price paid and photos",
            onClick: () => { setManageOpen(false); router.push(`/item/${item.id}/sell`); },
          });
          if (item.sku) {
            rows.push({
              icon: <PlusCircle size={16} />, label: "Add another copy",
              desc: "A second one you own — different condition, a resale copy, a gift",
              onClick: addAnotherCopy,
            });
          }
        }
        if (isOwned && !isSold) {
          // v8 :123 gates this to listed copies; ours covers offline sales of unlisted
          // copies too (founder-approved sold-state spec) — the desc adapts.
          rows.push({
            icon: <Check size={16} />, label: "Mark as sold",
            desc: item.is_listed ? "Closes the listing; the item stays here with a Sold tag" : "The item stays here with a Sold tag",
            onClick: () => { setManageOpen(false); setSoldOpen(true); },
          });
        }
        if (isOwned && !isSold && item.is_listed && item.listing_id) {
          rows.push({
            icon: <Send size={16} />, label: "Share to Feed",
            desc: "Post this listing to your feed with a caption",
            onClick: () => { setManageOpen(false); router.push(`/listing/${item.listing_id}?share=1`); },
          });
          rows.push({
            icon: <X size={16} />, label: "Unlist from market",
            desc: "Stop selling it — Relist later at these same terms",
            // QA #27 — same confirm the listing page's own Unlist already has.
            onClick: () => setConfirmUnlist(true),
          });
        }
        if (!isSold && !isPreorder && isOwned) {
          rows.push({
            icon: <Clock size={16} />, label: "Change to pre-order",
            desc: "You don’t have it in hand yet",
            onClick: changeToPreorder,
          });
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
            {/* v8 :138 — the 11-row sheet scrolls inside itself on short viewports:
                maxHeight 86%, r20 top corners, 8/0/34 padding. */}
            <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-[20px] sm:rounded-2xl shadow-[var(--shadow-4)]"
              style={{ maxHeight: "86%", overflowY: "auto", padding: "8px 0 34px" }}>
              {/* v8 :139 — the sheet's 36×4 drag handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 16px" }} />
              <div style={{ padding: "0 20px 12px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Manage this item</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isSold ? "Sold" : isPreorder ? "On pre-order" : item.is_listed ? "Owned · listed for sale" : "Owned"} · {title}
                </div>
              </div>
              {rows.map((row) => (
                <button key={row.label} onClick={row.onClick} disabled={statusBusy || soldBusy} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 20px", textAlign: "left",
                  background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: statusBusy || soldBusy ? "wait" : "pointer",
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
        <RemoveSheet isPreorder={isPreorder} reason={removeReason} setReason={setRemoveReason} onConfirm={removeItem} onClose={() => setRemoveOpen(false)} removing={removing} />
      )}
      {soldOpen && isOwnItem && (
        <MarkSoldSheet isListed={item.is_listed} busy={soldBusy} onConfirm={markSold} onClose={() => setSoldOpen(false)} />
      )}
      {reporting && item.sku && (
        <ReportCatalogueSheet sku={item.sku} onClose={() => setReporting(false)} />
      )}
      {poEdit && (
        <EditPreorderSheet item={item} onClose={() => setPoEdit(false)}
          onSaved={() => api.get<ApiItem>(`/items/${id}`).then(setItem).catch(console.error)} />
      )}
    </div>
  );
}
