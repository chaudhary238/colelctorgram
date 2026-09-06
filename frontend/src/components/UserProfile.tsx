"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, BarChart3, CalendarDays, Eye, EyeOff, Clock,
  MessageCircle, CirclePlus, ShieldCheck, Star, Camera, Lock,
  MoreHorizontal, Check, ChevronRight, Menu, SlidersHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { placeLabel } from "@/lib/utils";
import { AuthUser, useUser } from "@/lib/auth-context";
import {
  Avatar, Money, Segmented, ProductPhoto,
  Tag, EmptyNote, Button, IconButton,
} from "@/components/ui";
import { PostCard, type ApiPost } from "@/components/cards";
import { EditProfileSheet } from "@/components/EditProfileSheet";
import { FollowListModal } from "@/components/FollowListModal";
import { VouchGiveSheet, VouchListModal, VouchRequestModal } from "@/components/VouchSheets";
import { ProfileMoreMenu } from "@/components/ProfileMoreMenu";
import { AccountDrawer } from "@/components/AccountDrawer";
import { useUnread } from "@/components/useUnread";
import { RewardCard, BadgeShelf, TopSeasonBadge, AvatarFrame, fireToast } from "@/components/gamification";

/* ── Types ──────────────────────────────────────────────────────── */

interface ProfileUser {
  id: string;
  handle: string;
  name: string;
  bio: string | null;
  city: string | null;
  country: string | null; // DV8 — "City, Country" labels via placeLabel
  avatar_url: string | null;
  interests: string[];
  rating: number;
  rating_count: number;
  followers_count: number;
  following_count: number;
  active_listings_count: number;
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
  /** Server-resolved display name: custom_title → catalogue title → sku (QA §5). */
  title?: string | null;
  brand?: string | null;
  status: string;
  /** paise — null for non-owner viewers (DV8-03: purchase price is private). */
  value: number | null;
  is_listed: boolean;
  photo_count: number;
  image_url?: string | null;
  preorder_eta?: string | null;
  /** date | month | quarter | year | tbd — owner-only (nulled for visitors). "tbd"
      is an ANSWER, not a gap: v8 buckets it under "Date to be announced". */
  preorder_window_precision?: string | null;
  /** paise — owner-only. Drives the PO calendar's "Balance due" line + price gap. */
  preorder_total?: number | null;
  /** v8 :451 — teal NEW DB chip on a DB-contribution tile whose entry the user
      created. NOT sent by the API yet (see NEEDS BACKEND); renders once it is. */
  is_new_to_db?: boolean;
  is_wishlisted?: boolean;
  // DV8-03 completeness + DV8-11 filter fields
  condition?: string | null;
  is_complete?: boolean;
  listing_status?: "available" | "sold" | null;
  /** v8 sold treatment — set by POST /items/{id}/sold (with or without a listing). */
  sold_at?: string | null;
}

/** Sold check (v8): the item's own sold_at stamp OR a listing that closed as sold —
    an offline sale never had a listing, so listing_status alone under-counts. */
const isSoldItem = (i: CollectionItem) => i.sold_at != null || i.listing_status === "sold";

/** DV8-03 — server-computed portfolio summary on GET /users/{h}/collection. */
interface Portfolio {
  item_count: number;
  complete_count: number;
  incomplete_count: number;
  /** paise — null for visitors until the collection is complete (value_shared). */
  value: number | null;
  value_shared: boolean;
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
  // Not sent by GET /users/{h}/posts yet (see NEEDS BACKEND) — passed through so
  // ISO cards ("Looking for") and tagged-item chips light up the moment they are.
  title?: string | null;
  iso_item?: string | null;
  iso_budget?: number | null;
  iso_cond?: string | null;
  iso_city?: string | null;
  ref_sku?: string | null;
  ref_sku_title?: string | null;
  ref_sku_brand?: string | null;
  review_rating?: number | null;
}


