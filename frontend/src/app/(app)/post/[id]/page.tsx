"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Send } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { ApiPost } from "@/components/cards";
import { Avatar, Stars, PostTypeTag, ProductPhoto, SectionLabel } from "@/components/ui";

interface Comment {
  id: string;
  user_id: string;
  handle: string | null;
  name: string | null;
  body: string;
  created_at: string;
}

interface PostDetail extends ApiPost {
  comments?: Comment[];
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<{ name: string; body: string; time: string }[]>([]);

  useEffect(() => {
    api.get<PostDetail>(`/posts/${id}`)
      .then((p) => {
        setPost(p);
        setLiked(p.is_liked ?? false);
        setSaved(p.is_saved ?? false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const send = () => {
    if (draft.trim()) {
      setExtra((x) => [...x, { name: "You", body: draft.trim(), time: "just now" }]);
      setDraft("");
    }
  };

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

  const comments = post.comments ?? [];
  const totalComments = comments.length + extra.length;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-20">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/feed" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Post</span>
        </div>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href={`/profile/${post.handle}`}>
              <Avatar name={post.name ?? "?"} size={40} />
            </Link>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{post.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{post.handle} · {timeAgo(post.created_at)}</div>
            </div>
          </div>
          <PostTypeTag type={post.type as "showcase" | "discussion" | "review"} />
        </div>

        {post.type === "review" && post.review_rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Stars n={post.review_rating} />
            <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{post.review_rating}/5 build quality</span>
          </div>
        )}

        <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)", marginBottom: 14, whiteSpace: "pre-wrap" }}>{post.body}</div>

        {post.images.length > 0 && (
          <div style={{ marginBottom: 14, borderRadius: 13, overflow: "hidden" }}>
            <img src={post.images[0]} alt="" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 480 }} />
          </div>
        )}
        {post.images.length === 0 && post.type === "showcase" && (
          <div style={{ marginBottom: 14 }}>
            <ProductPhoto tone="teal" ratio="3/2" />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 20px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setLiked((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: liked ? "var(--stamp-red)" : "var(--ink-mute)" }}>
          <Heart size={21} fill={liked ? "currentColor" : "none"} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{post.likes_count + (liked ? 1 : 0)}</span>
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--ink-mute)" }}>
          <MessageCircle size={21} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{totalComments}</span>
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--ink-mute)" }}>
          <Share2 size={20} />
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setSaved((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: saved ? "var(--ink)" : "var(--ink-mute)" }}>
          <Bookmark size={21} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div style={{ padding: "16px 20px 24px" }}>
        <SectionLabel>{totalComments} comments</SectionLabel>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((cm) => (
            <div key={cm.id} style={{ display: "flex", gap: 10 }}>
              <Avatar name={cm.name ?? "?"} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{cm.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{timeAgo(cm.created_at)}</span>
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 2 }}>{cm.body}</div>
              </div>
            </div>
          ))}
          {extra.map((cm, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <Avatar name={cm.name} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{cm.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{cm.time}</span>
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 2 }}>{cm.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 245, right: 0, maxWidth: 680, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "10px 20px 18px", display: "flex", gap: 9, alignItems: "center", zIndex: 20 }}>
        <Avatar name="You" size={32} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Add a comment…"
          style={{ flex: 1, height: 40, padding: "0 14px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }}
        />
        <button onClick={send} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "none", background: draft.trim() ? "var(--stamp-red)" : "var(--bone)", color: draft.trim() ? "var(--paper)" : "var(--ink-ghost)", cursor: "pointer", flexShrink: 0 }}>
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
