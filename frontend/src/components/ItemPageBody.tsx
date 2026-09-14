"use client";

/**
 * DV8-05/06/07 — ONE item page (design_v8 ItemDetail, CHANGELOG 2026-08-18 §1/§2).
 *
 * The database entry (/db/[sku]) and a collection item (/item/[id]) render the SAME
 * body by construction: photo/carousel, title, provenance line, ownership card slot,
 * community stats row, About (with the specs absorbed), and the rating score block.
 * The only variable regions are the ownership card variant and the footer CTA, which
 * each page supplies itself.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Clock, Eye, Heart, MessageCircle, MoreHorizontal, Pencil, Send, Star, Trash2, User,
} from "lucide-react";
import { api } from "@/lib/api";
import { FeedBadge, goldFrameRing, hasGoldFrame, type FeedBadgeT } from "@/components/gamification";
import { Avatar, ClampText, ConfirmDialog, Disclosure, IconButton, ProductPhoto, SealMark, Tag, statusLabel } from "@/components/ui";
import { MentionInput, renderCommentBody } from "@/components/cards";
import { conditionLabel, formatMoney } from "@/lib/catalog";
import { timeAgo } from "@/lib/utils";
import { useUser } from "@/lib/auth-context";

/* Canonical condition ids → display labels (QA 2026-07-18 set; same map as
   cards.tsx / listing/[id]). The item stores the id; the UI shows the label. */
export const CONDITION_LABEL: Record<string, string> = {
  sealed_misb: "Sealed",
  mint: "MIB",
  like_new: "BIB",
  good: "Loose",
};

export interface RatingAggregate {
  rating_avg: number | null;
  rating_count: number;
  my_rating: number | null;
}

