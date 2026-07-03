"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, MessageCircle, Share2, Bookmark, Send, Calendar, MapPin, Clock,
  Users, MessageSquare, Bell, Shield, Tag as TagIcon, Pencil, Trash2, MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { timeAgo, shortDate } from "@/lib/utils";
import { symOf } from "@/lib/catalog";
import {
  Avatar, TierChip, PostTypeTag, Stars, Money, ProductPhoto, SealMark,
  Badge, Button, IconButton, GlassPill, LocationTag, statusLabel,
} from "@/components/ui";
import { FeedBadge } from "@/components/gamification";

/* ── API response shapes ────────────────────────────────────────── */

export interface ApiPost {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  tier: string;
  // Rewards badge shown next to the author (v3 §3): First Start badge or rank badge.
  badge?: { kind: "first_start" | "rank"; code: string; name: string; emoji: string | null } | null;
  type: string;
  body: string;
  images: string[];
  category: string | null;
  tags?: string[];
  community_id: string | null;
  community_ids?: string[];
  review_rating: number | null;
  poll_options: Record<string, unknown> | null;
  is_admin_post: boolean;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_following?: boolean;
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
  created_at: string;
}

export interface ApiListing {
  id: string;
  item_id: string;
  seller_id: string;
  sku: string | null;
  title: string;
  category: string | null;
  verify_tier: string;
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
  tier: string;
  rating: number;
  deals_count: number;
  vouches_count?: number;
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
  watching_count: number;
  is_saved?: boolean;
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
  pincode?: string | null;
  venue: string | null;
  online_url?: string | null;
  cover_image_url?: string | null;
  bring?: string | null;
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
  post_mode: string;
  rules: string[];
  is_invite_only: boolean;
  is_member: boolean;
  status?: string; // pending | approved | rejected (founder sees own pending)
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
        cursor: "pointer", color: active ? activeColor : "var(--slate-400)",
        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active ? 700 : 500,
        transition: "color 150ms",
      }}
    >
      <span style={{ display: "flex" }}>{icon}</span>
      {label != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{label}</span>}
    </button>
  );
}

