"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Share2, MessageCircle, Repeat2, Shield, Info, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo, formatPrice } from "@/lib/utils";
import { ApiListing } from "@/components/cards";
import { Avatar, VerifyBadge, Money, ProductPhoto, SectionLabel, TierChip, TrustSignals } from "@/components/ui";

const CONDITION_LABEL: Record<string, string> = {
  sealed_misb: "MISB · sealed",
  mint: "Mint",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  for_parts: "For parts",
  excellent: "Excellent",
  sealed: "MISB · sealed",
  opened: "Opened · complete",
  built: "Built",
  loose: "Loose",
  damaged: "For parts",
};

const CONDITION_LADDER = ["MISB", "Near Mint", "Excellent", "Good", "For Parts"];

function gradeOf(condition: string): string {
  if (condition === "sealed_misb" || condition === "sealed") return "MISB";
  if (condition === "mint") return "Near Mint";
  if (condition === "excellent" || condition === "like_new" || condition === "opened") return "Excellent";
  if (condition === "good" || condition === "built") return "Good";
  return "For Parts";
}

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-faint)", width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500, textAlign: "right", flex: 1 }}>{value}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ApiListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const [tab, setTab] = useState<"details" | "terms">("details");
  const [fulfil, setFulfil] = useState<"ship" | "pickup">("ship");
  const [priceVote, setPriceVote] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get<ApiListing>(`/listings/${id}`)
      .then((l) => { setListing(l); setSaved(l.is_saved ?? false); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (saveBusy) return;
    const next = !saved;
    setSaved(next);
    setSaveBusy(true);
    try {
      await api.post(`/listings/${id}/save`);
    } catch {
      setSaved(!next);
    } finally {
      setSaveBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/listing/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: listing?.title ?? "CollectorHub", url });
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
  const sellerTier = listing.deals_count >= 50 ? "top_seller" : listing.deals_count >= 20 ? "trusted" : "verified";
  const priceRupees = Math.round(listing.price / 100);
  const shippingRupees = Math.round(listing.shipping_cost / 100);
  const retailRupees = listing.retail_price ? Math.round(listing.retail_price / 100) : 0;
  const pctOff = retailRupees > priceRupees ? Math.round((1 - priceRupees / retailRupees) * 100) : 0;
  const maxQty = Math.max(1, listing.qty ?? 1);

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
          <Link href="/market" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Listing</span>
          <button onClick={toggleSave} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: saved ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
          <button onClick={share} title={shared ? "Link copied" : "Share"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: shared ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div style={{ position: "relative" }}>
        <ProductPhoto tone="ink" ratio="1/1" rounded={0} label={`${photo + 1} of 4`}>
          {!available && (
            <div style={{ position: "absolute", top: 60, left: 16 }}>
              <span style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, background: sold ? "var(--ink)" : "var(--grail-gold)", color: "var(--paper)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{listing.status}</span>
            </div>
          )}
        </ProductPhoto>
      </div>

      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 4px" }}>
        {[0, 1, 2, 3].map((i) => (
          <button key={i} onClick={() => setPhoto(i)} style={{ width: i === photo ? 18 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer", background: i === photo ? "var(--ink)" : "var(--bone-deep)", transition: "all 160ms" }} />
        ))}
      </div>

      <div style={{ padding: "6px 20px 20px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <VerifyBadge tier={listing.verify_tier} size="lg" />
          {listing.trade_willing && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--bone)", color: "var(--ink-mute)", border: "1px solid var(--border)" }}>
              <Repeat2 size={11} /> Trade considered
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>{listing.title}</h1>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 12 }}>
          Listed {timeAgo(listing.created_at)} · {listing.ships_from_city}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 28, color: "var(--stamp-red)" }}><Money value={priceRupees} /></span>
          {pctOff > 0 && (
            <>
              <span style={{ fontSize: 15, color: "var(--ink-faint)" }}><Money value={retailRupees} strike /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", background: "var(--forest-soft)", borderRadius: 6, padding: "2px 7px", letterSpacing: "0.02em" }}>
                {pctOff}% off retail
              </span>
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
              <SpecRow label="Ships from" value={listing.ships_from_city ?? "—"} />
              <SpecRow label="Shipping" value={listing.shipping_cost === 0 ? "Free" : formatPrice(listing.shipping_cost)} />
              <SpecRow label="Nationwide" value={listing.ships_nationwide ? "Yes" : "Pickup / local only"} />
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

            {listing.condition_notes && (
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 18 }}>{listing.condition_notes}</div>
            )}

            {available && (
              <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <SectionLabel>Your order</SectionLabel>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {(["ship", "pickup"] as const).map((o) => (
                    <button key={o} onClick={() => setFulfil(o)} style={{ flex: 1, padding: "10px 0", borderRadius: 11, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, border: `1px solid ${fulfil === o ? "var(--ink)" : "var(--border-strong)"}`, background: fulfil === o ? "var(--ink)" : "transparent", color: fulfil === o ? "var(--paper)" : "var(--ink)" }}>
                      {o === "ship" ? "Shipping" : "Local pickup"}
                    </button>
                  ))}
                </div>
                {maxQty > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                    <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>Quantity <span style={{ color: "var(--ink-ghost)" }}>· {maxQty} available</span></span>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid var(--border-strong)", borderRadius: 10, overflow: "hidden" }}>
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} style={{ width: 34, height: 34, border: "none", background: "var(--paper)", color: qty <= 1 ? "var(--ink-ghost)" : "var(--ink)", fontSize: 18, cursor: qty <= 1 ? "default" : "pointer", lineHeight: 1 }}>−</button>
                      <span style={{ width: 34, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, fontFeatureSettings: '"tnum" 1' }}>{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} style={{ width: 34, height: 34, border: "none", background: "var(--paper)", color: qty >= maxQty ? "var(--ink-ghost)" : "var(--ink)", fontSize: 18, cursor: qty >= maxQty ? "default" : "pointer", lineHeight: 1 }}>+</button>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>Est. total {fulfil === "ship" ? "(+ shipping)" : "(pickup)"}</span>
                  <span style={{ fontSize: 18, color: "var(--stamp-red)" }}><Money value={priceRupees * qty + (fulfil === "ship" ? shippingRupees : 0)} /></span>
                </div>
              </div>
            )}

            <div style={{ background: "var(--bone)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Info size={15} style={{ color: "var(--ink-mute)" }} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Is this price fair?</span>
                <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto" }}>Anonymous</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                {(["Too low", "Fair", "Too high"] as const).map((o) => {
                  const on = priceVote === o;
                  return (
                    <button key={o} onClick={() => setPriceVote(o)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`, background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink-soft)" }}>
                      {o}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9 }}>
                {priceVote ? "Your vote is private." : `${listing.watching_count + 12} collectors weighed in.`}
              </div>
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 12 }}>Set by {listing.name}. Read before you message.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
              {terms.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "13px 14px", borderBottom: i < terms.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ color: "var(--forest)", flexShrink: 0, marginTop: 1, fontWeight: 700, fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.45 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <SectionLabel>Seller</SectionLabel>
        <Link href={`/profile/${listing.handle}`} style={{ display: "block", width: "100%", marginTop: 10, padding: 14, cursor: "pointer", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={listing.name ?? "?"} size={46} verified={sellerTier !== "verified"} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{listing.name}</span>
                <TierChip tier={sellerTier} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 1 }}>@{listing.handle}</div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <TrustSignals
              compact
              deals={listing.deals_count}
              rating={listing.rating}
              ratingCount={listing.deals_count}
            />
          </div>
        </Link>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 13, padding: "12px 14px", marginTop: 16 }}>
          <Shield size={17} style={{ color: "var(--grail-gold-deep)", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            <b>Safe trading:</b> deals complete off-platform in Phase 1. CollectorHub doesn&rsquo;t hold payments. Always check trust signals, ask for an in-hand video, and never pay before you&rsquo;ve verified the seller.
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 245, right: 0, maxWidth: 680, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "12px 20px 20px", zIndex: 20 }}>
        {sold ? (
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
            <button onClick={() => messageSeller()} disabled={dmBusy} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: dmBusy ? "default" : "pointer" }}>
              <MessageCircle size={18} />{dmBusy ? "Opening…" : "Message seller"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