/* ── Photo / carousel ────────────────────────────────────────── */
export function ItemPhotoCarousel({ images, tone, label, countInLabel = false }: {
  images: string[];
  tone: string;
  label?: string;
  /** v8 :166 — the owner's photo label carries the index: "your photo · 1 of 3". */
  countInLabel?: boolean;
}) {
  const [photo, setPhoto] = useState(0);
  if (images.length === 0) {
    return <ProductPhoto tone={tone} ratio="1/1" rounded={0} label={label ?? "catalogue reference"} />;
  }
  const idx = Math.min(photo, images.length - 1);
  return (
    <>
      {/* QA 2026-09-14 — letterbox on INK, not bone: the market hero letterboxes
          dark (ProductPhoto's ink tone), so the item/DB hero matches. */}
      <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: "var(--ink)" }}>
        {/* contain, not cover — the frame stays 1:1 for layout but the photo
            must never crop; off-ratio uploads letterbox on the dark ground. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[idx]} alt={label ?? "Item photo"} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        {/* QA 2026-09-14 — explicit prev/next arrows (the dots alone weren't
            discoverable); same glass chrome as the market photo overlays. */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setPhoto((p) => (p - 1 + images.length) % images.length)}
              style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(15,23,42,0.46)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setPhoto((p) => (p + 1) % images.length)}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(15,23,42,0.46)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
        {/* Same corner label ProductPhoto stamps on tone renders (ui.tsx :461), with a
            faint shadow so it survives light photos. */}
        {label && (
          <div style={{ position: "absolute", bottom: 8, left: 10, color: "rgba(244,239,230,0.85)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.05em", textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}>
            {countInLabel ? `${label} · ${Math.min(photo, images.length - 1) + 1} of ${images.length}` : label}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 0" }}>
          {Array.from({ length: Math.min(images.length, 6) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPhoto(i)}
              aria-label={`Photo ${i + 1}`}
              style={{ width: i === photo ? 18 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer", background: i === photo ? "var(--ink)" : "var(--bone-deep)", transition: "all 160ms" }}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Provenance — review state + contributor on ONE line (DV8 §2) ──
   "Scorred Reviewed" replaces the old "Scorred Verified" wording; the two stacked
   pill treatments are retired. */
export function ProvenanceLine({ isVerified, addedBy, isYou }: {
  isVerified: boolean;
  addedBy: string | null; // contributor handle; null → "Scorred"
  isYou?: boolean;
}) {
  // v8 :180 — an entry with NO contributor is the house catalogue's own, so it reads
  // Reviewed even without the explicit flag; only a user-contributed pending row waits.
  const reviewed = isVerified || !addedBy;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      {reviewed ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "oklch(97% 0.01 30)", border: "1px solid oklch(85% 0.04 30)" }}>
          <SealMark size={14} />
          <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600 }}>Scorred Reviewed</span>
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "var(--bone)", border: "1px solid var(--border-strong)" }}>
          <Clock size={12} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)", fontWeight: 600 }}>Pending Review</span>
        </span>
      )}
      {isYou || !addedBy ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--verified-teal)" }}>
          <Eye size={12} style={{ flexShrink: 0 }} />
          Added by <b style={{ fontWeight: 700 }}>{isYou ? "@you" : "Scorred"}</b>
        </span>
      ) : (
        <Link href={`/profile/${addedBy}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--verified-teal)", textDecoration: "none" }}>
          <Eye size={12} style={{ flexShrink: 0 }} />
          Added by <b style={{ fontWeight: 700 }}>@{addedBy}</b>
        </Link>
      )}
    </div>
  );
}

/* ── Ownership card — the ONLY variable region of the page (DV8 §1) ──
   One collapsible card directly under the title. Owned / pre-order (gold tint,
   replaces the old standalone gold timeline panel) / listed (Sale row INSIDE the
   card) / visitor (no price, "Ask @owner"). DB contributions get NO card — the
   contributor line covers them. Defaults collapsed for consistency. */
export interface PreorderFacts {
  orderedAt: string | null;
  eta: string | null;
  precision: string | null;
  seller: string | null;
  total: number | null;   // minor units; null for visitors (API strips financials)
  deposit: number | null;
}

interface CardRow { label: string; value: string; accent?: boolean }

export function OwnershipCard({
  status,
  viewerIsOwner,
  ownerHandle,
  condition,
  value,
  currency = "INR",
  photoCount = 0,
  isListed = false,
  listingHref = "/market",
  listingPrice = null,
  listingCurrency,
  listingStatus,
  preorder = null,
  sold = false,
  soldPrice = null,
  onEditPreorder,
  onComplete,
  onAsk,
}: {
  status: "owned" | "preorder";
  viewerIsOwner: boolean;
  ownerHandle?: string | null;
  condition?: string | null;
  value?: number | null;       // minor units; null → price never renders (non-owner payload)
  currency?: string;
  photoCount?: number;
  isListed?: boolean;
  /** /listing/{id} when the item payload carries listing_id; /market only as fallback. */
  listingHref?: string;
  listingPrice?: number | null; // minor units (listing_price from GET /items/{id})
  listingCurrency?: string | null;
  /** v8 :301 — the Sale row's tag is statusLabel(ownerListing.status); a live row is "available". */
  listingStatus?: string | null;
  preorder?: PreorderFacts | null;
  /** v8 sold treatment (ItemDetail :244-246): sold_at set → the whole card greys
      out, header reads "Your copy — sold", no gaps/finish CTAs, listing row closed. */
  sold?: boolean;
  soldPrice?: number | null;    // minor units; owner-only (sold_price from GET /items/{id})
  onEditPreorder?: () => void;
  /** v8 complete-items flow: gap rows show "Add →" and the "Finish this item" CTA routes here. */
  onComplete?: () => void;
  /** DV8 "Ask about it" — opens (or reuses) the pair DM with the owner. Must THROW
      on failure: a privacy 403's detail becomes the quiet inline note below. */
  onAsk?: () => Promise<void>;
}) {
  const isPo = status === "preorder";
  // QA #21 — resolve via the live per-category vocabulary (catalog.ts), not the
  // retired 2026-07-18 map above: DV8-10 ids like "MISB" fell through it raw.
  const condLabel = condition ? (CONDITION_LABEL[condition] ?? conditionLabel(condition)) : null;
  const handle = ownerHandle ?? "collector";
  const hasValue = value != null && value > 0;

  const poTotal = preorder?.total ?? null;
  const poDeposit = preorder?.deposit ?? 0;
  const hasTotal = poTotal != null && poTotal > 0;
  const poBalance = Math.max(0, (poTotal ?? 0) - poDeposit);

  // Gaps only matter on your own copy — a visitor shouldn't be told what you
  // haven't filled in (v8 itemGaps: preorder → ETA/price, owned → condition/price).
  // A sold copy is never "incomplete" — its record is closed, so no finish CTAs.
  const gaps: string[] = viewerIsOwner && !sold
    ? isPo
      ? [
          ...(preorder?.precision !== "tbd" && !preorder?.eta ? ["ETA"] : []),
          ...(poTotal == null && !hasValue ? ["price"] : []),
        ]
      : [
          ...(!condLabel ? ["condition"] : []),
          ...(!hasValue ? ["price"] : []),
        ]
    : [];
  const gapSentence = gaps.length
    ? "Needs " + (gaps.length > 1 ? gaps.slice(0, -1).join(", ") + " & " + gaps[gaps.length - 1] : gaps[0])
    : "";

  // Every ownership card opens collapsed for consistency; only the OWNER's pre-order
  // or incomplete copy opens expanded, because there the rows are the call to action
  // (v8 :50 — `mine` is only set when viewing your own copy, so visitors always
  // land on the collapsed header).
  const [open, setOpen] = useState(viewerIsOwner && (isPo || gaps.length > 0));

  // DV8 "Ask about it" — a privacy 403 swaps the button for this quiet note, once,
  // in place (no toast spam). A network blip keeps the button so a retry works.
  const [askBusy, setAskBusy] = useState(false);
  const [askNote, setAskNote] = useState<string | null>(null);

  async function ask() {
    if (!onAsk || askBusy) return;
    setAskBusy(true);
    try {
      await onAsk();
    } catch (e) {
      if (e instanceof TypeError) { // fetch itself failed — transient, keep the button
        console.error(e);
      } else {
        const detail = e instanceof Error && e.message && e.message !== "Request failed" ? e.message : null;
        setAskNote(detail ?? `@${handle} only accepts messages from collectors they follow.`);
      }
    } finally {
      setAskBusy(false);
    }
  }

  // v8 :216 — a sold copy's header states it plainly; the owner's phrasing matches
  // the design verbatim, a visitor keeps the possessive form.
  const header = sold
    ? viewerIsOwner ? "Your copy — sold" : `@${handle}’s copy — sold`
    : isPo
    ? viewerIsOwner ? "Your pre-order" : `@${handle} has this on pre-order`
    : viewerIsOwner ? "About your copy" : `In @${handle}’s collection`;

  // Price renders ONLY when value != null — the API returns value: null to non-owners.
  // Collapsed, a pre-order still shows the two things you'd open it for (v8 :219-223).
  const sub = gaps.length ? gapSentence : isPo
    ? [preorder?.eta ? preorder.eta : (preorder?.precision === "tbd" ? "Date not announced" : null),
       viewerIsOwner && hasTotal && poBalance > 0 ? `${formatMoney(poBalance, currency)} due` : null]
        .filter(Boolean).join(" · ")
    : [sold ? "Sold" : "Owned", condLabel, hasValue ? formatMoney(value as number, currency) : null]
        .filter(Boolean).join(" · ");

  const rows: CardRow[] = (isPo
    ? [
        preorder?.orderedAt
          ? { label: "Ordered", value: new Date(preorder.orderedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }
          : null,
        { label: "Expected", value: preorder?.precision === "tbd" ? "Not announced" : (preorder?.eta || "TBD") },
        viewerIsOwner && preorder?.seller ? { label: "Ordered from", value: preorder.seller } : null,
        viewerIsOwner ? { label: "Total price", value: hasTotal ? formatMoney(poTotal as number, currency) : "—" } : null,
        viewerIsOwner && hasTotal ? { label: "Deposit paid", value: formatMoney(poDeposit, currency) } : null,
        viewerIsOwner && hasTotal ? { label: "Balance due", value: formatMoney(poBalance, currency), accent: true } : null,
      ]
    : [
        { label: "Status", value: sold ? "Sold" : "Owned" },
        { label: "Condition", value: condLabel ?? "—" },
        viewerIsOwner ? { label: "What you paid", value: hasValue ? formatMoney(value as number, currency) : "—" } : null,
        // The closing price of the sale — owner-only (the API strips sold_price for visitors).
        viewerIsOwner && sold && soldPrice != null && soldPrice > 0
          ? { label: "Sold for", value: formatMoney(soldPrice, currency) } : null,
        { label: viewerIsOwner ? "Your photos" : "Owner photos", value: photoCount ? String(photoCount) : "None yet" },
        { label: "Listed for sale", value: sold ? "Closed" : isListed ? "Yes" : "No" },
      ]
  ).filter((r): r is CardRow => r != null);

  return (
    /* v8 :244-246 — sold: plain border, bone ground, the WHOLE card runs through
       grayscale(1); the pre-order gold and owned paper-soft treatments otherwise. */
    <div style={{
      border: `1px solid ${sold ? "var(--border)" : isPo ? "var(--grail-gold)" : "var(--border-strong)"}`,
      borderRadius: 14,
      background: sold ? "var(--bone)" : isPo ? "var(--grail-gold-soft)" : "var(--paper-soft)",
      filter: sold ? "grayscale(1)" : "none",
      marginBottom: 14, overflow: "hidden",
    }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", textAlign: "left",
        background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {isPo && <Clock size={15} style={{ color: "var(--grail-gold-deep)", flexShrink: 0 }} />}
            <span style={{ fontSize: 14, fontWeight: 700, color: isPo ? "var(--grail-gold-deep)" : "var(--ink)" }}>{header}</span>
          </div>
          {/* v8 :255 — a gap sentence reads bold gold; the "Listed" tag lives in the page's
              tags row (and the Sale row below), never as a chip inside this header. */}
          {sub && (
            <div style={{ fontSize: 11.5, color: gaps.length ? "var(--grail-gold-deep)" : "var(--ink-faint)", marginTop: 2, fontWeight: gaps.length ? 700 : 400 }}>{sub}</div>
          )}
        </div>
        <ChevronRight size={16} style={{ color: "var(--ink-faint)", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 130ms" }} />
      </button>
      {open && (
        <div style={{ padding: "2px 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r) => {
            // v8 :263 — a missing value renders as an "Add →" jump into the finish flow,
            // in the slot where the data would have been. Owner only; a sold copy's
            // record is closed, so a bare "—" stays a dash, never a CTA.
            const isGap = r.value === "—" || r.value === "TBD";
            return (
              // QA #22 — flex items default to min-width:auto, so an unbreakable
              // ₹12,50,000 or a long seller name clipped at the card edge. Wrap
              // instead, and let the value shrink + break.
              <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 13 }}>
                <span style={{ color: "var(--ink-faint)", flexShrink: 0 }}>{r.label}</span>
                {viewerIsOwner && isGap && onComplete && !sold ? (
                  <button type="button" onClick={onComplete} style={{
                    padding: 0, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-body)",
                    fontWeight: 700, fontSize: 12.5, color: "var(--grail-gold-deep)" }}>Add →</button>
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: r.accent ? 700 : 600, color: r.accent ? "var(--stamp-red)" : "var(--ink)", minWidth: 0, textAlign: "right", overflowWrap: "anywhere" }}>{r.value}</span>
                )}
              </div>
            );
          })}
          {viewerIsOwner && isPo && onEditPreorder && (
            <button type="button" onClick={onEditPreorder} style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 3, padding: "10px 12px", borderRadius: 10,
              border: "1px solid var(--grail-gold)", background: "var(--paper)", cursor: "pointer", textAlign: "left",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ink)",
            }}>
              <Pencil size={14} style={{ color: "var(--grail-gold-deep)" }} />
              Edit pre-order details
              <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--ink-faint)" }} />
            </button>
          )}
          {gaps.length > 0 && onComplete && (
            /* v8 :287 — one gold CTA into the finish flow; +20 XP is the server's
               complete_item award for condition + price landing. */
            <button type="button" onClick={onComplete} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3, height: 40, borderRadius: 10,
              border: "1px solid var(--grail-gold)", background: "var(--grail-gold-soft)", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--grail-gold-deep)",
            }}>
              Finish this item · +20 XP
            </button>
          )}
          {isListed && !sold && (
            /* A live listing is a row inside this card, never a competing price block.
               GET /items/{id} carries listing_id / listing_price / listing_currency when
               listed, so this row reads "Sale · ₹price · View listing →" and deep-links
               to /listing/{listing_id} (item pages pass it via listingHref). */
            <Link href={listingHref} style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 3, padding: "10px 12px", borderRadius: 10,
              border: "1px solid var(--border-strong)", background: "var(--paper)", textDecoration: "none",
              fontFamily: "var(--font-body)",
            }}>
              {/* v8 :301 — statusLabel(ownerListing.status), never a hardcoded string. */}
              <Tag kind="sale">{statusLabel(listingStatus ?? "available")}</Tag>
              {listingPrice != null && (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{formatMoney(listingPrice, listingCurrency ?? currency)}</span>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)" }}>View listing</span>
              <ChevronRight size={14} style={{ color: "var(--ink-faint)" }} />
            </Link>
          )}
          {!viewerIsOwner && ownerHandle && (
            /* DV8 "Ask about it" — opens the pair DM with the owner (POST /threads via
               onAsk), landing in the chat composer pre-filled about this item. A privacy
               403 becomes the quiet note; without onAsk wiring the owner's profile stays
               the fallback destination. */
            askNote ? (
              <div style={{
                marginTop: 3, padding: "10px 12px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--bone)",
                fontSize: 12, lineHeight: 1.5, color: "var(--ink-faint)", textAlign: "center",
              }}>
                {askNote}
              </div>
            ) : onAsk ? (
              <button type="button" onClick={ask} disabled={askBusy} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3, height: 38, borderRadius: 10,
                border: "1px solid var(--border-strong)", background: "var(--paper)", cursor: askBusy ? "wait" : "pointer",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ink)",
                width: "100%", opacity: askBusy ? 0.6 : 1,
              }}>
                <MessageCircle size={14} /> Ask @{handle} about it
              </button>
            ) : (
              <Link href={`/profile/${ownerHandle}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3, height: 38, borderRadius: 10,
                border: "1px solid var(--border-strong)", background: "var(--paper)", textDecoration: "none",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ink)",
              }}>
                <MessageCircle size={14} /> Ask @{handle} about it
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Community stats — ONE compact row (DV8 §2): "{n} own this | {m} wishlisted".
   Replaces the two big CountTile blocks; both halves stay tappable (people list). */
