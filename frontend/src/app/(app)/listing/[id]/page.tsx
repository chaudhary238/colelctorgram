"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, Star, Share2, MessageCircle, Repeat2, Shield, Info, ChevronDown, ChevronRight, Pencil, Send, Check, Clock, Flag } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReportSheet } from "@/components/ReportSheet";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { symOf, conditionLabel, ADD_CATEGORIES } from "@/lib/catalog";
import { ApiListing, ApiListingQuestion } from "@/components/cards";
import { Avatar, Money, ProductPhoto, SectionLabel, TrustSignals } from "@/components/ui";

// DV8-09 — price-fairness vote options. Bar/legend tones are deliberately distinct:
// teal (low) / forest (fair) / soft red (high).
const VOTE_OPTS = [
  { id: "low", label: "Too low", color: "var(--verified-teal)" },
  { id: "fair", label: "Fair", color: "var(--forest)" },
  { id: "high", label: "Too high", color: "var(--stamp-red-soft)" },
] as const;
type VoteId = (typeof VOTE_OPTS)[number]["id"];

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
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  // DV8-08 — Selling terms lead (condition, shipping, returns are what a buyer decides
  // on); catalogue facts live in "About the item" and read from the same DB entry.
  const [tab, setTab] = useState<"terms" | "about">("terms");
  const [descExpanded, setDescExpanded] = useState(false);
  const [priceVote, setPriceVote] = useState<string | null>(null);
  const [voteChanging, setVoteChanging] = useState(false);
  const [voteCounts, setVoteCounts] = useState({ low: 0, fair: 0, high: 0, total: 0 });
  const [photo, setPhoto] = useState(0);
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
          // low/fair/high/total are NULL unless the viewer is the seller (seller-only intel).
          setVoteCounts({ low: l.price_votes.low ?? 0, fair: l.price_votes.fair ?? 0, high: l.price_votes.high ?? 0, total: l.price_votes.total ?? 0 });
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
  // DV8 §6 — SKU is an internal key only; it no longer appears in the meta line.
  const metaBits = [listing.brand, listing.scale, listing.release_year ? String(listing.release_year) : null].filter(Boolean);

  // Selling terms are the seller's two structured toggles — never invented on their behalf.
  const shipIncluded = listing.ships_nationwide || listing.terms.includes("Shipping included");
  const shippingValue = listing.shipping_cost > 0
    ? `${cur}${Math.round(listing.shipping_cost / 100).toLocaleString("en-IN")} extra`
    : shipIncluded ? "Included" : "Ask the seller";
  const returnsAccepted = listing.terms.includes("Returns accepted");
  const categoryLabel = listing.category
    ? (ADD_CATEGORIES.find((c) => c.id === listing.category)?.label ?? listing.category)
    : null;
  const aboutRows = [
    listing.brand ? { label: "Brand", value: listing.brand } : null,
    listing.scale ? { label: "Scale", value: listing.scale } : null,
    listing.release_year ? { label: "Release year", value: String(listing.release_year) } : null,
    categoryLabel ? { label: "Category", value: categoryLabel } : null,
    isPreorder && listing.preorder_eta ? { label: "Launch date", value: listing.preorder_eta } : null,
    isPreorder && listing.preorder_seller ? { label: "Pre-order from", value: listing.preorder_seller } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  const priceLabel = `${cur}${priceRupees.toLocaleString("en-IN")}`;
  const votePct = (k: VoteId) => (voteCounts.total ? Math.round((voteCounts[k] / voteCounts.total) * 100) : 0);
  const leadVote = VOTE_OPTS.reduce((a, b) => (voteCounts[b.id] > voteCounts[a.id] ? b : a));
  const advice = leadVote.id === "high"
    ? `Most collectors think ${priceLabel} is too high — consider trimming it.`
    : leadVote.id === "low"
    ? `Collectors think ${priceLabel} is a steal — you could ask more.`
    : `Collectors agree ${priceLabel} is about right.`;

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
      const res = await api.post<{ low: number | null; fair: number | null; high: number | null; total: number | null; my_vote: string | null }>(`/listings/${listing.id}/price-vote`, { vote });
      setVoteCounts({ low: res.low ?? 0, fair: res.fair ?? 0, high: res.high ?? 0, total: res.total ?? 0 });
      setPriceVote(res.my_vote);
      setVoteChanging(false);
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

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/market" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Listing</span>
          {/* v8 settled the word: the heart is "Save" (mechanism stays the like endpoint —
              a save lives exactly as long as the listing). Star = wishlist the item. */}
          <button onClick={toggleLike} title={liked ? "Saved" : "Save"} aria-label={liked ? "Saved" : "Save"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, minWidth: 36, height: 36, padding: likes > 0 ? "0 9px" : 0, borderRadius: 10, border: "1px solid var(--border)", color: liked ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
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

        {/* DV8-08 — Selling terms lead: condition, shipping and returns are what a buyer
            decides on. Catalogue facts belong to the item, so they live in the second tab. */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          {(["terms", "about"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "0 0 10px", cursor: "pointer", position: "relative", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: tab === t ? "var(--ink)" : "var(--ink-faint)" }}>
              {t === "terms" ? "Selling terms" : "About the item"}
              {tab === t && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: "var(--stamp-red)", borderRadius: 2 }} />}
            </button>
          ))}
        </div>

        {tab === "terms" ? (
          <>
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 14 }}>
              <SpecRow label="Condition" value={conditionLabel(listing.condition, listing.category) ?? listing.condition} />
              {maxQty > 1 && <SpecRow label="Quantity" value={`${maxQty} available`} />}
              {listing.ships_from_city && <SpecRow label="Ships from" value={listing.ships_from_city} />}
              <SpecRow label="Shipping" value={shippingValue} />
              {returnsAccepted && <SpecRow label="Returns" value="Accepted" />}
              <SpecRow label="Trades" value={listing.trade_willing ? "Considered" : "Not offered"} last />
            </div>

            {/* No invented policies on the seller's behalf — if they set nothing, say so. */}
            {listing.terms.length === 0 && (
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 14 }}>No terms set — ask before paying.</div>
            )}

            {listing.condition_notes && (
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 16, padding: 13, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12 }}>{listing.condition_notes}</div>
            )}
            {listing.description && (
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 16 }}>{listing.description}</div>
            )}

            {/* ── Is this price fair? (DV8-09) — the seller reads the split, a visitor casts a
                vote. Visitors NEVER see counts or percentages (the API nulls them anyway), so
                votes can't anchor buyers' expectations. ── */}
            {mine ? (
              <div style={{ background: "var(--bone)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Info size={15} style={{ color: "var(--ink-mute)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>What collectors think of your price</span>
                  <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>{voteCounts.total} vote{voteCounts.total === 1 ? "" : "s"}</span>
                </div>
                {voteCounts.total === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 10, lineHeight: 1.5 }}>
                    No votes yet — votes appear as collectors weigh in.
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 12, background: "var(--border)" }}>
                      {VOTE_OPTS.map((o) => votePct(o.id) > 0 && (
                        <div key={o.id} style={{ width: `${votePct(o.id)}%`, background: o.color }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                      {VOTE_OPTS.map((o) => (
                        <span key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: o.color, flexShrink: 0 }} />
                          <span style={{ color: "var(--ink-mute)" }}>{o.label}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)" }}>{votePct(o.id)}%</span>
                        </span>
                      ))}
                    </div>
                    {/* Turn the split into an actual recommendation — a bar alone isn't a decision. */}
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-soft)", marginTop: 11, padding: "10px 12px", borderRadius: 10, background: "var(--paper-soft)" }}>{advice}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9 }}>Anonymous — you see the split, never who voted. Buyers can&rsquo;t see these numbers.</div>
                    <button onClick={openEdit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", height: 42, marginTop: 10, borderRadius: 11, background: "var(--paper)", border: "1px solid var(--border-strong)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                      <Pencil size={15} />Adjust price
                    </button>
                  </>
                )}
              </div>
            ) : available && (
              <div style={{ background: "var(--bone)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Info size={15} style={{ color: "var(--ink-mute)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>Is this price fair?</span>
                  <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto" }}>Anonymous</span>
                </div>
                {priceVote && !voteChanging ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
                    <Check size={15} style={{ color: "var(--forest)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "var(--ink-soft)", flex: 1 }}>
                      You said <b>{VOTE_OPTS.find((o) => o.id === priceVote)?.label ?? priceVote}</b>. Your vote is private.
                    </span>
                    <button onClick={() => setVoteChanging(true)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, color: "var(--ink-mute)" }}>Change</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                      {VOTE_OPTS.map((o) => (
                        <button key={o.id} onClick={() => castVote(o.id)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--ink-soft)" }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9 }}>
                      Only the seller sees the result — it helps them decide whether to adjust the price.
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          /* Catalogue facts, straight from the database entry — same source as the item page */
          <div style={{ marginBottom: 18 }}>
            {aboutRows.length > 0 && (
              <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
                {aboutRows.map((r, i) => (
                  <SpecRow key={r.label} label={r.label} value={r.value} last={i === aboutRows.length - 1} />
                ))}
              </div>
            )}
            {listing.description && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", ...(descExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }) }}>
                  {listing.description}
                </div>
                {listing.description.length > 160 && (
                  <button onClick={() => setDescExpanded((v) => !v)} style={{ background: "none", border: "none", padding: 0, marginTop: 6, cursor: "pointer", color: "var(--ink-mute)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>
                    {descExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}
            {listing.sku && (
              <Link href={`/db/${listing.sku}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 14, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--stamp-red)", textDecoration: "none" }}>
                <span>View database entry</span>
                <ChevronRight size={13} />
              </Link>
            )}
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
                {/* v8 trust row: Vouches · Joined {year} (seller_joined ships in the
                    detail payload now). Replies renders only if the API ever sends it. */}
                <TrustSignals
                  compact
                  vouches={sellerVouches}
                  joined={listing.seller_joined ?? null}
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
                {/* DV8-13 — "reserved" retired: a listing is available | sold | closed. */}
                <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>YOUR LISTING · {available ? "LIVE" : listing.status.toUpperCase()}</div>
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

/* ── Public Q&A on a listing — collapsible, count in the header, open by default ── */
function ListingQA({ listingId, canAnswer, sellerName, sellerPhoto }: { listingId: string; canAnswer: boolean; sellerName?: string | null; sellerPhoto?: string | null }) {
  const [open, setOpen] = useState(true);
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
    <div style={{ marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: "6px 0 10px", cursor: "pointer" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Q&amp;A · {questions.length}</span>
        <ChevronDown size={16} style={{ color: "var(--ink-faint)", transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms" }} />
      </button>

      {open && (
        <div style={{ paddingBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "0 0 12px" }}>Questions are public — don&rsquo;t share personal info here.</div>

          {!canAnswer && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask the seller a question…"
                style={{ flex: 1, height: 40, padding: "0 13px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none" }} />
              <button onClick={ask} disabled={!draft.trim() || busy} style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "none", background: draft.trim() ? "var(--ink)" : "var(--bone-deep)", color: draft.trim() ? "var(--paper)" : "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: draft.trim() && !busy ? "pointer" : "default" }}>Ask</button>
            </div>
          )}

          {questions.length === 0 ? (
            <div style={{ fontSize: 13.5, color: "var(--ink-faint)", padding: "0 0 12px" }}>No questions yet{canAnswer ? "." : " — be the first to ask."}</div>
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
                <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", padding: "4px 0 14px", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, textAlign: "left" }}>
                  {expanded ? "Show less" : `View all ${questions.length} questions`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
