"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, MessageCircle, Share2, Bookmark, Flag } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { ApiPost, PollBlock, CommentThread, ISOCard, PostImages, refTone } from "@/components/cards";
import { BackButton } from "@/components/BackButton";
import { ReportSheet } from "@/components/ReportSheet";
import { useUser } from "@/lib/auth-context";
import { Avatar, Stars, ProductPhoto, SealMark, Badge } from "@/components/ui";
import { patchFeedSnapshotPost } from "@/lib/feedSnapshot";

interface Comment {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  avatar_url?: string | null;
  body: string;
  created_at: string;
}

// `ref` (the tagged item/listing) and its tone helper now live on ApiPost /
// in cards.tsx, shared with the feed's Tagged-item chip (v8).
interface PostDetail extends ApiPost {
  comments?: Comment[];
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [post, setPost] = useState<PostDetail | null>(null);
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
      // Keep the feed's restore snapshot honest, or going Back shows the pre-like
      // count while this page shows the new one (QA 2026-08-05 §3).
      patchFeedSnapshotPost(id, { is_liked: next, likes_count: likes + (next ? 1 : -1) });
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
      patchFeedSnapshotPost(id, { is_saved: next });
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
          {/* v8 PostDetail — ISO posts read "Wanted" in the header. */}
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>{post.type === "iso" ? "Wanted" : "Post"}</span>
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

      {post.type === "iso" ? (
        /* v8 PostDetail:18 — an ISO detail IS the real ISOCard (teal "Wanted" ribbon,
           plum border, Looking-for block, chips, "I have this"), thread below. */
        <>
          <div style={{ paddingTop: 16 }}>
            <ISOCard post={post} detail />
          </div>
          <CommentThread postId={id} onCountChange={setCommentCount} />
        </>
      ) : (
        <>
          <div style={{ padding: "16px 20px 0" }}>
            {/* v8 PostDetail — the author row carries NO post-type tag; the page
                header already names the surface. */}
            {/* Staff posts speak as Scorred (QA 2026-08-04 §4) — seal, Official tag, no
                handle and no link through to the admin's personal profile. */}
            {post.is_official ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <SealMark size={40} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Scorred</span>
                    <Badge style={{ background: "var(--slate-800)", color: "var(--paper)", borderRadius: 5, fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 7px" }}>
                      Official
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{timeAgo(post.created_at)}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
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
                {/* v8 PostDetail:36 — the placeholder's watermark is the brand. */}
                <ProductPhoto tone="teal" ratio="3/2" label={post.ref_sku_brand ?? undefined} />
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
                  {/* v8 PostDetail:45 — plain "view item" line; SKUs never surface. */}
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                    {post.ref.kind === "listing" ? "view listing" : "view item"}
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
        </>
      )}
    </div>
  );
}
