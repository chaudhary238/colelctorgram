"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, MessageCircle, Share2, Bookmark, Star, Send, Calendar, MapPin, Clock,
  MessageSquare, Shield, Tag as TagIcon, Pencil, Trash2, Pin,
  ChevronRight, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { timeAgo, shortDate } from "@/lib/utils";
import { symOf, conditionLabel } from "@/lib/catalog";
import {
  Avatar, Stars, Money, ProductPhoto, SealMark,
  Badge, Button, ConfirmDialog, IconButton, LocationTag, statusLabel, toneVar,
} from "@/components/ui";
import { FeedBadge, fireToast, goldFrameRing, hasGoldFrame, type FeedBadgeT } from "@/components/gamification";
import { formatTime12FromDate } from "@/components/CityField";

/* ── API response shapes ────────────────────────────────────────── */

export interface ApiPost {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  // Rewards badge shown next to the author (v3 §3): First Start badge or rank badge.
  // Null for staff authors — they carry the Official tag instead (QA 2026-08-04 §4).
  badge?: { kind: "first_start" | "rank"; code: string; name: string; emoji: string | null } | null;
  // Authored by an admin → the byline is "Scorred · Official", not the person.
  is_official?: boolean;
  // Up to 3 recent likers for the social-proof strip under the actions (QA §5).
  likers?: { handle: string | null; name: string | null; avatar_url: string | null }[];
  type: string;
  body: string;
  images: string[];
  category: string | null;
  tags?: string[];
  community_id: string | null;
  community_ids?: string[];
  // Community attribution in the byline: "@handle · {community_name} · time"
  // (v8 Cards.jsx:44). Null outside communities.
  community_name?: string | null;
  // Share-to-Feed "showcase" posts carry the shared listing inline — non-null
  // routes the card to SharedListingCard (v8 `listing-share`). Prices in PAISE.
  ref_listing?: ApiRefListing | null;
  review_rating: number | null;
  poll_options: Record<string, unknown> | null;
  // Viewer's locked poll choice (index into poll_options keys), or null if unvoted.
  my_poll_vote?: number | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_following?: boolean;
  /** QA #29 — published | pending | declined (community routing status for the
      viewer's own posts; the API only returns non-published rows to their author). */
  status?: string;
  created_at: string;
  // admin post extras
  title?: string;
  tone?: string;
  time?: string;
  city?: string | null;
  // ISO ("In Search Of") — DF-30c. iso_budget is in PAISE (card divides by 100).
  iso_item?: string | null;
  iso_budget?: number | null;
  iso_cond?: string | null;
  iso_city?: string | null;
  // Referenced item/listing → the v8 "Tagged item" chip. The post DETAIL payload
  // resolves this as `ref`; feed/community lists send the flat ref_sku fields
  // (composer "Tag item"), which postRef() below folds into the same shape.
  ref?: ApiPostRef | null;
  ref_sku?: string | null;
  ref_sku_title?: string | null;
  ref_sku_brand?: string | null;
}

export interface ApiPostRef {
  kind: "item" | "listing" | "catalogue";
  id: string;
  sku: string | null;
  title: string;
  price?: number;
}

/** The listing a Share-to-Feed post showcases (post.ref_listing). PAISE prices. */
export interface ApiRefListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  cover_url: string | null;
  status: string;
  retail_price: number | null;
}

/* One resolver for the tagged chip: the detail payload's `ref` wins; otherwise a
   composer-tagged catalogue entry (ref_sku) synthesizes the same shape. */
export function postRef(post: ApiPost): ApiPostRef | null {
  if (post.ref) return post.ref;
  if (post.ref_sku && post.ref_sku_title) {
    return { kind: "catalogue", id: post.ref_sku, sku: post.ref_sku, title: post.ref_sku_title };
  }
  return null;
}

/* SKU prefix → ProductPhoto tone for referenced-item chips (no catalogue join on web yet) */
const REF_TONE: Record<string, string> = { FIG: "red", KIT: "forest", DSN: "plum", DCS: "teal" };
export function refTone(sku: string | null): string {
  const m = (sku ?? "").match(/SKU-([A-Z]+)-/);
  return (m && REF_TONE[m[1]]) || "ink";
}

/* Where a referenced item/listing chip should land: listings → the listing page;
   catalogue-backed items → the database page when we have a SKU, else the item page. */
function refHref(ref: ApiPostRef): string {
  if (ref.kind === "listing") return `/listing/${ref.id}`;
  if (ref.kind === "catalogue") return `/db/${ref.id}`;
  return ref.sku ? `/db/${ref.sku}` : `/item/${ref.id}`;
}

export interface ApiComment {
  id: string;
  user_id?: string;
  handle?: string | null;
  name: string | null;
  avatar_url?: string | null;
  parent_id?: string | null;
  body: string;
  likes_count?: number;
  is_liked?: boolean;
  is_mine?: boolean;
  // v8 Cards.jsx :325 — the commenter's rewards badge pill beside their name.
  badge?: FeedBadgeT | null;
  created_at: string;
}

export interface ApiListing {
  id: string;
  item_id: string;
  seller_id: string;
  sku: string | null;
  title: string;
  category: string | null;
  brand?: string | null;
  scale?: string | null;
  release_year?: number | null;
  description?: string | null;
  // Pre-order listing (DV4-07a) — set when the underlying item is a pre-order.
  acq?: "inhand" | "preorder";
  preorder_eta?: string | null;
  preorder_seller?: string | null;
  photos?: string[];
  cover_url?: string | null;
  handle: string | null;
  name: string | null;
  seller_city?: string | null;
  avatar_url: string | null;
  rating: number;
  vouches_count?: number;
  /** Year the seller joined (listing detail payload) — TrustSignals "Joined {year}". */
  seller_joined?: number | null;
  price: number;
  currency?: string;
  retail_price: number | null;
  qty: number;
  condition: string;
  condition_notes: string | null;
  trade_willing: boolean;
  ships_from_city: string | null;
  ships_nationwide: boolean;
  shipping_cost: number;
  notes: string | null;
  terms: string[];
  status: string;
  saves_count: number;
  likes_count?: number;
  watching_count: number;
  is_saved?: boolean;
  is_liked?: boolean;
  is_wishlisted?: boolean;
  is_mine?: boolean;
  price_votes?: { low: number; fair: number; high: number; total: number; my_vote: string | null };
  created_at: string;
}

export interface ApiListingQuestion {
  id: string;
  body: string;
  answer: string | null;
  answered_at: string | null;
  asker_handle: string | null;
  asker_name: string | null;
  asker_avatar_url: string | null;
  is_mine?: boolean;
  created_at: string;
}

export interface ApiEvent {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  host_handle: string | null;
  host_name: string | null;
  host_avatar_url: string | null;
  host_tier?: string | null;
  host_city?: string | null;
  community_id: string | null;
  community?: { id: string; name: string; tag: string | null; tone: string; member_count: number } | null;
  categories: string[];
  mode: string;
  city: string | null;
  country?: string | null;
  pincode?: string | null;
  venue: string | null;
  address?: string | null;
  // Serialized display form "venue — address" (falls back to venue alone server-side).
  where?: string | null;
  online_url?: string | null;
  cover_image_url?: string | null;
  // DV8-16 — real pricing + ticketing/contact (price is minor units of currency).
  is_free: boolean;
  price: number;
  currency: string;
  ticket_url: string | null;
  contact: string | null;
  starts_at: string;
  ends_at?: string | null;
  going_count?: number;
  interested_count: number;
  my_rsvp?: "going" | "interested" | null;
  my_reminder?: boolean;
  is_host?: boolean;
  status: string;
  created_at: string;
}

export interface ApiCommunity {
  id: string;
  name: string;
  description: string | null;
  short_desc: string | null;
  tag: string | null;
  category: string;
  tone: string;
  member_count: number;
  post_count: number;
  recent_post_count?: number; // published posts in the last 24h (QA2 activity badge)
  post_mode: string;
  rules: string[];
  is_invite_only: boolean;
  is_member: boolean;
  // Viewer's role in this community — founder | mod | member, null when not a member.
  member_role?: string | null;
  // Viewer CREATED it — what the "Created by you" section groups on (QA §15).
  is_founder?: boolean;
  join_state?: string; // member | requested | none (QA2 — persists a private "Requested")
  status?: string; // pending | approved | rejected (founder sees own pending)
  /** QA #30 — the creator's chosen community photo; the tile shows it over the tone square. */
  avatar_url?: string | null;
  banner_url?: string | null;
  created_at: string;
}

