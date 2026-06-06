"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Bookmark, Send, Calendar, MapPin, Clock, Users, MessageSquare, Bell } from "lucide-react";
import { timeAgo, shortDate } from "@/lib/utils";
import {
  Avatar, Tag, TierChip, PostTypeTag, VerifyBadge, Stars,
  Money, ProductPhoto, Stamp, SealMark,
} from "@/components/ui";

/* ── API response shapes ────────────────────────────────────────── */

export interface ApiPost {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  tier: string;
  type: string;
  body: string;
  images: string[];
  category: string | null;
  community_id: string | null;
  review_rating: number | null;
  poll_options: Record<string, unknown> | null;
  is_admin_post: boolean;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  created_at: string;
  // admin post extras
  title?: string;
  tone?: string;
  time?: string;
}

export interface ApiListing {
  id: string;
  item_id: string;
  seller_id: string;
  sku: string | null;
  title: string;
  category: string | null;
  verify_tier: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  tier: string;
  rating: number;
  deals_count: number;
  price: number;
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
  watching_count: number;
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
  community_id: string | null;
  category: string | null;
  mode: string;
  city: string | null;
  venue: string | null;
  starts_at: string;
  interested_count: number;
  is_interested: boolean;
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
  post_mode: string;
  rules: string[];
  is_invite_only: boolean;
  is_member: boolean;
  created_at: string;
}

/* ── Condition label map ─────────────────────────────────────────── */
const CONDITION_LABEL: Record<string, string> = {
  sealed_misb: "MISB · sealed",
  mint: "Mint",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  for_parts: "For parts",
  excellent: "Excellent",
};

/* ── Quick-action button ─────────────────────────────────────────── */
function ActionBtn({
  icon, label, active, activeColor = "var(--stamp-red)", onClick,
}: {
  icon: React.ReactNode;
  label?: React.ReactNode;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "none", border: "none", padding: "4px 2px",
        cursor: "pointer", color: active ? activeColor : "var(--ink-mute)",
      }}
    >
      <span style={{ display: "flex" }}>{icon}</span>
      {label != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{label}</span>}
    </button>
  );
}

