"use client";

// Closed beta: user-created communities and events go live without waiting for
// a Scorred review (backend settings.beta_auto_approve, exposed on the public
// /auth/providers). Create forms read it so they never promise "approval" that
// isn't happening — or promise "live now" once the flag is turned off.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const BETA_REVIEW_NOTE =
  "For the beta, auto-approval is on, so it's live right away. In the live app, the Scorred team will review it first.";

let cached: Promise<boolean> | null = null;

function fetchFlag(): Promise<boolean> {
  cached ??= api
    .get<{ beta_auto_approve?: boolean }>("/auth/providers")
    .then((p) => Boolean(p?.beta_auto_approve))
    .catch(() => false);
  return cached;
}

/** null while loading; then whether beta auto-approval is on. */
export function useBetaAutoApprove(): boolean | null {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetchFlag().then((v) => { if (live) setOn(v); });
    return () => { live = false; };
  }, []);
  return on;
}

/** Small info banner for create forms. */
export function BetaApprovalNote({ what }: { what: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "var(--grail-gold-soft, #FCF1DD)", color: "var(--ink-soft)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.5 }}>
      <span aria-hidden>⚡</span>
      <span>
        <strong style={{ color: "var(--ink)" }}>Beta: auto-approval is on.</strong> Your {what} goes live right away. In the live app, the Scorred team will review it first.
      </span>
    </div>
  );
}