/* ── Author line ─────────────────────────────────────────────────── */
function AuthorLine({ post, showFollow }: { post: ApiPost; showFollow?: boolean }) {
  const [following, setFollowing] = useState(post.is_following ?? false);
  const [busy, setBusy] = useState(false);
  const tier = post.tier;

  async function toggleFollow() {
    if (busy || !post.handle) return;
    const next = !following;
    setFollowing(next);          // optimistic
    setBusy(true);
    try {
      if (next) await api.post(`/users/${post.handle}/follow`);
      else await api.delete(`/users/${post.handle}/follow`);
    } catch {
      setFollowing(!next);       // revert on error
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Link href={`/profile/${post.handle ?? "unknown"}`} className="shrink-0">
        <Avatar name={post.name ?? "?"} photo={post.avatar_url} verified={tier === "top_seller" || tier === "trusted"} size={38} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{post.name}</span>
          {tier && <TierChip tier={tier} />}
          {/* v3 §3: the single rewards badge (First Start badge, else rank badge) */}
          <FeedBadge badge={post.badge} />
          {showFollow && (
            <button
              onClick={toggleFollow}
              disabled={busy}
              style={{
                marginLeft: 2, padding: "3px 9px", borderRadius: 999, cursor: busy ? "default" : "pointer",
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
        <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          @{post.handle}{post.category ? ` · ${post.category}` : ""} · {timeAgo(post.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ── @mention rendering — highlight + link tappable @handles ─────── */
function renderCommentBody(text: string) {
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
function MentionInput({
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
function CommentThread({ postId, onCountChange }: { postId: string; onCountChange?: (n: number) => void }) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
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
        <Avatar name={c.name ?? "?"} photo={c.avatar_url} color="var(--ink)" size={reply ? 26 : 30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)", borderRadius: 14, padding: "10px 13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name ?? "Unknown"}</span>
              <span style={{ fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
              {isOwn && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button onClick={() => setMenuId(menuOpen ? null : c.id)} style={{ background: "none", border: "none", padding: "0 3px", cursor: "pointer", color: "var(--ink-faint)", display: "flex", alignItems: "center" }}>
                    <MoreHorizontal size={15} />
                  </button>
                  {menuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 30, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 11, boxShadow: "0 4px 18px rgba(0,0,0,0.13)", overflow: "hidden", minWidth: 112 }}>
                      <button onClick={() => { setEditingId(c.id); setEditDraft(c.body); setMenuId(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", textAlign: "left" }}>
                        <Pencil size={14} />Edit
                      </button>
                      <button onClick={() => remove(c.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--stamp-red)", textAlign: "left" }}>
                        <Trash2 size={14} />Delete
                      </button>
                    </div>
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
              borderRadius: 13, background: "var(--paper-soft)", padding: "12px 14px",
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

/* ── Post image gallery — 1 full, 2 side-by-side, 3+ grid (first big) */
function PostImg({ src, ratio, style }: { src: string; ratio?: string; style?: React.CSSProperties }) {
  const pb = ratio === "1/1" ? "100%" : ratio === "auto" ? "100%" : "66.67%";
  return (
    <div style={{ position: "relative", paddingBottom: pb, overflow: "hidden", ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}
function PostImages({ images }: { images: string[] }) {
  const n = images.length;
  if (n === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <PostImg src={images[0]} ratio="3/2" />
      </div>
    );
  }
  if (n === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, borderRadius: 12, overflow: "hidden" }}>
        {images.map((t, i) => <PostImg key={i} src={t} ratio="1/1" />)}
      </div>
    );
  }
  const rest = images.slice(1, 4);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 4, borderRadius: 12, overflow: "hidden" }}>
      <PostImg src={images[0]} ratio="1/1" />
      <div style={{ display: "grid", gridTemplateRows: `repeat(${rest.length}, 1fr)`, gap: 4 }}>
        {rest.map((t, i) => (
          <div key={i} style={{ position: "relative", minHeight: 0 }}>
            <PostImg src={t} ratio="auto" style={{ height: "100%" }} />
            {i === rest.length - 1 && n > 4 && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>+{n - 4}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Post card ───────────────────────────────────────────────────── */
export function PostCard({ post, showFollow = false }: { post: ApiPost; showFollow?: boolean }) {
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [likes, setLikes] = useState(post.likes_count);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [shared, setShared] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (post.type === "iso") return <ISOCard post={post} />;

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
    try { await api.post(`/posts/${post.id}/save`); }
    catch { setSaved(!next); }
    finally { setSaveBusy(false); }
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "CollectorHub", text: post.body.slice(0, 80), url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div style={{ ...CARD_BASE, transition: "transform 200ms var(--ease-out), box-shadow 200ms" }} onMouseEnter={liftOn} onMouseLeave={liftOff}>
      <div style={{ padding: "16px 18px 0" }}>
        <AuthorLine post={post} showFollow={showFollow} />
        <Link href={`/post/${post.id}`} style={{ display: "block", marginTop: 11, textDecoration: "none", color: "inherit" }}>
          {post.type === "review" && post.review_rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Stars n={post.review_rating} />
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{post.review_rating} / 5</span>
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
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {post.tags.map((t) => (
                <span key={t} style={{ fontSize: 13, fontWeight: 600, color: "var(--plum)" }}>{t.startsWith("#") ? t : `#${t}`}</span>
              ))}
            </div>
          )}
        </Link>
      </div>

      {post.images.length > 0 && (
        <Link href={`/post/${post.id}`} style={{ display: "block", padding: "12px 18px 0", position: "relative" }}>
          <PostImages images={post.images} />
          {post.images.length > 1 && (
            <div style={{ position: "absolute", top: 22, right: 28, pointerEvents: "none" }}>
              <GlassPill>📸 {post.images.length}</GlassPill>
            </div>
          )}
        </Link>
      )}

      {post.type === "poll" && post.poll_options && <PollBlock options={post.poll_options} />}

      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 18px 14px" }}>
        <ActionBtn icon={<Heart size={20} strokeWidth={1.8} fill={liked ? "var(--stamp-red)" : "none"} />} label={likes.toLocaleString()} active={liked} onClick={toggleLike} />
        <ActionBtn icon={<MessageCircle size={20} strokeWidth={1.8} />} label={commentCount.toLocaleString()} active={showComments} onClick={() => setShowComments((v) => !v)} />
        <ActionBtn icon={<Share2 size={19} strokeWidth={1.8} />} label={shared ? "Copied" : undefined} active={shared} activeColor="var(--ink)" onClick={sharePost} />
        <div style={{ flex: 1 }} />
        <ActionBtn icon={<Bookmark size={20} strokeWidth={1.8} fill={saved ? "var(--ink)" : "none"} />} active={saved} activeColor="var(--ink)" onClick={toggleSave} />
      </div>

      {post.city && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px 14px" }}>
          <LocationTag>{post.city}</LocationTag>
        </div>
      )}

      {showComments && <CommentThread postId={post.id} onCountChange={setCommentCount} />}
    </div>
  );
}

/* ── ISO ("In Search Of") card — "Wanted" post; "I have this" DMs the author (DF-30c) */
function ISOCard({ post }: { post: ApiPost }) {
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
    try {
      if (navigator.share) {
        await navigator.share({ title: "CollectorHub", text: `ISO: ${post.iso_item ?? post.body.slice(0, 80)}`, url });
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
    try { await api.post(`/posts/${post.id}/save`); } catch { setSaved(!next); }
  }
  // "I have this" — open a DM to the ISO author with the wanted item as context.
  async function haveThis() {
    if (dmBusy) return;
    setDmBusy(true);
    const item = post.iso_item ?? post.title ?? "the item you're looking for";
    try {
      const thread = await api.post<{ id: string }>("/threads", {
        other_user_id: post.user_id,
        initial_message: `Hi! I saw your ISO for "${item}" — I have one. Still looking?`,
      });
      router.push(`/chat/${thread.id}`);
    } catch {
      router.push("/inbox");
    } finally {
      setDmBusy(false);
    }
  }

  return (
    <div style={CARD_BASE}>
      <div style={{ padding: "16px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <AuthorLine post={post} />
          <PostTypeTag type="iso" />
        </div>
        <div style={{ marginTop: 12, borderRadius: 16, overflow: "hidden", background: "rgba(232,163,61,0.07)", border: "1.5px solid rgba(232,163,61,0.32)", padding: "14px 16px", position: "relative" }}>
          <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%) rotate(15deg)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 30, letterSpacing: "0.2em", color: "rgba(176,119,36,0.1)", textTransform: "uppercase", pointerEvents: "none", userSelect: "none" }}>WANTED</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.25, marginBottom: 10, paddingRight: 48 }}>{post.iso_item ?? post.title ?? post.body.slice(0, 60)}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {post.iso_budget != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 6, background: "rgba(176,119,36,0.15)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#9A6010" }}>
                <TagIcon size={11} />Max ₹{Math.round(Number(post.iso_budget) / 100).toLocaleString("en-IN")}
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
        {post.body && <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 9 }}>{post.body}</div>}
      </div>

      {post.images.length > 0 && <div style={{ padding: "12px 18px 0" }}><PostImages images={post.images} /></div>}

      {/* DV4-07f: v4 groups save+share with heart/comment on the left; the teal CTA sits alone on the right (gap 8, pad-bottom 16). */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px 16px" }}>
        <ActionBtn icon={<Heart size={19} fill={liked ? "var(--stamp-red)" : "none"} />} label={likes} active={liked} onClick={toggleLike} />
        <ActionBtn icon={<MessageCircle size={19} />} label={commentCount} active={showComments} onClick={() => setShowComments((v) => !v)} />
        <ActionBtn icon={<Bookmark size={19} fill={saved ? "var(--ink)" : "none"} />} active={saved} activeColor="var(--ink)" onClick={toggleSave} />
        <ActionBtn icon={<Share2 size={19} />} label={shared ? "Copied" : undefined} active={shared} activeColor="var(--ink)" onClick={shareIso} />
        <div style={{ flex: 1 }} />
        {!isOwn && (
          <Button size="sm" variant="teal" icon={<MessageSquare size={15} />} onClick={haveThis} disabled={dmBusy}>
            {dmBusy ? "Opening…" : "I have this"}
          </Button>
        )}
      </div>
      {showComments && <CommentThread postId={post.id} onCountChange={setCommentCount} />}
    </div>
  );
}

/* ── Admin / release card ────────────────────────────────────────── */
export function AdminCard({ post }: { post: ApiPost }) {
  const [interested, setInterested] = useState(false);
  return (
    <div style={{ ...CARD_BASE, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <SealMark size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>CollectorHub</span>
            <Badge variant="dark" style={{ borderRadius: 5 }}>Official</Badge>
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
          <div style={{ marginTop: 11 }}>
            <Button size="sm" variant={interested ? "secondary" : "grail"} icon={<Bell size={15} />} onClick={() => setInterested((v) => !v)}>
              {interested ? "Alert on" : "Notify me"}
            </Button>
          </div>
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
  const price = Math.round(listing.price / 100);
  const cur = symOf(listing.currency ?? "INR");
  const retail = listing.retail_price != null ? Math.round(listing.retail_price / 100) : null;
  return (
    <div style={{ ...CARD_BASE, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Link href={`/profile/${listing.handle ?? "unknown"}`} className="shrink-0">
          <Avatar name={listing.name ?? "?"} photo={listing.avatar_url} size={34} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/profile/${listing.handle ?? "unknown"}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }} className="hover:underline">
            @{listing.handle} listed an item
          </Link>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            {listing.ships_from_city} · {timeAgo(listing.created_at)}
          </div>
        </div>
        <Badge variant="default">For sale</Badge>
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
            {CONDITION_LABEL[listing.condition] ?? listing.condition}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
            <span style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}><Money value={price} currency={cur} /></span>
            {retail != null && retail > price && <Money value={retail} currency={cur} strike size={12} />}
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Marketplace grid card ───────────────────────────────────────── */
export function MarketCard({ listing }: { listing: ApiListing }) {
  const router = useRouter();
  const [saved, setSaved] = useState(listing.is_saved ?? false);
  const [busy, setBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(listing.is_wishlisted ?? false);
  const [wishBusy, setWishBusy] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const price = Math.round(listing.price / 100);
  const cur = symOf(listing.currency ?? "INR");

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    if (busy) return;
    const next = !saved;
    setSaved(next);              // optimistic
    setBusy(true);
    try { await api.post(`/listings/${listing.id}/save`); }
    catch { setSaved(!next); }
    finally { setBusy(false); }
  }

  // Wishlist the underlying item/SKU (DF-24) — distinct from the save heart:
  // adds a status="wishlist" copy to your collection + alerts you when a matching
  // listing is posted (POST /items/{item_id}/wishlist).
  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (wishBusy) return;
    const next = !wishlisted;
    setWishlisted(next);         // optimistic
    setWishBusy(true);
    try { await api.post(`/items/${listing.item_id}/wishlist`); }
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
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--card-shadow-lifted)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--card-shadow)"; }}
      style={{
        background: "var(--card-surface)",
        border: `1px solid ${listing.is_mine ? "var(--verified-teal)" : "var(--slate-200)"}`,
        borderRadius: 16, overflow: "hidden", textAlign: "left",
        padding: 0, display: "flex", flexDirection: "column",
        boxShadow: "var(--card-shadow)", transition: "transform 150ms var(--ease-out), box-shadow 150ms",
      }}
    >
      <div style={{ position: "relative" }}>
        <ProductPhoto tone="ink" src={listing.cover_url} ratio="1/1" rounded={0} />
        <div
          onClick={toggleSave}
          style={{
            position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 10,
            background: saved ? "rgba(255,36,66,0.80)" : "rgba(15,23,42,0.46)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--paper)", cursor: busy ? "default" : "pointer", transition: "background 150ms",
          }}
        >
          <Heart size={16} fill={saved ? "var(--stamp-red)" : "none"} />
        </div>
        {!listing.is_mine && (
          <div
            onClick={toggleWishlist}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            style={{
              position: "absolute", bottom: 8, right: 8, width: 30, height: 30, borderRadius: 9,
              background: wishlisted ? "rgba(255,36,66,0.85)" : "rgba(15,23,42,0.46)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.20)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--paper)", cursor: wishBusy ? "default" : "pointer", transition: "background 150ms",
            }}
          >
            <Bookmark size={14} strokeWidth={wishlisted ? 0 : 1.75} fill={wishlisted ? "currentColor" : "none"} />
          </div>
        )}
        {listing.is_mine && listing.status === "available" && (
          <div style={{ position: "absolute", top: 8, left: 8 }}><Badge variant="teal">Just listed</Badge></div>
        )}
        {!listing.is_mine && listing.status !== "available" && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <Badge variant={listing.status === "sold" ? "success" : "warning"}>{statusLabel(listing.status)}</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: "11px 12px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.25, color: "var(--ink)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", minHeight: 32,
        }}>
          {listing.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
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
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2, height: 34,
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
  const { day, month } = shortDate(event.starts_at);
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
          <MapPin size={13} strokeWidth={2} style={{ flexShrink: 0 }} /> {event.mode === "online" ? "Online" : event.venue ?? event.city}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--slate-400)" }}>
            <Clock size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
            {new Date(event.starts_at).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
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
    <div style={{ ...CARD_BASE, padding: "16px 18px" }}>
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
  const [busy, setBusy] = useState(false);

  async function toggleJoin() {
    if (busy) return;
    const next = !joined;
    setJoined(next);             // optimistic
    setBusy(true);
    try {
      if (next) await api.post(`/communities/${community.id}/join`);
      else await api.delete(`/communities/${community.id}/join`);
    } catch { setJoined(!next); }
    finally { setBusy(false); }
  }

  const tone = community.tone || "plum";
  const toneVar = tone.startsWith("var(--") ? tone : `var(--${tone})`;

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--card-surface)", border: "1px solid var(--slate-200)", borderRadius: 16, padding: 14, boxShadow: "var(--card-shadow)" }}>
      <Link href={`/community/${community.id}`} className="shrink-0">
        <div style={{
          width: 50, height: 50, borderRadius: 12,
          background: toneVar, color: "var(--paper)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em",
        }}>
          {community.tag ?? "🏷️"}
        </div>
      </Link>
      <Link href={`/community/${community.id}`} style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{community.name}</span>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {community.is_invite_only && <Badge variant="secondary">Private</Badge>}
            {community.status === "pending" && <Badge variant="warning">Under review</Badge>}
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-mute)", margin: "3px 0 4px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {community.short_desc ?? community.description}
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--slate-400)", fontFamily: "var(--font-mono)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Users size={11} />{community.member_count.toLocaleString()}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MessageSquare size={11} />{community.post_count.toLocaleString()}</span>
        </div>
      </Link>
      <Button size="sm" variant={joined ? "secondary" : "dark"} onClick={toggleJoin} disabled={busy}>
        {joined ? "Joined" : community.is_invite_only ? "Request" : "Join"}
      </Button>
    </div>
  );
}
