"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { shortDate } from "@/lib/utils";

interface PendingEvent {
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  mode: string;
  city: string | null;
  venue: string | null;
  cover_image_url: string | null;
  starts_at: string;
  host_handle: string;
  host_name: string;
  interested_count: number;
  created_at: string;
}

export default function EventsAdminPage() {
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actioned, setActioned] = useState<{ title: string; action: "approved" | "rejected" }[]>([]);

  useEffect(() => {
    api.get<PendingEvent[]>("/admin/events/pending")
      .then((data) => setPending(data ?? []))
      .catch((err) => { console.error(err); setLoadError(true); })
      .finally(() => setLoading(false));
  }, []);

  const act = async (e: PendingEvent, action: "approved" | "rejected") => {
    if (busy) return;
    setBusy(e.id);
    try {
      await api.patch(`/admin/events/${e.id}/${action === "approved" ? "approve" : "reject"}`);
      setPending((p) => p.filter((x) => x.id !== e.id));
      setActioned((a) => [...a, { title: e.title, action }]);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Events management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Review and approve user-submitted events before they go live.</p>

      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Pending approval ({pending.length})</h2>
      {loading && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>}
      {!loading && loadError && <div style={{ fontSize: 14, color: "var(--stamp-red)", padding: "20px 0" }}>Couldn&rsquo;t load the review queue. Retry in a moment.</div>}
      {!loading && !loadError && pending.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>All caught up — no events waiting for review.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {pending.map((e) => {
          const { day, month } = shortDate(e.starts_at);
          return (
            <div key={e.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 52, borderRadius: 10, background: "var(--paper)", border: "1px solid var(--border)", textAlign: "center", padding: "6px 0", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--stamp-red)" }}>{month}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{day}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
                    {e.mode === "online" ? "Online" : `${e.city ?? "TBA"} · In person`} · @{e.host_handle}{e.categories.length ? ` · ${e.categories.join(" · ")}` : ""}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-mute)", lineHeight: 1.4 }}>
                    {e.description ? e.description.slice(0, 160) + (e.description.length > 160 ? "…" : "") : "No description."}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => act(e, "rejected")} disabled={busy === e.id} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>Reject</button>
                  <button onClick={() => act(e, "approved")} disabled={busy === e.id} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Approve</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {actioned.length > 0 && (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Actioned this session</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actioned.map(({ title, action }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: action === "approved" ? "var(--forest-soft)" : "var(--bone)", border: `1px solid ${action === "approved" ? "var(--forest)" : "var(--border)"}` }}>
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{title}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: action === "approved" ? "var(--forest)" : "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{action}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