export function CommunityStatsRow({ owners, wishlisted, onOpen }: {
  owners: number;
  wishlisted: number;
  onOpen: (mode: "owners" | "wishlist") => void;
}) {
  const half = (n: number, label: string, icon: React.ReactNode, mode: "owners" | "wishlist") => (
    <button type="button" onClick={() => onOpen(mode)} style={{
      flex: 1, cursor: "pointer", border: "none", background: "none", padding: "10px 12px",
      display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-body)", minWidth: 0,
    }}>
      {icon}
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{n.toLocaleString("en-IN")}</span>
      <span style={{ fontSize: 12.5, color: "var(--ink-mute)", whiteSpace: "nowrap" }}>{label}</span>
      <ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--ink-faint)", flexShrink: 0 }} />
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--bone)", borderRadius: 12, marginBottom: 4, overflow: "hidden" }}>
      {half(owners, "own this", <User size={14} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />, "owners")}
      <div style={{ width: 1, background: "var(--border)" }} />
      {half(wishlisted, "wishlisted", <Star size={14} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />, "wishlist")}
    </div>
  );
}

/* ── About this item — the DESCRIPTION ONLY (v8 :344-348) ──────
   Brand/scale/year already sit under the title in the mono meta line — this section
   is never a second spec sheet. v8's Disclosure primitive (shared.jsx :434): borderTop
   from the primitive + borderBottom passed in, 13px header rhythm, chevron at the far
   right, defaultOpen. Body is ClampText (4 lines, measured overflow, Read more/less). */
