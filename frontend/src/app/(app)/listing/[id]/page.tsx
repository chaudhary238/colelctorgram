"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, Share2, MessageCircle, Shield, Info, ChevronLeft, ChevronRight, Pencil, Send, Check, Clock, Flag, SlidersHorizontal, Star, Tag as TagIcon, X } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReportSheet } from "@/components/ReportSheet";
import { ShareSheet } from "@/components/ShareSheet";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { symOf, conditionLabel } from "@/lib/catalog";
import { ApiCommunity, ApiListing, ApiListingQuestion } from "@/components/cards";
import { Avatar, ClampText, Disclosure, Money, ProductPhoto, SectionLabel, TrustSignals } from "@/components/ui";
import { fireToast } from "@/components/gamification";
import { invalidateFeedSnapshot } from "@/lib/feedSnapshot";

// Detail-only extras (GET /listings/{id} — backend listings.py DV8 §5#25/26/30/31).
// The browse payload doesn't carry them, so they extend ApiListing here rather
// than widening the shared card type in cards.tsx.
type ApiListingDetail = ApiListing & {
  seller_country?: string | null;
  /** Seller reply rate, e.g. "96%" — null under 3 answered questions. */
  seller_replies?: string | null;
  catalogue_rating?: { avg: number; count: number } | null;
  catalogue_owners?: number;
  catalogue_desc?: string | null;
};

// DV8-09 — price-fairness vote options. Bar/legend tones are deliberately distinct:
// teal (low) / forest (fair) / red (high) — v8 ListingView:70-74.
const VOTE_OPTS = [
  { id: "low", label: "Too low", color: "var(--verified-teal)" },
  { id: "fair", label: "Fair", color: "var(--forest)" },
  { id: "high", label: "Too high", color: "var(--stamp-red)" },
] as const;
type VoteId = (typeof VOTE_OPTS)[number]["id"];

