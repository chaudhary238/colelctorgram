"use client";

import { useState } from "react";
import { Users, MessageSquare, Plus } from "lucide-react";
import { MOCK_COMMUNITIES } from "@/lib/mock";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All" },
  { id: "figures", label: "Figures" },
  { id: "designer", label: "Designer" },
  { id: "kits", label: "Kits" },
  { id: "diecast", label: "Diecast" },
];

export default function CommunityPage() {
  const [tab, setTab] = useState("all");
  const [memberships, setMemberships] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_COMMUNITIES.map((c) => [c.id, c.is_member]))
  );

  const communities =
    tab === "all"
      ? MOCK_COMMUNITIES
      : MOCK_COMMUNITIES.filter((c) => c.category === tab);

  function toggleJoin(id: string) {
    setMemberships((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Communities
          </h1>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--stamp-red)] text-white hover:bg-[var(--stamp-red-deep)] transition-colors">
            <Plus size={13} strokeWidth={2.5} />
            Create
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex border-t border-[var(--border)] overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium shrink-0 border-b-2 transition-colors",
                tab === t.id
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-mute)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        {communities.map((c) => {
          const joined = memberships[c.id];
          return (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--paper)] overflow-hidden hover:shadow-[var(--shadow-1)] transition-shadow cursor-pointer"
            >
              {/* Accent bar */}
              <div className="h-1.5 w-full" style={{ background: c.accent }} />

              <div className="p-4 flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: `color-mix(in srgb, ${c.accent} 12%, var(--bone))` }}
                >
                  {c.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--ink)] truncate">{c.name}</p>
                      <p className="text-xs text-[var(--ink-faint)] mt-0.5 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleJoin(c.id)}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                        joined
                          ? "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink)]"
                          : "bg-[var(--stamp-red)] border-transparent text-white hover:bg-[var(--stamp-red-deep)]"
                      )}
                    >
                      {joined ? "Joined" : "Join"}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]">
                      <Users size={11} />
                      {c.member_count.toLocaleString()} members
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--ink-faint)]">
                      <MessageSquare size={11} />
                      {c.post_count.toLocaleString()} posts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