export function AboutSection({ description, brand, year, title }: {
  description?: string | null;
  brand?: string | null;
  year?: string | null;
  title: string;
}) {
  // v8 :348 — the fallback composes brand + the title's tail into catalogue boilerplate.
  const tail = title.split("·").slice(1).join("·").trim() || title;
  const desc = description?.trim()
    || `${[brand, tail].filter(Boolean).join(" ")}. Catalogue entry from the Scorred database${year ? `, ${year}` : ""}.`;
  return (
    <Disclosure title="About this item" defaultOpen style={{ borderBottom: "1px solid var(--border)" }}>
      <ClampText lines={4} size={15}>{desc}</ClampText>
    </Disclosure>
  );
}

/* ── Rating score block — LAST section, always open (DV8 §2) ──
   Large "{avg} /5", 5 gold stars filled to the TRUE fraction (overflow clip),
   "{count} ratings", divider, then the viewer's own tappable stars. POST returns
   the fresh aggregate; tapping your current score clears it (my_rating → null). */
/* v8 StarMeter (shared.jsx:520) — stroke 1.6, gap 1 */
function StaticStars({ size, color, fill }: { size: number; color: string; fill: string }) {
  return (
    <div style={{ display: "flex", gap: 1, width: "max-content" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} strokeWidth={1.6} fill={fill} style={{ color, flexShrink: 0 }} />
      ))}
    </div>
  );
}

