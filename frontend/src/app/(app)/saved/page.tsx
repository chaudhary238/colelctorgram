"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Star, Edit3, X } from "lucide-react";
import { api } from "@/lib/api";
import { PostCard, ApiPost } from "@/components/cards";
import { Segmented, ProductPhoto } from "@/components/ui";
import { formatMoney } from "@/lib/catalog";

// The Stash — one home for everything you've kept (taxonomy 2026-07-11; named
// "Stash" by founder pick, route stays /saved): Posts = saved content (Bookmark);
// Wishlist = items you might want someday (Star). Wishlist lives HERE, not in the
// profile Collection — the collection is what you own (DV6-11e). The saved-Listings
// tab was dropped (QA 8.1) since listing "Save" was removed (QA 11.5).

type Tab = "posts" | "wishlist";

interface WishItem {
  id: string;
  sku: string | null;
  title: string;
  brand: string | null;
  category: string | null;
  value: number;
  thumbnail_url: string | null;
}

function Empty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div style={{ padding: "64px 20px", textAlign: "center", color: "var(--ink-faint)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {icon}
      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-mute)" }}>{title}</div>
      <div style={{ fontSize: 13 }}>{hint}</div>
    </div>
  );
}

export default function SavedPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [wishlist, setWishlist] = useState<WishItem[] | null>(null);
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  // Lazy-load each tab on first open.
  useEffect(() => {
    if (tab === "posts" && posts === null) {
      api.get<{ items: ApiPost[] }>("/users/me/saved?limit=30")
        .then((d) => setPosts(d?.items ?? [])).catch(() => setPosts([]));
    }
    if (tab === "wishlist" && wishlist === null) {
      api.get<{ items: WishItem[] }>("/items/wishlist")
        .then((d) => setWishlist(d?.items ?? [])).catch(() => setWishlist([]));
    }
  }, [tab, posts, wishlist]);

  async function removeWish(w: WishItem) {
    if (removing[w.id]) return;
    setRemoving((r) => ({ ...r, [w.id]: true }));
    try {
      await api.delete(`/items/${w.id}`);
      setWishlist((cur) => (cur ?? []).filter((x) => x.id !== w.id));
    } catch {
      setRemoving((r) => ({ ...r, [w.id]: false }));
    }
  }

  const loadingBlock = <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Loading…</div>;

  return (
    <div className="w-full max-w-[680px] min-h-screen border-r border-[var(--border)] bg-[var(--canvas)]">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "14px 16px 12px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
          Stash
        </span>
        <div style={{ marginTop: 10 }}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { id: "posts", label: "Posts" },
              { id: "wishlist", label: "Wishlist" },
            ]}
          />
        </div>
      </div>

      {tab === "posts" && (
        posts === null ? loadingBlock : posts.length === 0 ? (
          <Empty
            icon={<Bookmark size={36} strokeWidth={1.5} style={{ color: "var(--ink-ghost)" }} />}
            title="No saved posts yet"
            hint="Tap the bookmark on any post to save it here."
          />
        ) : posts.map((p) => <PostCard key={p.id} post={p} />)
      )}

      {tab === "wishlist" && (
        wishlist === null ? loadingBlock : (
          <div style={{ padding: "12px 14px 24px" }}>
            {/* Escalation nudge: wishlist = casual intent; ISO = active pursuit. */}
            <Link
              href="/compose?type=iso"
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", marginBottom: 12,
                borderRadius: 14, background: "var(--card-surface)", border: "1px dashed var(--border-strong)",
                boxShadow: "var(--shadow-sm)", textDecoration: "none",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--stamp-red)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Edit3 size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Actively hunting one of these?</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Post an ISO on the Market board — sellers come to you.</div>
              </div>
            </Link>

            {wishlist.length === 0 ? (
              <Empty
                icon={<Star size={36} strokeWidth={1.5} style={{ color: "var(--ink-ghost)" }} />}
                title="Your wishlist is empty"
                hint="Tap the star on any item or Scorred DB entry you might want someday."
              />
            ) : wishlist.map((w) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, marginBottom: 8, borderRadius: 14, background: "var(--card-surface)", border: "1px solid var(--slate-200)", boxShadow: "var(--shadow-sm)" }}>
                <Link href={w.sku ? `/db/${encodeURIComponent(w.sku)}` : `/item/${w.id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textDecoration: "none" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                    <ProductPhoto tone="ink" src={w.thumbnail_url} ratio="1/1" rounded={10} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[w.brand, w.value > 0 ? `est. ${formatMoney(w.value)}` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => removeWish(w)}
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-faint)", cursor: "pointer", flexShrink: 0 }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