/* ── Floating card shell (v3 — white card on canvas, hover lift) ──── */
const CARD_BASE: React.CSSProperties = {
  background: "var(--card-surface)",
  borderRadius: 20,
  margin: "0 14px 12px",
  boxShadow: "var(--card-shadow)",
};
function liftOn(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = "translateY(-3px)";
  e.currentTarget.style.boxShadow = "var(--card-shadow-lifted)";
}
function liftOff(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = "";
  e.currentTarget.style.boxShadow = "var(--card-shadow)";
}

/* ── Per-type ribbon (v8 post-type differentiation) ──────────────────
   v8 Aug-25 update: an OUTLINED rotated stamp (8.5px/800, r2, -8deg) in the type
   colour — REVIEW gold-deep · WANTED teal · FOR SALE teal — on borderless
   shadow-only cards. Plain post/showcase/poll/discussion cards get no stamp. */
function TypeRibbon({ label, fg }: { label: string; fg: string }) {
  return (
    <span style={{
      position: "absolute", top: 14, right: 16, fontSize: 8.5, fontWeight: 800,
      letterSpacing: "0.06em", padding: "2px 6px", borderRadius: 2,
      border: `1px solid ${fg}`, color: fg, transform: "rotate(-8deg)", zIndex: 1,
    }}>
      {label}
    </span>
  );
}

/* ── Quick-action button (v8 shared.jsx:765-789, full tactile layer) ──
   Press squishes to 0.78; a tap "bursts" the icon to 1.40 for ~420ms before it
   settles at the active 1.12 + glow; the icon FILL is cloned in from `active`,
   so e.g. the comment icon fills while its thread is open.
   Exported — post/[id]'s action strip is the same treatment (v8 PostDetail:53-57). */
export function ActionBtn({
  icon, label, active, activeColor = "var(--stamp-red)", onClick,
}: {
  icon: React.ReactElement<{ fill?: string }>;
  label?: React.ReactNode;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
}) {
  const [burst, setBurst] = useState(false);
  const fire = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 420);
    onClick?.();
  };
  return (
    <button
      onClick={fire}
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.78)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ""; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ""; }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none", padding: "4px 2px",
        cursor: "pointer", color: active ? activeColor : "var(--slate-400)",
        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 700 : 500,
        transition: "color 150ms, transform 120ms var(--ease-spring)",
      }}
    >
      <span
        style={{
          display: "flex",
          transform: burst ? "scale(1.40)" : active ? "scale(1.12)" : "scale(1)",
          // v8 writes `${activeColor}99` — a hex-alpha suffix that is invalid on a
          // var() reference, so the glow silently no-ops there. color-mix at 60%
          // (≈ 0x99) is the same glow, working for tokens and hex alike.
          filter: active ? `drop-shadow(0 0 5px color-mix(in srgb, ${activeColor} 60%, transparent))` : "none",
          transition: "transform 260ms var(--ease-spring), filter 200ms",
        }}
      >
        {React.cloneElement(icon, { fill: active ? activeColor : "none" })}
      </span>
      {label != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{label}</span>}
    </button>
  );
}

/* ── Author line ─────────────────────────────────────────────────── */
/**
 * Social-proof strip — who liked this (design_v7 shared.jsx `StackedAvatars`).
 * Overlapping 26px circles, initials when there's no photo, then the count. The
 * server sends at most 3 likers, so the "+N" bubble is computed from likes_count
 * rather than the array length.
 */
function StackedLikers({ likers, total }: { likers: ApiPost["likers"]; total: number }) {
  const shown = (likers ?? []).slice(0, 3);
  if (total <= 0) return null;
  const overflow = total - shown.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {shown.length > 0 && (
        <div style={{ display: "flex", alignItems: "center" }}>
          {shown.map((u, i) => (
            <div
              key={u.handle ?? i}
              title={u.name ?? undefined}
              style={{
                borderRadius: "50%", flexShrink: 0, display: "flex",
                boxShadow: "0 0 0 2px var(--card-surface)",
                marginLeft: i === 0 ? 0 : -9, position: "relative", zIndex: shown.length - i,
              }}
            >
              {/* Same Avatar as the byline — initials fall out of it for free, and the
                  photo path stays consistent with every other face in the app. */}
              <Avatar name={u.name ?? "?"} photo={u.avatar_url} size={26} />
            </div>
          ))}
          {overflow > 0 && (
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0, marginLeft: -9,
              boxShadow: "0 0 0 2px var(--card-surface)", background: "var(--slate-200)",
              color: "var(--slate-600)", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              +{overflow > 99 ? "99" : overflow}
            </div>
          )}
        </div>
      )}
      {/* v8 Cards.jsx:178 — "{n} liked", not "{n} likes" */}
      <span style={{ fontSize: 12, color: "var(--slate-500)", fontWeight: 500 }}>
        {total.toLocaleString("en-IN")} liked
      </span>
    </div>
  );
}

/**
 * Byline for a staff post (QA 2026-08-04 §4): the platform speaks as **Scorred**,
 * with the seal for an avatar and an Official tag — never the admin's own name,
 * handle, rewards badge or a Follow button. Admins hold no badges and no rank, so
 * there is deliberately nothing else to show here.
 */
function OfficialAuthorLine({ post }: { post: ApiPost }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SealMark size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>Scorred</span>
          <Badge style={{ background: "var(--slate-800)", color: "var(--paper)", borderRadius: 5, fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 7px" }}>
            Official
          </Badge>
        </div>
        <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 1 }}>
          {timeAgo(post.created_at)}
        </div>
      </div>
    </div>
  );
}

/* Community role chip beside the author name (v8 CommunityDetail.jsx:7 RoleBadge):
   ADMIN = stamp-red, MOD = bone. Same treatment as the community rosters. */
export type AuthorRole = "admin" | "mod" | null;
function AuthorRoleChip({ role }: { role: "admin" | "mod" }) {
  const admin = role === "admin";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 6, fontWeight: 700, flexShrink: 0, lineHeight: 1,
      background: admin ? "var(--stamp-red)" : "var(--bone-deep)", color: admin ? "var(--paper)" : "var(--ink-mute)",
    }}>
      {role}
    </span>
  );
}

/* Exported — v8 PostDetail.jsx:27 renders the SAME AuthorLine on the post's own
   page (38px avatar, badge pill, community byline, role chip, Official switch). */
