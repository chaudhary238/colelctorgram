"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PendingCommunity {
  id: string;
  name: string;
  category: string;
  short_desc: string | null;
  description: string | null;
  rules: string[];
  post_mode: string;
  is_invite_only: boolean;
  founder_handle: string;
  founder_name: string;
  created_at: string;
}

export default function CommunitiesAdminPage() {
  const [pending, setPending] = useState<PendingCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [actioned, setActioned] = useState<{ name: string; action: "approved" | "rejected" }[]>([]);

  useEffect(() => {
    api.get<PendingCommunity[]>("/admin/communities/pending")
      .then((data) => setPending(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const act = async (c: PendingCommunity, action: "approved" | "rejected") => {
    if (busy) return;
    setBusy(c.id);
    try {
      await api.patch(`/admin/communities/${c.id}/${action === "approved" ? "approve" : "reject"}`);
      setPending((p) => p.filter((x) => x.id !== c.id));
      setActioned((a) => [...a, { name: c.name, action }]);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Community management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Review and approve community creation requests.</p>

      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Pending approval ({pending.length})</h2>
      {loading && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>}
      {!loading && pending.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>All caught up — no pending requests.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {pending.map((c) => (
          <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
                  @{c.founder_handle} · {c.category} · {c.is_invite_only ? "invite-only" : "public"} · posts: {c.post_mode}
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>{c.short_desc ?? c.description}</div>
                {c.rules.length > 0 && (
                  <ul style={{ margin: "10px 0 0", padding: "0 0 0 18px", fontSize: 12.5, color: "var(--ink-faint)", lineHeight: 1.6 }}>
                    {c.rules.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => act(c, "rejected")} disabled={busy === c.id} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>Reject</button>
                <button onClick={() => act(c, "approved")} disabled={busy === c.id} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {actioned.length > 0 && (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Actioned this session</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actioned.map(({ name, action }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: action === "approved" ? "var(--forest-soft)" : "var(--bone)", border: `1px solid ${action === "approved" ? "var(--forest)" : "var(--border)"}` }}>
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: action === "approved" ? "var(--forest)" : "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{action}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
