"use client";

import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Star } from "lucide-react";
import { MOCK_POSTS, timeAgo } from "@/lib/mock";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────── */

interface FeedPost {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  type: string;
  body: string;
  images: string[];
  category: string | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  review_rating?: number;
}

/* ── Type badge ─────────────────────────────────────────────────── */

const TYPE_STYLES: Record<string, string> = {
  showcase: "bg-[var(--grail-gold-soft)] text-[var(--grail-gold-deep)]",
  discussion: "bg-[var(--forest-soft)] text-[var(--forest)]",
  review: "bg-[var(--plum-soft)] text-[var(--plum)]",
};

/* ── FeedCard ────────────────────────────────────────────────────── */

function FeedCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const [saves, setSaves] = useState(post.saves_count);

  function toggleLike() {
    setLiked((v) => {
      setLikes((n) => n + (v ? -1 : 1));
      return !v;
    });
  }

  function toggleSave() {
    setSaved((v) => {
      setSaves((n) => n + (v ? -1 : 1));
      return !v;
    });
  }

  const initials = post.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[var(--stamp-red-soft)] flex items-center justify-center text-[var(--stamp-red)] font-bold text-sm shrink-0 select-none overflow-hidden">
          {post.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.avatar_url} alt={post.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[var(--ink)]">{post.name}</span>
            <span className="text-xs text-[var(--ink-faint)]">@{post.handle}</span>
            <span className="text-xs text-[var(--ink-ghost)]">·</span>
            <span className="text-xs text-[var(--ink-faint)]">{timeAgo(post.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
              TYPE_STYLES[post.type] ?? TYPE_STYLES.discussion
            )}>
              {post.type}
            </span>
            {post.category && (
              <span className="text-[10px] text-[var(--ink-faint)] capitalize">{post.category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-[var(--ink-soft)] leading-relaxed whitespace-pre-line mb-3">
        {post.body}
      </p>

      {/* Image */}
      {post.images.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-3 border border-[var(--border)] bg-[var(--bone-deep)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.images[0]}
            alt=""
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      {/* Review stars */}
      {post.type === "review" && (
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className={i < 4 ? "fill-[var(--grail-gold)] text-[var(--grail-gold)]" : "text-[var(--bone-deep)]"}
              strokeWidth={1.5}
            />
          ))}
          <span className="text-xs text-[var(--ink-faint)] ml-1">4 / 5</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-2">
        <button
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            liked ? "text-[var(--stamp-red)]" : "text-[var(--ink-faint)] hover:text-[var(--stamp-red)]"
          )}
        >
          <Heart
            size={16}
            strokeWidth={1.8}
            className={cn("transition-all", liked && "fill-[var(--stamp-red)]")}
          />
          <span>{likes.toLocaleString()}</span>
        </button>

        <button className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
          <MessageCircle size={16} strokeWidth={1.8} />
          <span>{post.comments_count.toLocaleString()}</span>
        </button>

        <button
          onClick={toggleSave}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors ml-auto",
            saved ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
          )}
        >
          <Bookmark
            size={16}
            strokeWidth={1.8}
            className={cn("transition-all", saved && "fill-[var(--ink)]")}
          />
          <span>{saves.toLocaleString()}</span>
        </button>
      </div>
    </article>
  );
}

/* ── Feed filter bar ─────────────────────────────────────────────── */

const FILTERS = [
  { id: "all", label: "For you" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits" },
  { id: "diecast", label: "Diecast" },
];

/* ── Page ────────────────────────────────────────────────────────── */

export default function FeedPage() {
  const [filter, setFilter] = useState("all");

  const posts = (filter === "all"
    ? MOCK_POSTS
    : MOCK_POSTS.filter((p) => p.category === filter)) as FeedPost[];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Home
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 px-4 overflow-x-auto pb-0 border-t border-[var(--border)]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium shrink-0 border-b-2 transition-colors",
                filter === f.id
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-mute)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div>
        {posts.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)] text-center py-16">No posts in this category yet.</p>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