export function StarMeter({ value, size = 13 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
      {/* v8 StarMeter (shared.jsx :520): outline row in border-strong, gold-deep fill clipped on top */}
      <StaticStars size={size} color="var(--border-strong)" fill="none" />
      <div style={{ position: "absolute", inset: 0, width: `${pct}%`, overflow: "hidden" }}>
        <StaticStars size={size} color="var(--grail-gold-deep)" fill="var(--grail-gold-deep)" />
      </div>
    </div>
  );
}

export function RatingBlock({ sku, initial }: { sku: string; initial: RatingAggregate }) {
  const [agg, setAgg] = useState<RatingAggregate>(initial);
  const [busy, setBusy] = useState(false);
  // v8 StarRow (ExploreView.jsx:223-236) — hovering previews the fill ahead of the cursor.
  const [hover, setHover] = useState(0);
  const avg = agg.rating_avg ?? 0;
  const mine = agg.my_rating ?? 0;

  async function rate(n: number) {
    if (busy) return;
    setBusy(true);
    const hadRating = agg.my_rating != null;
    try {
      // Server semantics: one rating per collector — a different score REPLACES
      // yours, the same score again CLEARS it. Toast it so repeated taps don't
      // read as stacking new ratings.
      const fresh = await api.post<RatingAggregate>(`/catalogue/${encodeURIComponent(sku)}/rate`, { rating: n });
      setAgg(fresh);
      const { fireToast } = await import("@/components/gamification");
      if (fresh.my_rating == null) fireToast("Rating removed");
      else if (hadRating) fireToast(`Rating updated to ${fresh.my_rating}/5 — one rating per collector`);
      else fireToast(`Rated ${fresh.my_rating}/5`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    /* v8 :355 — paddingTop 16 only; the body container carries the bottom rhythm. */
    <div style={{ display: "flex", alignItems: "stretch", gap: 14, paddingTop: 16 }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          {/* v8 :358 — avg.toFixed(1) always, so an unrated entry reads "0.0", not a dash */}
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            {avg.toFixed(1)}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-faint)" }}>/5</span>
        </div>
        <div style={{ marginTop: 5 }}><StarMeter value={avg} size={13} /></div>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4 }}>
          {agg.rating_count} rating{agg.rating_count === 1 ? "" : "s"}
        </div>
      </div>
      <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* v8 :366 — a plain "Your rating" label; replace/clear semantics live in the toast */}
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)", marginBottom: 6 }}>
          {mine ? "Your rating" : "Rate this item"}
        </div>
        {/* v8 StarRow (ExploreView.jsx:223-236) — gap 3, zero button padding, hover
            fills ahead of the cursor, active fill+stroke grail-gold, idle slate-300. */}
        <div style={{ display: "flex", gap: 3 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => rate(n)} disabled={busy}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
              style={{ padding: 0, border: "none", background: "none", cursor: busy ? "wait" : "pointer", lineHeight: 0 }}>
              <Star size={24} fill={(hover || mine) >= n ? "var(--grail-gold)" : "none"}
                style={{ color: (hover || mine) >= n ? "var(--grail-gold)" : "var(--slate-300)" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Comment thread — bottom of the item page (DV8-18) ─────────
   Same pattern as a post thread, kept simple: a flat list with ONE reply level.
   Comments live on the catalogue entry (keyed by sku), so the database page and
   every collector's copy of the item share a single conversation. */
interface CatComment {
  id: string;
  parent_id: string | null;
  body: string;
  handle: string | null;
  name: string | null;
  avatar_url?: string | null;
  is_mine?: boolean;
  likes_count?: number;
  is_liked?: boolean;
  badge?: FeedBadgeT | null;
  created_at: string;
}

/* QA #2 — review POSTS tagged to this SKU, so a written review finally shows on
   the entry it reviews. Compact rows (stars + snippet) linking to the full post;
   star ratings (RatingBlock) stay the quick-rate aggregate alongside. */
type SkuReview = {
  id: string; handle?: string | null; name?: string | null; avatar_url?: string | null;
  title?: string | null; body?: string | null; review_rating?: number | null; created_at: string;
};
export function CatalogueReviews({ sku }: { sku: string }) {
  const [reviews, setReviews] = useState<SkuReview[] | null>(null);
  useEffect(() => {
    api.get<{ items: SkuReview[] }>(`/catalogue/${encodeURIComponent(sku)}/reviews`)
      .then((r) => setReviews(r.items ?? []))
      .catch(() => setReviews([]));
  }, [sku]);
  if (!reviews || reviews.length === 0) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
        Reviews · {reviews.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reviews.map((r) => (
          <Link key={r.id} href={`/post/${r.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 13, padding: "11px 13px", background: "var(--paper-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={r.name ?? r.handle ?? "?"} photo={r.avatar_url} size={24} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>@{r.handle}</span>
                {typeof r.review_rating === "number" && (
                  <span style={{ fontSize: 12, color: "var(--grail-gold-deep)", fontFamily: "var(--font-mono)" }}>
                    {"★".repeat(r.review_rating)}{"☆".repeat(Math.max(0, 5 - r.review_rating))}
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{timeAgo(r.created_at)}</span>
              </div>
              {(r.title || r.body) && (
                <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 6, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.title ? <strong>{r.title} — </strong> : null}{r.body}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CatalogueComments({ sku }: { sku: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<CatComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  // v8 Cards.jsx :304-309 — own-comment ··· menu with in-place Edit / Delete.
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // QA #27
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // v8 :356-359 — heart toggle (optimistic; server returns the fresh aggregate).
  async function like(c: CatComment) {
    const wasLiked = c.is_liked ?? false;
    setComments((cs) => cs.map((x) => x.id === c.id
      ? { ...x, is_liked: !wasLiked, likes_count: Math.max(0, (x.likes_count ?? 0) + (wasLiked ? -1 : 1)) }
      : x));
    try {
      const fresh = await api.post<{ is_liked: boolean; likes_count: number }>(
        `/catalogue/${encodeURIComponent(sku)}/comments/${c.id}/like`);
      setComments((cs) => cs.map((x) => x.id === c.id ? { ...x, ...fresh } : x));
    } catch {
      setComments((cs) => cs.map((x) => x.id === c.id
        ? { ...x, is_liked: wasLiked, likes_count: c.likes_count ?? 0 } : x));
    }
  }

  async function saveEdit(id: string) {
    const text = editDraft.trim();
    if (!text) return;
    setEditingId(null);
    const prev = comments.find((c) => c.id === id)?.body;
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, body: text } : c)));
    try {
      await api.patch(`/catalogue/${encodeURIComponent(sku)}/comments/${id}`, { body: text });
    } catch {
      setComments((cs) => cs.map((c) => (c.id === id && prev != null ? { ...c, body: prev } : c)));
    }
  }

  async function remove(id: string) {
    setMenuId(null);
    const prev = comments;
    // Replies cascade server-side; drop them locally too.
    setComments((cs) => cs.filter((c) => c.id !== id && c.parent_id !== id));
    try {
      await api.delete(`/catalogue/${encodeURIComponent(sku)}/comments/${id}`);
    } catch {
      setComments(prev);
    }
  }

  useEffect(() => {
    let alive = true;
    api.get<{ comments?: CatComment[] }>(`/catalogue/${encodeURIComponent(sku)}/comments`)
      .then((r) => { if (alive) setComments(r.comments ?? []); })
      .catch(() => { /* composer still works */ })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [sku]);

  const parents = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  async function send(parentId?: string) {
    const isReply = !!parentId;
    const text = (isReply ? replyDraft : draft).trim();
    if (!text) return;
    // Optimistic append — the 201 payload replaces the placeholder, a failure
    // removes it and restores the draft for retry.
    const temp: CatComment = {
      id: `tmp-${Date.now()}`,
      parent_id: parentId ?? null,
      body: text,
      handle: user?.handle ?? null,
      name: user?.name ?? "You",
      avatar_url: user?.avatar_url ?? null,
      is_mine: true,
      created_at: new Date().toISOString(),
    };
    setComments((cs) => [...cs, temp]);
    if (isReply) { setReplyDraft(""); setReplyTo(null); } else setDraft("");
    try {
      const created = await api.post<CatComment>(
        `/catalogue/${encodeURIComponent(sku)}/comments`,
        { body: text, parent_id: parentId },
      );
      setComments((cs) => cs.map((c) => (c.id === temp.id ? created : c)));
    } catch {
      setComments((cs) => cs.filter((c) => c.id !== temp.id));
      if (isReply) { setReplyDraft(text); setReplyTo(parentId ?? null); } else setDraft(text);
    }
  }

  // v8 Cards.jsx :311-365 — the same Row post comments use: slate bubble card
  // (name · badge pill · time · own-··· menu, then the body), heart+Reply BELOW it.
  function Row({ c, reply }: { c: CatComment; reply?: boolean }) {
    const who = c.name ?? (c.handle ? `@${c.handle}` : "Collector");
    const isOwn = c.is_mine ?? false;
    const isEditing = editingId === c.id;
    const menuOpen = menuId === c.id;
    return (
      <div style={{ display: "flex", gap: 9 }}>
        {/* v8 :319 avatarFrame — Pioneer/Early Believer commenters get the gold ring */}
        <span style={{ display: "inline-flex", flexShrink: 0, alignSelf: "flex-start", ...(hasGoldFrame(c.badge) ? goldFrameRing : {}) }}>
          <Avatar name={who} photo={c.avatar_url} color="var(--ink)" size={reply ? 26 : 30} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", borderRadius: 14, padding: "10px 13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{who}</span>
              {/* v8 :325 — the commenter's rewards badge pill beside the name */}
              <FeedBadge badge={c.badge} />
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
              {isOwn && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button type="button" onClick={() => setMenuId(menuOpen ? null : c.id)} style={{ background: "none", border: "none", padding: "0 3px", cursor: "pointer", color: "var(--ink-faint)", display: "flex", alignItems: "center" }}>
                    <MoreHorizontal size={15} />
                  </button>
                  {menuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 30, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 11, boxShadow: "0 4px 18px rgba(0,0,0,0.13)", overflow: "hidden", minWidth: 112 }}>
                      <button type="button" onClick={() => { setEditingId(c.id); setEditDraft(c.body); setMenuId(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", textAlign: "left" }}>
                        <Pencil size={14} />Edit
                      </button>
                      {/* QA #27 — deleting a comment confirms first. */}
                      <button type="button" onClick={() => { setConfirmDelete(c.id); setMenuId(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--stamp-red)", textAlign: "left" }}>
                        <Trash2 size={14} />Delete
                      </button>
                    </div>
                  )}
                  {confirmDelete === c.id && (
                    <ConfirmDialog
                      title="Delete this comment?"
                      confirmLabel="Delete"
                      onConfirm={() => { setConfirmDelete(null); remove(c.id); }}
                      onCancel={() => setConfirmDelete(null)}
                    />
                  )}
                </div>
              )}
            </div>
            {isEditing ? (
              <div style={{ marginTop: 6, display: "flex", gap: 7, alignItems: "center" }}>
                <input
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(c.id); if (e.key === "Escape") setEditingId(null); }}
                  autoFocus
                  style={{ flex: 1, height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => saveEdit(c.id)} style={{ flexShrink: 0, background: "var(--ink)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12 }}>Save</button>
                <button type="button" onClick={() => setEditingId(null)} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.45, marginTop: 2, overflowWrap: "anywhere" }}>{renderCommentBody(c.body)}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "5px 12px 0", fontSize: 12 }}>
            <button type="button" onClick={() => like(c)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", color: c.is_liked ? "var(--stamp-red)" : "var(--ink-faint)", fontWeight: 600 }}>
              <Heart size={14} fill={c.is_liked ? "var(--stamp-red)" : "none"} />{(c.likes_count ?? 0) > 0 ? c.likes_count : "Like"}
            </button>
            {!reply && (
              <button
                type="button"
                onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, color: "var(--ink-faint)" }}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    /* v8 :372-377 — the header sits OUTSIDE the thread block at the page gutter
       (v8 '0 16px 2px'; ours 20px), and the thread block itself carries the
       borderTop hairline + 14px top pad (Cards.jsx CommentThread :367). */
    <div style={{ paddingTop: 4 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "0 20px 2px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.015em", color: "var(--ink)" }}>Comments</div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>{comments.length}</span>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", padding: "14px 20px 16px" }}>
      {/* v8 CommentThread :369-391 — gap 16 between threads, replies indented 30 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {parents.map((c) => (
          <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row c={c} />
            {repliesOf(c.id).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 30 }}>
                {repliesOf(c.id).map((r) => <Row key={r.id} c={r} reply />)}
              </div>
            )}
            {replyTo === c.id && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 30 }}>
                <Avatar name={user?.name ?? "You"} photo={user?.avatar_url} color="var(--ink)" size={26} />
                <MentionInput
                  autoFocus
                  size="sm"
                  value={replyDraft}
                  onChange={setReplyDraft}
                  onSubmit={() => send(c.id)}
                  placeholder={`Reply to ${c.handle ? `@${c.handle}` : c.name ?? "collector"}…`}
                />
                <IconButton icon={<Send size={15} />} active={!!replyDraft.trim()} onClick={() => send(c.id)} />
              </div>
            )}
          </div>
        ))}
        {loaded && comments.length === 0 && (
          /* v8 :392 copy */
          <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>No comments yet — say something.</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 14 }}>
        <Avatar name={user?.name ?? "You"} photo={user?.avatar_url} color="var(--ink)" size={30} />
        {/* v8 Cards.jsx MentionInput — typing @ opens the user picker (was a plain input,
            so @-tagging silently did nothing here while working on post comments) */}
        <MentionInput
          value={draft}
          onChange={setDraft}
          onSubmit={() => send()}
          placeholder="Add a comment… type @ to tag"
        />
        <IconButton icon={<Send size={17} />} active={!!draft.trim()} onClick={() => send()} />
      </div>
      </div>
    </div>
  );
}

/* ── The composed common body ────────────────────────────────── */
export function ItemPageBody({
  images,
  tone,
  photoLabel,
  photoCountInLabel,
  tags,
  title,
  metaLine,
  provenance,
  estValue,
  ownershipCard,
  stats,
  about,
  rating,
  sku,
}: {
  images: string[];
  tone: string;
  photoLabel?: string;
  /** v8 :166 — owner photos carry "· {i} of {n}" in the corner label. */
  photoCountInLabel?: boolean;
  tags?: React.ReactNode;                 // status tags above the title (own copy only, v8 :170-174)
  title: string;
  metaLine?: string | null;               // "brand · scale · year" — category never shows here
  provenance?: { isVerified: boolean; addedBy: string | null; isYou?: boolean } | null;
  /** v8 :200 — "Est. value" ValueCard between provenance and the ownership card.
      Minor units; pass null when the ownership card already carries a private price
      or the copy is a wishlist row (v8 suppresses it there). */
  estValue?: number | null;
  ownershipCard?: React.ReactNode;        // the ONLY variable region (DV8 §1)
  stats?: { owners: number; wishlisted: number; onOpen: (m: "owners" | "wishlist") => void } | null;
  about: { description?: string | null; brand?: string | null; year?: string | null };
  rating?: { sku: string; initial: RatingAggregate } | null;
  /** Catalogue sku — enables the shared comment thread (DV8-18). Null → no thread. */
  sku?: string | null;
}) {
  return (
    <>
      <ItemPhotoCarousel images={images} tone={tone} label={photoLabel} countInLabel={photoCountInLabel} />
      {/* v8 :169 — the body carries its own bottom rhythm (20); comments sit OUTSIDE it. */}
      <div style={{ padding: "14px 20px 20px" }}>
        {tags && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>{tags}</div>}
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>
          {title}
        </h1>
        {metaLine && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 8 }}>{metaLine}</div>
        )}
        {provenance && <ProvenanceLine {...provenance} />}
        {estValue != null && estValue > 0 && (
          /* v8 ValueCard (ProfileCollection.jsx :414) — label over a mono figure */
          <div style={{ marginBottom: 14 }}>
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 5 }}>Est. value</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 19, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>
                {formatMoney(estValue)}
              </div>
            </div>
          </div>
        )}
        {ownershipCard}
        {stats && <CommunityStatsRow {...stats} />}
        <AboutSection {...about} title={title} />
        {rating && <RatingBlock key={`rating-${rating.sku}`} sku={rating.sku} initial={rating.initial} />}
        {sku && <CatalogueReviews key={`reviews-${sku}`} sku={sku} />}
      </div>
      {/* v8 :372-377 — comments live OUTSIDE the padded body: gutter header + full-bleed rule */}
      {sku && <CatalogueComments key={`comments-${sku}`} sku={sku} />}
    </>
  );
}
