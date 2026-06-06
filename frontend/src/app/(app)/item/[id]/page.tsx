"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Camera, Bell, Tag, MoreHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { VerifyBadge, ProductPhoto, Money, SectionLabel } from "@/components/ui";

interface ApiItem {
  id: string;
  user_id: string;
  sku: string | null;
  custom_title: string | null;
  status: string;
  verify_tier: string;
  value: number;
  is_listed: boolean;
  photo_count: number;
  privacy: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  owned: "In collection",
  wishlist: "Wishlist",
  preorder: "Pre-order",
};

const TONES = ["teal", "plum", "forest", "gold", "red", "ink"];

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishAlert, setWishAlert] = useState(false);

  useEffect(() => {
    api.get<ApiItem>(`/items/${id}`)
      .then((i) => setItem(i))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !item) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "1/1", background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
      </div>
    );
  }

  const title = item.custom_title ?? item.sku ?? "Item";
  const tone = TONES[parseInt(id, 16) % TONES.length] ?? "teal";
  const isOwned = item.status === "owned";
  const isWish = item.status === "wishlist";
  const isPreorder = item.status === "preorder";

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-20">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/profile" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Item detail</span>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "none", cursor: "pointer" }}>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <ProductPhoto tone={tone} ratio="1/1" rounded={0} label={item.photo_count > 0 ? `${item.photo_count} photos` : "catalogue reference"} />

      {item.photo_count > 0 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 4px" }}>
          {Array.from({ length: Math.min(item.photo_count, 6) }).map((_, i) => (
            <div key={i} style={{ width: i === 0 ? 18 : 7, height: 7, borderRadius: 999, background: i === 0 ? "var(--ink)" : "var(--bone-deep)" }} />
          ))}
        </div>
      )}

      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          <VerifyBadge tier={item.verify_tier} size="lg" />
          {item.status !== "owned" && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: isWish ? "var(--plum)" : "var(--grail-gold)", color: "var(--paper)" }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          )}
          {item.is_listed && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--stamp-red)", color: "var(--paper)" }}>
              Listed
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>
          {title}
        </h1>
        {item.sku && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 14 }}>
            SKU {item.sku}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {item.value > 0 && (
            <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>
                {isWish ? "Est. market value" : "Est. value"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18 }}>
                <Money value={Math.round(item.value / 100)} />
              </div>
            </div>
          )}
          <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Ownership</div>
            <VerifyBadge tier={item.verify_tier} size="lg" />
          </div>
        </div>

        {isPreorder && (
          <div style={{ background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 13, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--grail-gold-deep)", fontWeight: 600, fontSize: 13.5 }}>
              Pre-order timeline
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 6 }}>Estimated shipping in a few weeks</div>
          </div>
        )}

        {isOwned && item.verify_tier !== "verified" && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", background: "var(--paper-soft)", border: "1px dashed var(--border-strong)", borderRadius: 13, padding: 13, marginBottom: 16, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Verify ownership to list it</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Capture an in-app photo + challenge shot. Listings need Verified.</div>
            </div>
          </div>
        )}

        <SectionLabel>About this item</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", marginTop: 10, marginBottom: 20 }}>
          {isWish
            ? "On your wishlist — we'll notify you when a seller lists this."
            : isPreorder
            ? "Pre-ordered. We'll notify you when it ships."
            : "In your collection."}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 245, right: 0, maxWidth: 680, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "12px 20px 20px", zIndex: 20 }}>
        {isOwned ? (
          item.is_listed ? (
            <Link href="/market" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--ink)", textDecoration: "none", gap: 8 }}>
              Manage listing
            </Link>
          ) : (
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              <Tag size={18} />Sell / Trade this item
            </button>
          )
        ) : isWish ? (
          <button onClick={() => setWishAlert((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: wishAlert ? "var(--bone)" : "var(--verified-teal)", color: wishAlert ? "var(--ink)" : "var(--paper)", border: wishAlert ? "1px solid var(--border-strong)" : "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Bell size={17} />
            {wishAlert ? "Alert on" : "Notify when listed"}
          </button>
        ) : (
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, borderRadius: 13, background: "var(--ink)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Add to my collection
          </button>
        )}
      </div>
    </div>
  );
}
