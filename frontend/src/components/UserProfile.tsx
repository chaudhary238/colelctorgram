"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, BarChart3, CalendarDays, Eye, EyeOff,
  Gift, MessageCircle, Plus, ShieldCheck, Star, Camera,
  MoreHorizontal, UserCheck, UserPlus, Check, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser, useUser } from "@/lib/auth-context";
import {
  Avatar, Money, Segmented, ProductPhoto, VerifyBadge,
  Tag, EmptyNote, Button, IconButton,
} from "@/components/ui";
import { PostCard, CommunityCard, type ApiPost, type ApiCommunity } from "@/components/cards";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { FollowListModal } from "@/components/FollowListModal";
import { VouchGiveSheet, VouchListModal, VouchRequestModal } from "@/components/VouchSheets";
import { ProfileMoreMenu } from "@/components/ProfileMoreMenu";
import { RewardCard, BadgeShelf, TopSeasonBadge, AvatarFrame } from "@/components/gamification";

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
  rating: number;
  rating_count: number;
  followers_count: number;
  following_count: number;
  active_listings_count: number;
  verified_items_count: number;
  portfolio_value: number; // paise
  is_following?: boolean;
  // Vouches (DF-36a)
  vouches_received_count: number;
  vouches_given_count: number;
  my_vouch?: { relation: string | null; note: string | null } | null;
  vouch_requested?: boolean;
  // Presence (DF-36a) — last_active_at, null when the profile hides it
  last_active_at?: string | null;
  // Per-view Collection visibility (eye toggle) — {grid,chart,calendar: public|private}
  collection_view_privacy?: Record<string, "public" | "private">;
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
  image_url?: string | null;
  preorder_eta?: string | null;
  is_wishlisted?: boolean;
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


type Tab = "collection" | "posts" | "communities";
type CollView = "grid" | "chart" | "calendar";

/* Presence label from last_active_at (DF-36a) — "Online now" within 5 min. */
function presenceLabel(iso: string | null | undefined): { text: string; online: boolean } | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 5) return { text: "Online now", online: true };
  if (mins < 60) return { text: `Active ${mins}m ago`, online: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `Active ${hrs}h ago`, online: false };
  const days = Math.floor(hrs / 24);
  return { text: `Active ${days}d ago`, online: false };
}

/* ── SKU → category / tone (no catalogue join on the web yet) ────── */

