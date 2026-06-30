"use client";

import { useState } from "react";
import { Link2, Ban, Flag, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, Button } from "@/components/ui";

/* v3's 6 display reasons mapped onto the backend's 4 (spam|harassment|counterfeit|other);
   the full label rides along as `detail` so moderators keep the nuance. */
const REPORT_REASONS: { label: string; reason: string }[] = [
  { label: "Fake / impersonation", reason: "other" },
  { label: "Counterfeit / replica listings", reason: "counterfeit" },
  { label: "Scam or fraud attempt", reason: "other" },
  { label: "Harassment or abuse", reason: "harassment" },
  { label: "Spam", reason: "spam" },
  { label: "Other", reason: "other" },
];

type Stage = "menu" | "report" | "block";

export function ProfileMoreMenu({
  targetId, targetHandle, targetName, avatarUrl, onClose, onBlocked,
}: {
  targetId: string;
  targetHandle: string;
  targetName: string;
  avatarUrl: string | null;
  onClose: () => void;
  onBlocked: () => void;
}) {
  const [stage, setStage] = useState<Stage>("menu");
  const [reason, setReason] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/profile/${targetHandle}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    onClose();
  }

  async function doBlock() {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/blocks?target_id=${targetId}`);
      onBlocked();
      onClose();
    } catch {
      setBusy(false);
    }
  }

  async function doReport() {
    if (!reason || busy) return;
    setBusy(true);
    const picked = REPORT_REASONS.find((r) => r.label === reason)!;
    try {
      await api.post(`/reports`, {
        target_type: "user",
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

        {/* ── Main menu ── */}
        {stage === "menu" && (
          <div>
            {[
              { icon: <Link2 size={18} />, label: "Copy profile link", danger: false, onClick: copyLink },
              { icon: <Ban size={18} />, label: `Block @${targetHandle}`, danger: false, onClick: () => setStage("block") },
              { icon: <Flag size={18} />, label: `Report @${targetHandle}`, danger: true, onClick: () => { setReason(null); setStage("report"); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 cursor-pointer"
                style={{ background: "none", border: "none", color: item.danger ? "var(--stamp-red)" : "var(--ink)" }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: item.danger ? "var(--rose-tint-bg)" : "var(--paper-soft)", color: "inherit" }}>
                  {item.icon}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15 }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Report ── */}
        {stage === "report" && (
          <div>
            <div style={{ padding: "0 20px 10px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Report @{targetHandle}</div>
              <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 3 }}>Why are you reporting this account?</div>
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
        )}

        {/* ── Block confirm ── */}
        {stage === "block" && (
          <div>
            <div style={{ padding: "8px 20px 6px", textAlign: "center" }}>
              <Avatar name={targetName} photo={avatarUrl} size={56} />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginTop: 12 }}>Block @{targetHandle}?</div>
              <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 6, lineHeight: 1.55, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
                They won&apos;t be able to see your profile, listings or messages. You can unblock them anytime from Settings.
              </div>
            </div>
            <div className="flex flex-col gap-2" style={{ padding: "18px 20px 0" }}>
              <Button variant="primary" style={{ width: "100%", justifyContent: "center", background: "var(--stamp-red)", borderColor: "var(--stamp-red)" }} disabled={busy} onClick={doBlock}>
                Block @{targetHandle}
              </Button>
              <Button variant="secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setStage("menu")}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