/* ── Author line ─────────────────────────────────────────────────── */
function AuthorLine({ post, showFollow }: { post: ApiPost; showFollow?: boolean }) {
  const [following, setFollowing] = useState(false);
  const tier = post.tier;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Link href={`/profile/${post.handle ?? "unknown"}`} className="shrink-0">
        <Avatar name={post.name ?? "?"} verified={tier === "top_seller" || tier === "trusted"} size={38} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{post.name}</span>
          {tier && <TierChip tier={tier} />}
          {showFollow && (
            <button
              onClick={() => setFollowing((v) => !v)}
              style={{
                marginLeft: 2, padding: "3px 9px", borderRadius: 999, cursor: "pointer",
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
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          @{post.handle}{post.category ? ` · ${post.category}` : ""} · {timeAgo(post.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ── Poll block ──────────────────────────────────────────────────── */
function PollBlock({ options }: { options: Record<string, unknown> }) {
  const entries = Object.entries(options) as [string, number][];
  const [vote, setVote] = useState<number | null>(null);
  const total = entries.reduce((s, [, v]) => s + (v as number), 0) + (vote != null ? 1 : 0);
  return (
    <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map(([label, votes], i) => {
        const v = (votes as number) + (vote === i ? 1 : 0);
        const pct = total ? Math.round((v / total) * 100) : 0;
        const picked = vote === i;
        return (
          <button
            key={i}
            onClick={() => setVote(i)}
            style={{
              position: "relative", overflow: "hidden", textAlign: "left", cursor: "pointer",
              border: `1px solid ${picked ? "var(--ink)" : "var(--border-strong)"}`,
              borderRadius: 11, background: "var(--paper-soft)", padding: "11px 13px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}
          >
            {vote != null && (
              <div style={{
                position: "absolute", inset: 0, width: pct + "%",
                background: picked ? "var(--plum-soft)" : "var(--bone)",
                transition: "width 280ms var(--ease-out)",
              }} />
            )}
            <span style={{ position: "relative", fontSize: 14, fontWeight: picked ? 600 : 500, color: "var(--ink)" }}>{label}</span>
            {vote != null && <span style={{ position: "relative", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-mute)" }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
        {total} votes{vote == null ? " · tap to vote" : ""}
      </div>
    </div>
  );
}

/* ── Post card ───────────────────────────────────────────────────── */
export function PostCard({ post, showFollow = false }: { post: ApiPost; showFollow?: boolean }) {
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<{ name: string; body: string }[]>([]);
  const commentCount = post.comments_count + extra.length;

  function addComment() {
    if (draft.trim()) {
      setExtra((x) => [...x, { name: "You", body: draft.trim() }]);
      setDraft("");
    }
  }

  return (
    <div style={{ background: "var(--paper)", borderBottom: "8px solid var(--bone)" }}>
      <Link href={`/post/${post.id}`} style={{ display: "block", padding: "14px 16px 0", textDecoration: "none", color: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <AuthorLine post={post} showFollow={showFollow} />
          <PostTypeTag type={post.type} />
        </div>

        <div style={{ marginTop: 11 }}>
          {post.type === "review" && post.review_rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Stars n={post.review_rating} />
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{post.review_rating} / 5</span>
            </div>
          )}
          <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)", whiteSpace: "pre-line" }}>
            {post.body.length > 280 ? post.body.slice(0, 280) + "…" : post.body}
          </div>
        </div>
      </Link>

      {post.images.length > 0 && (
        <div style={{ padding: "12px 16px 0" }}>
          <ProductPhoto src={post.images[0]} ratio="3/2" />
        </div>
      )}

      {post.type === "poll" && post.poll_options && <PollBlock options={post.poll_options} />}

      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 16px 14px" }}>
        <ActionBtn
          icon={<Heart size={20} strokeWidth={1.8} fill={liked ? "var(--stamp-red)" : "none"} />}
          label={likes.toLocaleString()}
          active={liked}
          onClick={() => { setLiked((v) => !v); setLikes((n) => n + (liked ? -1 : 1)); }}
        />
        <ActionBtn
          icon={<MessageCircle size={20} strokeWidth={1.8} />}
          label={commentCount.toLocaleString()}
          active={showComments}
          activeColor="var(--ink)"
          onClick={() => setShowComments((v) => !v)}
        />
        <ActionBtn icon={<Share2 size={19} strokeWidth={1.8} />} />
        <div style={{ flex: 1 }} />
        <ActionBtn
          icon={<Bookmark size={20} strokeWidth={1.8} fill={saved ? "var(--ink)" : "none"} />}
          active={saved}
          activeColor="var(--ink)"
          onClick={() => setSaved((v) => !v)}
        />
      </div>

      {showComments && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {extra.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>No comments yet — say something.</div>}
            {extra.map((cm, i) => (
              <div key={i} style={{ display: "flex", gap: 9 }}>
                <Avatar name={cm.name} color="var(--ink)" size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cm.name}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>now</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.45, marginTop: 1 }}>{cm.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 13 }}>
            <Avatar name="You" color="var(--ink)" size={30} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              placeholder="Add a comment…"
              style={{
                flex: 1, height: 38, padding: "0 13px", borderRadius: 999,
                border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
                fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none",
              }}
            />
            <button
              onClick={addComment}
              style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid " + (draft.trim() ? "var(--ink)" : "var(--border)"),
                background: draft.trim() ? "var(--ink)" : "transparent",
                color: draft.trim() ? "var(--paper)" : "var(--ink)", cursor: "pointer",
              }}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Admin / release card ────────────────────────────────────────── */
export function AdminCard({ post }: { post: ApiPost }) {
  return (
    <div style={{ background: "var(--paper)", borderBottom: "8px solid var(--bone)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <SealMark size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>CollectorHub</span>
            <Tag kind="misb">Official</Tag>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>New release · {timeAgo(post.created_at)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 5 }}>
            {post.title ?? post.body.slice(0, 60)}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-mute)", lineHeight: 1.5 }}>{post.body}</div>
          <button style={{
            marginTop: 11, display: "inline-flex", alignItems: "center", gap: 8,
            height: 32, padding: "0 12px", borderRadius: 8,
            background: "var(--grail-gold)", color: "var(--ink)",
            border: "1px solid var(--grail-gold-deep)", boxShadow: "var(--shadow-stamp)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
            <Bell size={15} />
            Notify me
          </button>
        </div>
        <div style={{ width: 88, flexShrink: 0 }}>
          <ProductPhoto tone={post.tone ?? "ink"} ratio="1/1" />
        </div>
      </div>
    </div>
  );
}

/* ── Listing feed card ───────────────────────────────────────────── */
export function ListingFeedCard({ listing }: { listing: ApiListing }) {
  return (
    <div style={{ background: "var(--paper)", borderBottom: "8px solid var(--bone)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Avatar name={listing.name ?? "?"} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>@{listing.handle} listed an item</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            {listing.ships_from_city} · {timeAgo(listing.created_at)}
          </div>
        </div>
        <Tag kind="sale">For sale</Tag>
      </div>
      <Link
        href={`/listing/${listing.id}`}
        style={{
          display: "flex", gap: 12, width: "100%", textAlign: "left",
          border: "1px solid var(--border)", background: "var(--paper-soft)",
          borderRadius: 14, padding: 10,
        }}
      >
        <div style={{ width: 96, flexShrink: 0 }}>
          <ProductPhoto tone="ink" ratio="1/1" />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{listing.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", margin: "3px 0 8px" }}>
            {CONDITION_LABEL[listing.condition] ?? listing.condition}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 17 }}>
              <Money value={Math.round(listing.price / 100)} />
            </span>
            <div style={{ marginLeft: "auto" }}>
              <VerifyBadge tier={listing.verify_tier} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Marketplace grid card ───────────────────────────────────────── */
export function MarketCard({ listing }: { listing: ApiListing }) {
  const [saved, setSaved] = useState(false);
  return (
    <Link
      href={`/listing/${listing.id}`}
      style={{
        background: "var(--paper-soft)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden", textAlign: "left",
        padding: 0, display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "relative" }}>
        <ProductPhoto tone="ink" ratio="1/1" rounded={0} />
        <div
          onClick={(e) => { e.preventDefault(); setSaved((v) => !v); }}
          style={{
            position: "absolute", top: 8, right: 8, width: 30, height: 30,
            borderRadius: "50%", background: "rgba(244,239,230,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: saved ? "var(--stamp-red)" : "var(--ink-mute)",
          }}
        >
          <Heart size={16} fill={saved ? "var(--stamp-red)" : "none"} />
        </div>
        {listing.status !== "available" && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <Tag kind={listing.status === "sold" ? "sold" : "reserved"}>{listing.status}</Tag>
          </div>
        )}
        {listing.trade_willing && listing.status === "available" && (
          <div style={{ position: "absolute", bottom: 8, left: 8 }}>
            <Stamp color="var(--ink)" rotate={-3} style={{ fontSize: 9 }}>Trade OK</Stamp>
          </div>
        )}
      </div>
      <div style={{ padding: "9px 10px 11px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: "var(--ink)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: 32,
        }}>
          {listing.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
          <span style={{ fontSize: 15 }}><Money value={Math.round(listing.price / 100)} /></span>
          <div style={{ marginLeft: "auto" }}>
            <VerifyBadge tier={listing.verify_tier} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-faint)" }}>
          <Avatar name={listing.name ?? "?"} size={15} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {listing.rating}★ · {listing.deals_count} deals
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Event card ──────────────────────────────────────────────────── */
export function EventCard({ event }: { event: ApiEvent }) {
  const { day, month } = shortDate(event.starts_at);
  const weekday = new Date(event.starts_at).toLocaleString("en-IN", { weekday: "short" });
  const [going, setGoing] = useState(event.is_interested);
  return (
    <div style={{
      display: "flex", gap: 12, width: "100%", textAlign: "left",
      alignItems: "stretch", background: "var(--paper-soft)",
      border: "1px solid var(--border)", borderRadius: 14, padding: 12,
    }}>
      <div style={{
        width: 58, flexShrink: 0, borderRadius: 10, background: "var(--ink)",
        color: "var(--paper)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "8px 0",
      }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--grail-gold)" }}>{month}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{day}</span>
        <span style={{ fontSize: 10, color: "var(--ink-ghost)", marginTop: 2 }}>{weekday}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <Tag kind={event.mode === "online" ? "vouch" : "event"}>{event.mode === "online" ? "Online" : event.mode === "hybrid" ? "Hybrid" : "In person"}</Tag>
          {going && <Tag kind="sold">Going</Tag>}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--ink)" }}>{event.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ink-mute)", marginTop: 5 }}>
          <MapPin size={14} strokeWidth={2} />
          {event.mode === "online" ? "Online" : event.venue ?? event.city}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>
          <Clock size={14} strokeWidth={2} />
          {new Date(event.starts_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {event.interested_count} interested
        </div>
      </div>
      <button
        onClick={() => setGoing((v) => !v)}
        className="self-start shrink-0"
        style={{
          padding: "6px 12px", borderRadius: 999,
          fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer",
          border: `1px solid ${going ? "var(--border-strong)" : "transparent"}`,
          background: going ? "var(--bone)" : "var(--stamp-red)",
          color: going ? "var(--ink)" : "var(--paper)",
        }}
      >
        {going ? "Going" : "Attend"}
      </button>
    </div>
  );
}

export function FeedEventCard({ event }: { event: ApiEvent }) {
  return (
    <div style={{ background: "var(--paper)", borderBottom: "8px solid var(--bone)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Calendar size={16} strokeWidth={2} style={{ color: "var(--plum)" }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--plum)" }}>Event near you</span>
      </div>
      <EventCard event={event} />
    </div>
  );
}

/* ── Community card ──────────────────────────────────────────────── */
export function CommunityCard({ community }: { community: ApiCommunity }) {
  const [joined, setJoined] = useState(community.is_member);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
      <div style={{
        width: 50, height: 50, borderRadius: 12, flexShrink: 0,
        background: "var(--bone)", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 24,
      }}>
        {community.tag ?? "🏷️"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14.5, color: "var(--ink)" }}>{community.name}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-mute)", margin: "2px 0 4px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {community.short_desc ?? community.description}
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Users size={11} />{community.member_count.toLocaleString()}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <MessageSquare size={11} />{community.post_count.toLocaleString()}
          </span>
        </div>
      </div>
      <button
        onClick={() => setJoined((v) => !v)}
        className="shrink-0"
        style={{
          height: 32, padding: "0 14px", borderRadius: 8,
          fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer",
          border: joined ? "1px solid var(--border-strong)" : "1px solid var(--ink)",
          background: joined ? "var(--paper-soft)" : "var(--ink)",
          color: joined ? "var(--ink)" : "var(--paper)",
        }}
      >
        {joined ? "Joined" : "Join"}
      </button>
    </div>
  );
}
