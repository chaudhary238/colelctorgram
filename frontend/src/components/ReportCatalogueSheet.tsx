"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { api } from "@/lib/api";

// DV6-13 — report a catalogue entry (reactive moderation). Entry stays live until an
// admin acts. Shared by item detail and the Scorred DB entry page (/db/[sku]).
const CATALOGUE_REPORT_REASONS = [
  "Wrong or misleading info",
  "Duplicate of another entry",
  "Bad or inappropriate image",
  "Counterfeit / bootleg",
  "Other",
];

export function ReportCatalogueSheet({ sku, onClose }: { sku: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason || sending) return;
    setSending(true);
    try {
      await api.post(`/catalogue/${encodeURIComponent(sku)}/report`, { reason });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] p-5">
        {done ? (
          <div className="flex flex-col items-center text-center py-4 gap-2">
            <div className="w-12 h-12 rounded-full bg-[var(--verified-teal-soft)] flex items-center justify-center"><Flag size={20} style={{ color: "var(--verified-teal)" }} /></div>
            <div className="text-sm font-semibold text-[var(--ink)]">Report submitted</div>
            <div className="text-xs text-[var(--ink-faint)]">Thanks — our team will take a look.</div>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-base text-[var(--ink)] mb-1" style={{ fontFamily: "var(--font-display)" }}>Report this entry</h2>
            <p className="text-xs text-[var(--ink-faint)] mb-4">What&rsquo;s wrong with it? It stays live until we review.</p>
            <div className="space-y-2">
              {CATALOGUE_REPORT_REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors"
                  style={{ borderColor: reason === r ? "var(--stamp-red)" : "var(--border)", background: reason === r ? "var(--stamp-red-soft)" : "var(--surface)" }}>
                  <span className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                    style={{ borderColor: reason === r ? "var(--stamp-red)" : "var(--border-strong)", background: reason === r ? "var(--stamp-red)" : "transparent" }}>
                    {reason === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-sm font-medium text-[var(--ink)]">{r}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border-strong)] text-[var(--ink)] font-semibold text-sm">Cancel</button>
              <button onClick={submit} disabled={!reason || sending}
                className="flex-1 h-11 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm disabled:opacity-50">
                {sending ? "Sending…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