const SKU_CAT: Record<string, { key: string; label: string; tone: string }> = {
  FIG: { key: "figures", label: "Action Figures", tone: "red" },
  KIT: { key: "kits", label: "Kits & Lego", tone: "forest" },
  DSN: { key: "designer", label: "Designer & Blind Boxes", tone: "plum" },
  DCS: { key: "diecast", label: "Diecast", tone: "teal" },
  TCG: { key: "tcg", label: "Trading Cards", tone: "gold" },
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
// Compact stat counts (1.2k) like v3's compactNum; small counts stay exact.
const compactNum = (n: number) =>
  n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k" : (n || 0).toLocaleString("en-IN");

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);
  const [showVouchGive, setShowVouchGive] = useState(false);
  const [showVouchList, setShowVouchList] = useState<"received" | "given" | null>(null);
  const [showVouchRequest, setShowVouchRequest] = useState(false);
  const [showMore, setShowMore] = useState(false);

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

  // Deep-link from Settings: /profile?edit=profile|avatar opens the edit sheet (DF-22/23);
  // /profile?vouch=request opens the vouch-request flow (v4 Settings "Vouches & endorsements").
  // /profile?show=following opens the Following list (Rewards "Vouch for a collector" earn row).
  useEffect(() => {
    if (!isOwn || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit")) {
      setShowEdit(true);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (params.get("vouch") === "request") {
      setShowVouchRequest(true);
      window.history.replaceState(null, "", window.location.pathname);
    } else if (params.get("show") === "following" || params.get("show") === "followers") {
      setShowFollowModal(params.get("show") as "following" | "followers");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [isOwn]);

  // Deep-link from a chat's "Leave a vouch" CTA (DV6-07): /profile/<handle>?vouch=give
  // opens the give-vouch sheet on another collector's profile.
  useEffect(() => {
    if (isOwn || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("vouch") === "give") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link read on mount
      setShowVouchGive(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [isOwn]);

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
    }
  }, [handle, posts, collection, communities]);

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

  // Optimistic vouch state (give / edit / remove) — keeps the CTA + In count truthful.
  function handleVouchSaved(next: { relation: string; note: string } | null) {
    setProfile((p) => {
      if (!p) return p;
      const had = !!p.my_vouch;
      const delta = next && !had ? 1 : !next && had ? -1 : 0;
      return { ...p, my_vouch: next, vouches_received_count: Math.max(0, p.vouches_received_count + delta) };
    });
  }

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

  // v4 shows presence for everyone incl. `you` ('Online now'). On the own profile
  // we know the viewer is online; for others derive from last_active_at.
  const presence = isOwn ? { text: "Online now", online: true } : presenceLabel(profile.last_active_at);
  const firstName = profile.name.split(" ")[0];

  const TABS: { id: Tab; label: string }[] = [
    { id: "collection", label: "Collection" },
    { id: "posts", label: "Posts" },
    { id: "communities", label: "Communities" },
  ];

  const avatarEl = profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatar_url} alt={profile.name} className="rounded-full object-cover" style={{ width: 76, height: 76 }} />
  ) : (
    <Avatar name={profile.name} size={76} />
  );

  return (
    <>
      {/* Identity header */}
      <div style={{ padding: "18px 16px 0" }}>
        {/* avatar + 3 key stat tiles */}
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <div style={{ position: "relative" }}>
              {isOwn ? (
                <button
                  onClick={() => setShowEdit(true)}
                  aria-label="Change profile photo"
                  style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", display: "block" }}
                >
                  {avatarEl}
                  <span style={{ position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: "var(--stamp-red)", color: "var(--paper)", border: "2.5px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={13} />
                  </span>
                </button>
              ) : avatarEl}
              {/* v3 §2.2: gold avatar frame for Pioneers & Early Believers */}
              <AvatarFrame handle={profile.handle} />
              {/* the user's top season badge as a corner medallion */}
              <TopSeasonBadge handle={profile.handle} />
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "space-around", alignItems: "flex-start" }}>
            <StatTop n={profile.followers_count} label="Followers" onClick={() => setShowFollowModal("followers")} />
            <StatTop n={profile.vouches_received_count} label="Vouches" onClick={() => setShowVouchList("received")} />
          </div>
        </div>

        {/* name + handle + presence + bio */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.025em", color: "var(--ink)" }}>{profile.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--slate-400)" }}>
                @{profile.handle}{profile.city ? ` · ${profile.city}` : ""}
              </span>
              {presence && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: presence.online ? "var(--forest)" : "var(--ink-ghost)" }} />
                  <span style={{ fontSize: 12, color: presence.online ? "var(--forest)" : "var(--ink-faint)", fontWeight: presence.online ? 600 : 400 }}>{presence.text}</span>
                </span>
              )}
            </div>
          </div>
          {!isOwn && (
            <IconButton icon={<MoreHorizontal size={18} />} onClick={() => setShowMore(true)} />
          )}
        </div>
        {profile.bio && (
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 7 }}>{profile.bio}</div>
        )}

        {/* Season-badge shelf (GM-14) — hidden when the user has none */}
        <div><BadgeShelf handle={profile.handle} /></div>

        {/* 4-up follow + vouch stat card */}
        <div style={{ display: "flex", alignItems: "stretch", background: "var(--card-surface)", border: "1px solid var(--slate-200)", borderRadius: 16, marginTop: 14, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
          <StatTile icon={<UserCheck size={15} />} n={profile.followers_count} l="Followers" onClick={() => setShowFollowModal("followers")} />
          <StatDivider />
          <StatTile icon={<UserPlus size={15} />} n={profile.following_count} l="Following" onClick={() => setShowFollowModal("following")} />
          <StatDivider />
          <StatTile icon={<ShieldCheck size={15} />} accent="var(--verified-teal)" n={profile.vouches_received_count} l="Vouches In" onClick={() => setShowVouchList("received")} />
          <StatDivider />
          <StatTile icon={<ShieldCheck size={15} />} accent="var(--verified-teal)" n={profile.vouches_given_count} l="Vouches Out" onClick={() => setShowVouchList("given")} />
        </div>

        {/* Request a vouch — own profile only */}
        {isOwn && (
          <button
            onClick={() => setShowVouchRequest(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", marginTop: 8, padding: "10px 13px", borderRadius: 11, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", cursor: "pointer", textAlign: "left" }}
          >
            <ShieldCheck size={16} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--verified-teal)" }}>Request a vouch</span>
              <span style={{ fontSize: 12, color: "var(--verified-teal)", opacity: 0.75, marginLeft: 6 }}>Ask collectors who know you</span>
            </span>
            <ChevronRight size={15} style={{ color: "var(--verified-teal)", opacity: 0.7, flexShrink: 0 }} />
          </button>
        )}

        {/* Collector rank card (GM-15) — own card adds "Earn points"; shows the
            rank ladder progress + any First Start badge */}
        <RewardCard handle={profile.handle} isMe={isOwn} />

        {/* actions */}
        {isOwn ? (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button variant="dark" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowEdit(true)}>Edit profile</Button>
            {/* Single add flow: the v6 mode→search→form page (/add/catalogue), not the old v4 sheet */}
            <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} icon={<Plus size={17} />} onClick={() => router.push("/add/catalogue")}>Add item</Button>
            <IconButton icon={<Gift size={18} />} onClick={() => router.push("/refer")} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            <div style={{ display: "flex", gap: 9 }}>
              <Button variant={isFollowing ? "secondary" : "dark"} style={{ flex: 1, justifyContent: "center" }} disabled={followLoading} onClick={toggleFollow}>
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="dark" style={{ flex: 1, justifyContent: "center" }} icon={<MessageCircle size={16} />} onClick={startMessage}>Message</Button>
            </div>
            <Button
              variant={profile.my_vouch ? "secondary" : "teal"}
              style={{ width: "100%", justifyContent: "center", ...(profile.my_vouch ? { borderColor: "var(--verified-teal)", color: "var(--verified-teal)" } : null) }}
              icon={profile.my_vouch ? <Check size={17} /> : <ShieldCheck size={17} />}
              onClick={() => setShowVouchGive(true)}
            >
              {profile.my_vouch ? "Vouched · Edit" : `Vouch for ${firstName}`}
            </Button>
          </div>
        )}
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
          <CollectionTab items={collection} isOwn={isOwn} viewPrivacy={profile.collection_view_privacy} />
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

      </div>

      {/* Overlays */}
      {showEdit && isOwn && authUser && (
        <EditProfileSheet user={authUser} onClose={() => setShowEdit(false)} onSaved={handleProfileSaved} />
      )}
      {showFollowModal && (
        <FollowListModal handle={profile.handle} tab={showFollowModal} onClose={() => setShowFollowModal(null)} />
      )}
      {showVouchGive && !isOwn && (
        <VouchGiveSheet
          targetHandle={profile.handle}
          targetName={profile.name}
          existing={profile.my_vouch ?? null}
          onClose={() => setShowVouchGive(false)}
          onSaved={handleVouchSaved}
        />
      )}
      {showVouchList && (
        <VouchListModal handle={profile.handle} mode={showVouchList} onClose={() => setShowVouchList(null)} />
      )}
      {showVouchRequest && isOwn && (
        <VouchRequestModal myHandle={profile.handle} onClose={() => setShowVouchRequest(false)} />
      )}
      {showMore && !isOwn && (
        <ProfileMoreMenu
          targetId={profile.id}
          targetHandle={profile.handle}
          targetName={profile.name}
          avatarUrl={profile.avatar_url}
          onClose={() => setShowMore(false)}
          onBlocked={() => router.push("/feed")}
        />
      )}
    </>
  );
}

