"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useUser } from "@/lib/auth-context";
import { Avatar, Button } from "@/components/ui";
import { fireToast } from "@/components/gamification";


interface FollowUser {
  handle: string;
  name: string;
  avatar_url: string | null;
  /* NEEDS-BACKEND (audit §9#17) — FollowUserOut sends handle/name/avatar_url only.
     The v8 row also shows a presence dot and "@handle · city"; both render the
     moment the payload carries these fields, and stay hidden until then. */
  last_active_at?: string | null;
  city?: string | null;
}

/* ── Shared follow state for list rows (audit §9#17/#18) ─────────────
   The followers/following/vouches payloads carry no per-row is_following flag,
   so the viewer's own following list seeds a handle→bool map once per mount.
   One page of 400 covers all but extreme accounts; a row past that cap starts
   as "Follow" — tapping it is harmless (the POST is idempotent and the server
   answers xp_granted:false, so the toast stays the plain variant). */
export function useFollowMap() {
  const { user } = useUser();
  const [map, setMap] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let alive = true;
    if (!user?.handle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync fallback when signed out
      setMap({});
      return;
    }
    api.get<{ handle: string }[]>(`/users/${user.handle}/following?limit=400`)
      .then((rows) => { if (alive) setMap(Object.fromEntries(rows.map((r) => [r.handle, true]))); })
      .catch(() => { if (alive) setMap({}); });
    return () => { alive = false; };
  }, [user?.handle]);

  return [map, setMap] as const;
}

/* Per-row Follow/Following button — optimistic, with the v8 toast rule: the
   "+2 XP" suffix renders only when the server says the grant landed (POST
   /follow → {xp_granted}); unfollow always toasts plain (v8 ProfileView:441). */
export function FollowRowButton({
  handle, followMap, setFollowMap,
}: {
  handle: string;
  followMap: Record<string, boolean> | null;
  setFollowMap: React.Dispatch<React.SetStateAction<Record<string, boolean> | null>>;
}) {
  const following = !!followMap?.[handle];
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy || followMap === null) return; // wait for the seed — no blind flips
    const next = !following;
    setFollowMap((m) => ({ ...(m ?? {}), [handle]: next })); // optimistic
    setBusy(true);
    try {
      if (next) {
        const res = await api.post<{ xp_granted?: boolean } | undefined>(`/users/${handle}/follow`);
        fireToast(res?.xp_granted ? `Following @${handle} · +2 XP` : `Following @${handle}`);
      } else {
        await api.delete(`/users/${handle}/follow`);
        fireToast(`Unfollowed @${handle}`);
      }
    } catch {
      setFollowMap((m) => ({ ...(m ?? {}), [handle]: !next })); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant={following ? "secondary" : "dark"} disabled={busy} onClick={toggle}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}

/* "Online now" = active within 5 min (matches the profile header's presenceLabel). */
function isOnline(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  return !Number.isNaN(then) && Date.now() - then < 5 * 60000;
}

interface FollowListModalProps {
  handle: string;
  tab: "followers" | "following";
  /** The subject's header counts (v8 :424 subtitle `@handle · count`). */
  counts?: { followers: number; following: number };
  onClose: () => void;
}

export function FollowListModal({ handle, tab, counts, onClose }: FollowListModalProps) {
  const { user: me } = useUser();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab);
  const [followMap, setFollowMap] = useFollowMap();

  const load = useCallback(async (t: "followers" | "following") => {
    setLoading(true);
    try {
      const data = await api.get<FollowUser[]>(`/users/${handle}/${t}`);
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load flips its own loading flag synchronously; fetch-per-tab
    load(activeTab);
  }, [activeTab, load]);

  // v8 :424 — header subtitle `@{handle} · {count}` for the open list.
  const count = counts ? counts[activeTab] : loading ? null : users.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="border-b border-[var(--border)] px-4 py-3 shrink-0">
          <div className="flex items-center">
            <div className="flex gap-6 flex-1">
              {(["followers", "following"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`text-sm font-semibold capitalize pb-1 border-b-2 transition-colors ${
                    activeTab === t
                      ? "border-[var(--ink)] text-[var(--ink)]"
                      : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 3 }}>
            @{handle}{count != null ? ` · ${count.toLocaleString("en-IN")}` : ""}
          </div>
        </div>

        {/* List — v8 ProfileView:425-447: full-bleed rows, 44px avatar,
            name + presence dot, "@handle · city" sub, trailing Follow button. */}
        <div className="overflow-y-auto flex-1" style={{ padding: "8px 0 24px" }}>
          {loading ? (
            <div className="space-y-3 py-2 px-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-[var(--bone-deep)]" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 rounded bg-[var(--bone-deep)]" />
                    <div className="h-2.5 w-16 rounded bg-[var(--bone)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)] text-center py-8">
              No {activeTab} yet.
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.handle}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--border)" }}
              >
                <Link href={`/profile/${u.handle}`} onClick={onClose} className="shrink-0">
                  <Avatar name={u.name} photo={u.avatar_url} size={44} />
                </Link>
                <Link
                  href={`/profile/${u.handle}`}
                  onClick={onClose}
                  style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{u.name}</span>
                    {/* v8 :436 — presence dot beside the name; renders only when the
                        payload carries last_active_at (it doesn't yet — NEEDS-BACKEND). */}
                    {u.last_active_at !== undefined && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: isOnline(u.last_active_at) ? "var(--forest)" : "transparent" }} />
                    )}
                  </div>
                  {/* v8 :438 — "@handle · city"; the city half is guarded until sent. */}
                  <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                    @{u.handle}{u.city ? ` · ${u.city}` : ""}
                  </div>
                </Link>
                {/* Hidden on your own row — you can't follow yourself. */}
                {me?.handle !== u.handle && (
                  <FollowRowButton handle={u.handle} followMap={followMap} setFollowMap={setFollowMap} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
