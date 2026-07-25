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
  { label: "Counterfeit / replica", reason: "counterfeit" },
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
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doReport() {
    if (!reason || busy) return;
    setBusy(true);
    const picked = REPORT_REASONS.find((r) => r.label === reason)!;
    try {
      await api.post(`/reports`, {
        target_type: targetType,
        target_id: targetId,
        reason: picked.reason,
        detail: picked.label,
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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.38)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl sm:mb-4"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.12)", padding: "8px 0 28px" }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "8px auto 14px" }} />
        <div style={{ padding: "0 20px 10px" }}>
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
            <div style={{ padding: "14px 20px 0" }}>
              <Button variant="primary" style={{ width: "100%", justifyContent: "center" }} disabled={!reason || busy} onClick={doReport}>
                Submit report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
