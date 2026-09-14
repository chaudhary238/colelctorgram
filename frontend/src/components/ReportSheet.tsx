"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

/* W-48 — generic report sheet for posts / listings / comments (profiles use
   ProfileMoreMenu's report stage; catalogue entries use ReportCatalogueSheet).
   v3's display reasons mapped onto the backend's 4 (spam|harassment|counterfeit|other);
   the label rides along as `detail` so moderators keep the nuance. */
const REPORT_REASONS: { label: string; reason: string }[] = [
  /* v8 parity with ProfileMoreMenu — "Fake / impersonation" leads the list;
     DV8 §2#23 — the full v8 string keeps "listings" (ProfileView.jsx:31). */
  { label: "Fake / impersonation", reason: "other" },
  { label: "Counterfeit / replica listings", reason: "counterfeit" },
  { label: "Scam or fraud attempt", reason: "other" },
  { label: "Harassment or abuse", reason: "harassment" },
  { label: "Spam", reason: "spam" },
  { label: "Other", reason: "other" },
];

export function ReportSheet({
  targetType, targetId, title, onClose,
}: {
  targetType: "post" | "listing" | "comment";
  targetId: string;
  title: string; // e.g. "Report post"
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  // v8 (parity with ProfileMoreMenu) — a report needs a description too; submit
  // stays disabled until BOTH a reason is picked AND the note is non-empty.
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = Boolean(reason) && note.trim().length > 0;

  async function doReport() {
    if (!canSubmit || busy) return;
    setBusy(true);
    const picked = REPORT_REASONS.find((r) => r.label === reason)!;
    try {
      await api.post(`/reports`, {
        target_type: targetType,
        target_id: targetId,
        reason: picked.reason,
        // The description rides along after the display label so moderators see both.
        detail: `${picked.label} — ${note.trim()}`,
      });
      setSent(true);
      setTimeout(onClose, 1100);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.38)" }}
    >
      {/* DV8 §2#25 — v8 sheet chrome (ProfileView.jsx:117-146): r20 top corners,
          '8px 0 32px' shell padding, handle margin '8px auto 0', header '16px 20px 10px'. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--paper)]"
        style={{ borderRadius: "20px 20px 0 0", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", padding: "8px 0 32px" }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 0" }} />
        <div style={{ padding: "16px 20px 10px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{title}</div>
          <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 3 }}>Why are you reporting this?</div>
        </div>
        {sent ? (
          <div className="flex flex-col items-center gap-2.5" style={{ padding: "24px 0 8px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--paper-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={24} style={{ color: "var(--forest)" }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Report submitted</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>We&apos;ll review this within 24 hrs</div>
          </div>
        ) : (
          <>
            {REPORT_REASONS.map((r) => (
              <button
                key={r.label}
                onClick={() => setReason(r.label)}
                className="w-full flex items-center justify-between cursor-pointer"
                style={{ padding: "13px 20px", background: "none", border: "none", borderBottom: "1px solid var(--border)" }}
              >
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", fontWeight: reason === r.label ? 600 : 400 }}>{r.label}</span>
                {reason === r.label && <Check size={16} style={{ color: "var(--stamp-red)" }} />}
              </button>
            ))}
            {/* v8 — the what-happened note (300 chars, mono counter, red past 260). Required. */}
            <div style={{ padding: "12px 20px 0" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Tell us what happened</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="Describe the issue — what was said or done, and when."
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.5, color: "var(--ink)", outline: "none", resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: "var(--font-mono)", fontSize: 11, color: note.length > 260 ? "var(--stamp-red)" : "var(--ink-ghost)", marginTop: 4 }}>{note.length}/300</div>
            </div>
            {/* DV8 §2#25 — submit row '14px 20px 0'; the not-yet-submittable state is
                v8's still-styled primary at opacity 0.45 (onClick gated), NOT the Button
                component's washed-out disabled treatment. */}
            <div style={{ padding: "14px 20px 0" }}>
              <Button
                variant="primary"
                style={{ width: "100%", justifyContent: "center", opacity: canSubmit && !busy ? 1 : 0.45 }}
                onClick={canSubmit && !busy ? doReport : undefined}
              >
                Submit report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