/* ── Top stat tile (Followers / Vouches) ─────────────────────────── */
const STAT_TOP_META: Record<string, { emoji: string; bg: string }> = {
  Followers: { emoji: "👥", bg: "var(--sky-soft)" },
  Vouches: { emoji: "🛡️", bg: "rgba(139,92,246,0.10)" },
};
function StatTop({ n, label, onClick }: { n: number; label: string; onClick?: () => void }) {
  const meta = STAT_TOP_META[label] ?? { emoji: "•", bg: "var(--paper-soft)" };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        background: "none", border: "none", padding: "4px 10px", cursor: onClick ? "pointer" : "default",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
      }}
    >
      <span style={{ width: 38, height: 38, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 1 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{meta.emoji}</span>
      </span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--slate-900)", lineHeight: 1, letterSpacing: "-0.04em" }}>{compactNum(n)}</span>
      <span style={{ fontSize: 9.5, fontWeight: 300, color: "var(--slate-400)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>{label}</span>
    </button>
  );
}

/* ── 4-up stat tile (Followers / Following / Vouches In·Out) ─────── */
function StatTile({ icon, n, l, accent, onClick }: { icon: React.ReactNode; n: number; l: string; accent?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
        background: "none", border: "none", padding: "14px 4px", cursor: onClick ? "pointer" : "default",
      }}
      title={(n || 0).toLocaleString("en-IN")}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: accent || "var(--ink-mute)" }}>
        {icon}
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--ink)", fontFeatureSettings: '"tnum" 1', lineHeight: 1 }}>{compactNum(n)}</span>
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, textAlign: "center", color: "var(--ink-faint)", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{l}</span>
    </button>
  );
}

