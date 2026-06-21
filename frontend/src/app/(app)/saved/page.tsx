"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { PostCard, ApiPost } from "@/components/cards";

export default function SavedPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ items: ApiPost[] }>("/users/me/saved?limit=30")
      .then((d) => setPosts(d?.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-[600px] min-h-screen border-r border-[var(--border)]">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "14px 16px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
          Saved
        </span>
      </div>

      {loading ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ padding: "64px 20px", textAlign: "center", color: "var(--ink-faint)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Bookmark size={36} strokeWidth={1.5} style={{ color: "var(--ink-ghost)" }} />
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-mute)" }}>No saved posts yet</div>
          <div style={{ fontSize: 13 }}>Tap the bookmark on any post to save it here.</div>
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
