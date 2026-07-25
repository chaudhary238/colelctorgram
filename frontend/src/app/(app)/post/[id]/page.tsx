"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2, Bookmark, Tag as TagIcon, MapPin, MessageSquare, Flag } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { ApiPost, PollBlock, CommentThread, PostImages } from "@/components/cards";
import { BackButton } from "@/components/BackButton";
import { ReportSheet } from "@/components/ReportSheet";
import { useUser } from "@/lib/auth-context";
import { Avatar, Stars, PostTypeTag, ProductPhoto } from "@/components/ui";

interface Comment {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  avatar_url?: string | null;
  body: string;
  created_at: string;
}

interface PostRef {
  kind: "item" | "listing";
  id: string;
  sku: string | null;
  title: string;
  price?: number;
}

interface PostDetail extends ApiPost {
  comments?: Comment[];
  ref?: PostRef | null;
}

// SKU prefix → ProductPhoto tone (no catalogue join on web yet)
const REF_TONE: Record<string, string> = { FIG: "red", KIT: "forest", DSN: "plum", DCS: "teal" };
function refTone(sku: string | null): string {
  const m = (sku ?? "").match(/SKU-([A-Z]+)-/);
  return (m && REF_TONE[m[1]]) || "ink";
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [dmBusy, setDmBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [reporting, setReporting] = useState(false); // W-48
  const [shared, setShared] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    api.get<PostDetail>(`/posts/${id}`)
      .then((p) => {
        setPost(p);
        setLiked(p.is_liked ?? false);
        setSaved(p.is_saved ?? false);
        setLikes(p.likes_count ?? 0);
        setCommentCount(p.comments_count ?? (p.comments?.length ?? 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleLike() {
    if (likeBusy) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    setLikeBusy(true);
    try {
      await api.post(`/posts/${id}/like`);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSave() {
    if (saveBusy) return;
    const next = !saved;
    setSaved(next);
    setSaveBusy(true);
    try {
      await api.post(`/posts/${id}/save`);
    } catch {
      setSaved(!next);
    } finally {
      setSaveBusy(false);
    }
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Scorred", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1600);
      }
    } catch {
      /* cancelled */
    }
  }

  // "I have this" — open a DM to the ISO author with the wanted item as context.
  async function haveThis() {
    if (dmBusy || !post) return;
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

  if (loading || !post) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bone)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "40%", height: 13, borderRadius: 6, background: "var(--bone)", marginBottom: 6 }} />
            <div style={{ width: "60%", height: 11, borderRadius: 6, background: "var(--bone)" }} />
          </div>
        </div>
        <div style={{ height: 16, borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
        <div style={{ height: 16, borderRadius: 6, background: "var(--bone)", width: "80%" }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-20">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/feed" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Post</span>
          {user?.id !== post.user_id && (
            /* W-48 — report entry point on post detail */
            <button
              onClick={() => setReporting(true)}
              aria-label="Report post"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)" }}
            >
              <Flag size={17} />
            </button>
          )}
        </div>
      </div>
      {reporting && (
        <ReportSheet targetType="post" targetId={post.id} title="Report post" onClose={() => setReporting(false)} />
      )}

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href={`/profile/${post.handle}`}>
              <Avatar name={post.name ?? "?"} size={40} />
            </Link>
            <div>
              <Link href={`/profile/${post.handle}`} style={{ textDecoration: "none", color: "inherit" }} className="hover:underline">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{post.name}</div>
              </Link>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{post.handle} · {timeAgo(post.created_at)}</div>
            </div>
          </div>
          <PostTypeTag type={post.type as "showcase" | "discussion" | "review" | "iso"} />
        </div>

        {post.type === "iso" && (
          <>
            <div style={{ borderRadius: 16, overflow: "hidden", background: "rgba(232,163,61,0.07)", border: "1.5px solid rgba(232,163,61,0.32)", padding: "14px 16px", position: "relative", marginBottom: 12 }}>
              <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%) rotate(15deg)", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 34, letterSpacing: "0.2em", color: "rgba(176,119,36,0.1)", textTransform: "uppercase", pointerEvents: "none", userSelect: "none" }}>WANTED</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.25, marginBottom: 10, paddingRight: 48 }}>{post.iso_item ?? post.title ?? post.body.slice(0, 60)}</div>
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
            {user?.id !== post.user_id && (
              <button onClick={haveThis} disabled={dmBusy} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--verified-teal)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: dmBusy ? "wait" : "pointer", marginBottom: 14 }}>
                <MessageSquare size={15} />{dmBusy ? "Opening…" : "I have this"}
              </button>
            )}
          </>
        )}

        {post.type === "review" && post.review_rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Stars n={post.review_rating} />
            <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{post.review_rating}/5 build quality</span>
          </div>
        )}

        <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 14, whiteSpace: "pre-wrap" }}>{post.body}</div>

        {/* QA 5.1 — same swipeable carousel as the feed for multi-photo posts. */}
        {post.images.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <PostImages images={post.images} />
          </div>
        )}
        {post.images.length === 0 && post.type === "showcase" && (
          <div style={{ marginBottom: 14 }}>
            <ProductPhoto tone="teal" ratio="3/2" />
          </div>
        )}

        {post.type === "poll" && post.poll_options && (
          <div style={{ margin: "0 -16px 14px" }}>
            <PollBlock postId={post.id} options={post.poll_options} initialVote={post.my_poll_vote} />
          </div>
        )}

        {post.ref && (
          <Link
            href={post.ref.kind === "listing" ? `/listing/${post.ref.id}` : `/item/${post.ref.id}`}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textDecoration: "none", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12, padding: 10, marginBottom: 14 }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
              <ProductPhoto tone={refTone(post.ref.sku)} ratio="1/1" rounded={8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.ref.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                {post.ref.sku ? `${post.ref.sku} · ` : ""}{post.ref.kind === "listing" ? "view listing" : "view item"}
              </div>
            </div>
          </Link>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 20px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={toggleLike} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: liked ? "var(--stamp-red)" : "var(--ink-mute)" }}>
          <Heart size={21} fill={liked ? "currentColor" : "none"} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{likes}</span>
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--ink-mute)" }}>
          <MessageCircle size={21} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{commentCount}</span>
        </button>
        <button onClick={sharePost} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: shared ? "var(--ink)" : "var(--ink-mute)" }}>
          <Share2 size={20} />
          {shared && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>Copied</span>}
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={toggleSave} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: saved ? "var(--ink)" : "var(--ink-mute)" }}>
          <Bookmark size={21} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Rich thread — likes, replies & @mentions on each comment (QA 5.2). */}
      <CommentThread postId={id} onCountChange={setCommentCount} />
    </div>
  );
}
