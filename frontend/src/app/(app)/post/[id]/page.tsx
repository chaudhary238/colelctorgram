"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, MessageCircle, Share2, Bookmark, Flag } from "lucide-react";
import { api } from "@/lib/api";
import { ApiPost, ActionBtn, AuthorLine, PollBlock, CommentThread, ISOCard, PostImages, refTone } from "@/components/cards";
import { BackButton } from "@/components/BackButton";
import { ReportSheet } from "@/components/ReportSheet";
import { ShareSheet } from "@/components/ShareSheet";
import { useUser } from "@/lib/auth-context";
import { Stars, ProductPhoto } from "@/components/ui";
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
  // GET /posts/{id} only — the author's role in the post's community, for the
  // ADMIN/MOD chip in the detail AuthorLine (v8 PostDetail.jsx:27).
  author_role?: "admin" | "mod" | null;
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
  // DV8 §2#2 — share opens the branded ShareSheet (v8 Overlays.jsx:716), replacing
  // the old direct navigator.share / silent-clipboard handler.
  const [sharing, setSharing] = useState(false);
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
          {/* v8 PostDetail — ISO posts read "Wanted" in the header.
              Title 19/700 display (v8 Chrome.jsx:83 DetailHeader); 20px gutters stay. */}
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em", lineHeight: 1.15, flex: 1 }}>{post.type === "iso" ? "Wanted" : "Post"}</span>
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
      {sharing && (
        <ShareSheet
          url={`${window.location.origin}/post/${id}`}
          label="post"
          title={post.title ?? "Scorred"}
          // QA #35 — untitled posts shared the literal word "Scorred"; use the
          // author + a body snippet so the message says what it links to.
          text={post.title ?? [post.handle ? `@${post.handle} on Scorred` : null, post.body?.slice(0, 120) || null].filter(Boolean).join(": ")}
          onClose={() => setSharing(false)}
        />
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
            {/* v8 PostDetail.jsx:27 — the SAME AuthorLine as the feed: 38px avatar,
                name, rewards-badge pill, community byline, ADMIN/MOD chip, and the
                Scorred-Official switch for staff posts (all inside AuthorLine). The
                author row carries NO post-type tag — the header names the surface. */}
            <AuthorLine post={post} authorRole={post.author_role ?? null} />

            {post.type === "review" && post.review_rating && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 0" }}>
                <Stars n={post.review_rating} />
                <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{post.review_rating}/5 build quality</span>
              </div>
            )}

            {/* v8 PostDetail.jsx:34 — body margin '12px 0' */}
            <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)", margin: "12px 0", whiteSpace: "pre-wrap" }}>{post.body}</div>

            {/* QA 5.1 — same swipeable carousel as the feed for multi-photo posts. */}
            {post.images.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <PostImages images={post.images} />
              </div>
            )}
            {post.images.length === 0 && post.type === "showcase" && (
              <div style={{ marginBottom: 14 }}>
                {/* v8 PostDetail:36 — the placeholder's watermark is the brand.
                    tone stays "teal": the post payload carries no tone field
                    (audit §1#44) — switch to `post.tone ?? "teal"` if the
                    serializer ever grows one. */}
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

          {/* v8 PostDetail.jsx:52-57 — the shared ActionBtn treatment (inactive
              slate-400, active fill/weight + burst), margin '6px 0'; 20px web
              gutters kept (deliberate over v8's 16). */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 20px", margin: "6px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <ActionBtn icon={<Heart size={21} />} label={likes} active={liked} onClick={toggleLike} />
            <ActionBtn icon={<MessageCircle size={21} />} label={commentCount} />
            <ActionBtn icon={<Share2 size={20} />} onClick={() => setSharing(true)} />
            <div style={{ flex: 1 }} />
            <ActionBtn icon={<Bookmark size={21} />} active={saved} activeColor="var(--ink)" onClick={toggleSave} />
          </div>

          {/* Rich thread — likes, replies & @mentions on each comment (QA 5.2). */}
          <CommentThread postId={id} onCountChange={setCommentCount} />
        </>
      )}
    </div>
  );
}
