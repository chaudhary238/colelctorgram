"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { Avatar } from "@/components/ui";

interface SuggestedUser {
  id: string;
  handle: string;
  name: string;
  tier: string;
  followers_count: number;
  verified_items_count: number;
}

function RailFollow({ user }: { user: SuggestedUser }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleFollow() {
    if (busy) return;
    const next = !following;
    setFollowing(next);          // optimistic
    setBusy(true);
    try {
      if (next) await api.post(`/users/${user.handle}/follow`);
      else await api.delete(`/users/${user.handle}/follow`);
    } catch {
      setFollowing(!next);       // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <Link href={`/profile/${user.handle}`} className="shrink-0">
        <Avatar name={user.name} size={42} verified={user.verified_items_count > 10} />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/profile/${user.handle}`} className="block truncate text-[13.5px] font-semibold text-[var(--ink)] hover:underline">
          @{user.handle}
        </Link>
        <div className="truncate text-xs text-[var(--ink-faint)] capitalize">
          {user.tier} · {user.followers_count.toLocaleString()} followers
        </div>
      </div>
      <button
        onClick={toggleFollow}
        disabled={busy}
        className="shrink-0 font-bold text-[12.5px]"
        style={{ color: following ? "var(--ink-faint)" : "var(--stamp-red)", cursor: busy ? "default" : "pointer" }}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export function RightRail() {
  const { user } = useUser();
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get<{ items: SuggestedUser[] }>("/users/me/suggested?limit=12").catch(() => ({ items: [] })).then((d) => {
      if (d && Array.isArray(d)) setSuggested(d);
      else if (d && "items" in d) setSuggested(d.items);
    });
  }, []);

  const shown = expanded ? suggested : suggested.slice(0, 5);

  const displayName = user?.name ?? "You";
  const displayHandle = user?.handle ?? "…";

  return (
    <aside className="w-80 shrink-0" style={{ paddingTop: 28, boxSizing: "border-box" }}>
      <Link href="/profile" className="flex items-center gap-[13px] w-full px-1 pb-[22px]">
        <Avatar name={displayName} color="var(--ink)" size={50} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--ink)] truncate">@{displayHandle}</div>
          <div className="text-[13px] text-[var(--ink-faint)] truncate capitalize">
            {displayName} · {user?.tier ?? "collector"}
          </div>
        </div>
      </Link>

      {suggested.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1.5 pb-[14px]">
            <span className="text-[13.5px] font-semibold text-[var(--ink-mute)]">Suggested collectors</span>
            {suggested.length > 5 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink-mute)]"
              >
                {expanded ? "Show less" : "See all"}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4 px-1.5">
            {shown.map((u) => <RailFollow key={u.handle} user={u} />)}
          </div>
        </>
      )}

      <div className="px-1.5 pt-7 text-[11.5px] text-[var(--ink-ghost)]" style={{ lineHeight: 1.7 }}>
        About · Help · Press · API · Communities · Events · Privacy · Terms
        <br />
        <span style={{ letterSpacing: "0.04em" }}>© 2026 Scorred</span>
      </div>
    </aside>
  );
}
