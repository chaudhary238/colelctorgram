"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";


interface FollowUser {
  handle: string;
  name: string;
  avatar_url: string | null;
  tier: string;
}

interface FollowListModalProps {
  handle: string;
  tab: "followers" | "following";
  onClose: () => void;
}

export function FollowListModal({ handle, tab, onClose }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab);

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
    load(activeTab);
  }, [activeTab, load]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3 shrink-0">
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

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[var(--bone-deep)]" />
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
            <div className="space-y-1 py-2">
              {users.map((u) => (
                <Link
                  key={u.handle}
                  href={`/profile/${u.handle}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--bone)] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--bone-deep)] overflow-hidden shrink-0 flex items-center justify-center text-[var(--ink-faint)] font-bold text-sm">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">{u.name}</p>
                    <p className="text-xs text-[var(--ink-faint)]">@{u.handle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
