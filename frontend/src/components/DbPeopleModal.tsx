"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, EmptyNote } from "@/components/ui";

/**
 * Who owns / wishlisted a Scorred DB entry (design_v7 app/ExploreView.jsx → DbPeopleList,
 * DV7-02). v7 pushes a full screen; the web shows a modal, matching how followers and
 * vouches already open from a tappable stat (FollowListModal / VouchListModal).
 *
 * The wishlist tab can come back shorter than the headline count: aggregate counts are
 * public, but individual wishlists respect each owner's wishlist privacy (DF-23).
 */

interface DbPerson {
  handle: string;
  name: string;
  avatar_url: string | null;
  is_following: boolean;
  is_me: boolean;
}

export type DbPeopleMode = "owners" | "wishlist";

export function DbPeopleModal({
  sku,
  title,
  mode: initialMode,
  onClose,
}: {
  sku: string;
  title: string;
  mode: DbPeopleMode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<DbPeopleMode>(initialMode);
  // Cached per tab, so switching back doesn't refetch — and `people === null` (the
  // skeleton) falls out of the cache miss instead of a synchronous reset in the effect.
  const [byMode, setByMode] = useState<Partial<Record<DbPeopleMode, DbPerson[]>>>({});
  const people = byMode[mode] ?? null;

  useEffect(() => {
    if (byMode[mode]) return;
    let alive = true;
    const put = (items: DbPerson[]) => { if (alive) setByMode((prev) => ({ ...prev, [mode]: items })); };
    api.get<{ items: DbPerson[] }>(`/catalogue/${encodeURIComponent(sku)}/people?mode=${mode}`)
      .then((d) => put(d.items))
      .catch(() => put([]));
    return () => { alive = false; };
  }, [sku, mode, byMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "owners" ? "Collectors who own this" : "Collectors who want this"}
        className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[70vh]"
      >
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3 shrink-0">
          <div className="flex gap-6 flex-1">
            {(["owners", "wishlist"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  mode === m ? "border-[var(--ink)] text-[var(--ink)]" : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }`}
              >
                {m === "owners" ? "Own this" : "Wishlisted"}
              </button>
            ))}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-2.5 pb-1 shrink-0 text-[12px] text-[var(--ink-faint)] truncate">{title}</div>

        <div className="overflow-y-auto py-1">
          {people === null ? (
            <div className="px-4 py-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[var(--bone-deep)]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-[var(--bone)]" />
                    <div className="h-3 w-20 rounded bg-[var(--bone)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : people.length === 0 ? (
            <div className="px-4 py-3">
              <EmptyNote>
                {mode === "owners"
                  ? "No one has this on their shelf yet."
                  : "No wishlists to show — they may be private."}
              </EmptyNote>
            </div>
          ) : (
            people.map((p) => (
              <Link
                key={p.handle}
                href={`/profile/${p.handle}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bone)]"
                style={{ textDecoration: "none" }}
              >
                <Avatar name={p.name} photo={p.avatar_url} size={40} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold text-[var(--ink)] truncate">{p.name}</span>
                  <span className="block text-[12px] text-[var(--ink-faint)] truncate">@{p.handle}</span>
                </span>
                {p.is_me ? (
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--verified-teal)] shrink-0">You</span>
                ) : p.is_following ? (
                  <span className="text-[11px] font-semibold text-[var(--ink-faint)] shrink-0">Following</span>
                ) : null}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