export function AuthorLine({ post, showFollow, authorRole, reserveRight = 0 }: {
  post: ApiPost;
  showFollow?: boolean;
  authorRole?: AuthorRole;
  /** v8 — right padding (px) reserved so name/badges never collide with an
      absolute TypeRibbon in the card corner (~52 for the "REVIEW" stamp). */
  reserveRight?: number;
}) {
  const { user } = useUser();
  const [following, setFollowing] = useState(post.is_following ?? false);
  const [busy, setBusy] = useState(false);
  // Never offer a Follow button on your own post — you can't follow yourself.
  const isOwn = !!user && user.id === post.user_id;

  if (post.is_official) return <OfficialAuthorLine post={post} />;

  async function toggleFollow() {
    if (busy || !post.handle) return;
    const next = !following;
    setFollowing(next);          // optimistic
    setBusy(true);
    try {
      if (next) {
        // v8 Cards.jsx:33 toast copy, with SERVER-truth XP: the "+2 XP" suffix
        // renders only when the response says a grant landed. Today the endpoint
        // is a bodyless 204 (the dedup/cap verdict stays server-side), so this
        // stays the plain variant until the payload grows the flag — never a
        // false "+2 XP" on a re-follow the ledger already counted.
        const res = await api.post<{ xp_granted?: boolean } | undefined>(`/users/${post.handle}/follow`);
        fireToast(res?.xp_granted ? `Following @${post.handle} · +2 XP` : `Following @${post.handle}`);
      } else {
        await api.delete(`/users/${post.handle}/follow`);
        fireToast(`Unfollowed @${post.handle}`);
      }
    } catch {
      setFollowing(!next);       // revert on error
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Link href={`/profile/${post.handle ?? "unknown"}`} className="shrink-0">
        <Avatar name={post.name ?? "?"} photo={post.avatar_url} size={38} />
      </Link>
      <div style={{ flex: 1, minWidth: 0, paddingRight: reserveRight }}>
        {/* v8 25-Aug polish — nowrap + minWidth 0: the NAME truncates first, so the
            role chip / badge / Follow button never wrap into or collide with a
            review ribbon or the card edge. */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", rowGap: 4, minWidth: 0 }}>
          <Link
            href={`/profile/${post.handle ?? "unknown"}`}
            style={{ textDecoration: "none", flexShrink: 1, minWidth: 0, overflow: "hidden" }}
            className="hover:underline"
          >
            <span style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.name}</span>
          </Link>
          {authorRole && <AuthorRoleChip role={authorRole} />}
          {/* QA #29 — the author's own not-yet-published community post is tagged
              inline, so it can't be mistaken for a live post. */}
          {post.status === "pending" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 6, background: "var(--grail-gold-soft)", color: "var(--grail-gold-deep)", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
              <Clock size={11} /> Pending review
            </span>
          )}
          {post.status === "declined" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 6, background: "var(--stamp-red-soft)", color: "var(--stamp-red)", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>
              <X size={11} /> Declined
            </span>
          )}
          {/* v3 §3: the single rewards badge (First Start badge, else rank badge) */}
          <FeedBadge badge={post.badge} />
          {showFollow && !isOwn && (
            <button
              onClick={toggleFollow}
              disabled={busy}
              style={{
                /* v8 Cards.jsx:35 — pad 3px 8px, no extra left margin */
                padding: "3px 8px", borderRadius: 999, cursor: busy ? "default" : "pointer",
                lineHeight: 1, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap",
                background: following ? "transparent" : "var(--stamp-red-soft)",
                color: following ? "var(--ink-faint)" : "var(--stamp-red)",
                border: `1px solid ${following ? "var(--border-strong)" : "var(--stamp-red)"}`,
              }}
            >
              {following ? "Following" : "+ Follow"}
            </button>
          )}
        </div>
        {/* v8 Cards.jsx:44 — community attribution sits between handle and time */}
        <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          @{post.handle}{post.community_name ? ` · ${post.community_name}` : ""} · {timeAgo(post.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ── @mention rendering — highlight + link tappable @handles ─────── */
export function renderCommentBody(text: string) {
  return text.split(/(@\w+)/g).map((p, i) =>
    p.startsWith("@") ? (
      <Link
        key={i}
        href={`/profile/${p.slice(1)}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--stamp-red)", fontWeight: 700 }}
      >
        {p}
      </Link>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

/* ── MentionInput — shows a user picker when @ is typed ──────────── */
// Require at least this many characters after "@" before hitting the search
// endpoint. With thousands of users a 1-char query matches far too broadly and
// hammers /search on every keystroke; 2 is the common bar (Slack/GitHub-style).
const MENTION_MIN_CHARS = 2;
interface MentionUser { id: string; handle: string; name: string }
export function MentionInput({
  value, onChange, onSubmit, placeholder, size, autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  size?: "sm";
  autoFocus?: boolean;
}) {
  const h = size === "sm" ? 34 : 38;
  const fs = size === "sm" ? 13.5 : 14;
  const px = size === "sm" ? 12 : 13;
  const ref = React.useRef<HTMLInputElement>(null);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);

  // Debounced user search against the global search endpoint. Only fetches —
  // never clears synchronously; the dropdown is gated on `mention` in render,
  // so stale results stay hidden until the next query resolves.
  const query = mention?.query.trim() ?? "";
  useEffect(() => {
    if (query.length < MENTION_MIN_CHARS) return;
    let alive = true;
    const t = setTimeout(() => {
      api.get<{ users?: MentionUser[] }>(`/search?q=${encodeURIComponent(query)}&limit=5`)
        .then((r) => { if (alive) setSuggestions(r.users ?? []); })
        .catch(() => { if (alive) setSuggestions([]); });
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);
  const showSuggestions = query.length >= MENTION_MIN_CHARS && suggestions.length > 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const cur = e.target.selectionStart ?? v.length;
    const before = v.slice(0, cur);
    const m = before.match(/@(\w*)$/);
    setMention(m ? { start: cur - m[0].length, query: m[1] } : null);
    onChange(v);
  }

  function insertMention(handle: string) {
    if (!mention) return;
    const cur = ref.current?.selectionStart ?? value.length;
    const before = value.slice(0, mention.start);
    const after = value.slice(cur);
    const next = before + "@" + handle + " " + after;
    onChange(next);
    setMention(null);
    setSuggestions([]);
    setTimeout(() => {
      if (!ref.current) return;
      ref.current.focus();
      const pos = (before + "@" + handle + " ").length;
      ref.current.setSelectionRange(pos, pos);
    }, 0);
  }

  return (
    <div style={{ flex: 1, position: "relative" }}>
      {showSuggestions && (
        <div
          style={{
            position: "absolute", bottom: h + 6, left: 0, right: 0, zIndex: 30,
            background: "var(--paper)", border: "1px solid var(--border-strong)",
            borderRadius: 15, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          }}
        >
          {suggestions.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(u.handle); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 13px", background: "none", cursor: "pointer",
                border: "none", borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                textAlign: "left",
              }}
            >
              <Avatar name={u.name} size={30} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>@{u.handle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <input
        ref={ref}
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") setMention(null);
          if (e.key === "Enter" && !showSuggestions) onSubmit?.();
        }}
        placeholder={placeholder || "Add a comment…"}
        style={{
          width: "100%", height: h, padding: `0 ${px}px`,
          borderRadius: 999, border: "1px solid var(--border-strong)",
          background: "var(--paper-soft)", fontFamily: "var(--font-body)",
          fontSize: fs, color: "var(--ink)", outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/* ── Rich comment thread — likes, replies, @mentions, edit/delete ── */
export function CommentThread({ postId, onCountChange }: { postId: string; onCountChange?: (n: number) => void }) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // QA #27
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Report the count to the parent AFTER commit — never inside a setState updater.
  // Calling onCountChange (a parent setState) from within an updater runs during
  // render and triggers "Cannot update a component while rendering a different one".
  useEffect(() => {
    if (loaded) onCountChange?.(comments.length);
  }, [comments, loaded, onCountChange]);

  useEffect(() => {
    let alive = true;
    api.get<{ comments?: ApiComment[] }>(`/posts/${postId}`)
      .then((p) => { if (alive) setComments(p.comments ?? []); })
      .catch(() => { /* composer still works */ })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [postId]);

  const parents = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  async function add(parentId?: string) {
    const isReply = !!parentId;
    const text = (isReply ? replyDraft : draft).trim();
    if (!text) return;
    try {
      const created = await api.post<ApiComment>(`/posts/${postId}/comments`, { body: text, parent_id: parentId });
      setComments((cs) => [...cs, created]);
      if (isReply) { setReplyDraft(""); setReplyTo(null); } else setDraft("");
    } catch { /* leave draft for retry */ }
  }

  async function like(c: ApiComment) {
    const next = !c.is_liked;
    setComments((cs) => cs.map((x) => x.id === c.id
      ? { ...x, is_liked: next, likes_count: (x.likes_count ?? 0) + (next ? 1 : -1) }
      : x));
    try { await api.post(`/comments/${c.id}/like`); }
    catch {
      setComments((cs) => cs.map((x) => x.id === c.id
        ? { ...x, is_liked: !next, likes_count: (x.likes_count ?? 0) + (next ? -1 : 1) }
        : x));
    }
  }

  async function saveEdit(id: string) {
    const text = editDraft.trim();
    if (!text) return;
    const prev = comments;
    setComments((cs) => cs.map((x) => x.id === id ? { ...x, body: text } : x));
    setEditingId(null);
    try { await api.patch(`/comments/${id}`, { body: text }); }
    catch { setComments(prev); }
  }

  async function remove(id: string) {
    setMenuId(null);
    const prev = comments;
    setComments((cs) => cs.filter((x) => x.id !== id && x.parent_id !== id));
    try { await api.delete(`/comments/${id}`); }
    catch { setComments(prev); }
  }

  function Row({ c, reply }: { c: ApiComment; reply?: boolean }) {
    const isOwn = c.is_mine ?? false;
    const isEditing = editingId === c.id;
    const menuOpen = menuId === c.id;
    return (
      <div style={{ display: "flex", gap: 9 }}>
        {/* v8 :319 avatarFrame — Pioneer/Early Believer commenters get the gold ring */}
        <span style={{ display: "inline-flex", flexShrink: 0, alignSelf: "flex-start", ...(hasGoldFrame(c.badge) ? goldFrameRing : {}) }}>
          <Avatar name={c.name ?? "?"} photo={c.avatar_url} color="var(--ink)" size={reply ? 26 : 30} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", borderRadius: 14, padding: "10px 13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name ?? "Unknown"}</span>
              {/* v8 :325 — badge pill between name and the spacer */}
              <FeedBadge badge={c.badge} />
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
              {isOwn && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {/* v8 Cards.jsx:330 — text "···" trigger, not an icon glyph */}
                  <button onClick={() => setMenuId(menuOpen ? null : c.id)} style={{ background: "none", border: "none", padding: "0 3px", cursor: "pointer", color: "var(--ink-faint)", display: "flex", alignItems: "center", fontSize: 15, lineHeight: 1, letterSpacing: "0.05em" }}>
                    ···
                  </button>
                  {menuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 30, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 11, boxShadow: "0 4px 18px rgba(0,0,0,0.13)", overflow: "hidden", minWidth: 112 }}>
                      <button onClick={() => { setEditingId(c.id); setEditDraft(c.body); setMenuId(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", textAlign: "left" }}>
                        <Pencil size={14} />Edit
                      </button>
                      {/* QA #27 — deleting a comment confirms first. */}
                      <button onClick={() => { setConfirmDelete(c.id); setMenuId(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--stamp-red)", textAlign: "left" }}>
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
                <button onClick={() => saveEdit(c.id)} style={{ flexShrink: 0, background: "var(--ink)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12 }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontSize: 12 }}>Cancel</button>
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.45, marginTop: 2 }}>{renderCommentBody(c.body)}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "5px 12px 0", fontSize: 12 }}>
            <button onClick={() => like(c)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", color: c.is_liked ? "var(--stamp-red)" : "var(--ink-faint)", fontWeight: 600 }}>
              <Heart size={14} fill={c.is_liked ? "var(--stamp-red)" : "none"} />{(c.likes_count ?? 0) > 0 ? c.likes_count : "Like"}
            </button>
            {!reply && (
              <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink-faint)", fontWeight: 600 }}>Reply</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "14px 18px 16px" }}>
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
                <Avatar name="You" color="var(--ink)" size={26} />
                <MentionInput size="sm" autoFocus value={replyDraft} onChange={setReplyDraft} onSubmit={() => add(c.id)} placeholder={`Reply to @${c.handle ?? c.name ?? "user"}…`} />
                <IconButton icon={<Send size={15} />} active={!!replyDraft.trim()} onClick={() => add(c.id)} />
              </div>
            )}
          </div>
        ))}
        {loaded && comments.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>No comments yet — say something.</div>}
      </div>
      <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 14 }}>
        <Avatar name="You" color="var(--ink)" size={30} />
        <MentionInput value={draft} onChange={setDraft} onSubmit={() => add()} placeholder="Add a comment… type @ to tag" />
        <IconButton icon={<Send size={17} />} active={!!draft.trim()} onClick={() => add()} />
      </div>
    </div>
  );
}

/* ── Poll block ──────────────────────────────────────────────────────
   One vote per user, LOCKED once cast (no switching). The viewer's prior
   choice arrives as `initialVote` (post.my_poll_vote) so a reload/return shows
   their selection + results instead of a fresh, votable poll. */
export function PollBlock({
  postId, options, initialVote,
}: {
  postId: string;
  options: Record<string, unknown>;
  initialVote?: number | null;
}) {
  const labels = Object.keys(options);
  const [vote, setVote] = useState<number | null>(initialVote ?? null);
  // Server counts already include the viewer's vote when initialVote is set.
  const [counts, setCounts] = useState<number[]>(labels.map((l) => Number(options[l]) || 0));
  const [busy, setBusy] = useState(false);
  const voted = vote != null;
  const total = counts.reduce((s, v) => s + v, 0);

  async function cast(e: React.MouseEvent, i: number) {
    e.preventDefault();
    e.stopPropagation();
    if (voted || busy) return;                     // locked after the first vote
    setVote(i);
    setCounts((c) => c.map((v, j) => (j === i ? v + 1 : v)));  // optimistic
    setBusy(true);
    try {
      await api.post(`/posts/${postId}/poll-vote`, { option_index: i });
    } catch {
      setVote(null);
      setCounts((c) => c.map((v, j) => (j === i ? v - 1 : v)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
      {labels.map((label, i) => {
        const v = counts[i];
        const pct = total ? Math.round((v / total) * 100) : 0;
        const picked = vote === i;
        return (
          <button
            key={i}
            onClick={(e) => cast(e, i)}
            disabled={voted || busy}
            style={{
              position: "relative", overflow: "hidden", textAlign: "left",
              cursor: voted ? "default" : "pointer",
              border: `1px solid ${picked ? "var(--ink)" : "var(--border-strong)"}`,
              borderRadius: 13, background: "var(--paper-soft)", padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}
          >
            {voted && (
              <div style={{
                position: "absolute", inset: 0, width: pct + "%",
                background: picked ? "var(--plum-soft)" : "var(--bone)",
                transition: "width 280ms var(--ease-out)",
              }} />
            )}
            <span style={{ position: "relative", fontSize: 14, fontWeight: picked ? 600 : 500, color: "var(--ink)" }}>{label}</span>
            {voted && <span style={{ position: "relative", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-mute)" }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
        {total} vote{total === 1 ? "" : "s"}{voted ? "" : " · tap to vote"}
      </div>
    </div>
  );
}

/* ── Post image gallery — natural aspect ratio, never cropped. Tall images
   clamp to 560px and letterbox on bone so one 9:16 shot can't own the feed. */
function PostImg({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ display: "block", width: "100%", height: "auto", maxHeight: 560, objectFit: "contain", background: "var(--bone)", ...style }} />
  );
}
export function PostImages({ images }: { images: string[] }) {
  const n = images.length;
  if (n === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <PostImg src={images[0]} />
      </div>
    );
  }
  // QA 5.1 — multi-photo posts swipe as a carousel instead of stacking/gridding.
  return <PostCarousel images={images} />;
}

// Swipeable, scroll-snapped photo carousel with dot + "n/total" indicators.
// Indicators are pointer-events:none so the surrounding <Link> (tap → post
// detail) still works while a horizontal drag pages between photos.
function PostCarousel({ images }: { images: string[] }) {
  const n = images.length;
  const [active, setActive] = useState(0);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive((cur) => (idx !== cur ? idx : cur));
  }

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar"
        style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {images.map((src, i) => (
          // Mixed-ratio slides: the scroller is as tall as the tallest photo;
          // shorter ones centre on bone instead of cropping to a shared ratio.
          <div key={i} style={{ flex: "0 0 100%", scrollSnapAlign: "center", display: "flex", alignItems: "center", background: "var(--bone)" }}>
            <PostImg src={src} />
          </div>
        ))}
      </div>
      {/* counter */}
      <div style={{ position: "absolute", top: 10, right: 10, pointerEvents: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: "3px 9px", fontFamily: "var(--font-mono)" }}>
        {active + 1}/{n}
      </div>
      {/* dots */}
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, pointerEvents: "none" }}>
        {images.map((_, i) => (
          <span key={i} style={{ width: i === active ? 7 : 6, height: i === active ? 7 : 6, borderRadius: "50%", background: i === active ? "#fff" : "rgba(255,255,255,0.55)", transition: "all 0.15s", boxShadow: "0 0 2px rgba(0,0,0,0.4)" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Post card ───────────────────────────────────────────────────── */
export function PostCard({ post, showFollow = false, authorRole = null, canModerate = false, onRemove }: {
  post: ApiPost;
  showFollow?: boolean;
  /** Author's role in the community this card renders in (DV8-14) — ADMIN/MOD chip
      in the author row. Null (default) renders no chip. */
  authorRole?: AuthorRole;
  /** Community moderation (v8): admins get a trash action that opens an inline
      "Remove this post — why?" panel; the reason is handed to onRemove. */
  canModerate?: boolean;
  onRemove?: (reason: string) => void;
}) {
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [likes, setLikes] = useState(post.likes_count);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [shared, setShared] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeReason, setRemoveReason] = useState("");

  // Adopt fresh server counts when the `post` prop changes (QA 2026-08-05 §3).
  // These useState calls only read their argument on the FIRST render, and the feed
  // keeps each card mounted under a stable key — so once a card existed, a refetch
  // handed it new props that it silently ignored, and the like count sat at whatever
  // it was when the card first mounted while the post's own page showed the truth.
  // This is React's documented "adjusting state when a prop changes" pattern: the
  // setState during render is re-run immediately, before anything commits.
  const [syncedFrom, setSyncedFrom] = useState(post);
  if (syncedFrom !== post) {
    setSyncedFrom(post);
    // Don't clobber an in-flight optimistic toggle — only adopt when idle.
    if (!likeBusy) {
      setLiked(post.is_liked ?? false);
      setLikes(post.likes_count);
    }
    if (!saveBusy) setSaved(post.is_saved ?? false);
    setCommentCount(post.comments_count);
  }

  if (post.type === "iso") return <ISOCard post={post} authorRole={authorRole} />;

  const isReview = post.type === "review";
  const metaStrip = likes > 0 || !!post.city;

  async function toggleLike() {
    if (likeBusy) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));   // optimistic
    setLikeBusy(true);
    try { await api.post(`/posts/${post.id}/like`); }
    catch { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); }
    finally { setLikeBusy(false); }
  }

  async function toggleSave() {
    if (saveBusy) return;
    const next = !saved;
    setSaved(next);                          // optimistic
    setSaveBusy(true);
    try {
      await api.post(`/posts/${post.id}/save`);
      fireToast(next ? "Saved" : "Removed from saved"); // v8 Cards.jsx:155
    }
    catch { setSaved(!next); }
    finally { setSaveBusy(false); }
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Scorred", text: post.body.slice(0, 80), url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div
      style={{
        ...CARD_BASE,
        // v8 (Aug-25 update) — cards are shadow-only; the corner ribbon alone
        // carries the type, no per-type border.
        border: "none",
        position: "relative",
        transition: "transform 200ms var(--ease-out), box-shadow 200ms",
      }}
      onMouseEnter={liftOn}
      onMouseLeave={liftOff}
    >
      {isReview && <TypeRibbon label="REVIEW" fg="var(--grail-gold-deep)" />}
      <div style={{ padding: "16px 18px 0" }}>
        <AuthorLine post={post} showFollow={showFollow} authorRole={authorRole} reserveRight={isReview ? 52 : 0} />
        <Link href={`/post/${post.id}`} style={{ display: "block", marginTop: 11, textDecoration: "none", color: "inherit" }}>
          {post.type === "review" && post.review_rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Stars n={post.review_rating} />
              {/* v8 Cards.jsx:88 — a tagged item reads "reviewing {brand}", else the score */}
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {post.ref_sku_brand ? `reviewing ${post.ref_sku_brand}` : `${post.review_rating} / 5`}
              </span>
            </div>
          )}
          {post.title && (
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 5 }}>{post.title}</div>
          )}
          {post.body && (
            <div>
              <div style={{
                fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)", whiteSpace: "pre-line",
                display: expanded ? "block" : "-webkit-box",
                WebkitLineClamp: expanded ? undefined : 3, WebkitBoxOrient: "vertical",
                overflow: expanded ? "visible" : "hidden",
              }}>
                {post.body}
              </div>
              {!expanded && post.body.length > 130 && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true); }}
                  style={{ background: "none", border: "none", padding: "3px 0 0", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}
                >
                  read more
                </button>
              )}
            </div>
          )}
        </Link>
        {/* Hashtags — outside the post-detail Link so each tag can navigate to a
            filtered search of its own (QA 10.1). */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {post.tags.map((t) => {
              const label = t.startsWith("#") ? t : `#${t}`;
              return (
                <Link key={t} href={`/search?q=${encodeURIComponent(label)}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--plum)", textDecoration: "none" }} className="hover:underline">
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {post.images.length > 0 && (
        <Link href={`/post/${post.id}`} style={{ display: "block", padding: "12px 18px 0", position: "relative" }}>
          <PostImages images={post.images} />
        </Link>
      )}

      {post.type === "poll" && post.poll_options && (
        <PollBlock postId={post.id} options={post.poll_options} initialVote={post.my_poll_vote} />
      )}

      {/* Tagged database item (v8) — the referenced item/listing/catalogue entry
          as a tappable chip. postRef() folds the detail payload's `ref` and the
          feed lists' flat ref_sku fields into one shape. */}
      {(() => { const ref = postRef(post); return ref && (
        <Link
          href={refHref(ref)}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "calc(100% - 36px)",
            margin: "12px 18px 0", textAlign: "left", padding: 8, borderRadius: 12,
            border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
            textDecoration: "none",
          }}
        >
          <div style={{ width: 38, height: 38, flexShrink: 0 }}>
            <ProductPhoto tone={refTone(ref.sku)} ratio="1/1" rounded={9} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Tagged item</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ref.title}</div>
          </div>
          <ChevronRight size={15} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
        </Link>
      ); })()}

      {/* v8 Cards.jsx:147 — fixed pad, no metaStrip conditional */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 18px 10px" }}>
        <ActionBtn icon={<Heart size={20} strokeWidth={1.8} />} label={likes.toLocaleString()} active={liked} onClick={toggleLike} />
        <ActionBtn icon={<MessageCircle size={20} strokeWidth={1.8} />} label={commentCount.toLocaleString()} active={showComments} onClick={() => setShowComments((v) => !v)} />
        <ActionBtn icon={<Share2 size={19} strokeWidth={1.8} />} label={shared ? "Copied" : undefined} active={shared} activeColor="var(--ink)" onClick={sharePost} />
        <div style={{ flex: 1 }} />
        <ActionBtn icon={<Bookmark size={20} strokeWidth={1.8} />} active={saved} activeColor="var(--ink)" onClick={toggleSave} />
        {canModerate && (
          <ActionBtn icon={<Trash2 size={19} strokeWidth={1.8} />} active={confirmRemove} onClick={() => setConfirmRemove((v) => !v)} />
        )}
      </div>

      {/* v8 — inline removal panel: collects a short reason before the takedown. */}
      {confirmRemove && (
        <div style={{ margin: "0 18px 14px", padding: 12, borderRadius: 12, background: "var(--stamp-red-soft)", border: "1px solid var(--stamp-red)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--stamp-red-deep)", marginBottom: 7 }}>Remove this post — why?</div>
          <textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value.slice(0, 200))}
            rows={2}
            placeholder="e.g. Breaks community rules, off-topic, spam…"
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
            <button
              onClick={() => { setConfirmRemove(false); setRemoveReason(""); }}
              style={{ flex: 1, background: "none", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "8px 0", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, color: "var(--ink-mute)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => { onRemove?.(removeReason.trim()); setConfirmRemove(false); }}
              style={{ flex: 1, background: "var(--stamp-red)", border: "none", borderRadius: 9, padding: "8px 0", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5, color: "#fff" }}
            >
              Remove post
            </button>
          </div>
        </div>
      )}

      {/* Social-proof + location strip (design_v7 Cards.jsx:137). The liker faces
          come from the server; `likes` is the optimistic local count, so your own
          like bumps the number the instant you tap. */}
      {metaStrip && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px 14px", flexWrap: "wrap" }}>
          <StackedLikers likers={post.likers} total={likes} />
          {post.city && <LocationTag>{post.city}</LocationTag>}
        </div>
      )}

      {showComments && <CommentThread postId={post.id} onCountChange={setCommentCount} />}
    </div>
  );
}

/* ── ISO ("In Search Of") card — "Wanted" post; "I have this" DMs the author (DF-30c).
   Exported for the post-detail page (v8 PostDetail renders the real card, ribbon and
   all, above the comment thread). `detail` suppresses the card's own collapsible
   thread — the detail page renders the full CommentThread right below the card. */
export function ISOCard({ post, authorRole = null, detail = false }: { post: ApiPost; authorRole?: AuthorRole; detail?: boolean }) {
  const router = useRouter();
  const { user } = useUser();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [dmBusy, setDmBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const isOwn = user?.id === post.user_id;

  async function shareIso() {
    const url = `${window.location.origin}/post/${post.id}`;
    // v8 — shares read "…'s wanted post", not "ISO".
    const who = (post.name ?? "A collector").split(" ")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: "Scorred", text: `${who}'s wanted post: ${post.iso_item ?? post.body.slice(0, 80)}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch { /* user cancelled */ }
  }

  async function toggleLike() {
    const next = !liked; setLiked(next); setLikes((n) => n + (next ? 1 : -1));
    try { await api.post(`/posts/${post.id}/like`); } catch { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); }
  }
  async function toggleSave() {
    const next = !saved; setSaved(next);
    try {
      await api.post(`/posts/${post.id}/save`);
      fireToast(next ? "Saved" : "Removed from saved"); // v8 Cards.jsx:826
    } catch { setSaved(!next); }
  }
  // "I have this" — DV8 §10#22 (v8 Chat.jsx:90): an EDITABLE draft, never auto-sent.
  // Create/reuse the pair thread with NO initial_message, then open the chat
  // composer pre-filled + focused (?draft=1&intent=iso). When the ISO references a
  // catalogue entry, its sku rides the first send as the context chip.
  async function haveThis() {
    if (dmBusy) return;
    setDmBusy(true);
    const item = post.iso_item ?? post.title ?? "it";
    try {
      const thread = await api.post<{ id: string }>("/threads", {
        other_user_id: post.user_id,
      });
      const skuQs = post.ref_sku ? `&sku=${encodeURIComponent(post.ref_sku)}` : "";
      router.push(`/chat/${thread.id}?draft=1&intent=iso&title=${encodeURIComponent(item)}${skuQs}`);
    } catch {
      router.push("/inbox");
    } finally {
      setDmBusy(false);
    }
  }

  return (
    <div
      style={{ ...CARD_BASE, border: "none", position: "relative", transition: "transform 200ms var(--ease-out), box-shadow 200ms" }}
      onMouseEnter={liftOn}
      onMouseLeave={liftOff}
    >
      <TypeRibbon label="WANTED" fg="var(--verified-teal)" />
      <div style={{ padding: "16px 18px 0" }}>
        <AuthorLine post={post} authorRole={authorRole} />

        {/* Looking for — the item being sought, in the same visual language as any
            other in-post reference block (v8). The gold WANTED watermark panel read
            as a second, unrelated element sitting inside the post — it's gone. */}
        <div style={{ marginTop: 11 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-faint)", marginBottom: 4 }}>Looking for</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "-0.025em", color: "var(--ink)", lineHeight: 1.22, marginBottom: 9 }}>
            {post.iso_item ?? post.title ?? post.body.slice(0, 60)}
          </div>
          {(() => { const ref = postRef(post); return ref && (
            <Link
              href={refHref(ref)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", marginBottom: 10, padding: "7px 9px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--paper-soft)", textDecoration: "none" }}
            >
              <div style={{ width: 30, height: 30, flexShrink: 0 }}>
                <ProductPhoto tone={refTone(ref.sku)} ratio="1/1" rounded={7} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ref.title}</div>
                {/* v8 shows the brand line here — never the SKU (DV8 removed SKUs from user-facing UI). */}
                {post.ref_sku_brand && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-faint)" }}>{post.ref_sku_brand}</div>}
              </div>
              <ChevronRight size={14} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
            </Link>
          ); })()}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {post.iso_budget != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 6, background: "var(--bone)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                <TagIcon size={11} />Up to ₹{Math.round(Number(post.iso_budget) / 100).toLocaleString("en-IN")}
              </span>
            )}
            {post.iso_cond && post.iso_cond !== "Any" && (
              <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: 6, background: "var(--bone)", fontSize: 12, fontWeight: 600, color: "var(--ink-mute)" }}>{post.iso_cond}</span>
            )}
            {post.iso_city && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 6, background: "var(--bone)", fontSize: 12, fontWeight: 500, color: "var(--ink-mute)" }}>
                <MapPin size={11} />{post.iso_city}
              </span>
            )}
          </div>
        </div>
        {post.body && <div style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 10 }}>{post.body}</div>}
      </div>

      {/* v8 Cards.jsx:815-819 — pad '0 16px 12px': below the body, above the actions.
          (The WANTED ribbon lives in the top corner, well above this block — no clash.) */}
      {post.images.length > 0 && <div style={{ padding: "0 16px 12px" }}><PostImages images={post.images} /></div>}

      {/* DV4-07f: v4 groups save+share with heart/comment on the left; the teal CTA sits alone on the right (gap 8, pad-bottom 16). */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px 16px" }}>
        <ActionBtn icon={<Heart size={19} />} label={likes} active={liked} onClick={toggleLike} />
        <ActionBtn icon={<MessageCircle size={19} />} label={commentCount} active={showComments} onClick={detail ? undefined : () => setShowComments((v) => !v)} />
        <ActionBtn icon={<Bookmark size={19} />} active={saved} activeColor="var(--ink)" onClick={toggleSave} />
        <ActionBtn icon={<Share2 size={19} />} label={shared ? "Copied" : undefined} active={shared} activeColor="var(--ink)" onClick={shareIso} />
        <div style={{ flex: 1 }} />
        {!isOwn && (
          <Button size="sm" variant="teal" icon={<MessageSquare size={15} />} onClick={haveThis} disabled={dmBusy}>
            {dmBusy ? "Opening…" : "I have this"}
          </Button>
        )}
      </div>
      {!detail && showComments && <CommentThread postId={post.id} onCountChange={setCommentCount} />}
    </div>
  );
}


