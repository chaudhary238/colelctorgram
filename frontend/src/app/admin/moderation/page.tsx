"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

interface Report {
  id: string;
  reporter_handle: string | null;
  target_type: string; // post | listing | comment | user
  target_id: string | null;
  target_label: string | null;
  target_author_id: string | null;
  target_exists: boolean;
  reason: string;
  notes: string | null;
  created_at: string;
}

const REASON_COLOR: Record<string, string> = {
  spam: "var(--ink-mute)",
  harassment: "var(--stamp-red)",
  counterfeit: "var(--grail-gold-deep)",
  other: "var(--ink-faint)",
};

export default function ModerationPage() {
  const [queue, setQueue] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [actioned, setActioned] = useState<{ label: string; action: string }[]>([]);

  useEffect(() => {
    api.get<Report[]>("/admin/reports?status=pending")
      .then((d) => setQueue(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const resolve = async (id: string, action: "dismissed" | "actioned") =>
    api.patch(`/admin/reports/${id}/resolve?action=${action}`);

  const done = (r: Report, label: string) => {
    setQueue((q) => q.filter((x) => x.id !== r.id));
    setActioned((a) => [...a, { label: r.target_label ?? r.target_type, action: label }]);
  };

  const dismiss = async (r: Report) => {
    if (busy) return;
    setBusy(r.id);
    try { await resolve(r.id, "dismissed"); done(r, "dismissed"); }
    catch (e) { console.error(e); } finally { setBusy(null); }
  };

  const removeContent = async (r: Report) => {
    if (busy || r.target_type === "user" || !r.target_id) return;
    setBusy(r.id);
    const reason = `Report: ${r.reason}`;
    try {
      await api.delete(`/admin/${r.target_type}s/${r.target_id}?reason=${encodeURIComponent(reason)}`);
      await resolve(r.id, "actioned");
      done(r, "content removed");
    } catch (e) { console.error(e); } finally { setBusy(null); }
  };

  const suspend = async (r: Report) => {
    if (busy || !r.target_author_id) return;
    setBusy(r.id);
    try {
      await api.post(`/admin/users/${r.target_author_id}/suspend`);
      await resolve(r.id, "actioned");
      done(r, "user suspended");
    } catch (e) { console.error(e); } finally { setBusy(null); }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Moderation queue</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Reports submitted by the community. Act or dismiss.</p>

      {loading && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>}
      {!loading && queue.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Queue is clear.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {queue.map((r) => (
          <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: REASON_COLOR[r.reason] ?? "var(--ink-faint)", color: "var(--paper)" }}>{r.reason}</span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-faint)", textTransform: "uppercase" }}>{r.target_type}</span>
              {!r.target_exists && <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--stamp-red)", textTransform: "uppercase" }}>· already removed</span>}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-faint)" }}>{timeAgo(r.created_at)}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.target_label ?? `${r.target_type} ${r.target_id}`}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
              Reported by @{r.reporter_handle ?? "unknown"}{r.notes && ` — "${r.notes}"`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <button onClick={() => dismiss(r)} disabled={busy === r.id} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", color: "var(--ink)" }}>Dismiss</button>
              {r.target_type !== "user" && r.target_exists && (
                <button onClick={() => removeContent(r)} disabled={busy === r.id} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--grail-gold)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Remove content</button>
              )}
              {r.target_author_id && (
                <button onClick={() => suspend(r)} disabled={busy === r.id} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Suspend user</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {actioned.length > 0 && (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Actioned this session</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actioned.map(({ label, action }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: "var(--bone)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{action}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
