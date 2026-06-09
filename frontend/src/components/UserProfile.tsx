"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, BarChart3, CalendarDays, Images, Eye, EyeOff,
  Settings, MessageCircle, Plus, Shield, MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser, useUser } from "@/lib/auth-context";
import {
  Avatar, TierChip, Money, Segmented, ProductPhoto, VerifyBadge,
  Tag, Stars, EmptyNote, TrustSignals,
} from "@/components/ui";
import { PostCard, CommunityCard, type ApiPost, type ApiCommunity } from "@/components/cards";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { FollowListModal } from "@/components/FollowListModal";
import { AddToCollectionSheet } from "@/components/AddToCollectionSheet";

/* ── Types ──────────────────────────────────────────────────────── */

interface ProfileUser {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  tier: string;
  interests: string[];
  deals_count: number;
  rating: number;
  rating_count: number;
  followers_count: number;
  following_count: number;
  active_listings_count: number;
  verified_items_count: number;
  portfolio_value: number; // paise
  is_following?: boolean;
}

interface CollectionItem {
  id: string;
  sku: string | null;
  custom_title: string | null;
  status: string;
  verify_tier: string;
  value: number; // paise
  is_listed: boolean;
  photo_count: number;
}

interface RawPost {
  id: string;
  type: string;
  body: string;
  images: string[];
  category: string | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
}

interface TradeDeal {
  id: string;
  direction: string;
  deal_type: string;
  item: string;
  with: { handle: string; name: string; avatar_url: string | null };
  when: string | null;
  rating: number | null;
  vouched: boolean;
}

type Tab = "collection" | "posts" | "communities" | "trades";
type CollView = "grid" | "chart" | "calendar" | "collage";

/* ── SKU → category / tone (no catalogue join on the web yet) ────── */

const SKU_CAT: Record<string, { key: string; label: string; tone: string }> = {
  FIG: { key: "figures", label: "Action Figures", tone: "red" },
  KIT: { key: "kits", label: "Kits & Lego", tone: "forest" },
  DSN: { key: "designer", label: "Designer Toys", tone: "plum" },
  DCS: { key: "diecast", label: "Diecast", tone: "teal" },
};
function skuPrefix(sku: string | null): string {
  const m = (sku ?? "").match(/SKU-([A-Z]+)-/);
  return m ? m[1] : "";
}
function catForItem(it: CollectionItem) {
  return SKU_CAT[skuPrefix(it.sku)] ?? { key: "other", label: "Other", tone: "bone" };
}
function titleForItem(it: CollectionItem): string {
  return it.custom_title || it.sku || "Item";
}
const paiseToRupees = (p: number) => Math.round(p / 100);

/* ── Main component ─────────────────────────────────────────────── */

interface UserProfileProps {
  handle: string;
  isOwn: boolean;
}

