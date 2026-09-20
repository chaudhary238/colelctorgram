"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/auth-context";
import { UserProfile } from "@/components/UserProfile";
import { Button } from "@/components/ui";

/**
 * Sell-item intro (v8 ProfileView.jsx Sep-20) — shown when you arrive via Market's
 * "Sell item" CTA (`/profile?sell=1`). Selling starts from an item you already own
 * (its "List for sale" flip), and this modal teaches that rule at the exact moment
 * someone came looking for a standalone sell form.
 *
 * Same centred-modal shell as the "Add a new item" guidelines gate (ContributeGuidelines):
 * black/40 backdrop that does NOT tap-dismiss, 440px paper card, radius 18, pinned
 * Cancel/Accept pair. "Don't show this message again" persists as ch_hide_sell_hint
 * (v8's key) — once set, the ?sell=1 hop lands straight on the collection.
 *
 * Cancel = v8's pop(): you changed your mind, so go back to Market rather than
 * stranding you on My Space.
 */
function SellIntroModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsSell = searchParams.get("sell") === "1";
  // Lazy read is safe: this subtree only mounts client-side, after auth resolves.
  const [hiddenPref] = useState(() => {
    try {
      return localStorage.getItem("ch_hide_sell_hint") === "1";
    } catch {
      return false; // private mode — treat as not hidden
    }
  });
  const [dismissed, setDismissed] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const open = wantsSell && !hiddenPref && !dismissed;

  // Opted out earlier — consume the flag silently and land on the collection.
  useEffect(() => {
    if (wantsSell && hiddenPref) router.replace("/profile", { scroll: false });
  }, [wantsSell, hiddenPref, router]);

  if (!open) return null;

  const accept = () => {
    if (dontShow) {
      try {
        localStorage.setItem("ch_hide_sell_hint", "1");
      } catch {
        /* ignore */
      }
    }
    setDismissed(true);
    router.replace("/profile", { scroll: false }); // strip ?sell=1 so refresh doesn't re-open
  };
  const cancel = () => {
    setDontShow(false); // v8 — a ticked box doesn't persist through Cancel
    setDismissed(true);
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.replace("/profile", { scroll: false }); // cold deep-link — nowhere to pop to
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20 }}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sell an item"
        className="relative z-10 w-full max-w-[440px] bg-[var(--paper)] shadow-[var(--shadow-3)]"
        style={{ maxHeight: "min(86vh, 640px)", overflowY: "auto", borderRadius: 18, padding: "22px 22px 20px" }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, textAlign: "center", marginBottom: 6 }}>
          Sell an item
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-faint)", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
          You can only sell items already in your collection. Pick one below and choose
          &ldquo;List for sale&rdquo; on its page &mdash; or add it to your collection first, then list it.
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center", marginBottom: 18, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: "var(--stamp-red)" }}
          />
          <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Don&rsquo;t show this message again</span>
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={cancel}>Cancel</Button>
          <Button variant="dark" style={{ flex: 1, justifyContent: "center" }} onClick={accept}>Accept</Button>
        </div>
      </div>
    </div>
  );
}

export default function OwnProfilePage() {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="flex justify-start px-5">
      <div className="w-full max-w-[680px] min-h-screen border-x border-[var(--border)]">
        {/* useSearchParams consumer needs its own Suspense boundary for prerender. */}
        <Suspense fallback={null}>
          <SellIntroModal />
        </Suspense>
        <UserProfile handle={user.handle} isOwn={true} />
      </div>
    </div>
  );
}
