"use client";

/**
 * Who owns / wishlisted a catalogue entry — full screen, v8 ExploreView.jsx:529
 * `DbPeopleList` (founder QA 2026-09-06: the modal version rendered mispositioned
 * and wasn't the v8 design — v8 pushes a whole screen, one mode per visit, no tabs).
 *
 * Reached from the stats row on BOTH the /db/[sku] entry page and /item/[id]
 * (`?mode=owners|wishlist`). Rows are v8's: 44px avatar → name / @handle → a REAL
 * Follow/Following button (the modal only had a passive "Following" label).
 *
 * The wishlist mode can come back shorter than the headline count: aggregate counts
 * are public, but individual wishlists respect each owner's privacy (DF-23).
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { Avatar, EmptyNote } from "@/components/ui";
import { fireToast } from "@/components/gamification";

interface DbPerson {
  handle: string;
  name: string;
  avatar_url: string | null;
  is_following: boolean;
  is_me: boolean;
}

function DbPeopleInner() {
  const { sku } = useParams<{ sku: string }>();
  const mode = useSearchParams().get("mode") === "wishlist" ? "wishlist" : "owners";

  const [title, setTitle] = useState("");
  const [people, setPeople] = useState<DbPerson[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.get<{ title: string }>(`/catalogue/${encodeURIComponent(sku)}`)
      .then((e) => { if (alive) setTitle(e.title); })
      .catch(() => {});
    api.get<{ items: DbPerson[] }>(`/catalogue/${encodeURIComponent(sku)}/people?mode=${mode}`)
      // DV8 §3#24 — the viewer is never listed among the people (v8 ExploreView.jsx:536
      // filters out 'you'); your own copy/wishlist isn't news to you.
      .then((d) => { if (alive) setPeople(d.items.filter((p) => !p.is_me)); })
      .catch(() => { if (alive) setPeople([]); });
    return () => { alive = false; };
  }, [sku, mode]);

  async function toggleFollow(p: DbPerson) {
    if (busy) return;
    setBusy(p.handle);
    // Optimistic — the button flips immediately; a failure flips it back.
    setPeople((ps) => ps?.map((x) => (x.handle === p.handle ? { ...x, is_following: !p.is_following } : x)) ?? null);
    try {
      // DV8 §3#22 — v8 follow toasts (ExploreView.jsx:553). The follow response says
      // whether XP was actually granted (first-time follows only), so the +2 rides
      // the same line instead of firing a gold toast for a re-follow that earns 0.
      if (p.is_following) {
        await api.delete(`/users/${p.handle}/follow`);
        fireToast(`Unfollowed @${p.handle}`);
      } else {
        const res = await api.post<{ xp_granted?: boolean }>(`/users/${p.handle}/follow`);
        fireToast(`Following @${p.handle}${res.xp_granted ? " · +2 XP" : ""}`);
      }
    } catch {
      setPeople((ps) => ps?.map((x) => (x.handle === p.handle ? { ...x, is_following: p.is_following } : x)) ?? null);
    } finally {
      setBusy(null);
    }
  }

  const heading = mode === "owners" ? "Own this" : "Wishlisted";

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      {/* v8 DetailHeader — title with a "{item} · {count}" subtitle under it */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback={`/db/${encodeURIComponent(sku)}`} />
          {/* DV8 §3#20 — v8 DetailHeader type: title 19/700, subtitle 12 (Chrome.jsx:83-110) */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{heading}</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title || "…"}{people ? ` · ${people.length}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 0 24px" }}>
        {people === null ? (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bone-deep)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, width: 130, borderRadius: 6, background: "var(--bone)" }} />
                  <div style={{ height: 11, width: 90, borderRadius: 6, background: "var(--bone)", marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <div style={{ padding: "8px 20px" }}>
            <EmptyNote>
              {mode === "owners"
                ? "No one owns this yet."
                : "No wishlists to show — they may be private."}
            </EmptyNote>
          </div>
        ) : (
          people.map((p) => (
            /* Row padding '11px 20px' — v8 uses 16px gutters (:544), the 20px web
               gutter is deliberate (matches every other list on the web column). */
            <div key={p.handle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: "1px solid var(--border)" }}>
              <Link href={`/profile/${p.handle}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textDecoration: "none" }}>
                <Avatar name={p.name} photo={p.avatar_url} size={44} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink-faint)" }}>@{p.handle}</span>
                </span>
              </Link>
              {/* DV8 §3#21 — v8 shared Button sm (shared.jsx:567): h34, r9, fs13;
                  following = secondary's bone bg + ink-soft text. */}
              <button
                type="button"
                onClick={() => toggleFollow(p)}
                disabled={busy === p.handle}
                style={{
                  flexShrink: 0, height: 34, padding: "0 14px", borderRadius: 9,
                  cursor: busy === p.handle ? "wait" : "pointer",
                  fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13,
                  border: p.is_following ? "1px solid var(--border-strong)" : "1px solid var(--ink)",
                  background: p.is_following ? "var(--bone)" : "var(--ink)",
                  color: p.is_following ? "var(--ink-soft)" : "var(--paper)",
                }}
              >
                {p.is_following ? "Following" : "Follow"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DbPeoplePage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[680px]" style={{ padding: 20 }} />}>
      <DbPeopleInner />
    </Suspense>
  );
}