type Tab = "collection" | "posts";
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
// Prefer the server-resolved `title` (custom_title → catalogue title → sku). The old
// client-side chain stays as the fallback so nothing breaks if an older/cached payload
// arrives without it — items added from the Database carry only a `sku`, which is why
// this used to render raw SKU codes in Owned (QA 2026-08-05 §5).
function titleForItem(it: CollectionItem): string {
  return it.title || it.custom_title || it.sku || "Item";
}
const paiseToRupees = (p: number) => Math.round(p / 100);
// v8 shared.jsx compactNum — 1284 → 1.3K, 3.45M → 3.4M (capital K/M/B, compacts from
// 1000 up; <10 keeps one decimal, ≥10 rounds). Keeps the stat tiles uniform at any size.
const compactNum = (n: number): string => {
  n = n || 0;
  if (n < 1000) return n.toLocaleString("en-IN");
  if (n < 1000000) { const v = n / 1000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v))) + "K"; }
  if (n < 1000000000) { const v = n / 1000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v))) + "M"; }
  const v = n / 1000000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v))) + "B";
};

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
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);
  const [showVouchGive, setShowVouchGive] = useState(false);
  const [showVouchList, setShowVouchList] = useState<"received" | "given" | null>(null);
  const [showVouchRequest, setShowVouchRequest] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false); // ≡ account drawer (v7)
  // Unread DM count for the header's Messages button. Same hook the Sidebar/AppBar use,
  // so the number can't disagree with chrome.
  const { msgs: msgUnread } = useUnread();

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadProfile flips its own loading flag synchronously; fetch-on-mount
    loadProfile();
  }, [loadProfile]);

  // Deep-link from Settings: /profile?edit=profile|avatar opens the edit sheet (DF-22/23);
  // /profile?vouch=request opens the vouch-request flow (v4 Settings "Vouches & endorsements").
  // /profile?show=following opens the Following list (Rewards "Vouch for a collector" earn row).
  useEffect(() => {
    if (!isOwn || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link read on mount
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
      const data = await api.get<{ items: CollectionItem[]; portfolio?: Portfolio }>(`/users/${handle}/collection`)
        .catch(() => ({ items: [] as CollectionItem[], portfolio: undefined }));
      setCollection(data.items);
      setPortfolio(data.portfolio ?? null);
    }
  }, [handle, posts, collection]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadTab awaits the API before setting state; lazy per-tab fetch
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
          <div className="w-[76px] h-[76px] rounded-full bg-[var(--bone-deep)]" />
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

  // DV7-01 — v7 dropped the Communities tab: it duplicated the dedicated Community nav
  // destination, and two tabs read cleaner at the top of a long collection grid.
  const TABS: { id: Tab; label: string }[] = [
    { id: "collection", label: "Collection" },
    { id: "posts", label: "Posts" },
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
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              {isOwn ? (
                <button
                  onClick={() => setShowEdit(true)}
                  aria-label="Change profile photo"
                  style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", display: "block" }}
                >
                  {avatarEl}
                  {/* v8 ProfileView :256 — camera pip (supersedes QA 6.6's pencil; v8 wins). */}
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

          {/* DV7-01 — ONE stat row beside the avatar: Followers / Following / Vouches.
              v7 consolidated the old emoji-tile trio + the separate 4-up stat card into
              this single row (Deals is gone with the deal flow), which buys back a full
              row of vertical space above the fold. Vouches is In+Out combined — the
              modal still splits them. */}
          <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
            {[
              { label: "Followers", n: profile.followers_count, onClick: () => setShowFollowModal("followers") },
              { label: "Following", n: profile.following_count, onClick: () => setShowFollowModal("following") },
              { label: "Vouches", n: profile.vouches_received_count + profile.vouches_given_count, onClick: () => setShowVouchList("received") },
            ].map(({ label, n, onClick }, i) => (
              // v8 :274 — divider and button are SIBLINGS in the row (Fragment), so the
              // three stat buttons share the width equally; nesting them skewed the first.
              <Fragment key={label}>
                {i > 0 && <span style={{ width: 1, alignSelf: "center", height: 30, background: "var(--border)", flexShrink: 0 }} />}
                <button
                  onClick={onClick}
                  title={n.toLocaleString("en-IN")}
                  style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: "4px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                >
                  {/* v8 writes color var(--s900) — an undefined token (typo of --slate-900); we render the intended slate-900. */}
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--slate-900)", lineHeight: 1, letterSpacing: "-0.03em", fontFeatureSettings: '"tnum" 1', whiteSpace: "nowrap" }}>
                    {compactNum(n)}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "var(--slate-400)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </div>

        {/* name + menu, then the badge shelf on its OWN row (v8 25-Aug — the shelf
            no longer squeezes the name), then handle · city · presence, then bio */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.025em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.name}
            </div>
            {isOwn ? (
              // ≡ → the account drawer. NOT mobile-only any more: v7's latest batch deleted
              // the Refer/Settings squares beside the rank card and moved that whole set in
              // here, so hiding it above lg would strand Refer / Earn points / Badges / Log
              // out on desktop. v8 :296 — a 38×34 soft square, not the 40×40 IconButton.
              <button
                onClick={() => setShowAccountMenu(true)}
                aria-label="Menu"
                style={{
                  width: 38, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                  border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Menu size={18} strokeWidth={2} />
              </button>
            ) : (
              // Judgment: v8 puts the visitor ⋯ in the DetailHeader's trailing slot; our web
              // pages have no such chrome on desktop, so it lives here next to the name.
              <IconButton icon={<MoreHorizontal size={18} />} onClick={() => setShowMore(true)} />
            )}
          </div>
          {/* Season-badge shelf (GM-14) — renders null when the user has no badges,
              so no reserved row appears for badge-less profiles. */}
          <BadgeShelf handle={profile.handle} style={{ marginTop: 8 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--slate-400)" }}>
              @{profile.handle}{placeLabel(profile) ? ` · ${placeLabel(profile)}` : ""}
            </span>
            {presence && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: presence.online ? "var(--forest)" : "var(--ink-ghost)" }} />
                <span style={{ fontSize: 12, color: presence.online ? "var(--forest)" : "var(--ink-faint)", fontWeight: presence.online ? 600 : 400 }}>{presence.text}</span>
              </span>
            )}
          </div>
          {profile.bio && (
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 7 }}>{profile.bio}</div>
          )}
        </div>

        {/* Request a vouch + Messages — own profile only.
            v7 pairs them on one row and, in the same batch, drops DMs out of the header
            bell's badge (`Chrome.jsx`: `badge={unread}`, was `unread + msgUnread`). My
            Space is now where you notice unread messages, so this button carries the
            count. It opens the merged Activity screen on its Messages segment rather than
            /inbox — DV7-05 made that one inbox on the web, and a second thread-list
            surface is exactly the "two entry points" split founder QA rejected.
            The strapline drops here: at two-up the button is too narrow for it. */}
        {isOwn && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setShowVouchRequest(true)}
              style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 11, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", cursor: "pointer", textAlign: "left" }}
            >
              <ShieldCheck size={16} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: "var(--verified-teal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Request a vouch</span>
              <ChevronRight size={15} style={{ color: "var(--verified-teal)", opacity: 0.7, flexShrink: 0 }} />
            </button>
            <Link
              href="/notifications?seg=messages"
              aria-label={msgUnread ? `Messages, ${msgUnread} unread` : "Messages"}
              style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: "10px 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", textDecoration: "none" }}
            >
              <MessageCircle size={16} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Messages</span>
              {msgUnread > 0 && (
                <span style={{ minWidth: 19, height: 19, padding: "0 5px", borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {msgUnread}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Collector rank card (GM-15) — "Earn points" + "Leaderboard" only. v7's latest
            batch deleted the Refer / Settings squares that used to sit alongside it
            (`Rewards.jsx` now reads `{isMe && null}`); both moved into the ≡ drawer, which
            is why that drawer is no longer mobile-only. */}
        <RewardCard handle={profile.handle} isMe={isOwn} />

        {/* actions — other people's profiles only */}
        {isOwn ? null : (
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
              icon={profile.my_vouch ? <Check size={17} strokeWidth={2.6} /> : <ShieldCheck size={17} strokeWidth={2} />}
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
          marginTop: 8,
          borderBottom: "1px solid var(--slate-200)",
        }}
      >
        <Segmented<Tab> value={tab} onChange={setTab} options={TABS} />
      </div>

      {/* Tab content */}
      <div style={{ padding: "14px 16px 28px" }}>
        {tab === "collection" && (
          <CollectionTab items={collection} portfolio={portfolio} isOwn={isOwn} viewPrivacy={profile.collection_view_privacy} />
        )}

        {tab === "posts" && (
          <PostsTab posts={posts} profile={profile} isOwn={isOwn} />
        )}
      </div>

      {/* Overlays */}
      {isOwn && (
        <AccountDrawer
          open={showAccountMenu}
          onClose={() => setShowAccountMenu(false)}
          onEditProfile={() => setShowEdit(true)}
        />
      )}
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

/* ── Collection tab (grid / chart / calendar / collage) ─────────── */
type OwnedView = "all" | "preorder" | "listed" | "sold" | "plain";

function CollectionTab({ items, portfolio, isOwn, viewPrivacy }: { items: CollectionItem[] | null; portfolio: Portfolio | null; isOwn: boolean; viewPrivacy?: Record<string, "public" | "private"> }) {
  // DV7-01 — segments are Owned / Wishlist / DB Contributions. Pre-orders no longer get
  // their own tab: they sit inside Owned carrying a PO tag (the PO Calendar view is still
  // the place to read them by date), and Wishlist is back as a segment now that the
  // Stash's listing-save tab is gone.
  const [seg, setSeg] = useState<"owned" | "wishlist" | "intel">("owned");
  // v7 (2026-08-09) hangs a filter off the Owned segment itself: tapping Owned while it is
  // already active opens this popover. DV8-11 replaced the two OR-ed checkboxes with a
  // SINGLE-SELECT view — an item is exactly one of these at a time, so none of them
  // compose. One tap picks a view and closes the popover.
  const [ownedFilter, setOwnedFilter] = useState<OwnedView>("all");
  const [ownedFilterOpen, setOwnedFilterOpen] = useState(false);
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

  // "owned" set powers the item count + the chart — exclude wishlist AND intel (DV6-11f),
  // otherwise unowned DB-contribution items would inflate the portfolio.
  const owned = items.filter((i) => i.status !== "wishlist" && i.status !== "intel");
  // DV8-03 — the SERVER's portfolio object is the source of truth (it knows completeness
  // and privacy); the client-side sum stays only as a fallback for older payloads.
  // v8 ProfileCollection :21 — a sold copy is no longer value you hold.
  const clientSum = items.filter((i) => i.status === "owned" && !isSoldItem(i)).reduce((s, i) => s + (i.value ?? 0), 0);
  const portfolioValue = portfolio ? portfolio.value : clientSum;
  const incompleteCount = portfolio?.incomplete_count ?? 0;
  const completeCount = portfolio?.complete_count ?? owned.length;
  const itemCount = portfolio?.item_count ?? owned.length;
  // Visitors only get a number when the owner's collection shares it (complete).
  const valueShared = portfolio ? portfolio.value_shared : true;
  // v8 :54 `valuePublic` = allComplete — drives the pills row's bottom margin for
  // EVERY viewer (the meter that follows is owner-only, but the tighter gap isn't).
  const allComplete = (portfolio?.incomplete_count ?? 0) === 0;
  // Owned folds in pre-orders (DV7-01); the other two segments match their status exactly.
  // DV8-11 — single-select views over the owned set. Listed/Sold read the listing_status
  // the server now sends; "Just owned" = in hand, not listed, not sold.
  const anyOwnedFilter = ownedFilter !== "all";
  const filteredOwned =
    ownedFilter === "preorder" ? owned.filter((i) => i.status === "preorder")
    : ownedFilter === "listed" ? owned.filter((i) => i.listing_status === "available")
    : ownedFilter === "sold" ? owned.filter(isSoldItem)
    : ownedFilter === "plain" ? owned.filter((i) => i.status === "owned" && i.listing_status !== "available" && !isSoldItem(i))
    : owned;
  const filtered = seg === "owned" ? filteredOwned : items.filter((i) => i.status === seg);

  const views: { id: CollView; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[] = [
    { id: "grid", Icon: LayoutGrid, label: "Grid" },
    { id: "chart", Icon: BarChart3, label: "Chart" },
    { id: "calendar", Icon: CalendarDays, label: "PO Calendar" },
  ];
  const isPrivate = vis[view] === "private";
  const hiddenFromViewer = !isOwn && isPrivate;

  return (
    <div>
      {/* portfolio value + item count — v7 slims these to two pills. DV8-03: the value is
          private until every item is complete — the owner still sees the number (with a
          lock while incomplete), a visitor sees the slot with nothing in it. */}
      <div style={{ display: "flex", gap: 8, marginBottom: allComplete ? 14 : 8 }}>
        <div style={{ flex: 1.3, minWidth: 0, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink-faint)", whiteSpace: "nowrap" }}>
            {!isOwn && !valueShared ? "Value not shared" : "Portfolio Value"}
          </span>
          <span style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
            {isOwn && incompleteCount > 0 && <Lock size={12} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />}
            {!isOwn && !valueShared ? (
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--ink-faint)" }}>—</span>
            ) : (
              /* v8 — the value reads in plain ink, not stamp-red (ProfileCollection.jsx:61). */
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>
                <Money value={paiseToRupees(portfolioValue ?? 0)} />
              </span>
            )}
          </span>
        </div>
        <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>Items</span>
          {/* v8 :66 — Items counts everything on the shelf INCLUDING sold records. The
              server's portfolio.item_count excludes sold (it feeds completeness), so add
              the sold records we can see; exact once the server counts them itself. */}
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>
            {portfolio ? portfolio.item_count + owned.filter(isSoldItem).length : owned.length}
          </span>
        </div>
      </div>

      {/* DV8-03 — collection health: ONE meter, not a badge per tile. Owner only, and only
          while something is incomplete. Links to the batch finish flow. */}
      {isOwn && incompleteCount > 0 && (
        <Link
          href="/collection/finish"
          style={{
            display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, padding: "11px 14px",
            borderRadius: 14, border: "1px solid var(--grail-gold)", background: "var(--grail-gold-soft)",
            textDecoration: "none", color: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={14} style={{ color: "var(--grail-gold-deep)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Only you can see your portfolio value</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 2 }}>
                {completeCount} of {itemCount} items complete · +{incompleteCount * 20} XP to finish
              </div>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--grail-gold-deep)", whiteSpace: "nowrap" }}>
              Finish {incompleteCount} →
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${(completeCount / Math.max(itemCount, 1)) * 100}%`, height: "100%", background: "var(--grail-gold-deep)", borderRadius: 3 }} />
          </div>
        </Link>
      )}

      {/* view switcher (icon-only in v7, freeing room for Add item) + per-view visibility */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {views.map((v) => {
            const on = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-label={v.label}
                aria-pressed={on}
                title={v.label}
                style={{
                  width: 40, height: 36, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                  background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                }}
              >
                {/* v8 :105 — the active view's glyph draws a hair heavier. */}
                <v.Icon size={17} strokeWidth={on ? 2 : 1.75} />
              </button>
            );
          })}
          {/* DV7-01 — "Add item" moved here from the header button row, and opens the
              Database tab (search the shared library first) instead of a blank form. */}
          {isOwn && (
            <Link
              href="/db"
              style={{
                height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderRadius: 10,
                border: "1px solid var(--stamp-red)", background: "var(--stamp-red-soft)", color: "var(--stamp-red)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", textDecoration: "none",
              }}
            >
              {/* v8 :115 — plusCircle glyph, stroke 1.9 (not the bare plus). */}
              <CirclePlus size={16} strokeWidth={1.9} />Add item
            </Link>
          )}
        </div>
        {isOwn && (
          <button
            onClick={() => {
              const next: "public" | "private" = isPrivate ? "public" : "private";
              setVis((s) => ({ ...s, [view]: next })); // optimistic
              // v8 :120 — the toggle confirms itself in a toast.
              fireToast(`${views.find((x) => x.id === view)?.label ?? "This"} view ${isPrivate ? "now public" : "now private"}`);
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
              <div style={{ position: "relative" }}>
                <Segmented
                  value={seg}
                  onChange={(v) => {
                    // Re-tapping the active Owned segment toggles its filter (v7).
                    if (v === "owned" && seg === "owned") { setOwnedFilterOpen((o) => !o); return; }
                    setSeg(v);
                    setOwnedFilterOpen(false);
                  }}
                  options={[
                    { id: "owned", label: "Owned", icon: <SlidersHorizontal size={14} strokeWidth={seg === "owned" ? 2.2 : 1.9} /> },
                    { id: "wishlist", label: "Wishlist" },
                    { id: "intel", label: "DB Contributions" },
                  ]}
                />
                {ownedFilterOpen && seg === "owned" && (
                  <>
                    {/* Outside-click catcher. An anchored dropdown, not a bottom sheet —
                        a sheet pinned to the viewport floor reads as unrelated to the
                        control that opened it (QA 2026-08-01). */}
                    <div onClick={() => setOwnedFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
                    {/* DV8-11 — single-select chip row: All / Pre-order / Listed / Sold /
                        Just owned. An item is exactly one of these at a time, so nothing
                        composes; one tap picks a view and closes. "Sold" is ALWAYS shown
                        (it used to hide until something had sold, making the view
                        undiscoverable). */}
                    {/* v8 :157 `animation: fadeIn 140ms ease` — the keyframes live in v8's
                        index.html, not our globals, so they're scoped here. */}
                    <style>{"@keyframes ch-profile-fadein { from { opacity: 0 } to { opacity: 1 } }"}</style>
                    <div
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 31, width: "min(360px, 100%)",
                        background: "var(--paper)", border: "1px solid var(--slate-200)", borderRadius: 16,
                        boxShadow: "var(--shadow-4)", padding: 10, animation: "ch-profile-fadein 140ms ease",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {([
                          { id: "all" as OwnedView, label: "All" },
                          { id: "preorder" as OwnedView, label: `Pre-order · ${owned.filter((i) => i.status === "preorder").length}` },
                          { id: "listed" as OwnedView, label: `Listed · ${owned.filter((i) => i.listing_status === "available").length}` },
                          { id: "sold" as OwnedView, label: `Sold · ${owned.filter(isSoldItem).length}` },
                          { id: "plain" as OwnedView, label: `Just owned · ${owned.filter((i) => i.status === "owned" && i.listing_status !== "available" && !isSoldItem(i)).length}` },
                        ]).map((f) => {
                          const on = ownedFilter === f.id;
                          return (
                            <button
                              key={f.id}
                              onClick={() => { setOwnedFilter(f.id); setOwnedFilterOpen(false); }}
                              aria-pressed={on}
                              style={{
                                padding: "8px 13px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
                                border: `1px solid ${on ? "var(--stamp-red)" : "var(--border-strong)"}`,
                                background: on ? "var(--stamp-red)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink)",
                                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: on ? 700 : 500,
                              }}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 14 }}>
                {filtered.map((it) => <ItemTile key={it.id} item={it} isOwn={isOwn} />)}
              </div>
              {/* v8 :184 — ONE empty-state pair for every segment: owner gets the filter
                  line or the add-from-database nudge, a visitor always reads "Private or
                  empty." (the per-segment copy this used to carry was pre-v8). */}
              {filtered.length === 0 && (
                <EmptyNote>
                  {isOwn
                    ? (seg === "owned" && anyOwnedFilter ? "Nothing matches this filter." : "Nothing here yet — add from the Scorred database.")
                    : "Private or empty."}
                </EmptyNote>
              )}
            </>
          )}

          {view === "chart" && <PortfolioChart items={owned} inHand={items.filter((i) => i.status === "owned").length} preorder={items.filter((i) => i.status === "preorder").length} />}
          {view === "calendar" && <PortfolioCalendar items={items} />}
        </>
      )}
    </div>
  );
}

/* DV8-03 — what a tile is missing, named in the slot where the data would have been.
   Markers, not badges: the value line becomes a gold "Add price →" / "Add condition →" /
   "Add ETA →" / "Add details →" link into the finish flow. Owner only — visitors never
   see markers (their `value` is null anyway). */
function gapLabelFor(item: CollectionItem): string | null {
  if (item.is_complete !== false) return null;
  const gaps: string[] = [];
  if (item.status === "preorder") {
    // v8 itemGaps: an explicit "not announced yet" (tbd) is an answer, not a gap;
    // a pre-order's price is its TOTAL (value stays the fallback for old rows).
    if (!item.preorder_eta && item.preorder_window_precision !== "tbd") gaps.push("Add ETA");
    if (!item.preorder_total && !item.value) gaps.push("Add price");
  } else {
    if (!item.condition) gaps.push("Add condition");
    if (!item.value) gaps.push("Add price");
  }
  if (gaps.length === 0) return "Add details"; // server says incomplete; trust it
  return gaps.length > 1 ? "Add details" : gaps[0];
}

function ItemTile({ item, isOwn }: { item: CollectionItem; isOwn: boolean }) {
  const router = useRouter();
  const c = catForItem(item);
  const [wishlisted, setWishlisted] = useState(!!item.is_wishlisted);
  const [busy, setBusy] = useState(false);
  const sold = isSoldItem(item);
  // A sold copy shows its struck-through value, never a "finish it" marker.
  const gapText = isOwn && !sold ? gapLabelFor(item) : null;

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
      onClick={() => {
        // v8 :440 — a tile without a catalogue destination goes nowhere: DB
        // Contributions have "no catalogue detail page yet" when the entry is
        // still missing. Wishlist/intel rows render on the catalogue entry
        // (/db/{sku}), owned/pre-order/sold copies on the item page.
        if (item.status === "intel" || item.status === "wishlist") {
          if (item.sku) router.push(`/db/${item.sku}`);
          return;
        }
        router.push(`/item/${item.id}`);
      }}
      role="button"
      tabIndex={0}
      style={{
        background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13,
        overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer",
      }}
    >
      {/* v8 :449 — the WHOLE media block (photo AND its tag) dims for a sold copy:
          grayscale(1) at 62% opacity, so even the Sold tag reads as a record. */}
      <div style={{ position: "relative", filter: sold ? "grayscale(1)" : "none", opacity: sold ? 0.62 : 1 }}>
        {item.image_url ? (
          <div style={{ aspectRatio: "1/1", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={titleForItem(item)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ) : (
          /* v8 :450 — bare placeholder, no brand caption on collection tiles. */
          <ProductPhoto tone={c.tone} ratio="1/1" rounded={0} />
        )}
        {/* v8 :451 — "NEW DB" chip, top-LEFT, on a contribution that created its entry. */}
        {item.status === "intel" && item.is_new_to_db && (
          <div style={{ position: "absolute", top: 7, left: 7, fontSize: 10, fontWeight: 700, color: "var(--paper)", background: "var(--verified-teal)", padding: "2px 6px", borderRadius: 5 }}>NEW DB</div>
        )}
        {/* ONE top-right tag, mutually exclusive by priority: Sold → Listed → PO.
            Listed reads the server's listing_status (not the stale is_listed flag). */}
        {sold ? (
          <div style={{ position: "absolute", top: 7, right: 7 }}><Tag kind="sold">Sold</Tag></div>
        ) : item.listing_status === "available" ? (
          <div style={{ position: "absolute", top: 7, right: 7 }}><Tag kind="sale">Listed</Tag></div>
        ) : item.status === "preorder" ? (
          <div style={{ position: "absolute", top: 7, right: 7 }}><Tag kind="po">PO</Tag></div>
        ) : null}
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
            fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, color: sold ? "var(--ink-faint)" : "var(--ink)",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 31,
          }}
        >
          {titleForItem(item)}
        </div>
        {/* No price on wishlist / DB-contribution tiles — you don't own them, so the
            number would read as portfolio value it isn't (DV7-01). DV8-03: an incomplete
            owned tile's value line becomes the gold "Add … →" marker into the finish
            flow; visitors (null value) get no number and no marker. v8: a sold tile's
            value is struck through in faint ink — no longer value you hold. */}
        {item.status !== "wishlist" && item.status !== "intel" && (
          sold && item.value != null ? (
            <div style={{ fontSize: 12.5, marginTop: 5, color: "var(--ink-faint)" }}>
              <Money value={paiseToRupees(item.value)} strike />
            </div>
          ) : gapText ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); router.push(`/collection/finish?item=${encodeURIComponent(item.id)}`); }}
              style={{
                marginTop: 5, padding: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left",
                fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 700, color: "var(--grail-gold-deep)",
              }}
            >
              {gapText} →
            </button>
          ) : item.value != null ? (
            <div style={{ fontSize: 12.5, marginTop: 5, color: "var(--ink-mute)" }}>
              <Money value={paiseToRupees(item.value)} />
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// SVG donut by category value — converted from design ProfileCollection PortfolioChart.
// DV7-01 adds the in-hand vs pre-order split above the donut: the donut answers "what
// kinds of things do I own", this answers "how much of it has actually landed".
function PortfolioChart({ items, inHand, preorder }: { items: CollectionItem[]; inHand: number; preorder: number }) {
  const byCat: Record<string, { count: number; value: number; label: string; tone: string }> = {};
  items.forEach((i) => {
    const c = catForItem(i);
    byCat[c.key] = byCat[c.key] || { count: 0, value: 0, label: c.label, tone: c.tone };
    byCat[c.key].count++;
    byCat[c.key].value += i.value ?? 0;
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
      {/* in hand vs pre-order */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "var(--bone)", borderRadius: 13, padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
          <Check size={16} style={{ color: "var(--forest)", flexShrink: 0 }} />
          <span>
            <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>{inHand}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--ink-mute)" }}>in hand</span>
          </span>
        </div>
        <div style={{ flex: 1, background: "var(--grail-gold-soft)", borderRadius: 13, padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
          <Clock size={16} style={{ color: "var(--grail-gold-deep)", flexShrink: 0 }} />
          <span>
            <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>{preorder}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--ink-mute)" }}>pre-order</span>
          </span>
        </div>
      </div>
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

/* v8 ProfileCollection.jsx `poWindow` — a pre-order's release window as one shape:
   bucket (label + numeric sort), the 48px mini tile's two lines, and the eta sentence.
   v8 reads structured parts (etaPrecision/etaYear/etaMonth/etaDay/etaQuarter); our API
   stores free text + an owner-only precision, so this parses "12 Mar 2026" / "March
   2026" / "Q3 2026" / "2026" / "TBD" into the same buckets. */
interface PoWindow {
  bucketKey: string;
  bucketLabel: string;
  sort: number;
  tileTop: string;
  tileBottom: string;
  eta: string;
}
function poWindow(it: CollectionItem): PoWindow {
  const raw = (it.preorder_eta ?? "").trim();
  const lower = raw.toLowerCase();
  // v8: precision "tbd" is an explicit answer; no eta at all lands in the same bucket.
  if (it.preorder_window_precision === "tbd" || !raw || lower.includes("to be announced") || lower === "tbd" || lower === "tba") {
    return { bucketKey: "zzzz", bucketLabel: "Date to be announced", sort: 99999999, tileTop: "TBD", tileBottom: "·", eta: "Release date not announced yet" };
  }
  const yearMatch = raw.match(/(20\d{2})/);
  const y = yearMatch ? Number(yearMatch[1]) : null;
  const monthIdx = MONTH_NAMES.findIndex((m, i) => lower.includes(m.toLowerCase()) || lower.includes(MONTH_SHORT[i].toLowerCase()));
  if (monthIdx >= 0) {
    const yy = y ?? 2026; // v8 defaults an unstated year to 2026
    const dayMatch = raw.match(/\b([0-3]?\d)\b/);
    const day = dayMatch ? Number(dayMatch[1]) : null;
    const hasDay = day != null && day >= 1 && day <= 31;
    return {
      bucketKey: `${yy}-${String(monthIdx).padStart(2, "0")}`,
      bucketLabel: `${MONTH_NAMES[monthIdx]} ${yy}`,
      sort: yy * 10000 + monthIdx * 100 + (hasDay ? day : 0),
      tileTop: MONTH_SHORT[monthIdx],
      tileBottom: hasDay ? String(day) : "~",
      eta: hasDay ? `Ships ~ ${day} ${MONTH_SHORT[monthIdx]} ${yy}` : `Expected ${MONTH_NAMES[monthIdx]} ${yy}`,
    };
  }
  const qMatch = lower.match(/q([1-4])/);
  if (qMatch) {
    const q = Number(qMatch[1]);
    const yy = y ?? 2026;
    const am = (q - 1) * 3;
    return {
      bucketKey: `${yy}-Q${q}`, bucketLabel: `Q${q} ${yy}`, sort: yy * 10000 + am * 100 + 50,
      tileTop: `Q${q}`, tileBottom: `'${String(yy).slice(2)}`, eta: `Expected Q${q} ${yy}`,
    };
  }
  if (y != null) {
    return {
      bucketKey: `${y}-13`, bucketLabel: `${y} · window TBD`, sort: y * 10000 + 1300,
      tileTop: "YEAR", tileBottom: String(y).slice(2), eta: `Expected sometime in ${y}`,
    };
  }
  // Unrecognisable free text keeps its own bucket just ahead of TBD (don't merge distinct ETAs).
  return { bucketKey: `zz-${lower}`, bucketLabel: raw, sort: 99999998, tileTop: "PO", tileBottom: "~", eta: raw };
}

// Pre-orders grouped by release window — v8 ProfileCollection PortfolioCalendar.
function PortfolioCalendar({ items }: { items: CollectionItem[] }) {
  const pos = items.filter((i) => i.status === "preorder");

  const grouped: Record<string, { label: string; sort: number; items: { it: CollectionItem; w: PoWindow }[] }> = {};
  pos.forEach((it) => {
    const w = poWindow(it);
    grouped[w.bucketKey] = grouped[w.bucketKey] || { label: w.bucketLabel, sort: w.sort, items: [] };
    grouped[w.bucketKey].items.push({ it, w });
  });
  // v8 :317 — buckets sort chronologically by the numeric key, TBD last.
  const buckets = Object.values(grouped).sort((a, b) => a.sort - b.sort);
  if (buckets.length === 0) return <EmptyNote>No pre-orders on the calendar.</EmptyNote>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {buckets.map((g) => (
        <div key={g.label}>
          {/* Window header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ background: "var(--grail-gold)", color: "var(--ink)", borderRadius: 7, padding: "4px 11px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              {g.label}
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {g.items.length} item{g.items.length !== 1 ? "s" : ""}
            </span>
          </div>
          {/* Items in window */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {g.items.map(({ it, w }) => {
              const bigDay = /^\d+$/.test(w.tileBottom);
              // v8 :343 — balance = (total ?? value) − deposit; the API has no deposit
              // field yet, so the balance reads as the full total (owner-only fields).
              const balancePaise = it.preorder_total ?? it.value;
              return (
                <div key={it.id} style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: 12 }}>
                  {/* Mini window tile */}
                  <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, overflow: "hidden", border: "1px solid var(--grail-gold)", display: "flex", flexDirection: "column" }}>
                    <div style={{ background: "var(--grail-gold)", textAlign: "center", fontSize: w.tileTop.length > 3 ? 7 : 8, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.06em", padding: "3px 0", lineHeight: 1 }}>
                      {w.tileTop}
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--grail-gold-soft)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: bigDay ? 17 : 13, color: "var(--grail-gold-deep)", lineHeight: 1 }}>
                      {w.tileBottom}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titleForItem(it)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 3 }}>On order</div>
                    <div style={{ fontSize: 11.5, color: "var(--grail-gold-deep)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{w.eta}</div>
                    {balancePaise != null && (
                      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 3 }}>
                        Balance due <b style={{ fontFamily: "var(--font-mono)", color: "var(--stamp-red)" }}>₹{Math.max(0, paiseToRupees(balancePaise)).toLocaleString("en-IN")}</b>
                      </div>
                    )}
                  </div>
                  <Tag kind="po">PO</Tag>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Posts tab ──────────────────────────────────────────────────── */
function PostsTab({ posts, profile, isOwn }: { posts: RawPost[] | null; profile: ProfileUser; isOwn: boolean }) {
  if (posts === null) return <SkeletonRows />;
  if (posts.length === 0) {
    // v8 :388 — exact copy.
    return <EmptyNote>{isOwn ? "You haven't posted yet. Tap + to showcase a piece." : "No posts yet."}</EmptyNote>;
  }
  // The per-user posts endpoint omits author fields; the author is this profile.
  // PostCard routes type "iso" to ISOCard itself (v8 renders ISOCard vs PostCard here).
  const enriched: ApiPost[] = posts.map((p) => ({
    id: p.id,
    user_id: profile.id,
    handle: profile.handle,
    name: profile.name,
    avatar_url: profile.avatar_url,
    type: p.type,
    title: p.title ?? undefined,
    body: p.body,
    images: p.images,
    category: p.category,
    community_id: null,
    review_rating: p.review_rating ?? null,
    poll_options: null,
    iso_item: p.iso_item ?? null,
    iso_budget: p.iso_budget ?? null,
    iso_cond: p.iso_cond ?? null,
    iso_city: p.iso_city ?? null,
    ref_sku: p.ref_sku ?? null,
    ref_sku_title: p.ref_sku_title ?? null,
    ref_sku_brand: p.ref_sku_brand ?? null,
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