export function UserProfile({ handle, isOwn }: UserProfileProps) {
  const router = useRouter();
  const { user: authUser, setUser } = useUser();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("collection");
  const [posts, setPosts] = useState<RawPost[] | null>(null);
  const [collection, setCollection] = useState<CollectionItem[] | null>(null);
  const [communities, setCommunities] = useState<ApiCommunity[] | null>(null);
  const [trades, setTrades] = useState<TradeDeal[] | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);
  const [showAddCollection, setShowAddCollection] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ProfileUser>(`/users/${handle}`);
      setProfile(data);
      setIsFollowing(data.is_following ?? false);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadTab = useCallback(async (t: Tab) => {
    if (t === "posts" && posts === null) {
      const data = await api.get<{ items: RawPost[] }>(`/users/${handle}/posts`).catch(() => ({ items: [] }));
      setPosts(data.items);
    } else if (t === "collection" && collection === null) {
      const data = await api.get<{ items: CollectionItem[] }>(`/users/${handle}/collection`).catch(() => ({ items: [] }));
      setCollection(data.items);
    } else if (t === "communities" && communities === null) {
      const data = await api.get<{ items: ApiCommunity[] }>(`/users/${handle}/communities`).catch(() => ({ items: [] }));
      setCommunities(data.items);
    } else if (t === "trades" && trades === null) {
      const data = await api.get<{ items: TradeDeal[] }>(`/users/${handle}/deals`).catch(() => ({ items: [] }));
      setTrades(data.items);
    }
  }, [handle, posts, collection, communities, trades]);

  useEffect(() => {
    if (!loading) loadTab(tab);
  }, [tab, loading, loadTab]);

  async function toggleFollow() {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${profile.handle}/follow`);
        setIsFollowing(false);
        setProfile((p) => (p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p));
      } else {
        await api.post(`/users/${profile.handle}/follow`);
        setIsFollowing(true);
        setProfile((p) => (p ? { ...p, followers_count: p.followers_count + 1 } : p));
      }
    } catch {
      /* ignore */
    }
    setFollowLoading(false);
  }

  async function startMessage() {
    if (!profile) return;
    try {
      const t = await api.post<{ id: string }>("/threads", { other_user_id: profile.id });
      router.push(`/chat/${t.id}`);
    } catch {
      /* ignore */
    }
  }

  function handleProfileSaved(updated: AuthUser) {
    setUser(updated);
    setProfile((p) => (p ? { ...p, ...updated } : p));
  }

  function handleCollectionAdded() {
    setCollection(null); // force reload
  }

  /* ── Derived header stats ──────────────────────────────────────── */
  const ownedItems = useMemo(
    () => (collection ?? []).filter((i) => i.status === "owned"),
    [collection]
  );
  const portfolioRupees = collection
    ? paiseToRupees(ownedItems.reduce((s, i) => s + i.value, 0))
    : paiseToRupees(profile?.portfolio_value ?? 0);

  /* ── Render ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{ padding: "18px 16px" }}>
        <div className="flex items-start gap-3.5 animate-pulse">
          <div className="w-[68px] h-[68px] rounded-full bg-[var(--bone-deep)]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-40 rounded bg-[var(--bone-deep)]" />
            <div className="h-3.5 w-28 rounded bg-[var(--bone)]" />
            <div className="h-3.5 w-48 rounded bg-[var(--bone)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--ink-faint)]">User not found.</p>
      </div>
    );
  }

  const isTrusted = profile.tier === "top_seller" || profile.tier === "trusted";

  const TABS: { id: Tab; label: string }[] = [
    { id: "collection", label: "Collection" },
    { id: "posts", label: "Posts" },
    { id: "communities", label: "Communities" },
    { id: "trades", label: "Trades" },
  ];

  return (
    <>
      {/* Identity header */}
      <div style={{ padding: "18px 16px 0" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-[68px] h-[68px] rounded-full object-cover"
              />
            ) : (
              <Avatar name={profile.name} size={68} verified={isTrusted} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 21,
                  letterSpacing: "-0.02em",
                }}
              >
                {profile.name}
              </span>
              {profile.tier && <TierChip tier={profile.tier} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>@{profile.handle}</span>
              {profile.city && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, color: "var(--ink-faint)" }}>
                  <MapPin size={12} /> {profile.city}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <Stat n={profile.followers_count} l="followers" onClick={() => setShowFollowModal("followers")} />
              <Stat n={profile.following_count} l="following" onClick={() => setShowFollowModal("following")} />
            </div>
          </div>
        </div>

        {profile.bio && (
          <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 12 }}>
            {profile.bio}
          </div>
        )}

        {/* ownership stats */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "4px 8px",
            marginTop: 10,
            fontSize: 12.5,
            color: "var(--ink-mute)",
          }}
        >
          <span>
            <b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{ownedItems.length}</b> owned
          </span>
          <span style={{ color: "var(--ink-ghost)" }}>·</span>
          <span>
            <b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{profile.verified_items_count}</b> verified
          </span>
          <span style={{ color: "var(--ink-ghost)" }}>·</span>
          <span>
            portfolio <b style={{ color: "var(--ink)" }}><Money value={portfolioRupees} /></b>
          </span>
        </div>

        {/* trust signals */}
        <div
          style={{
            background: "var(--paper-soft)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "14px 16px",
            marginTop: 14,
          }}
        >
          <TrustSignals
            deals={profile.deals_count}
            rating={profile.rating}
            ratingCount={profile.rating_count}
            response={profile.active_listings_count > 0 ? `${profile.active_listings_count}` : null}
          />
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
          {isOwn ? (
            <>
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-[var(--ink)] text-[var(--paper)] hover:opacity-90 transition-opacity"
              >
                Edit profile
              </button>
              <button
                onClick={() => setShowAddCollection(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border border-[var(--border-strong)] text-[var(--ink)] bg-[var(--paper-soft)] hover:bg-[var(--bone)] transition-colors"
              >
                <Plus size={16} /> Add item
              </button>
              <button
                onClick={() => router.push("/settings")}
                title="Settings"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--ink-mute)] bg-[var(--paper-soft)] hover:bg-[var(--bone)] transition-colors"
              >
                <Settings size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={
                  "flex-1 px-5 py-2 rounded-full text-sm font-semibold border transition-colors disabled:opacity-60 " +
                  (isFollowing
                    ? "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink)] hover:bg-[var(--bone-deep)]"
                    : "bg-[var(--ink)] border-transparent text-[var(--paper)] hover:opacity-90")
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={startMessage}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-[var(--stamp-red)] text-white hover:bg-[var(--stamp-red-deep)] transition-colors"
              >
                <MessageCircle size={16} /> Message
              </button>
              <button
                title="Trade vouch needs a confirmed deal first"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--ink-mute)] bg-[var(--paper-soft)]"
              >
                <Shield size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          background: "var(--paper)",
          padding: "16px 16px 10px",
          marginTop: 14,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Segmented<Tab> value={tab} onChange={setTab} options={TABS} />
      </div>

      {/* Tab content */}
      <div style={{ padding: "14px 16px 28px" }}>
        {tab === "collection" && (
          <CollectionTab items={collection} verifiedCount={profile.verified_items_count} isOwn={isOwn} />
        )}

        {tab === "posts" && (
          <PostsTab posts={posts} profile={profile} isOwn={isOwn} />
        )}

        {tab === "communities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {communities === null ? (
              <SkeletonRows />
            ) : communities.length === 0 ? (
              <EmptyNote>Not in any community yet.</EmptyNote>
            ) : (
              communities.map((c) => <CommunityCard key={c.id} community={c} />)
            )}
          </div>
        )}

        {tab === "trades" && <TradesTab trades={trades} />}
      </div>

      {/* Overlays */}
      {showEdit && isOwn && authUser && (
        <EditProfileSheet user={authUser} onClose={() => setShowEdit(false)} onSaved={handleProfileSaved} />
      )}
      {showFollowModal && (
        <FollowListModal handle={profile.handle} tab={showFollowModal} onClose={() => setShowFollowModal(null)} />
      )}
      {showAddCollection && isOwn && (
        <AddToCollectionSheet onClose={() => setShowAddCollection(false)} onAdded={handleCollectionAdded} />
      )}
    </>
  );
}

/* ── Stat (tappable follower/following count) ───────────────────── */
function Stat({ n, l, onClick }: { n: number; l: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 5,
        background: "none",
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>
        {n.toLocaleString("en-IN")}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{l}</span>
    </button>
  );
}

/* ── Collection tab (grid / chart / calendar / collage) ─────────── */
function CollectionTab({ items, verifiedCount, isOwn }: { items: CollectionItem[] | null; verifiedCount: number; isOwn: boolean }) {
  const [seg, setSeg] = useState<"owned" | "wishlist" | "preorder">("owned");
  const [view, setView] = useState<CollView>("grid");
  const [vis, setVis] = useState<Record<CollView, "public" | "private">>({
    grid: "public", chart: "public", calendar: "public", collage: "private",
  });

  if (items === null) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-[var(--bone-deep)] animate-pulse" />
        ))}
      </div>
    );
  }

  const owned = items.filter((i) => i.status !== "wishlist");
  const ownedValue = paiseToRupees(items.filter((i) => i.status === "owned").reduce((s, i) => s + i.value, 0));
  const filtered = items.filter((i) => i.status === seg);

  const views: { id: CollView; icon: React.ReactNode; label: string }[] = [
    { id: "grid", icon: <LayoutGrid size={15} />, label: "Grid" },
    { id: "chart", icon: <BarChart3 size={15} />, label: "Chart" },
    { id: "calendar", icon: <CalendarDays size={15} />, label: "Calendar" },
    { id: "collage", icon: <Images size={15} />, label: "Collage" },
  ];
  const isPrivate = vis[view] === "private";
  const hiddenFromViewer = !isOwn && isPrivate;

  return (
    <div>
      {/* portfolio value cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <ValueCard label="Portfolio value" value={ownedValue} accent="var(--stamp-red)" />
        <ValueCard label="Verified items" value={verifiedCount} plain accent="var(--verified-teal)" />
      </div>

      {/* view switcher + per-view visibility */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
          {views.map((v) => {
            const on = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                  background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                  fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {v.icon}
                {v.label}
              </button>
            );
          })}
        </div>
        {isOwn && (
          <button
            onClick={() => setVis((s) => ({ ...s, [view]: isPrivate ? "public" : "private" }))}
            title="Toggle who can see this view"
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0, cursor: "pointer",
              border: "1px solid var(--border-strong)",
              background: isPrivate ? "var(--bone)" : "var(--paper-soft)",
              color: isPrivate ? "var(--ink-faint)" : "var(--verified-teal)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {hiddenFromViewer ? (
        <div style={{ textAlign: "center", padding: "34px 0", color: "var(--ink-faint)" }}>
          <EyeOff size={26} style={{ color: "var(--ink-ghost)", margin: "0 auto" }} />
          <div style={{ fontSize: 13.5, marginTop: 8 }}>This view is private.</div>
        </div>
      ) : (
        <>
          {isOwn && isPrivate && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 12 }}>
              <EyeOff size={14} /> Only you can see this view.
            </div>
          )}

          {view === "grid" && (
            <>
              <Segmented
                value={seg}
                onChange={setSeg}
                options={[
                  { id: "owned", label: "Owned" },
                  { id: "wishlist", label: "Wishlist" },
                  { id: "preorder", label: "Pre-order" },
                ]}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
                {filtered.map((it) => <ItemTile key={it.id} item={it} />)}
              </div>
              {filtered.length === 0 && (
                <EmptyNote>{isOwn ? "Nothing here yet — add from the catalogue." : "Private or empty."}</EmptyNote>
              )}
            </>
          )}

          {view === "chart" && <PortfolioChart items={owned} />}
          {view === "calendar" && <PortfolioCalendar items={items} />}
          {view === "collage" && <PortfolioCollage items={owned} />}
        </>
      )}
    </div>
  );
}

function ValueCard({ label, value, accent, plain }: { label: string; value: number; accent: string; plain?: boolean }) {
  return (
    <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px" }}>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 19, color: accent, fontFeatureSettings: '"tnum" 1' }}>
        {plain ? value : <Money value={value} />}
      </div>
    </div>
  );
}

function ItemTile({ item }: { item: CollectionItem }) {
  const c = catForItem(item);
  return (
    <div
      style={{
        background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13,
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ position: "relative" }}>
        <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label={c.label} />
        <div style={{ position: "absolute", top: 7, left: 7 }}>
          <VerifyBadge tier={item.verify_tier} />
        </div>
        {item.is_listed && <div style={{ position: "absolute", top: 7, right: 7 }}><Tag kind="sale">Listed</Tag></div>}
        {item.status === "preorder" && <div style={{ position: "absolute", bottom: 7, left: 7 }}><Tag kind="po">PO</Tag></div>}
      </div>
      <div style={{ padding: "8px 9px 10px" }}>
        <div
          style={{
            fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, color: "var(--ink)",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31,
          }}
        >
          {titleForItem(item)}
        </div>
        <div style={{ fontSize: 12.5, marginTop: 5, color: "var(--ink-mute)" }}>
          <Money value={paiseToRupees(item.value)} />
        </div>
      </div>
    </div>
  );
}

function PortfolioChart({ items }: { items: CollectionItem[] }) {
  const byCat: Record<string, { count: number; value: number; label: string; tone: string }> = {};
  items.forEach((i) => {
    const c = catForItem(i);
    byCat[c.key] = byCat[c.key] || { count: 0, value: 0, label: c.label, tone: c.tone };
    byCat[c.key].count++;
    byCat[c.key].value += i.value;
  });
  const tokenTone: Record<string, string> = {
    red: "var(--stamp-red)", forest: "var(--forest)", plum: "var(--plum)", teal: "var(--verified-teal)", bone: "var(--ink-mute)",
  };
  const rows = Object.values(byCat).sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map((v) => v.value));
  if (rows.length === 0) return <EmptyNote>No items to chart yet.</EmptyNote>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 2px" }}>
      {rows.map((v) => (
        <div key={v.label}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{v.label}</span>
            <span style={{ fontSize: 12.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
              {v.count} · <Money value={paiseToRupees(v.value)} />
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "var(--bone)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: Math.max(6, Math.round((v.value / max) * 100)) + "%",
                background: tokenTone[v.tone] || "var(--ink)",
                borderRadius: 999,
                transition: "width 320ms var(--ease-out)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioCalendar({ items }: { items: CollectionItem[] }) {
  const pos = items.filter((i) => i.status === "preorder");
  if (pos.length === 0) return <EmptyNote>No pre-orders on the calendar.</EmptyNote>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pos.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex", gap: 12, alignItems: "center", background: "var(--paper-soft)",
            border: "1px solid var(--border)", borderRadius: 13, padding: 12,
          }}
        >
          <div
            style={{
              width: 46, height: 46, borderRadius: 10, background: "var(--grail-gold-soft)",
              color: "var(--grail-gold-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <CalendarDays size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{titleForItem(it)}</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, fontFamily: "var(--font-mono)" }}>Ordered · ETA TBD</div>
          </div>
          <Tag kind="po">PO</Tag>
        </div>
      ))}
    </div>
  );
}

function PortfolioCollage({ items }: { items: CollectionItem[] }) {
  if (items.length === 0) return <EmptyNote>Nothing to show off yet.</EmptyNote>;
  return (
    <div style={{ columnCount: 2, columnGap: 8 }}>
      {items.map((it, i) => {
        const c = catForItem(it);
        const ratio = ["3/4", "1/1", "4/5", "1/1"][i % 4];
        return (
          <div key={it.id} style={{ width: "100%", marginBottom: 8, breakInside: "avoid", display: "inline-block" }}>
            <ProductPhoto tone={c.tone} ratio={ratio} rounded={12} label={c.label} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Posts tab ──────────────────────────────────────────────────── */
function PostsTab({ posts, profile, isOwn }: { posts: RawPost[] | null; profile: ProfileUser; isOwn: boolean }) {
  if (posts === null) return <SkeletonRows />;
  if (posts.length === 0) {
    return <EmptyNote>{isOwn ? "You haven't posted yet. Tap Add item to showcase a piece." : "No posts yet."}</EmptyNote>;
  }
  // The per-user posts endpoint omits author fields; the author is this profile.
  const enriched: ApiPost[] = posts.map((p) => ({
    id: p.id,
    user_id: profile.id,
    handle: profile.handle,
    name: profile.name,
    avatar_url: profile.avatar_url,
    tier: profile.tier,
    type: p.type,
    body: p.body,
    images: p.images,
    category: p.category,
    community_id: null,
    review_rating: null,
    poll_options: null,
    is_admin_post: false,
    likes_count: p.likes_count,
    comments_count: p.comments_count,
    saves_count: p.saves_count,
    created_at: p.created_at,
  }));
  return (
    <div style={{ margin: "0 -16px" }}>
      {enriched.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}

/* ── Trades tab ─────────────────────────────────────────────────── */
function TradesTab({ trades }: { trades: TradeDeal[] | null }) {
  if (trades === null) return <SkeletonRows />;
  if (trades.length === 0) return <EmptyNote>No confirmed trades yet.</EmptyNote>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {trades.map((d, i) => (
        <div
          key={d.id}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
            borderBottom: i < trades.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          {d.with.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.with.avatar_url} alt={d.with.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <Avatar name={d.with.name} size={40} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
              {d.direction} · {d.item}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              with @{d.with.handle}
              {d.when ? ` · ${new Date(d.when).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            {d.rating != null && <Stars n={d.rating} size={12} />}
            {d.vouched && <Tag kind="vouch" style={{ fontSize: 9 }}>Vouched</Tag>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared skeleton ────────────────────────────────────────────── */
function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-[var(--border)] space-y-2 animate-pulse">
          <div className="h-3.5 w-3/4 rounded bg-[var(--bone)]" />
          <div className="h-3.5 w-1/2 rounded bg-[var(--bone)]" />
        </div>
      ))}
    </div>
  );
}
