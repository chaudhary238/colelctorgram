"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, Star, Share2, MessageCircle, Repeat2, Shield, Info, ChevronRight, Pencil, Send, Check, Clock, Flag } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReportSheet } from "@/components/ReportSheet";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { symOf } from "@/lib/catalog";
import { ApiListing, ApiListingQuestion } from "@/components/cards";
import { Avatar, Money, ProductPhoto, SectionLabel, TrustSignals } from "@/components/ui";

// Condition vocabulary matches the "List for sale" create form (QA 11.3):
// Sealed → MIB → BIB → Loose. Legacy keys map to the nearest approved grade.
const CONDITION_LABEL: Record<string, string> = {
  sealed_misb: "Sealed",
  sealed: "Sealed",
  mint: "MIB",
  excellent: "MIB",
  like_new: "BIB",
  opened: "BIB",
  good: "Loose",
  built: "Loose",
  loose: "Loose",
  fair: "Loose",
  for_parts: "Loose",
  damaged: "Loose",
};

const CONDITION_LADDER = ["Sealed", "MIB", "BIB", "Loose"];

function gradeOf(condition: string): string {
  if (condition === "sealed_misb" || condition === "sealed") return "Sealed";
  if (condition === "mint" || condition === "excellent") return "MIB";
  if (condition === "like_new" || condition === "opened") return "BIB";
  return "Loose";
}

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-faint)", width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500, textAlign: "right", flex: 1 }}>{value}</span>
    </div>
  );
}