function StatDivider() {
  return <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "11px 0" }} />;
}

/* ── Collection tab (grid / chart / calendar / collage) ─────────── */
function CollectionTab({ items, isOwn, viewPrivacy }: { items: CollectionItem[] | null; isOwn: boolean; viewPrivacy?: Record<string, "public" | "private"> }) {
  // DV6-11e — v6 drops the Wishlist segment and adds "DB Contributions" (status:'intel').
  const [seg, setSeg] = useState<"owned" | "preorder" | "intel">("owned");
  const [view, setView] = useState<CollView>("grid");
  // Seed per-view visibility from the server (eye toggle is persisted in
  // privacy_prefs.collection_views). Falls back to public.
  const [vis, setVis] = useState<Record<CollView, "public" | "private">>({
    grid: viewPrivacy?.grid ?? "public",
    chart: viewPrivacy?.chart ?? "public",
    calendar: viewPrivacy?.calendar ?? "public",
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

  // "owned" set powers Portfolio Value/count + the chart — exclude wishlist AND intel (DV6-11f),
  // otherwise unowned DB-contribution items would inflate the portfolio.
  const owned = items.filter((i) => i.status !== "wishlist" && i.status !== "intel");
  const ownedValue = paiseToRupees(items.filter((i) => i.status === "owned").reduce((s, i) => s + i.value, 0));
  const filtered = items.filter((i) => i.status === seg);

  const views: { id: CollView; icon: React.ReactNode; label: string }[] = [
    { id: "grid", icon: <LayoutGrid size={15} />, label: "Grid" },
    { id: "chart", icon: <BarChart3 size={15} />, label: "Chart" },
    { id: "calendar", icon: <CalendarDays size={15} />, label: "PO Calendar" },
  ];
  const isPrivate = vis[view] === "private";
  const hiddenFromViewer = !isOwn && isPrivate;

  return (
    <div>
      {/* portfolio value cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <ValueCard label="Portfolio Value" value={ownedValue} accent="var(--stamp-red)" />
        <ValueCard label="Items Owned" value={owned.length} plain accent="var(--ink)" />
      </div>

      {/* view switcher + per-view visibility */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flex: 1 }}>
          {views.map((v) => {
            const on = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 8px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                  background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                  fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap",
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
            onClick={() => {
              const next: "public" | "private" = isPrivate ? "public" : "private";
              setVis((s) => ({ ...s, [view]: next })); // optimistic
              api.patch("/users/me/collection-privacy", { view, visibility: next }).catch(() => {
                setVis((s) => ({ ...s, [view]: isPrivate ? "private" : "public" })); // revert
              });
            }}
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
                  { id: "preorder", label: "Pre-order" },
                  { id: "intel", label: "DB Contributions" },
                ]}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
                {filtered.map((it) => <ItemTile key={it.id} item={it} isOwn={isOwn} />)}
              </div>
              {filtered.length === 0 && (
                <EmptyNote>
                  {seg === "intel"
                    ? (isOwn ? "No DB contributions yet — add an item that's new to Scorred to help the community." : "No DB contributions yet.")
                    : (isOwn ? "Nothing here yet — add from the catalogue." : "Private or empty.")}
                </EmptyNote>
              )}
            </>
          )}

          {view === "chart" && <PortfolioChart items={owned} />}
          {view === "calendar" && <PortfolioCalendar items={items} />}
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

function ItemTile({ item, isOwn }: { item: CollectionItem; isOwn: boolean }) {
  const router = useRouter();
  const c = catForItem(item);
  const [wishlisted, setWishlisted] = useState(!!item.is_wishlisted);
  const [busy, setBusy] = useState(false);

  async function toggleWishlist(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    try {
      const res = await api.post<{ wishlisted: boolean }>(`/items/${item.id}/wishlist`);
      setWishlisted(res.wishlisted);
    } catch {
      setWishlisted(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={() => router.push(`/item/${item.id}`)}
      role="button"
      tabIndex={0}
      style={{
        background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13,
        overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer",
      }}
    >
      <div style={{ position: "relative" }}>
        {item.image_url ? (
          <div style={{ aspectRatio: "1/1", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={titleForItem(item)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ) : (
          <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} label={c.label} />
        )}
        <div style={{ position: "absolute", top: 7, left: 7 }}>
          <VerifyBadge tier={item.verify_tier} />
        </div>
        {item.is_listed && <div style={{ position: "absolute", top: 7, right: 7 }}><Tag kind="sale">Listed</Tag></div>}
        {item.status === "preorder" && <div style={{ position: "absolute", bottom: 7, left: 7 }}><Tag kind="po">PO</Tag></div>}
        {/* Wishlist-for-others button — only on someone else's collection (DF-24).
            Icon law (2026-07-11): Star = wishlist; Bookmark is save-content only. */}
        {!isOwn && (
          <button
            onClick={toggleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={wishlisted ? "Remove from your wishlist" : "Add to your wishlist"}
            style={{
              position: "absolute", bottom: 7, right: 7, width: 28, height: 28, borderRadius: 7,
              border: "none", cursor: busy ? "wait" : "pointer",
              background: wishlisted ? "var(--stamp-red)" : "rgba(20,17,15,0.52)", color: "var(--paper)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Star size={14} fill={wishlisted ? "currentColor" : "none"} strokeWidth={wishlisted ? 0 : 1.75} />
          </button>
        )}
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

// SVG donut by category value — converted from design ProfileCollection PortfolioChart.
function PortfolioChart({ items }: { items: CollectionItem[] }) {
  const byCat: Record<string, { count: number; value: number; label: string; tone: string }> = {};
  items.forEach((i) => {
    const c = catForItem(i);
    byCat[c.key] = byCat[c.key] || { count: 0, value: 0, label: c.label, tone: c.tone };
    byCat[c.key].count++;
    byCat[c.key].value += i.value;
  });
  const tokenTone: Record<string, string> = {
    red: "var(--stamp-red)", forest: "var(--forest)", plum: "var(--plum)", teal: "var(--verified-teal)", gold: "var(--grail-gold)", bone: "var(--ink-mute)",
  };
  const rows = Object.values(byCat).sort((a, b) => b.value - a.value);
  if (rows.length === 0) return <EmptyNote>No items to chart yet.</EmptyNote>;

  const total = rows.reduce((s, v) => s + v.value, 0) || 1;
  const totalCount = rows.reduce((s, v) => s + v.count, 0);
  const cx = 100, cy = 100, R = 76, ir = 44;
  // Cumulative start fraction per slice, computed purely (no closure mutation
  // during render — react-hooks/immutability).
  const START = -Math.PI / 2;
  const pcts = rows.map((v) => v.value / total);
  const offsets = pcts.map((_, i) => pcts.slice(0, i).reduce((s, x) => s + x, 0));
  const slices = rows.map((v, idx) => {
    const pct = pcts[idx];
    const sweep = pct * 2 * Math.PI;
    const sa = START + offsets[idx] * 2 * Math.PI;
    const ea = sa + sweep;
    let pathD: string;
    if (pct > 0.9999) {
      pathD = `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx} ${cy + R} A ${R} ${R} 0 1 1 ${cx} ${cy - R} M ${cx} ${cy - ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy + ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy - ir} Z`;
    } else {
      const lg = sweep > Math.PI ? 1 : 0;
      const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa);
      const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea);
      const xi1 = cx + ir * Math.cos(sa), yi1 = cy + ir * Math.sin(sa);
      const xi2 = cx + ir * Math.cos(ea), yi2 = cy + ir * Math.sin(ea);
      pathD = `M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${lg} 0 ${xi1} ${yi1} Z`;
    }
    return { ...v, pct, pathD };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          <circle cx={cx} cy={cy} r={(R + ir) / 2} fill="none" stroke="var(--bone)" strokeWidth={R - ir + 1} />
          {slices.map((s) => (
            <path key={s.label} d={s.pathD} style={{ fill: tokenTone[s.tone] || "var(--ink-mute)" }} stroke="var(--paper)" strokeWidth={2.5} />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 700, fill: "var(--ink)" }}>{totalCount}</text>
          <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontFamily: "var(--font-body)", fontSize: "11px", fill: "var(--ink-faint)" }}>items</text>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "0 2px" }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: tokenTone[s.tone] || "var(--ink-mute)", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{s.count} · {Math.round(s.pct * 100)}%</span>
            <span style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "var(--font-mono)", minWidth: 76, textAlign: "right" }}>
              <Money value={paiseToRupees(s.value)} />
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Portfolio value</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--stamp-red)" }}><Money value={paiseToRupees(total)} /></span>
      </div>
    </div>
  );
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// Best-effort parse of a free-text ETA ("March 2026", "Q1 2026", "12 Mar 2026") into a
// {monthIdx, year, day} so pre-orders can be grouped by month like the design. Falls
// back to an "Upcoming" bucket when no month is recognisable.
function parseEta(eta?: string | null): { key: string; label: string; monthIdx: number | null; day: string | null } {
  if (!eta) return { key: "zzz-upcoming", label: "Upcoming", monthIdx: null, day: null };
  const lower = eta.toLowerCase();
  // DV4-03c: TBD pre-orders group under "Date to be announced", sorted last.
  if (lower.includes("to be announced") || lower === "tbd" || lower === "tba") {
    return { key: "zzz-tbd", label: "Date to be announced", monthIdx: null, day: null };
  }
  const monthIdx = MONTH_NAMES.findIndex((m, i) => lower.includes(m.toLowerCase()) || lower.includes(MONTH_SHORT[i].toLowerCase()));
  const yearMatch = eta.match(/(20\d{2})/);
  const year = yearMatch ? yearMatch[1] : "";
  const dayMatch = eta.match(/\b([0-3]?\d)\b/);
  if (monthIdx >= 0) {
    return {
      key: `${year || "0000"}-${String(monthIdx).padStart(2, "0")}`,
      label: `${MONTH_NAMES[monthIdx]}${year ? " " + year : ""}`,
      monthIdx,
      day: dayMatch ? dayMatch[1] : null,
    };
  }
  // Quarter window ("Q3 2026") — bucket by its first month so it sorts chronologically.
  const qMatch = lower.match(/q([1-4])/);
  if (qMatch) {
    const q = Number(qMatch[1]);
    return {
      key: `${year || "0000"}-${String((q - 1) * 3).padStart(2, "0")}q`,
      label: `Q${q}${year ? " " + year : ""}`,
      monthIdx: null,
      day: null,
    };
  }
  // Bare year ("2026") — sorts after that year's dated windows.
  if (year) {
    return { key: `${year}-99`, label: year, monthIdx: null, day: null };
  }
  // Anything else keeps its own bucket (don't merge distinct free-text ETAs).
  return { key: `zzz-${lower}`, label: eta, monthIdx: null, day: null };
}

// Pre-orders grouped by month — converted from design ProfileCollection PortfolioCalendar.
function PortfolioCalendar({ items }: { items: CollectionItem[] }) {
  const pos = items.filter((i) => i.status === "preorder");
  if (pos.length === 0) return <EmptyNote>No pre-orders on the calendar.</EmptyNote>;

  const grouped: Record<string, { label: string; monthIdx: number | null; items: { it: CollectionItem; day: string | null }[] }> = {};
  pos.forEach((it) => {
    const p = parseEta(it.preorder_eta);
    grouped[p.key] = grouped[p.key] || { label: p.label, monthIdx: p.monthIdx, items: [] };
    grouped[p.key].items.push({ it, day: p.day });
  });
  const keys = Object.keys(grouped).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {keys.map((key) => {
        const g = grouped[key];
        return (
          <div key={key}>
            {/* Month header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ background: "var(--grail-gold)", color: "var(--ink)", borderRadius: 7, padding: "4px 11px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {g.label}
              </div>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                {g.items.length} item{g.items.length !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {g.items.map(({ it, day }) => (
                <div key={it.id} style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: "hidden", border: "1px solid var(--grail-gold)", display: "flex", flexDirection: "column" }}>
                    <div style={{ background: "var(--grail-gold)", textAlign: "center", fontSize: 8, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.07em", padding: "3px 0", lineHeight: 1 }}>
                      {g.monthIdx != null ? MONTH_SHORT[g.monthIdx] : "PO"}
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--grail-gold-soft)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: day ? 17 : 13, color: "var(--grail-gold-deep)", lineHeight: 1 }}>
                      {day || "~"}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titleForItem(it)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 3 }}>On order</div>
                    <div style={{ fontSize: 11.5, color: "var(--grail-gold-deep)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{it.preorder_eta || "ETA TBD"}</div>
                  </div>
                  <Tag kind="po">PO</Tag>
                </div>
              ))}
            </div>
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
