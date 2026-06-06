"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { MOCK_SUGGESTED_USERS } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function RightRail() {
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  function toggle(handle: string) {
    setFollowed((prev) => ({ ...prev, [handle]: !prev[handle] }));
  }

  return (
    <aside
      className="ch-rail w-80 shrink-0 pt-7 hidden xl:block"
      style={{ boxSizing: "border-box" }}
    >
      <div className="px-1.5">
        <p className="text-sm font-semibold text-[var(--ink-mute)] mb-3">Suggested collectors</p>

        <div className="space-y-3">
          {MOCK_SUGGESTED_USERS.map((user) => {
            const isFollowed = followed[user.handle];
            const initials = user.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={user.handle} className="flex items-center gap-3">
                <Link href={`/profile/${user.handle}`} className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[var(--stamp-red-soft)] flex items-center justify-center text-[var(--stamp-red)] font-bold text-sm select-none">
                    {initials}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.handle}`} className="flex items-center gap-1 hover:underline">
                    <span className="text-sm font-semibold text-[var(--ink)] truncate">{user.name}</span>
                    {user.verified_items_count > 0 && (
                      <ShieldCheck size={13} className="text-[var(--verified-teal)] shrink-0" />
                    )}
                  </Link>
                  <p className="text-xs text-[var(--ink-faint)] truncate">@{user.handle}</p>
                </div>

                <button
                  onClick={() => toggle(user.handle)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                    isFollowed
                      ? "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink)]"
                      : "bg-[var(--stamp-red)] border-transparent text-white hover:bg-[var(--stamp-red-deep)]"
                  )}
                >
                  {isFollowed ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>

        <Link
          href="/search"
          className="mt-4 block text-xs text-[var(--stamp-red)] hover:underline font-medium"
        >
          Find more collectors →
        </Link>

        <p className="text-[11px] text-[var(--ink-ghost)] leading-6 mt-7">
          About · Help · Privacy · Terms<br />
          <span className="tracking-wide">© 2026 CollectorHub</span>
        </p>
      </div>
    </aside>
  );
}