function Stepper({ sign, onClick, disabled }: { sign: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 34, height: 34, borderRadius: 9, cursor: disabled ? "default" : "pointer", border: "1px solid var(--border-strong)", background: "var(--paper)", color: disabled ? "var(--ink-ghost)" : "var(--ink)", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)" }}>
      {sign}
    </button>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ApiListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const [tab, setTab] = useState<"details" | "terms">("details");
  const [fulfil, setFulfil] = useState<"ship" | "pickup">("ship");
  const [priceVote, setPriceVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState({ low: 0, fair: 0, high: 0, total: 0 });
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [editing, setEditing] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [reporting, setReporting] = useState(false); // W-48

  useEffect(() => {
    api.get<ApiListing>(`/listings/${id}`)
      .then((l) => {
        setListing(l);
        setLiked(l.is_liked ?? false);
        setLikes(l.likes_count ?? 0);
        setWishlisted(l.is_wishlisted ?? false);
        if (l.price_votes) {
          setPriceVote(l.price_votes.my_vote);
          setVoteCounts({ low: l.price_votes.low, fair: l.price_votes.fair, high: l.price_votes.high, total: l.price_votes.total });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleLike() {
    if (likeBusy) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    setLikeBusy(true);
    try {
      await api.post(`/listings/${id}/like`);
    } catch {
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleWishlist() {
    if (!listing || wishBusy) return;
    const next = !wishlisted;
    setWishlisted(next);
    setWishBusy(true);
    try {
      await api.post(`/items/${listing.item_id}/wishlist`);
    } catch {
      setWishlisted(!next);
    } finally {
      setWishBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/listing/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: listing?.title ?? "Scorred", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1600); }
    } catch { /* cancelled */ }
  }

  async function messageSeller(initialMessage?: string) {
    if (!listing || dmBusy) return;
    setDmBusy(true);
    try {
      const thread = await api.post<{ id: string }>("/threads", {
        other_user_id: listing.seller_id,
        listing_id: listing.id,
        initial_message: initialMessage,
      });
      router.push(`/chat/${thread.id}`);
    } catch {
      router.push("/inbox");   // fall back to inbox if thread creation fails
    } finally {
      setDmBusy(false);
    }
  }

  if (loading || !listing) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "1/1", borderRadius: 0, background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
        <div style={{ height: 32, width: "40%", borderRadius: 6, background: "var(--bone)" }} />
      </div>
    );
  }

  const sold = listing.status === "sold";
  const reserved = listing.status === "reserved";
  const available = listing.status === "available";
  const isPreorder = listing.acq === "preorder";
  const sellerVouches = listing.vouches_count ?? 0;
  const priceRupees = Math.round(listing.price / 100);
  const cur = symOf(listing.currency ?? "INR");
  const retailRupees = listing.retail_price ? Math.round(listing.retail_price / 100) : 0;
  const pctOff = retailRupees > priceRupees ? Math.round((1 - priceRupees / retailRupees) * 100) : 0;
  const maxQty = Math.max(1, listing.qty ?? 1);
  const gallery = listing.photos ?? [];
  const mine = listing.is_mine ?? false;
  const metaBits = [listing.brand, listing.scale, listing.release_year ? String(listing.release_year) : null, listing.sku ? `SKU ${listing.sku}` : null].filter(Boolean);
  const dominantVote = (() => {
    const entries: [string, number][] = [["“Too low”", voteCounts.low], ["“Fair”", voteCounts.fair], ["“Too high”", voteCounts.high]];
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  })();

  function openEdit() {
    if (!listing) return;
    setEditPrice(String(Math.round(listing.price / 100)));
    setEditNotes(listing.condition_notes ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    if (!listing || editBusy) return;
    setEditBusy(true);
    try {
      const updated = await api.patch<ApiListing>(`/listings/${listing.id}`, {
        price: Number(editPrice) * 100,
        condition_notes: editNotes.trim() || null,
      });
      setListing(updated);
      setEditing(false);
    } catch { /* keep the form open on failure */ } finally {
      setEditBusy(false);
    }
  }

  async function castVote(vote: string) {
    if (!listing) return;
    const prev = priceVote;
    setPriceVote(vote); // optimistic
    try {
      const res = await api.post<{ low: number; fair: number; high: number; total: number; my_vote: string | null }>(`/listings/${listing.id}/price-vote`, { vote });
      setVoteCounts({ low: res.low, fair: res.fair, high: res.high, total: res.total });
      setPriceVote(res.my_vote);
    } catch {
      setPriceVote(prev);
    }
  }

  async function markSold() {
    if (!listing || editBusy) return;
    setEditBusy(true);
    try {
      const updated = await api.patch<ApiListing>(`/listings/${listing.id}`, { status: "sold" });
      setListing(updated);
      setEditing(false);
    } catch { /* ignore */ } finally {
      setEditBusy(false);
    }
  }

  const terms = listing.terms.length > 0 ? listing.terms : [
    "Item ships within 48 hours of payment confirmation.",
    "Accepts Google Pay, PhonePe, and bank transfer only.",
    "Returns only for significantly not as described — DM within 24h.",
    "Shipping cost is additional unless stated.",
  ];

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/market" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Listing</span>
          {/* Icon law: Heart = like, Star = wishlist the item. Save removed (QA 11.5). */}
          <button onClick={toggleLike} title={liked ? "Unlike" : "Like"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, minWidth: 36, height: 36, padding: likes > 0 ? "0 9px" : 0, borderRadius: 10, border: "1px solid var(--border)", color: liked ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
            {likes > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{likes}</span>}
          </button>
          <button onClick={toggleWishlist} title={wishlisted ? "Remove from wishlist" : "Add item to wishlist"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: wishlisted ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Star size={17} fill={wishlisted ? "currentColor" : "none"} />
          </button>
          <button onClick={share} title={shared ? "Link copied" : "Share"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: shared ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Share2 size={17} />
          </button>
          {!mine && (
            /* W-48 — report entry point on listing detail */
            <button onClick={() => setReporting(true)} title="Report listing" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink-faint)", background: "none", cursor: "pointer" }}>
              <Flag size={17} />
            </button>
          )}
        </div>
      </div>
      {reporting && (
        <ReportSheet targetType="listing" targetId={listing.id} title="Report listing" onClose={() => setReporting(false)} />
      )}

      {/* Gallery — real uploaded photos when present, else the placeholder */}
      <div style={{ position: "relative" }}>
        <ProductPhoto tone="ink" src={gallery[photo]} ratio="1/1" rounded={0} label={gallery.length ? `${photo + 1} of ${gallery.length}` : undefined}>
          {!available && (
            <div style={{ position: "absolute", top: 60, left: 16 }}>
              <span style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, background: sold ? "var(--ink)" : "var(--grail-gold)", color: "var(--paper)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{listing.status}</span>
            </div>
          )}
        </ProductPhoto>
      </div>

      {gallery.length > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 4px" }}>
          {gallery.map((_, i) => (
            <button key={i} onClick={() => setPhoto(i)} style={{ width: i === photo ? 18 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer", background: i === photo ? "var(--ink)" : "var(--bone-deep)", transition: "all 160ms" }} />
          ))}
        </div>
      )}

      <div style={{ padding: "6px 20px 20px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {isPreorder && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--grail-gold-soft)", color: "var(--grail-gold-deep)", border: "1px solid var(--grail-gold)" }}>
              <Clock size={11} /> Pre-order
            </span>
          )}
          {listing.trade_willing && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--bone)", color: "var(--ink-mute)", border: "1px solid var(--border)" }}>
              <Repeat2 size={11} /> Trade considered
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>{listing.title}</h1>
        {metaBits.length > 0 && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 12 }}>
            {metaBits.join(" · ")}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 28, color: "var(--stamp-red)" }}><Money value={priceRupees} currency={cur} /></span>
          {pctOff > 0 && (
            <>
              <span style={{ fontSize: 15, color: "var(--ink-faint)" }}><Money value={retailRupees} currency={cur} strike /></span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--forest)" }}>{pctOff}% off MRP</span>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          {(["details", "terms"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "0 0 10px", cursor: "pointer", position: "relative", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: tab === t ? "var(--ink)" : "var(--ink-faint)" }}>
              {t === "details" ? "Details" : "Seller terms"}
              {tab === t && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: "var(--stamp-red)", borderRadius: 2 }} />}
            </button>
          ))}
        </div>

        {tab === "details" ? (
          <>
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 14 }}>
              <SpecRow label="Condition" value={CONDITION_LABEL[listing.condition] ?? listing.condition} />
              {isPreorder && listing.preorder_eta && <SpecRow label="Launch date" value={listing.preorder_eta} />}
              {isPreorder && listing.preorder_seller && <SpecRow label="Pre-order from" value={listing.preorder_seller} />}
              <SpecRow label="Quantity" value={`${maxQty} available`} />
              <SpecRow label="Ships from" value={listing.ships_from_city ?? "—"} />
              <SpecRow label="Watching" value={`${listing.watching_count} people`} last />
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
              {CONDITION_LADDER.map((cd) => {
                const on = cd === gradeOf(listing.condition);
                return (
                  <span key={cd} style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.04em", padding: "4px 8px", borderRadius: 6, background: on ? "var(--ink)" : "var(--bone)", color: on ? "var(--paper)" : "var(--ink-faint)", border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`, fontWeight: on ? 700 : 500 }}>
                    {cd}
                  </span>
                );
              })}
            </div>

            {listing.description && (
              <div style={{ marginBottom: 18 }}>
                <SectionLabel>About this item</SectionLabel>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", marginTop: 10 }}>{listing.description}</div>
              </div>
            )}

            {listing.condition_notes && (
              <div style={{ marginBottom: 18 }}>
                <SectionLabel>Condition notes</SectionLabel>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", marginTop: 10, padding: 13, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12 }}>{listing.condition_notes}</div>
              </div>
            )}

            {available && !mine && (
              <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <SectionLabel>Your order</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>Quantity</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Stepper sign="−" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} />
                    <span style={{ width: 34, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, fontFeatureSettings: '"tnum" 1' }}>{qty}</span>
                    <Stepper sign="+" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}><span style={{ fontSize: 14, color: "var(--ink-soft)" }}>Fulfilment</span></div>
                <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                  {(["ship", "pickup"] as const).map((o) => (
                    <button key={o} onClick={() => setFulfil(o)} style={{ flex: 1, padding: "10px 0", borderRadius: 11, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, border: `1px solid ${fulfil === o ? "var(--ink)" : "var(--border-strong)"}`, background: fulfil === o ? "var(--ink)" : "transparent", color: fulfil === o ? "var(--paper)" : "var(--ink)" }}>
                      {o === "ship" ? "Shipping" : "Local pickup"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>Est. total {fulfil === "ship" ? "(+ shipping)" : "(pickup)"}</span>
                  <span style={{ fontSize: 18, color: "var(--stamp-red)" }}><Money value={priceRupees * qty} currency={cur} /></span>
                </div>
              </div>
            )}

            {!mine && (
            <div style={{ background: "var(--bone)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Info size={15} style={{ color: "var(--ink-mute)" }} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Is this price fair?</span>
                <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto" }}>Anonymous</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                {([["low", "Too low"], ["fair", "Fair"], ["high", "Too high"]] as const).map(([id, label]) => {
                  const on = priceVote === id;
                  return (
                    <button key={id} onClick={() => castVote(id)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`, background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink-soft)" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9 }}>
                {priceVote ? "Your vote is private. The seller only sees the overall split." : voteCounts.total > 0 ? `${voteCounts.total} collector${voteCounts.total === 1 ? "" : "s"} weighed in · mostly ${dominantVote}.` : "Be the first to weigh in."}
              </div>
            </div>
            )}
          </>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 12 }}>Set by {listing.name}. Read before you message.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
              {terms.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "13px 14px", borderBottom: i < terms.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <Check size={16} strokeWidth={2.4} style={{ color: "var(--forest)", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.45 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <ListingQA listingId={id} canAnswer={mine} sellerName={listing.name} sellerPhoto={listing.avatar_url} />

        {!mine && (
          <>
            <SectionLabel>Seller</SectionLabel>
            <Link href={`/profile/${listing.handle}`} style={{ display: "block", width: "100%", marginTop: 10, padding: 14, cursor: "pointer", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={listing.name ?? "?"} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{listing.name}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{listing.handle}{listing.seller_city ? ` · ${listing.seller_city}` : ""}</div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <TrustSignals
                  compact
                  vouches={sellerVouches}
                />
              </div>
            </Link>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 13, padding: "12px 14px", marginTop: 16 }}>
              <Shield size={17} style={{ color: "var(--grail-gold-deep)", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                <b>Safe trading:</b> deals complete off-platform. Scorred doesn&rsquo;t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you&rsquo;ve verified the seller.
              </div>
            </div>
          </>
        )}
      </div>

      <div className="ch-cta-bar">
        {mine ? (
          editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 4 }}>Price ({cur})</div>
                  <input value={editPrice} onChange={(e) => setEditPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)", outline: "none" }} />
                </div>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 4 }}>Condition notes</div>
                  <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Box wear, what's included…" style={{ width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={markSold} disabled={editBusy} style={{ height: 44, padding: "0 14px", borderRadius: 11, background: "var(--bone)", border: "1px solid var(--border-strong)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: editBusy ? "default" : "pointer" }}>Mark sold</button>
                <button onClick={() => setEditing(false)} disabled={editBusy} style={{ height: 44, padding: "0 14px", borderRadius: 11, background: "transparent", border: "1px solid var(--border-strong)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginLeft: "auto" }}>Cancel</button>
                <button onClick={saveEdit} disabled={editBusy} style={{ height: 44, padding: "0 18px", borderRadius: 11, background: "var(--stamp-red)", border: "none", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: editBusy ? "wait" : "pointer" }}>{editBusy ? "Saving…" : "Save"}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>YOUR LISTING · {sold ? "SOLD" : reserved ? "RESERVED" : "LIVE"}</div>
                <div style={{ fontSize: 18, color: "var(--stamp-red)" }}><Money value={priceRupees} currency={cur} /></div>
              </div>
              <button onClick={openEdit} style={{ display: "flex", alignItems: "center", gap: 7, height: 44, padding: "0 16px", borderRadius: 11, background: "var(--bone)", border: "1px solid var(--border-strong)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                <Pencil size={16} />Edit
              </button>
              <button onClick={share} style={{ display: "flex", alignItems: "center", gap: 7, height: 44, padding: "0 16px", borderRadius: 11, background: "var(--ink)", border: "none", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                <Share2 size={16} />{shared ? "Copied" : "Share"}
              </button>
            </div>
          )
        ) : sold ? (
          <button disabled style={{ width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", color: "var(--ink-faint)", border: "1px solid var(--border)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
            This listing is sold
          </button>
        ) : reserved ? (
          <button disabled style={{ width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", color: "var(--ink-faint)", border: "1px solid var(--border)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
            Reserved — ask to join the queue
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {listing.trade_willing && (
              <button onClick={() => messageSeller(`Hi! Would you consider a trade for "${listing.title}"?`)} disabled={dmBusy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 20px", borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: dmBusy ? "default" : "pointer" }}>
                <Repeat2 size={18} />Trade
              </button>
            )}
            <button onClick={() => messageSeller(`Hi! Is "${listing.title}" still available?`)} disabled={dmBusy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: dmBusy ? "default" : "pointer" }}>
              <MessageCircle size={18} />{dmBusy ? "Opening…" : "Message seller"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Public Q&A on a listing ─────────────────────────────────────── */
function ListingQA({ listingId, canAnswer, sellerName, sellerPhoto }: { listingId: string; canAnswer: boolean; sellerName?: string | null; sellerPhoto?: string | null }) {
  const [questions, setQuestions] = useState<ApiListingQuestion[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");

  useEffect(() => {
    api.get<{ questions: ApiListingQuestion[] }>(`/listings/${listingId}/questions`)
      .then((d) => setQuestions(d?.questions ?? []))
      .catch(() => { /* leave empty */ });
  }, [listingId]);

  async function ask() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const q = await api.post<ApiListingQuestion>(`/listings/${listingId}/questions`, { body });
      setQuestions((qs) => [q, ...qs]);
      setDraft("");
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(qid: string) {
    const answer = answerDraft.trim();
    if (!answer || busy) return;
    setBusy(true);
    try {
      const res = await api.post<{ answer: string; answered_at: string }>(`/listings/${listingId}/questions/${qid}/answer`, { answer });
      setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, answer: res.answer, answered_at: res.answered_at } : q)));
      setAnswerFor(null);
      setAnswerDraft("");
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  }

  const visible = expanded ? questions : questions.slice(0, 2);

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel>Q&amp;A</SectionLabel>
      <div style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "4px 0 12px" }}>Questions are public — don&rsquo;t share personal info here.</div>

      {!canAnswer && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask the seller a question…"
            style={{ flex: 1, height: 40, padding: "0 13px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none" }} />
          <button onClick={ask} disabled={!draft.trim() || busy} style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "none", background: draft.trim() ? "var(--ink)" : "var(--bone-deep)", color: draft.trim() ? "var(--paper)" : "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: draft.trim() && !busy ? "pointer" : "default" }}>Ask</button>
        </div>
      )}

      {questions.length === 0 ? (
        <div style={{ fontSize: 13.5, color: "var(--ink-faint)", padding: "12px 0" }}>No questions yet{canAnswer ? "." : " — be the first to ask."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((item) => (
            <div key={item.id} style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
              <div style={{ padding: "11px 13px", display: "flex", gap: 9, alignItems: "flex-start" }}>
                <Avatar name={item.asker_name ?? "?"} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 3 }}>{item.is_mine ? "You" : item.asker_name} · {timeAgo(item.created_at)}</div>
                  <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.45 }}>{item.body}</div>
                </div>
              </div>
              {item.answer ? (
                <div style={{ padding: "10px 13px 12px", borderTop: "1px solid var(--border)", background: "var(--bone)", display: "flex", gap: 9 }}>
                  <Avatar name={sellerName ?? "?"} photo={sellerPhoto ?? undefined} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 3 }}>Seller · verified answer</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>{item.answer}</div>
                  </div>
                </div>
              ) : canAnswer ? (
                <div style={{ padding: "10px 13px", borderTop: "1px solid var(--border)", background: "var(--bone)" }}>
                  {answerFor === item.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAnswer(item.id)} autoFocus placeholder="Write your answer…"
                        style={{ flex: 1, height: 36, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none" }} />
                      <button onClick={() => submitAnswer(item.id)} disabled={!answerDraft.trim() || busy} style={{ height: 36, padding: "0 12px", borderRadius: 9, border: "none", background: answerDraft.trim() ? "var(--ink)" : "var(--bone-deep)", color: answerDraft.trim() ? "var(--paper)" : "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: answerDraft.trim() && !busy ? "pointer" : "default" }}>Send</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAnswerFor(item.id); setAnswerDraft(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>
                      <Send size={13} />Answer this
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: "9px 13px", borderTop: "1px solid var(--border)", background: "var(--bone)" }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-faint)", fontStyle: "italic" }}>Awaiting seller response…</span>
                </div>
              )}
            </div>
          ))}
          {questions.length > 2 && (
            <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", padding: "4px 0", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, textAlign: "left" }}>
              {expanded ? "Show less" : `View all ${questions.length} questions`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
