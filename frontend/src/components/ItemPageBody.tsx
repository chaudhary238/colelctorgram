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
  ChevronRight, Clock, Eye, MessageCircle, Pencil, Send, Star, Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, IconButton, ProductPhoto, SealMark, SectionLabel } from "@/components/ui";
import { formatMoney } from "@/lib/catalog";
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
export function ItemPhotoCarousel({ images, tone, label }: { images: string[]; tone: string; label?: string }) {
  const [photo, setPhoto] = useState(0);
  if (images.length === 0) {
    return <ProductPhoto tone={tone} ratio="1/1" rounded={0} label={label ?? "catalogue reference"} />;
  }
  return (
    <>
      <div style={{ aspectRatio: "1/1", overflow: "hidden", background: "var(--bone)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[Math.min(photo, images.length - 1)]} alt={label ?? "Item photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      {isVerified ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "var(--paper-soft)", border: "1px solid var(--border-strong)" }}>
          <SealMark size={14} />
          <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600 }}>Scorred Reviewed</span>
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "var(--bone)", border: "1px solid var(--border-strong)" }}>
          <Clock size={12} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)", fontWeight: 600 }}>Pending review</span>
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
  preorder = null,
  onEditPreorder,
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
  preorder?: PreorderFacts | null;
  onEditPreorder?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isPo = status === "preorder";
  const condLabel = condition ? CONDITION_LABEL[condition] ?? condition : null;
  const handle = ownerHandle ?? "collector";

  const poTotal = preorder?.total ?? null;
  const poDeposit = preorder?.deposit ?? 0;
  const hasTotal = poTotal != null && poTotal > 0;
  const poBalance = Math.max(0, (poTotal ?? 0) - poDeposit);
  const etaText = preorder?.eta
    ? preorder.eta
    : preorder?.precision === "tbd" ? "Date not announced" : "ETA TBD";

  const header = isPo
    ? viewerIsOwner ? "Your pre-order" : `@${handle} has this on pre-order`
    : viewerIsOwner ? "About your copy" : `In @${handle}’s collection`;

  // Price renders ONLY when value != null — the API returns value: null to non-owners.
  const sub = isPo
    ? [etaText, viewerIsOwner && hasTotal && poBalance > 0 ? `${formatMoney(poBalance, currency)} due` : null]
        .filter(Boolean).join(" · ")
    : ["Owned", condLabel, value != null && value > 0 ? formatMoney(value, currency) : null]
        .filter(Boolean).join(" · ");

  const rows: CardRow[] = (isPo
    ? [
        preorder?.orderedAt
          ? { label: "Ordered", value: new Date(preorder.orderedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }
          : null,
        { label: "Expected", value: etaText },
        viewerIsOwner && preorder?.seller ? { label: "Ordered from", value: preorder.seller } : null,
        viewerIsOwner ? { label: "Total price", value: hasTotal ? formatMoney(poTotal as number, currency) : "—" } : null,
        viewerIsOwner && hasTotal ? { label: "Deposit paid", value: formatMoney(poDeposit, currency) } : null,
        viewerIsOwner && hasTotal ? { label: "Balance due", value: formatMoney(poBalance, currency), accent: true } : null,
      ]
    : [
        { label: "Status", value: "Owned" },
        { label: "Condition", value: condLabel ?? "—" },
        value != null ? { label: "What you paid", value: value > 0 ? formatMoney(value, currency) : "—" } : null,
        { label: viewerIsOwner ? "Your photos" : "Owner photos", value: photoCount ? String(photoCount) : "None yet" },
        { label: "Listed for sale", value: isListed ? "Yes" : "No" },
      ]
  ).filter((r): r is CardRow => r != null);

  return (
    <div style={{
      border: `1px solid ${isPo ? "var(--grail-gold)" : "var(--border-strong)"}`,
      borderRadius: 14,
      background: isPo ? "var(--grail-gold-soft)" : "var(--paper-soft)",
      marginBottom: 14, overflow: "hidden",
    }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", textAlign: "left",
        background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {isPo && <Clock size={15} style={{ color: "var(--grail-gold-deep)", flexShrink: 0 }} />}
            <span style={{ fontSize: 14, fontWeight: 700, color: isPo ? "var(--grail-gold-deep)" : "var(--ink)" }}>{header}</span>
            {isListed && (
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 5, background: "var(--stamp-red)", color: "var(--paper)" }}>
                Listed
              </span>
            )}
          </div>
          {sub && <div style={{ fontSize: 11.5, color: isPo ? "var(--grail-gold-deep)" : "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
        </div>
        <ChevronRight size={16} style={{ color: "var(--ink-faint)", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 130ms" }} />
      </button>
      {open && (
        <div style={{ padding: "2px 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
              <span style={{ color: "var(--ink-faint)" }}>{r.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: r.accent ? 700 : 600, color: r.accent ? "var(--stamp-red)" : "var(--ink)" }}>{r.value}</span>
            </div>
          ))}
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
          {isListed && (
            /* A live listing is a row inside this card, never a competing price block.
               GET /items/{id} carries listing_id / listing_price / listing_currency when
               listed, so this row reads "Sale · ₹price · View listing →" and deep-links
               to /listing/{listing_id} (item pages pass it via listingHref). */
            <Link href={listingHref} style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 3, padding: "10px 12px", borderRadius: 10,
              border: "1px solid var(--border-strong)", background: "var(--paper)", textDecoration: "none",
              fontFamily: "var(--font-body)",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 5, background: "var(--stamp-red)", color: "var(--paper)" }}>Sale</span>
              {listingPrice != null && (
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{formatMoney(listingPrice, listingCurrency ?? currency)}</span>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)" }}>View listing</span>
              <ChevronRight size={14} style={{ color: "var(--ink-faint)" }} />
            </Link>
          )}
          {!viewerIsOwner && ownerHandle && (
            /* Chat threads are listing-scoped in this app — there is no free-form user
               DM composer to deep-link into, so the owner's profile is the correct
               fallback destination for "ask about it". */
            <Link href={`/profile/${ownerHandle}`} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3, height: 38, borderRadius: 10,
              border: "1px solid var(--border-strong)", background: "var(--paper)", textDecoration: "none",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ink)",
            }}>
              <MessageCircle size={14} /> Ask @{handle} about it
            </Link>
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
  if (owners === 0 && wishlisted === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bone)", borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
        <Users size={14} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>No collectors have this on their shelf yet — be the first.</span>
      </div>
    );
  }
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
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--bone)", borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
      {half(owners, "own this", <Users size={14} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />, "owners")}
      <div style={{ width: 1, background: "var(--border)" }} />
      {half(wishlisted, "wishlisted", <Star size={14} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />, "wishlist")}
    </div>
  );
}