// v8 ListingView:151 — the header floats ON the gallery; controls carry their own
// scrim (same treatment as the event-detail hero).
const heroBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  minWidth: 38, height: 38, borderRadius: 12, border: "none",
  background: "rgba(20,17,15,0.5)", backdropFilter: "blur(6px)",
  color: "var(--paper)", cursor: "pointer",
};

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-faint)", width: 92, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500, textAlign: "right", flex: 1 }}>{value}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ApiListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  // DV8 §2#2 — share opens the branded ShareSheet (v8 Overlays.jsx:716), replacing
  // the old direct navigator.share / silent-clipboard handler.
  const [sharing, setSharing] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  // DV8-08 — Selling terms lead (condition, shipping, returns are what a buyer decides
  // on); catalogue facts live in "About the item" and read from the same DB entry.
  const [tab, setTab] = useState<"terms" | "about">("terms");
  const [priceVote, setPriceVote] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState({ low: 0, fair: 0, high: 0, total: 0 });
  const [photo, setPhoto] = useState(0);
  // v8 Manage sheet (ListingView:97) replaces the old inline edit bar. The inline
  // price editor survives only as the Edit row's fallback when item_id is missing.
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmUnlist, setConfirmUnlist] = useState(false);
  const [shareToFeedOpen, setShareToFeedOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [reporting, setReporting] = useState(false); // W-48
  const sharePrompted = useRef(false);

  useEffect(() => {
    api.get<ApiListingDetail>(`/listings/${id}`)
      .then((l) => {
        setListing(l);
        setLiked(l.is_liked ?? false);
        if (l.price_votes) {
          setPriceVote(l.price_votes.my_vote);
          // low/fair/high/total are NULL unless the viewer is the seller (seller-only intel).
          setVoteCounts({ low: l.price_votes.low ?? 0, fair: l.price_votes.fair ?? 0, high: l.price_votes.high ?? 0, total: l.price_votes.total ?? 0 });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Deep link: /listing/{id}?share=1 auto-opens the Share-to-Feed sheet once the
  // listing is in — the item page's Manage sheet links here for its Share-to-Feed row.
  // Read window.location directly (no useSearchParams — that would force Suspense).
  useEffect(() => {
    if (loading || !listing || sharePrompted.current) return;
    if (new URLSearchParams(window.location.search).get("share") === "1") {
      sharePrompted.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of an external (URL) value once the listing has loaded
      setShareToFeedOpen(true);
    }
  }, [loading, listing]);

  async function toggleLike() {
    if (likeBusy) return;
    const next = !liked;
    setLiked(next);
    setLikeBusy(true);
    // "Saved" wording per the market save→LIKE decision (2026-08-04); v8 toasts on toggle.
    fireToast(next ? "Saved" : "Removed from Saved");
    try {
      await api.post(`/listings/${id}/like`);
    } catch {
      setLiked(!next);
    } finally {
      setLikeBusy(false);
    }
  }

  const share = () => setSharing(true);

  // DV8 §10#22 (v8 Chat.jsx:90) — buy intent is an EDITABLE draft, never auto-sent:
  // create/reuse the pair thread with NO initial_message, then land in the chat
  // composer pre-filled + focused via the existing ?draft=1 plumbing (intent=buy).
  async function messageSeller() {
    if (!listing || dmBusy) return;
    setDmBusy(true);
    try {
      const thread = await api.post<{ id: string }>("/threads", {
        other_user_id: listing.seller_id,
        listing_id: listing.id,
      });
      router.push(`/chat/${thread.id}?draft=1&intent=buy&title=${encodeURIComponent(listing.title)}`);
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

  // v8 spec-row copy (ListingView:210). Divergence kept: v8 has no shipping-cost
  // concept, so a seller-set cost still renders as "₹N extra" over the binary copy.
  // QA #7 — ships_nationwide ("I'll ship anywhere") is not "shipping is free";
  // it's hardcoded true on create, so OR-ing it in made every listing "Included".
  const shipIncluded = listing.terms.includes("Shipping included");
  const shippingValue = listing.shipping_cost > 0
    ? `${cur}${Math.round(listing.shipping_cost / 100).toLocaleString("en-IN")} extra`
    : shipIncluded ? "Included in price" : "Paid by buyer";
  const returnsAccepted = listing.terms.includes("Returns accepted");
  // v8 About tab (ListingView:297-301) — catalogue facts live in the title meta
  // line, not a spec table; the PO card carries the Launch date row ONLY (v8 has
  // no "Pre-order from" row — the source seller is a Terms-side concern).
  const launchDate = isPreorder ? listing.preorder_eta : null;
  // v8:309-313 — the About blurb is the CATALOGUE description (the listing's own
  // description already renders on the Terms tab); fallback sentence per v8,
  // year omitted when the payload has none.
  const catalogueBlurb = listing.sku
    ? listing.catalogue_desc
      || `${listing.brand ? `${listing.brand} ` : ""}${listing.title}. Catalogue entry from the Scorred database${listing.release_year ? `, ${listing.release_year}` : ""}.`
    : null;

  const priceLabel = `${cur}${priceRupees.toLocaleString("en-IN")}`;
  const votePct = (k: VoteId) => (voteCounts.total ? Math.round((voteCounts[k] / voteCounts.total) * 100) : 0);
  const leadVote = VOTE_OPTS.reduce((a, b) => (voteCounts[b.id] > voteCounts[a.id] ? b : a));
  // v8 ListingView:247-253 — the split becomes an actual recommendation, tinted by
  // verdict. Copy verbatim from v8; only the currency reads from the listing.
  const advice = leadVote.id === "high"
    ? { text: `Most collectors think ${priceLabel} is too high — consider trimming it to move faster.`, tone: "var(--stamp-red)", bg: "var(--stamp-red-soft)" }
    : leadVote.id === "low"
    ? { text: "Most think you’ve priced it under the market — you have room to ask for more.", tone: "var(--forest)", bg: "var(--paper-soft)" }
    : { text: "Your price reads as fair to most collectors. No change needed.", tone: "var(--ink-mute)", bg: "var(--paper-soft)" };

  // v8 pops back after unlist / mark-sold (ListingView:108,122) — same
  // history-aware fallback as BackButton so deep links still land somewhere.
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/market");
  }

  function openEdit() {
    if (!listing) return;
    setEditPrice(String(Math.round(listing.price / 100)));
    setEditNotes(listing.condition_notes ?? "");
    setEditing(true);
  }

  // v8 Manage → Edit listing: the full editor is the item's sell page (price,
  // condition, photos, shipping and returns in one place). The inline price editor
  // stays only as the fallback for a legacy payload without item_id.
  function goEdit() {
    if (!listing) return;
    setManageOpen(false);
    if (listing.item_id) router.push(`/item/${listing.item_id}/sell`);
    else openEdit();
  }

  async function saveEdit() {
    if (!listing || editBusy) return;
    setEditBusy(true);
    try {
      const updated = await api.patch<ApiListing>(`/listings/${listing.id}`, {
        price: Number(editPrice) * 100,
        condition_notes: editNotes.trim() || null,
      });
      // Merge — the PATCH payload lacks the detail-only extras (seller_replies,
      // catalogue_rating…); replacing outright would blank them mid-session.
      setListing((cur) => (cur ? { ...cur, ...updated } : updated));
      setEditing(false);
    } catch { /* keep the form open on failure */ } finally {
      setEditBusy(false);
    }
  }

  // vote: "low"|"fair"|"high" casts/replaces; null CLEARS the caller's vote
  // server-side (v8 ListingView:275-276 — "Change" un-votes, the picker reopens
  // with nothing selected until a new verdict lands).
  async function castVote(vote: VoteId | null) {
    if (!listing) return;
    const prev = priceVote;
    setPriceVote(vote); // optimistic — null immediately re-renders the empty picker
    if (vote) fireToast("Thanks — sent anonymously to the seller"); // v8:282; clearing is silent
    try {
      const res = await api.post<{ low: number | null; fair: number | null; high: number | null; total: number | null; my_vote: string | null }>(`/listings/${listing.id}/price-vote`, { vote });
      setVoteCounts({ low: res.low ?? 0, fair: res.fair ?? 0, high: res.high ?? 0, total: res.total ?? 0 });
      setPriceVote(res.my_vote);
    } catch {
      setPriceVote(prev);
      fireToast("Couldn't record your vote — try again"); // QA #10: failures were silent
    }
  }

  async function markSold() {
    if (!listing || editBusy) return;
    setEditBusy(true);
    try {
      const updated = await api.patch<ApiListing>(`/listings/${listing.id}`, { status: "sold" });
      setListing((cur) => (cur ? { ...cur, ...updated } : updated));
      setEditing(false);
      setManageOpen(false);
      // The server stamps the item's sold_at when the listing PATCHes to sold —
      // no extra /items call needed; the shelf copy picks up its Sold tag on load.
      // v8:122 two-line toast (title + sub), then pop.
      fireToast("Marked as sold", "Greyed out in your collection — undo any time");
      setTimeout(goBack, 60);
    } catch { /* ignore */ } finally {
      setEditBusy(false);
    }
  }

  // v8 ListingView:107 — Unlist keeps the item, stops selling it (status → closed).
  async function unlist() {
    if (!listing || editBusy) return;
    setEditBusy(true);
    try {
      const updated = await api.patch<ApiListing>(`/listings/${listing.id}`, { status: "closed" });
      setListing((cur) => (cur ? { ...cur, ...updated } : updated));
      setManageOpen(false);
      setConfirmUnlist(false);
      fireToast("Unlisted — back in your collection");
      setTimeout(goBack, 60); // v8:108 pops after unlist
    } catch {
      fireToast("Couldn't unlist — try again");
    } finally {
      setEditBusy(false);
    }
  }

  // v8 Manage sheet rows (ListingView:117) — sold listings keep only Share + Unlist.
  type ManageRow = { icon: React.ReactNode; label: string; desc?: string; danger?: boolean; onClick: () => void };
  const manageRows = ([
    !sold ? { icon: <Pencil size={16} />, label: "Edit listing", desc: "Price, condition, photos, shipping and returns", onClick: goEdit } : null,
    !sold ? { icon: <Check size={16} />, label: "Mark as sold", desc: "Closes the listing; the item stays in your collection with a Sold tag", onClick: markSold } : null,
    { icon: <Share2 size={16} />, label: "Share listing", onClick: () => { setManageOpen(false); share(); } },
    !sold ? { icon: <Send size={16} />, label: "Share to Feed", desc: "Post to your feed with a caption", onClick: () => { setManageOpen(false); setShareToFeedOpen(true); } } : null,
    { icon: <X size={16} />, label: "Unlist from market", desc: "Keep the item, stop selling it", danger: true, onClick: () => setConfirmUnlist(true) },
  ] as (ManageRow | null)[]).filter((r): r is ManageRow => r !== null);

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      {reporting && (
        <ReportSheet targetType="listing" targetId={listing.id} title="Report listing" onClose={() => setReporting(false)} />
      )}
      {shareToFeedOpen && (
        <ShareToFeedSheet listing={listing} onClose={() => setShareToFeedOpen(false)} />
      )}
      {sharing && (
        <ShareSheet
          url={`${window.location.origin}/listing/${id}`}
          label="listing"
          title={listing.title ?? "Scorred"}
          // QA #35 — say what's for sale and for how much, not a bare link.
          text={[listing.title, `${cur}${Math.round(listing.price / 100).toLocaleString("en-IN")} on Scorred`].filter(Boolean).join(" — ")}
          onClose={() => setSharing(false)}
        />
      )}

      {/* v8 Manage sheet — one dark footer button opens this; rows above. */}
      {mine && manageOpen && (
        /* QA 2026-09-14 — bottom sheet on phones, CENTERED modal from sm up
           (the repo convention item-page sheets already follow); a viewport-
           bottom sheet floats mid-page next to the sidebar on web. */
        <div onClick={() => { setManageOpen(false); setConfirmUnlist(false); }} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.38)" }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[680px] sm:max-w-[420px] rounded-t-[20px] sm:rounded-2xl pt-2 pb-[34px] sm:pb-6" style={{ background: "var(--paper)", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
            <div className="sm:hidden" style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 16px" }} />
            {confirmUnlist ? (
              <div style={{ padding: "0 20px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, textAlign: "center" }}>Unlist from the market?</div>
                <div style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center", marginTop: 5, lineHeight: 1.5 }}>
                  Buyers won&rsquo;t see it any more. The item stays in your collection, and Relist puts it back at these same terms.
                </div>
                {/* v8:107-109 — Button md pair: red confirm, secondary "Keep it listed". */}
                <button onClick={unlist} disabled={editBusy} style={{ width: "100%", height: 46, marginTop: 18, borderRadius: 14, border: "1px solid var(--stamp-red)", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, cursor: editBusy ? "wait" : "pointer" }}>
                  {editBusy ? "Unlisting…" : "Unlist item"}
                </button>
                <button onClick={() => setConfirmUnlist(false)} style={{ width: "100%", height: 46, marginTop: 8, borderRadius: 14, border: "1px solid var(--border-strong)", background: "var(--bone)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                  Keep it listed
                </button>
              </div>
            ) : (
              <>
                <div style={{ padding: "0 20px 12px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Manage listing</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>Currently {sold ? "sold" : "live in the market"}.</div>
                </div>
                {manageRows.map((row) => (
                  <button key={row.label} onClick={row.onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 20px", textAlign: "left", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: row.danger ? "var(--stamp-red-soft)" : "var(--paper-soft)", color: row.danger ? "var(--stamp-red)" : "var(--ink-mute)" }}>
                      {row.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 600, color: row.danger ? "var(--stamp-red)" : "var(--ink)" }}>{row.label}</div>
                      {row.desc && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{row.desc}</div>}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Gallery with the v8 transparent overlay header — back + heart + share float
          on the photo with their own scrim (event-detail hero treatment). */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
          <BackButton fallback="/market" transparent />
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            {/* Heart = save/like (v8 keeps exactly two trailing controls: heart, share).
                v8:153 — the heart FILLS stamp-red when saved; the button chrome never
                changes and no count renders on the hero. Size 18 per v8. */}
            <button onClick={toggleLike} title={liked ? "Saved" : "Save"} aria-label={liked ? "Saved" : "Save"} style={heroBtn}>
              <Heart size={18} fill={liked ? "var(--stamp-red)" : "none"} />
            </button>
            <button onClick={share} title="Share" aria-label="Share" style={heroBtn}>
              <Share2 size={17} />
            </button>
          </div>
        </div>
        <ProductPhoto tone="ink" src={gallery[photo]} ratio="1/1" rounded={0} fit="contain" label={gallery.length ? `${photo + 1} of ${gallery.length}` : undefined}>
          {/* QA 2026-09-14 — explicit prev/next arrows beside the dots (same
              glass chrome as the item-page hero and the market tile overlays). */}
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => setPhoto((p) => (p - 1 + gallery.length) % gallery.length)}
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(15,23,42,0.46)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setPhoto((p) => (p + 1) % gallery.length)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(15,23,42,0.46)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
          {!available && (
            /* v8:160 — Tag kind="sold" (forest/paper) for EVERY non-available status,
               label via statusLabel ("Sold" / "Closed"), fontSize 12, 5x10 padding. */
            <div style={{ position: "absolute", top: 60, left: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "5px 10px", borderRadius: 6, lineHeight: 1, background: "var(--forest)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </span>
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

      <div style={{ padding: "8px 16px 20px" }}>
        {/* v8:176-180 — a single Pre-order chip (Tag kind="default": bone/ink, fs10,
            0.08em caps); trade willingness reads from the spec table. */}
        {isPreorder && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, lineHeight: 1, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", background: "var(--bone)", color: "var(--ink)" }}>
              <Clock size={11} /> Pre-order
            </span>
          </div>
        )}

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 23, letterSpacing: "-0.03em", lineHeight: 1.12, margin: "0 0 4px" }}>{listing.title}</h1>
        {metaBits.length > 0 && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 10 }}>
            {metaBits.join(" · ")}
          </div>
        )}
        {/* v8:183-187 — gap 10, mb 14, bold red price, nowrap on every price bit. */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "var(--stamp-red)", whiteSpace: "nowrap" }}><Money value={priceRupees} currency={cur} /></span>
          {pctOff > 0 && (
            <>
              <span style={{ fontSize: 15, whiteSpace: "nowrap" }}><Money value={retailRupees} currency={cur} strike /></span>
              <span style={{ fontSize: 12, color: "var(--forest)", fontWeight: 600, whiteSpace: "nowrap" }}>{pctOff}% off MRP</span>
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
            {/* v8 spec-row copy: Returns always states a policy ("sold as described"
                is the default, not silence); Trades renders only when open.
                v8:206 card — card-surface on slate-200 with shadow-sm. */}
            <div style={{ background: "var(--card-surface)", border: "1px solid var(--slate-200)", borderRadius: 13, overflow: "hidden", marginBottom: 14, boxShadow: "var(--shadow-sm)" }}>
              <SpecRow label="Condition" value={conditionLabel(listing.condition, listing.category) ?? listing.condition} />
              {maxQty > 1 && <SpecRow label="Quantity" value={`${maxQty} available`} />}
              {listing.ships_from_city && <SpecRow label="Ships from" value={listing.ships_from_city} />}
              <SpecRow label="Shipping" value={shippingValue} />
              <SpecRow label="Returns" value={returnsAccepted ? "Accepted within a short window" : "Not accepted — sold as described"} last={!listing.trade_willing} />
              {listing.trade_willing && <SpecRow label="Trades" value="Open to offers" last />}
            </div>

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
                  {/* v8:225 — body font, "{n} votes" (kept singular-aware) */}
                  <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto" }}>{voteCounts.total} vote{voteCounts.total === 1 ? "" : "s"}</span>
                </div>
                {voteCounts.total === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 10, lineHeight: 1.5 }}>
                    No votes yet. Once collectors weigh in you&rsquo;ll see the split here — and get a notification each time a vote lands.
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
                    {/* Turn the split into an actual recommendation — a bar alone isn't a
                        decision. v8:255-258 — tag icon + verdict-tinted panel. */}
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 11, padding: "10px 12px", borderRadius: 10, background: advice.bg }}>
                      <TagIcon size={14} style={{ color: advice.tone, flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-soft)" }}>{advice.text}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9 }}>Anonymous — you see the split, never who voted. Buyers can&rsquo;t see these numbers.</div>
                    {/* v8:262 — Button secondary size=block: h52/r14/fs16, bone on border-strong. */}
                    <button onClick={goEdit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 52, marginTop: 10, borderRadius: 14, background: "var(--bone)", border: "1px solid var(--border-strong)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                      <Pencil size={16} />Adjust price
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* v8 renders the vote panel for every status — no `available` gate. */
              <div style={{ background: "var(--bone)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Info size={15} style={{ color: "var(--ink-mute)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>Is this price fair?</span>
                  <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto" }}>Anonymous</span>
                </div>
                {priceVote ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
                    <Check size={15} style={{ color: "var(--forest)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "var(--ink-soft)", flex: 1 }}>
                      You said <b>{VOTE_OPTS.find((o) => o.id === priceVote)?.label ?? priceVote}</b> — sent anonymously to the seller.
                    </span>
                    {/* v8:275 — Change = castPriceVote(l, null): the old vote is DELETED
                        server-side, not held while a replacement is picked. */}
                    <button onClick={() => castVote(null)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, color: "var(--ink-mute)" }}>Change</button>
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
            {launchDate && (
              /* v8:298 — same card-surface treatment as the terms table. */
              <div style={{ background: "var(--card-surface)", border: "1px solid var(--slate-200)", borderRadius: 13, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <SpecRow label="Launch date" value={launchDate} last />
              </div>
            )}
            {listing.catalogue_rating && listing.catalogue_rating.count > 0 && (
              /* v8:302-307 — gold star + avg + "· N ratings · N own this". */
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14 }}>
                <Star size={15} fill="var(--grail-gold)" style={{ color: "var(--grail-gold)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{listing.catalogue_rating.avg.toFixed(1)}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-faint)", whiteSpace: "nowrap" }}>· {listing.catalogue_rating.count} ratings · {listing.catalogue_owners ?? 0} own this</span>
              </div>
            )}
            {catalogueBlurb && (
              <div style={{ marginTop: 14 }}>
                <ClampText lines={3} size={14.5}>{catalogueBlurb}</ClampText>
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

        {/* v8 shows Q&A to visitors only; we keep the owner's view — answering is
            functional, not decorative — but the header matches the v8 Disclosure. */}
        <ListingQA listingId={id} canAnswer={mine} sellerName={listing.name} sellerPhoto={listing.avatar_url} />

        {mine ? (
          /* v8 ListingView:332 — gold Boost-trust panel on your own listing.
             v8's own copy promised the RETIRED Verified badge (verification removed
             2026-07-18), so the wording below replaces it — ⚖ founder-confirmable. */
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 13, padding: "12px 14px" }}>
            <Shield size={17} style={{ color: "var(--grail-gold-deep)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              <b>Boost trust:</b> add clear in-hand photos — listings with real photos build buyer confidence and sell faster.
            </div>
          </div>
        ) : (
          <>
            <SectionLabel>Seller</SectionLabel>
            <Link href={`/profile/${listing.handle}`} style={{ display: "block", width: "100%", marginTop: 10, padding: 14, cursor: "pointer", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={listing.name ?? "?"} photo={listing.avatar_url} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{listing.name}</div>
                  {/* v8:349 placeLabel — "@handle · City, Country"; degrades to
                      city-only / country-only / bare handle when fields are null. */}
                  {(() => {
                    const place = [listing.seller_city, listing.seller_country].filter(Boolean).join(", ");
                    return (
                      <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{listing.handle}{place ? ` · ${place}` : ""}</div>
                    );
                  })()}
                </div>
                <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                {/* v8:354 trust row is NON-compact (stats spread space-between):
                    Vouches · Replies · Joined. Replies = seller reply rate ("96%"),
                    null under 3 answered questions — the row degrades gracefully. */}
                <TrustSignals
                  vouches={sellerVouches}
                  response={listing.seller_replies ?? null}
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

            {/* W-48 — the header flag moved out with the transparent overlay (v8 keeps
                just heart + share up there); visitors report from the page footer. */}
            <button onClick={() => setReporting(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>
              <Flag size={13} />Report this listing
            </button>
          </>
        )}
      </div>

      <div className="ch-cta-bar">
        {mine ? (
          editing ? (
            /* Inline fallback editor — only reachable when the listing payload has no
               item_id to route to the full sell-page editor. */
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
                <button onClick={() => setEditing(false)} disabled={editBusy} style={{ height: 44, padding: "0 14px", borderRadius: 11, background: "transparent", border: "1px solid var(--border-strong)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginLeft: "auto" }}>Cancel</button>
                <button onClick={saveEdit} disabled={editBusy} style={{ height: 44, padding: "0 18px", borderRadius: 11, background: "var(--stamp-red)", border: "none", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: editBusy ? "wait" : "pointer" }}>{editBusy ? "Saving…" : "Save"}</button>
              </div>
            </div>
          ) : (
            /* v8 owner footer — status + price on the left, ONE dark Manage button. */
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* DV8-13 — "reserved" retired: a listing is available | sold | closed. */}
                {/* v8 ListingView :83 — the raw status word ("AVAILABLE"), never "LIVE" */}
                <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>YOUR LISTING · {listing.status.toUpperCase()}</div>
                <div style={{ fontSize: 18, color: "var(--stamp-red)" }}><Money value={priceRupees} currency={cur} /></div>
              </div>
              <button onClick={() => setManageOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 18px", borderRadius: 13, background: "var(--ink)", border: "none", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                <SlidersHorizontal size={17} />Manage listing
              </button>
            </div>
          )
        ) : sold ? (
          /* v8:89 — Button secondary, disabled: bone on border-strong, ink-soft,
             dimmed to 0.4 (heights follow the app's 48px CTA-bar convention). */
          <button disabled style={{ width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", color: "var(--ink-soft)", border: "1px solid var(--border-strong)", opacity: 0.4, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
            This listing is sold
          </button>
        ) : (
          /* v8 — a single full-width CTA; a trade conversation folds into the chat. */
          <button onClick={messageSeller} disabled={dmBusy} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: dmBusy ? "default" : "pointer" }}>
            <MessageCircle size={18} />{dmBusy ? "Opening…" : "Message seller"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Share to Feed (v8 Overlays.jsx:769) — post the listing to the feed and/or
   communities with a caption. Uses the composer's exact POST /posts contract:
   "post" maps to showcase, the listing rides as ref_listing_id. ── */
function ShareToFeedSheet({ listing, onClose }: { listing: ApiListing; onClose: () => void }) {
  const [caption, setCaption] = useState("");
  const [postTo, setPostTo] = useState<string[]>(["feed"]);
  const [showPostTo, setShowPostTo] = useState(false);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((d) => setCommunities((d ?? []).filter((c) => c.is_member)))
      .catch(() => { /* feed-only sharing still works */ });
  }, []);

  // Same multi-select pattern as the composer: at least one target stays selected.
  const togglePostTo = (tid: string) =>
    setPostTo((ps) => ps.includes(tid) ? (ps.length > 1 ? ps.filter((p) => p !== tid) : ps) : [...ps, tid]);

  const cur = symOf(listing.currency ?? "INR");
  const price = Math.round(listing.price / 100);
  const cover = listing.cover_url ?? listing.photos?.[0];
  const pillLabel = postTo.includes("feed") && postTo.length === 1
    ? "Your feed"
    : postTo.includes("feed")
    ? `Feed +${postTo.length - 1}`
    : `${postTo.length} ${postTo.length === 1 ? "community" : "communities"}`;

  async function post() {
    if (busy) return;
    setBusy(true);
    try {
      const target = postTo.filter((p) => p !== "feed");
      await api.post("/posts", {
        type: "showcase", // the composer's "post" → showcase mapping
        body: caption.trim(),
        images: [],
        ref_listing_id: listing.id,
        communities: target,
        community_id: target[0] ?? null,
        to_feed: postTo.includes("feed"),
      });
      // The feed snapshot predates this post — drop it so /feed refetches fresh.
      invalidateFeedSnapshot();
      fireToast("Shared to your feed");
      onClose();
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Couldn't share — try again");
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" style={{ background: "rgba(20,17,15,0.45)" }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[680px] sm:max-w-[420px] rounded-t-[20px] sm:rounded-2xl" style={{ boxSizing: "border-box", overflowX: "hidden", background: "var(--paper)", padding: "10px 18px 30px", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>Share to Feed</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={17} />
          </button>
        </div>

        {/* where to post — same multi-select pattern as the post composer */}
        <button onClick={() => setShowPostTo((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--paper-soft)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "5px 10px 5px 12px", cursor: "pointer", marginBottom: showPostTo ? 8 : 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", fontFamily: "var(--font-body)" }}>{pillLabel}</span>
          <ChevronRight size={12} strokeWidth={2.4} style={{ transform: "rotate(90deg)" }} />
        </button>
        {showPostTo && (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 14, border: "1px solid var(--border-strong)", borderRadius: 12, overflow: "hidden", background: "var(--paper-soft)" }}>
            {[{ id: "feed", name: "Your feed" }, ...communities.map((c) => ({ id: c.id, name: c.name }))].map((c, i) => {
              const on = postTo.includes(c.id);
              return (
                <button key={c.id} onClick={() => togglePostTo(c.id)} style={{ display: "flex", alignItems: "center", gap: 9, height: 40, padding: "0 12px", border: "none", borderTop: i > 0 ? "1px solid var(--border)" : "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)" }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${on ? "var(--stamp-red)" : "var(--border-strong)"}`, background: on ? "var(--stamp-red)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {on && <Check size={11} strokeWidth={3} style={{ color: "var(--paper)" }} />}
                  </span>
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something about it… (optional)" rows={3} style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border-strong)", borderRadius: 13, padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", resize: "none", background: "var(--paper-soft)", outline: "none" }} />

        {/* listing preview card */}
        <div style={{ display: "flex", gap: 13, marginTop: 14, padding: 12, border: "1px solid var(--slate-200)", borderRadius: 16, background: "var(--slate-50)" }}>
          <div style={{ width: 64, flexShrink: 0 }}><ProductPhoto tone="ink" src={cover} ratio="1/1" /></div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{listing.title}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}><Money value={price} currency={cur} /></div>
          </div>
        </div>

        <button onClick={post} disabled={busy} style={{ width: "100%", boxSizing: "border-box", marginTop: 16, padding: "14px 0", borderRadius: 13, border: "none", background: "var(--stamp-red)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Posting…" : "Post to Feed"}
        </button>
      </div>
    </div>
  );
}

/* ── Public Q&A on a listing — collapsible, count in the header, open by default.
   Header matches the v8 Disclosure (display-font title + mono meta + chevron). ── */
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
      fireToast("Question posted — seller will be notified"); // v8:389
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
    /* v8:326 — Disclosure carries a top rule of its own plus the passed borderBottom.
       Defaults closed (shared.jsx:434); the count reads in the header meta slot. */
    <Disclosure title="Q&A" meta={questions.length} style={{ marginBottom: 18, borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "0 0 12px" }}>Questions are public — don&rsquo;t share personal info here.</div>

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
                    {/* DV8 §5#28 — asker photos render like the seller's, not initials */}
                    <Avatar name={item.asker_name ?? "?"} photo={item.asker_avatar_url} size={26} />
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
    </Disclosure>
  );
}
