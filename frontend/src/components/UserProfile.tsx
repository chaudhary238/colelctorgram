"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, Star, ShieldCheck, Package } from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser, useUser } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
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
}

interface CollectionItem {
  id: string;
  sku: string | null;
  custom_title: string | null;
  status: string;
  verify_tier: string;
  value: number;
  is_listed: boolean;
  photo_count: number;
}

interface UserPost {
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

interface UserListing {
  id: string;
  sku: string | null;
  price: number;
  condition: string;
  trade_willing: boolean;
  ships_from_city: string | null;
  saves_count: number;
}

type Tab = "posts" | "collection" | "listings";

/* ── Verify tier badge ──────────────────────────────────────────── */

function VerifyDot({ tier }: { tier: string }) {
  if (tier === "verified")
    return (
      <span
        title="Verified"
        className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[var(--verified-teal)] border-2 border-[var(--paper)]"
      />
    );
  if (tier === "shown")
    return (
      <span
        title="Photo shown"
        className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[var(--grail-gold)] border-2 border-[var(--paper)]"
      />
    );
  return null;
}

/* ── Main component ─────────────────────────────────────────────── */

interface UserProfileProps {
  handle: string;
  isOwn: boolean;
}

export function UserProfile({ handle, isOwn }: UserProfileProps) {
  const { user: authUser, setUser } = useUser();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<UserPost[] | null>(null);
  const [collection, setCollection] = useState<CollectionItem[] | null>(null);
  const [listings, setListings] = useState<UserListing[] | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<string>("all");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ProfileUser>(`/users/${handle}`);
      setProfile(data);
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
      const data = await api.get<{ items: UserPost[] }>(`/users/${handle}/posts`).catch(() => ({ items: [] }));
      setPosts(data.items);
    } else if (t === "collection" && collection === null) {
      const data = await api.get<{ items: CollectionItem[] }>(`/users/${handle}/collection`).catch(() => ({ items: [] }));
      setCollection(data.items);
    } else if (t === "listings" && listings === null) {
      const data = await api.get<{ items: UserListing[] }>(`/users/${handle}/listings`).catch(() => ({ items: [] }));
      setListings(data.items);
    }
  }, [handle, posts, collection, listings]);

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
        setProfile((p) => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p);
      } else {
        await api.post(`/users/${profile.handle}/follow`);
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
      }
    } catch { /* ignore */ }
    setFollowLoading(false);
  }

  function handleProfileSaved(updated: AuthUser) {
    setUser(updated);
    setProfile((p) => p ? { ...p, ...updated } : p);
  }

  function handleCollectionAdded() {
    setCollection(null); // force reload
  }

  /* ── Filtered collection ──────────────────────────────────────── */
  const filteredCollection =
    collectionFilter === "all"
      ? collection
      : collection?.filter((i) => i.status === collectionFilter) ?? null;

  /* ── Render ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div>
        <div className="h-36 bg-[var(--bone-deep)] animate-pulse" />
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-[var(--paper)] bg-[var(--bone-deep)] animate-pulse" />
            <div className="h-9 w-24 rounded-full bg-[var(--bone-deep)] animate-pulse mb-1" />
          </div>
          <div className="space-y-2 animate-pulse">
            <div className="h-5 w-40 rounded bg-[var(--bone-deep)]" />
            <div className="h-3.5 w-24 rounded bg-[var(--bone)]" />
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

  const TABS: { id: Tab; label: string }[] = [
    { id: "posts", label: "Posts" },
    { id: "collection", label: "Collection" },
    { id: "listings", label: "Listings" },
  ];

  const COLLECTION_FILTERS = [
    { value: "all", label: "All" },
    { value: "owned", label: "Owned" },
    { value: "wishlist", label: "Wishlist" },
    { value: "preorder", label: "Pre-order" },
  ];

  return (
    <>
      {/* Cover */}
      <div
        className="h-36 w-full"
        style={{
          background: `linear-gradient(135deg, var(--stamp-red-soft) 0%, var(--grail-gold-soft) 100%)`,
        }}
      />

      {/* Header */}
      <div className="px-4 pb-2">
        <div className="flex items-end justify-between -mt-10 mb-3">
          {/* Avatar */}
          <div className="relative w-20 h-20 rounded-full border-4 border-[var(--paper)] bg-[var(--bone-deep)] overflow-hidden shrink-0 flex items-center justify-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-[var(--ink-faint)]">{profile.name[0]}</span>
            )}
          </div>

          {/* Action button */}
          {isOwn ? (
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setShowAddCollection(true)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold border border-[var(--border-strong)] text-[var(--ink)] bg-[var(--bone)] hover:bg-[var(--bone-deep)] transition-colors"
              >
                + Add item
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold border border-[var(--border-strong)] text-[var(--ink)] bg-[var(--bone)] hover:bg-[var(--bone-deep)] transition-colors"
              >
                Edit profile
              </button>
            </div>
          ) : (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={cn(
                "mb-1 px-5 py-1.5 rounded-full text-sm font-semibold border transition-colors disabled:opacity-60",
                isFollowing
                  ? "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink)] hover:bg-[var(--bone-deep)]"
                  : "bg-[var(--stamp-red)] border-transparent text-white hover:bg-[var(--stamp-red-deep)]"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Name & handle */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
              {profile.name}
            </h1>
            {profile.verified_items_count > 0 && (
              <ShieldCheck size={16} className="text-[var(--verified-teal)] shrink-0" />
            )}
          </div>
          <p className="text-sm text-[var(--ink-faint)]">@{profile.handle}</p>
        </div>

        {/* Bio & city */}
        {profile.bio && (
          <p className="text-sm text-[var(--ink-soft)] leading-snug mb-1.5">{profile.bio}</p>
        )}
        {profile.city && (
          <div className="flex items-center gap-1 text-xs text-[var(--ink-faint)] mb-3">
            <MapPin size={12} />
            {profile.city}
          </div>
        )}

        {/* Trust signals */}
        {(profile.rating_count > 0 || profile.deals_count > 0) && (
          <div className="flex items-center gap-3 mb-3 text-xs text-[var(--ink-mute)]">
            {profile.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star size={11} className="text-[var(--grail-gold)]" />
                {profile.rating.toFixed(1)} ({profile.rating_count})
              </span>
            )}
            {profile.deals_count > 0 && (
              <span className="flex items-center gap-1">
                <Package size={11} />
                {profile.deals_count} deals
              </span>
            )}
          </div>
        )}

        {/* Stats bar */}
        <div className="flex gap-6 py-2 border-t border-[var(--border)]">
          {[
            { label: "Items", value: profile.active_listings_count + (collection?.length ?? 0) },
            { label: "Deals", value: profile.deals_count },
            {
              label: "Followers",
              value: profile.followers_count,
              onClick: () => setShowFollowModal("followers"),
            },
            {
              label: "Following",
              value: profile.following_count,
              onClick: () => setShowFollowModal("following"),
            },
          ].map(({ label, value, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={!onClick}
              className="text-center disabled:cursor-default group"
            >
              <p className="text-base font-bold text-[var(--ink)] leading-tight">{value}</p>
              <p className="text-xs text-[var(--ink-faint)] group-hover:text-[var(--ink)] transition-colors">
                {label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] sticky top-0 bg-[var(--paper)] z-10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 py-3 text-sm font-semibold border-b-2 transition-colors",
              tab === id
                ? "border-[var(--ink)] text-[var(--ink)]"
                : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-mute)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-64">
        {/* Posts tab */}
        {tab === "posts" && (
          <div className="divide-y divide-[var(--border)]">
            {posts === null ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2 animate-pulse">
                  <div className="h-3.5 w-3/4 rounded bg-[var(--bone)]" />
                  <div className="h-3.5 w-1/2 rounded bg-[var(--bone)]" />
                </div>
              ))
            ) : posts.length === 0 ? (
              <p className="text-sm text-[var(--ink-faint)] text-center py-10">No posts yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                        post.type === "showcase" && "bg-[var(--grail-gold-soft)] text-[var(--grail-gold-deep)]",
                        post.type === "discussion" && "bg-[var(--forest-soft)] text-[var(--forest)]",
                        post.type === "review" && "bg-[var(--plum-soft)] text-[var(--plum)]"
                      )}
                    >
                      {post.type}
                    </span>
                    {post.category && (
                      <span className="text-xs text-[var(--ink-faint)]">{post.category}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--ink-soft)] leading-snug line-clamp-3">{post.body}</p>
                  {post.images.length > 0 && (
                    <div className="aspect-video rounded-xl bg-[var(--bone-deep)] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex gap-5 text-xs text-[var(--ink-faint)] pt-1">
                    <span>❤ {post.likes_count}</span>
                    <span>💬 {post.comments_count}</span>
                    <span>🔖 {post.saves_count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Collection tab */}
        {tab === "collection" && (
          <div>
            {/* Filter bar */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-[var(--border)]">
              {COLLECTION_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCollectionFilter(value)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-colors",
                    collectionFilter === value
                      ? "bg-[var(--ink)] text-white border-transparent"
                      : "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink-mute)] hover:border-[var(--ink-ghost)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {collection === null ? (
              <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-[var(--bone-deep)] animate-pulse" />
                ))}
              </div>
            ) : filteredCollection!.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-[var(--ink-faint)]">
                  {collection.length === 0 ? "No items in collection yet." : "No items match this filter."}
                </p>
                {isOwn && collection.length === 0 && (
                  <button
                    onClick={() => setShowAddCollection(true)}
                    className="mt-3 px-4 py-2 rounded-full bg-[var(--stamp-red)] text-white text-xs font-semibold hover:bg-[var(--stamp-red-deep)] transition-colors"
                  >
                    Add your first item
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                {filteredCollection!.map((item) => (
                  <div key={item.id} className="aspect-square bg-[var(--bone-deep)] relative overflow-hidden">
                    {item.photo_count === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-[var(--ink-ghost)]">
                        <Package size={24} strokeWidth={1.5} />
                      </div>
                    ) : null}
                    <VerifyDot tier={item.verify_tier} />
                    {item.is_listed && (
                      <span className="absolute top-1 left-1 bg-[var(--grail-gold)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        SALE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listings tab */}
        {tab === "listings" && (
          <div className="divide-y divide-[var(--border)]">
            {listings === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-3.5 w-1/2 rounded bg-[var(--bone)]" />
                  <div className="h-5 w-24 rounded bg-[var(--bone-deep)] mt-2" />
                </div>
              ))
            ) : listings.length === 0 ? (
              <p className="text-sm text-[var(--ink-faint)] text-center py-10">No active listings.</p>
            ) : (
              listings.map((l) => (
                <div key={l.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[var(--bone-deep)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--ink-faint)] mb-0.5">{l.sku ?? "Custom item"}</p>
                    <p className="text-base font-bold text-[var(--ink)]">
                      ₹{(l.price / 100).toLocaleString("en-IN")}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs text-[var(--ink-faint)]">
                      <span>{l.condition}</span>
                      {l.trade_willing && <span>· Trade OK</span>}
                      {l.ships_from_city && <span>· {l.ships_from_city}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Overlays */}
      {showEdit && isOwn && authUser && (
        <EditProfileSheet
          user={authUser}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {showFollowModal && (
        <FollowListModal
          handle={profile.handle}
          tab={showFollowModal}
          onClose={() => setShowFollowModal(null)}
        />
      )}

      {showAddCollection && isOwn && (
        <AddToCollectionSheet
          onClose={() => setShowAddCollection(false)}
          onAdded={handleCollectionAdded}
        />
      )}
    </>
  );
}