/* ── About this item — collapsible, with the specs grid absorbed inside (DV8 §2) ── */
export interface SpecEntry { label: string; value: string }

export function AboutSection({ description, specs }: { description?: string | null; specs: SpecEntry[] }) {
  const [open, setOpen] = useState(true);
  const [more, setMore] = useState(false);
  const desc = description?.trim() || null;
  const clampable = (desc?.length ?? 0) > 220;
  if (!desc && specs.length === 0) return null;
  return (
    <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "13px 0",
        background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)",
        fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.015em", color: "var(--ink)", textAlign: "left",
      }}>
        About this item
        <ChevronRight size={16} style={{ color: "var(--ink-faint)", transform: open ? "rotate(90deg)" : "none", transition: "transform 130ms" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 14 }}>
          {desc && (
            <>
              <div style={{
                fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)",
                ...(clampable && !more ? { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {}),
              }}>
                {desc}
              </div>
              {clampable && (
                <button type="button" onClick={() => setMore((m) => !m)} style={{ marginTop: 6, padding: 0, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5, color: "var(--ink-mute)" }}>
                  {more ? "Show less" : "Read more"}
                </button>
              )}
            </>
          )}
          {specs.length > 0 && (
            <div style={{ marginTop: desc ? 12 : 0 }}>
              {specs.map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>{s.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Rating score block — LAST section, always open (DV8 §2) ──
   Large "{avg} /5", 5 gold stars filled to the TRUE fraction (overflow clip),
   "{count} ratings", divider, then the viewer's own tappable stars. POST returns
   the fresh aggregate; tapping your current score clears it (my_rating → null). */
function StaticStars({ size, color, fill }: { size: number; color: string; fill: string }) {
  return (
    <div style={{ display: "flex", gap: 2, width: "max-content" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={fill} style={{ color, flexShrink: 0 }} />
      ))}
    </div>
  );
}

export function StarMeter({ value, size = 13 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
      <StaticStars size={size} color="var(--bone-deep)" fill="var(--bone)" />
      <div style={{ position: "absolute", inset: 0, width: `${pct}%`, overflow: "hidden" }}>
        <StaticStars size={size} color="var(--grail-gold-deep)" fill="var(--grail-gold)" />
      </div>
    </div>
  );
}

export function RatingBlock({ sku, initial }: { sku: string; initial: RatingAggregate }) {
  const [agg, setAgg] = useState<RatingAggregate>(initial);
  const [busy, setBusy] = useState(false);
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
    <div style={{ display: "flex", alignItems: "stretch", gap: 14, padding: "16px 0 8px" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink)" }}>
            {agg.rating_avg != null ? avg.toFixed(1) : "—"}
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
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)", marginBottom: 6 }}>
          {mine ? `Your rating: ${mine}/5 · tap to change · tap your score to clear` : "Rate this item"}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => rate(n)} disabled={busy}
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
              style={{ padding: 2, border: "none", background: "none", cursor: busy ? "wait" : "pointer", lineHeight: 0 }}>
              <Star size={24} fill={n <= mine ? "var(--grail-gold)" : "none"}
                style={{ color: n <= mine ? "var(--grail-gold-deep)" : "var(--bone-deep)" }} />
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
  created_at: string;
}

const COMPOSER_INPUT: React.CSSProperties = {
  flex: 1, minWidth: 0, height: 38, padding: "0 13px", borderRadius: 999,
  border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)",
  outline: "none", boxSizing: "border-box",
};

export function CatalogueComments({ sku }: { sku: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<CatComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

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

  function Row({ c, reply }: { c: CatComment; reply?: boolean }) {
    const who = c.name ?? (c.handle ? `@${c.handle}` : "Collector");
    return (
      <div style={{ display: "flex", gap: 9 }}>
        <Avatar name={who} photo={c.avatar_url} color="var(--ink)" size={reply ? 26 : 30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            {c.handle ? (
              <Link href={`/profile/${c.handle}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>
                {who}
              </Link>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{who}</span>
            )}
            <span style={{ fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.45, marginTop: 2, overflowWrap: "anywhere" }}>{c.body}</div>
          {!reply && (
            <button
              type="button"
              onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }}
              style={{ background: "none", border: "none", padding: "4px 0 0", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, color: "var(--ink-faint)" }}
            >
              Reply
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, padding: "16px 0 4px" }}>
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Comments · {comments.length}</SectionLabel>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {parents.map((c) => (
          <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row c={c} />
            {repliesOf(c.id).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 39 }}>
                {repliesOf(c.id).map((r) => <Row key={r.id} c={r} reply />)}
              </div>
            )}
            {replyTo === c.id && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 39 }}>
                <Avatar name={user?.name ?? "You"} photo={user?.avatar_url} color="var(--ink)" size={26} />
                <input
                  autoFocus
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send(c.id);
                    if (e.key === "Escape") setReplyTo(null);
                  }}
                  placeholder={`Reply to ${c.handle ? `@${c.handle}` : c.name ?? "collector"}…`}
                  style={{ ...COMPOSER_INPUT, height: 34, fontSize: 13.5, padding: "0 12px" }}
                />
                <IconButton icon={<Send size={15} />} active={!!replyDraft.trim()} onClick={() => send(c.id)} />
              </div>
            )}
          </div>
        ))}
        {loaded && comments.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>No comments yet — start the conversation.</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 16 }}>
        <Avatar name={user?.name ?? "You"} photo={user?.avatar_url} color="var(--ink)" size={30} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Add a comment…"
          style={COMPOSER_INPUT}
        />
        <IconButton icon={<Send size={17} />} active={!!draft.trim()} onClick={() => send()} />
      </div>
    </div>
  );
}

/* ── The composed common body ────────────────────────────────── */
export function ItemPageBody({
  images,
  tone,
  photoLabel,
  tags,
  title,
  metaLine,
  provenance,
  ownershipCard,
  stats,
  about,
  rating,
  sku,
}: {
  images: string[];
  tone: string;
  photoLabel?: string;
  tags?: React.ReactNode;                 // status tags above the title (item page)
  title: string;
  metaLine?: string | null;               // "brand · scale · year"
  provenance?: { isVerified: boolean; addedBy: string | null; isYou?: boolean } | null;
  ownershipCard?: React.ReactNode;        // the ONLY variable region (DV8 §1)
  stats?: { owners: number; wishlisted: number; onOpen: (m: "owners" | "wishlist") => void } | null;
  about: { description?: string | null; specs: SpecEntry[] };
  rating?: { sku: string; initial: RatingAggregate } | null;
  /** Catalogue sku — enables the shared comment thread (DV8-18). Null → no thread. */
  sku?: string | null;
}) {
  return (
    <>
      <ItemPhotoCarousel images={images} tone={tone} label={photoLabel} />
      <div style={{ padding: "14px 20px 0" }}>
        {tags && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>{tags}</div>}
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>
          {title}
        </h1>
        {metaLine && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 8 }}>{metaLine}</div>
        )}
        {provenance && <ProvenanceLine {...provenance} />}
        {ownershipCard}
        {stats && <CommunityStatsRow {...stats} />}
        <AboutSection {...about} />
        {rating && <RatingBlock key={`rating-${rating.sku}`} sku={rating.sku} initial={rating.initial} />}
        {sku && <CatalogueComments key={`comments-${sku}`} sku={sku} />}
      </div>
    </>
  );
}