/* ── Listing feed card ───────────────────────────────────────────── */
export function ListingFeedCard({ listing }: { listing: ApiListing }) {
  // Null-guard (v8 25-Aug polish): a sparse/legacy payload may lack price or city —
  // skip the figure rather than render "₹ NaN" or a dangling "· 2h".
  const price = listing.price != null ? Math.round(listing.price / 100) : null;
  const cur = symOf(listing.currency ?? "INR");
  const retail = listing.retail_price != null ? Math.round(listing.retail_price / 100) : null;
  const metaLine = [listing.ships_from_city, timeAgo(listing.created_at)].filter(Boolean).join(" · ");
  return (
    <div style={{ ...CARD_BASE, padding: "16px 18px", border: "none", position: "relative" }}>
      {/* v8 ribbon system — the corner ribbon replaces the old "For sale" Badge. */}
      <TypeRibbon label="FOR SALE" fg="var(--verified-teal)" />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Link href={`/profile/${listing.handle ?? "unknown"}`} className="shrink-0">
          <Avatar name={listing.name ?? "?"} photo={listing.avatar_url} size={34} />
        </Link>
        {/* paddingRight reserves the ribbon's corner so the byline can't run under it */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 64 }}>
          <Link href={`/profile/${listing.handle ?? "unknown"}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }} className="hover:underline">
            @{listing.handle} listed an item
          </Link>
          {metaLine && (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{metaLine}</div>
          )}
        </div>
      </div>
      <Link
        href={`/listing/${listing.id}`}
        style={{
          display: "flex", gap: 13, width: "100%", textAlign: "left",
          border: "1px solid var(--slate-200)", background: "var(--slate-50)",
          borderRadius: 16, padding: 12, boxShadow: "var(--shadow-1)",
        }}
      >
        <div style={{ width: 96, flexShrink: 0 }}>
          <ProductPhoto tone="ink" src={listing.cover_url} ratio="1/1" />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{listing.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", margin: "3px 0 8px" }}>
            {conditionLabel(listing.condition, listing.category) ?? listing.condition}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
            {price != null && (
              <span style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}><Money value={price} currency={cur} /></span>
            )}
            {retail != null && price != null && retail > price && <Money value={retail} currency={cur} strike size={12} />}
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Shared listing card (in feed) — v8 Cards.jsx:844-898 ────────────
   A seller's Share-to-Feed "showcase" post with `ref_listing` set: FOR SALE
   ribbon, optional caption (post.body), inner listing box (96px photo, title,
   condition, price + strike retail), ActionBtn row, teal Message CTA into the
   listing, inline CommentThread. Callers gate on post.ref_listing != null and
   fall back to PostCard otherwise. */
export function SharedListingCard({ post, showFollow = false }: { post: ApiPost; showFollow?: boolean }) {
  const { user } = useUser();
  const l = post.ref_listing;
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likes, setLikes] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [shared, setShared] = useState(false);
  if (!l) return <PostCard post={post} showFollow={showFollow} />;
  const isOwn = !!user && user.id === post.user_id;
  const listingTitle = l.title;
  const price = Math.round(l.price / 100);
  const retail = l.retail_price != null ? Math.round(l.retail_price / 100) : null;
  const cur = symOf(l.currency ?? "INR");

  async function toggleLike() {
    const next = !liked; setLiked(next); setLikes((n) => n + (next ? 1 : -1));
    try { await api.post(`/posts/${post.id}/like`); }
    catch { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); }
  }
  async function toggleSave() {
    const next = !saved; setSaved(next);
    try {
      await api.post(`/posts/${post.id}/save`);
      fireToast(next ? "Saved" : "Removed from saved"); // v8 :885
    } catch { setSaved(!next); }
  }
  async function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    const who = (post.name ?? "A collector").split(" ")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: "Scorred", text: `${who}'s listing: ${listingTitle}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div style={{ ...CARD_BASE, border: "none", position: "relative" }}>
      <TypeRibbon label="FOR SALE" fg="var(--verified-teal)" />
      <div style={{ padding: "16px 18px 0" }}>
        <AuthorLine post={post} showFollow={showFollow} reserveRight={64} />
        {post.body && (
          <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.45, marginTop: 12 }}>{post.body}</div>
        )}
        <Link
          href={`/listing/${l.id}`}
          style={{
            display: "flex", gap: 13, width: "100%", textAlign: "left", marginTop: 12,
            border: "1px solid var(--slate-200)", background: "var(--slate-50)",
            borderRadius: 16, padding: 12, boxShadow: "var(--shadow-1)", textDecoration: "none",
          }}
        >
          <div style={{ width: 96, flexShrink: 0 }}>
            <ProductPhoto tone="ink" src={l.cover_url} ratio="1/1" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{l.title}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", margin: "3px 0 8px" }}>
              {conditionLabel(l.condition) ?? l.condition}
            </div>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
              <span style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}><Money value={price} currency={cur} /></span>
              {retail != null && retail > price && <Money value={retail} currency={cur} strike size={12} />}
            </div>
          </div>
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px 16px" }}>
        <ActionBtn icon={<Heart size={19} />} label={likes} active={liked} onClick={toggleLike} />
        <ActionBtn icon={<MessageCircle size={19} />} label={commentCount} active={showComments} onClick={() => setShowComments((v) => !v)} />
        <ActionBtn icon={<Bookmark size={19} />} active={saved} activeColor="var(--ink)" onClick={toggleSave} />
        <ActionBtn icon={<Share2 size={19} />} label={shared ? "Copied" : undefined} active={shared} activeColor="var(--ink)" onClick={share} />
        <div style={{ flex: 1 }} />
        {!isOwn && (
          <Link href={`/listing/${l.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
            <Button size="sm" variant="teal" icon={<MessageSquare size={15} />}>Message</Button>
          </Link>
        )}
      </div>
      {showComments && <CommentThread postId={post.id} onCountChange={setCommentCount} />}
    </div>
  );
}

/* ── Marketplace grid card ───────────────────────────────────────── */
export function MarketCard({ listing }: { listing: ApiListing }) {
  const router = useRouter();
  const [liked, setLiked] = useState(listing.is_liked ?? false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(listing.is_wishlisted ?? false);
  const [wishBusy, setWishBusy] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const price = Math.round(listing.price / 100);
  const cur = symOf(listing.currency ?? "INR");

  // v8 Cards.jsx:519-598 chrome on OUR semantics (deliberate): the heart keeps
  // the /like endpoint and the star keeps the item-wishlist endpoint, but the
  // card carries NO counts — heart bottom-right (red fill active), star
  // top-right (gold active), is_mine gates unchanged.
  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (likeBusy) return;
    const next = !liked;
    setLiked(next);                              // optimistic
    setLikeBusy(true);
    try { await api.post(`/listings/${listing.id}/like`); }
    catch { setLiked(!next); }
    finally { setLikeBusy(false); }
  }

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (wishBusy) return;
    const next = !wishlisted;
    setWishlisted(next);                         // optimistic
    setWishBusy(true);
    try {
      await api.post(`/items/${listing.item_id}/wishlist`);
      fireToast(next ? "Added to wishlist" : "Removed from wishlist"); // v8 :532
    }
    catch { setWishlisted(!next); }
    finally { setWishBusy(false); }
  }

  async function messageSeller(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (dmBusy) return;
    setDmBusy(true);
    try {
      const thread = await api.post<{ id: string }>("/threads", {
        other_user_id: listing.seller_id,
        listing_id: listing.id,
      });
      router.push(`/chat/${thread.id}`);
    } catch {
      router.push("/inbox");
    } finally {
      setDmBusy(false);
    }
  }

  return (
    <Link
      href={`/listing/${listing.id}`}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.025) translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--card-shadow-lifted)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; e.currentTarget.style.boxShadow = "none"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      style={{
        background: "var(--card-surface)",
        border: `1px solid ${listing.is_mine ? "var(--verified-teal)" : "var(--slate-200)"}`,
        borderRadius: 16, overflow: "hidden", textAlign: "left",
        padding: 0, display: "flex", flexDirection: "column",
        boxShadow: "var(--card-shadow)", transition: "transform 80ms var(--ease-out), box-shadow 80ms",
      }}
    >
      <div style={{ position: "relative" }}>
        <ProductPhoto tone="ink" src={listing.cover_url} ratio="1/1" rounded={0} />
        {!listing.is_mine && (
          <div
            onClick={toggleWishlist}
            title={wishlisted ? "Remove from wishlist" : "Add item to wishlist"}
            style={{
              position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 10,
              background: wishlisted ? "rgba(176,119,36,0.85)" : "rgba(15,23,42,0.46)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--paper)", cursor: wishBusy ? "default" : "pointer", transition: "background 150ms",
            }}
          >
            <Star size={16} fill={wishlisted ? "currentColor" : "none"} />
          </div>
        )}
        <div
          onClick={toggleLike}
          title={liked ? "Unlike" : "Like"}
          style={{
            position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: 10,
            background: liked ? "rgba(255,36,66,0.80)" : "rgba(15,23,42,0.46)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--paper)", cursor: likeBusy ? "default" : "pointer", transition: "background 150ms",
          }}
        >
          <Heart size={16} fill={liked ? "var(--stamp-red)" : "none"} />
        </div>
        {listing.is_mine && listing.status === "available" && (
          <div style={{ position: "absolute", top: 8, left: 8 }}><Badge variant="teal">Just listed</Badge></div>
        )}
        {!listing.is_mine && listing.status !== "available" && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <Badge variant={listing.status === "sold" ? "success" : "warning"}>{statusLabel(listing.status)}</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: "11px 12px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: "var(--ink)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: 32,
        }}>
          {listing.title}
        </div>
        {/* QA 11.1 — price sits directly under the title (no auto-margin gap); the
            message button below carries the auto margin so cards still bottom-align. */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}><Money value={price} currency={cur} /></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-faint)" }}>
          <Avatar name={listing.name ?? "?"} photo={listing.avatar_url} size={16} />
          {listing.is_mine ? (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>You · just now</span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Shield size={12} strokeWidth={2} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
              Vouched by {listing.vouches_count ?? 0}
            </span>
          )}
        </div>
        {!listing.is_mine && (
          <div
            role="button"
            tabIndex={0}
            onClick={messageSeller}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "auto", height: 34,
              borderRadius: 11, background: "var(--ink)", color: "var(--paper)", cursor: dmBusy ? "default" : "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
            }}
          >
            <MessageSquare size={14} />{dmBusy ? "Opening…" : "Message"}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Event card ──────────────────────────────────────────────────── */
export function EventCard({ event }: { event: ApiEvent }) {
  const { day: rawDay, month } = shortDate(event.starts_at);
  // v8 EventCreate.jsx:15 pads the tile day ("05", not "5").
  const day = String(rawDay).padStart(2, "0");
  const weekday = new Date(event.starts_at).toLocaleString("en-IN", { weekday: "short" });
  const going = event.my_rsvp === "going";
  const interested = event.my_rsvp === "interested";
  const past = event.status === "past" || new Date(event.starts_at) < new Date();

  return (
    <Link
      href={`/events/${event.id}`}
      style={{
        display: "flex", gap: 12, width: "100%", textAlign: "left", alignItems: "stretch",
        background: "var(--card-surface)",
        border: `1px solid ${going ? "var(--emerald)" : "var(--slate-200)"}`,
        borderRadius: 16, padding: 14, boxShadow: "var(--card-shadow)",
        opacity: past ? 0.72 : 1, textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{
        width: 54, flexShrink: 0, borderRadius: 10, background: "var(--slate-800)", color: "var(--paper)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0", gap: 1,
      }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--grail-gold)" }}>{month}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{day}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{weekday}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--ink)" }}>{event.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ink-mute)" }}>
          {/* DV8 — venue line prefers the joined "venue — address" display form. */}
          <MapPin size={13} strokeWidth={2} style={{ flexShrink: 0 }} /> {event.mode === "online" ? "Online" : event.where ?? event.venue ?? event.city}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--slate-400)" }}>
            <Clock size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
            {/* DV8 — time renders as a range when ends_at is set ("4:00 pm – 8:00 pm"). */}
            {formatTime12FromDate(new Date(event.starts_at))}
            {event.ends_at ? ` – ${formatTime12FromDate(new Date(event.ends_at))}` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            {/* DV8 — the Free/price badge is gone; the card leads with the RSVP state. */}
            {going && <Badge variant="success">Going</Badge>}
            {interested && <Badge variant="warning">Interested</Badge>}
            <span style={{ fontSize: 12, color: "var(--slate-400)", fontFamily: "var(--font-mono)" }}>{event.going_count ?? 0} going</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function FeedEventCard({ event }: { event: ApiEvent }) {
  return (
    /* v8 FeedView.jsx:191 — the plum 1.5px border IS the event-card identity. */
    <div style={{ ...CARD_BASE, padding: "14px 18px", border: "1.5px solid var(--plum)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Calendar size={16} strokeWidth={2} style={{ color: "var(--plum)" }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--plum)" }}>Event near you</span>
      </div>
      <EventCard event={event} />
    </div>
  );
}

/* ── Community card ──────────────────────────────────────────────── */
export function CommunityCard({ community, pinned, onTogglePin }: {
  community: ApiCommunity;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  // QA2 — track the tri-state join status (member | requested | none), not a bool.
  // A private community's "Request to join" must land on "Requested", never "Joined".
  const [joinState, setJoinState] = useState<string>(
    community.join_state ?? (community.is_member ? "member" : "none"),
  );
  const [busy, setBusy] = useState(false);
  const isMember = joinState === "member";
  const isRequested = joinState === "requested";

  // v8 25-Aug polish — a member's CTA is "Open" (a plain Link into the community);
  // leaving moved to the community detail header, so the card never leave-toggles.
  // Join/withdraw-request still happen right on the card.
  async function toggleJoin() {
    if (busy || isMember) return;
    setBusy(true);
    const prev = joinState;
    try {
      if (isRequested) {
        setJoinState("none"); // withdraw a pending request
        await api.delete(`/communities/${community.id}/join`);
        fireToast("Request withdrawn");
      } else {
        // Optimistic guess; the server tells us "requested" (private) vs "member" (public).
        setJoinState(community.is_invite_only ? "requested" : "member");
        const res = await api.post<{ join_state?: string }>(`/communities/${community.id}/join`);
        const next = res?.join_state ?? (community.is_invite_only ? "requested" : "member");
        if (res?.join_state) setJoinState(res.join_state);
        // v8 Cards.jsx:711-716 — the card announces what actually happened.
        if (next === "member") fireToast(`Joined ${community.name}`);
        else fireToast("Request sent — an admin will review it");
      }
    } catch { setJoinState(prev); }
    finally { setBusy(false); }
  }

  const toneBg = toneVar(community.tone || "plum");
  const fresh = community.recent_post_count ?? 0;
  const joinLabel = isRequested ? "Requested" : community.is_invite_only ? "Request" : "Join";
  // v8 Cards.jsx:705-706 — role keys off member_role: ANY manage role (founder /
  // granted admin / mod) gets the badge, not just the founder. is_founder is the
  // safety net for rows whose membership record predates the role column or
  // drifted (a founder must NEVER lose the Manage door over data drift).
  const role = community.member_role;
  const manages = community.is_founder || role === "founder" || role === "admin" || role === "mod";
  // v8 25-Aug polish — the badge row renders ONLY when a badge exists (no reserved gap).
  const hasBadges = manages || fresh > 0 || community.is_invite_only
    || community.status === "pending" || community.status === "closed" || isRequested;
  // Fixed minimum width keeps Join / Request / Requested / Open aligned (v8 :735 — 84).
  const ctaStyle: React.CSSProperties = { minWidth: 84, justifyContent: "center" };

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--card-surface)", border: `1px solid ${pinned ? "var(--stamp-red)" : "var(--slate-200)"}`, borderRadius: 16, padding: 14, boxShadow: "var(--card-shadow)" }}>
      <Link href={`/community/${community.id}`} className="shrink-0">
        {/* QA #30 — the creator's photo IS the icon when set (same pattern as the
            community detail header); the tone square + initials stay the fallback. */}
        <div style={{
          width: 50, height: 50, borderRadius: 12,
          background: community.avatar_url ? `center/cover url(${community.avatar_url})` : toneBg,
          color: "var(--paper)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em",
        }}>
          {!community.avatar_url && (community.tag ?? "🏷️")}
        </div>
      </Link>
      <Link href={`/community/${community.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{community.name}</div>
        {/* v8 25-Aug polish — badges on their own conditional row: no reserved empty
            space under the name when a public community carries no badge at all. */}
        {hasBadges && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
            {/* v8 Cards.jsx:730 — teal role badge for every manage role; "Founder"
                displays as "Admin" (DV8-15), mods read "Mod". */}
            {manages && <Badge variant="teal">{role === "mod" ? "Mod" : "Admin"}</Badge>}
            {fresh > 0 && <Badge variant="default">{fresh} new</Badge>}
            {community.is_invite_only && <Badge variant="secondary">Private</Badge>}
            {/* v8 Cards.jsx:728 — secondary "Pending review", not a warning tone. */}
            {community.status === "pending" && <Badge variant="secondary">Pending review</Badge>}
            {/* DV8 close — members still see closed communities in "Your communities". */}
            {community.status === "closed" && <Badge variant="secondary">Closed</Badge>}
            {isRequested && <Badge variant="secondary">Requested</Badge>}
          </div>
        )}
        {/* QA #11 full v8 revert (founder 2026-09-13) — the card body is name →
            badges → ONE members line (Cards.jsx:733); the description line and
            icon stat row are gone, so the card is back to v8's 3-line height. */}
        <div style={{ fontSize: 11.5, color: "var(--slate-400)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
          {community.member_count.toLocaleString("en-IN")} members
        </div>
      </Link>
      {/* QA2 — pin to keep a community at the top of "Joined" (client-only, localStorage — no DB cost) */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          title={pinned ? "Unpin" : "Pin to top"}
          aria-label={pinned ? "Unpin community" : "Pin community to top"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer", border: `1px solid ${pinned ? "var(--stamp-red)" : "var(--slate-200)"}`, background: pinned ? "var(--stamp-red-soft)" : "transparent", color: pinned ? "var(--stamp-red)" : "var(--slate-400)" }}
        >
          <Pin size={15} fill={pinned ? "currentColor" : "none"} />
        </button>
      )}
      {/* v8 Cards.jsx:734-736 — EVERY member's CTA is a plain "Open", manage roles
          included (founder call 2026-09-10, reverting our earlier Manage-CTA
          divergence): the teal role badge says what you are, and managing lives
          INSIDE the community (Open → "Manage community" in the detail header).
          The CTA is a Link into the community, NOT a leave toggle. */}
      {isMember ? (
        <Link href={`/community/${community.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
          <Button size="sm" variant="secondary" style={ctaStyle}>Open</Button>
        </Link>
      ) : (
        <Button size="sm" variant={isRequested ? "secondary" : "dark"} onClick={toggleJoin} disabled={busy} style={ctaStyle}>
          {joinLabel}
        </Button>
      )}
    </div>
  );
}
