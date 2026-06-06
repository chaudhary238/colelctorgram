"use client";

import { useState } from "react";

const PENDING = [
  { id: "req-001", name: "Hot Toys India", category: "figures", description: "Dedicated community for Hot Toys 1/6 collectors in India.", founder: "aman_toys", members_target: 500, created_at: "2h ago" },
  { id: "req-002", name: "Gundam Wing Fan Club", category: "kits", description: "All Wing Gundam variants — TV series, EW, and Endless Waltz.", founder: "brickmaster", members_target: 300, created_at: "5h ago" },
  { id: "req-003", name: "Diecast 1:18 India", category: "diecast", description: "Large-scale diecast only — Norev, Autoart, CMC, Maisto Special.", founder: "karan_k", members_target: 200, created_at: "1d ago" },
];

export default function CommunitiesAdminPage() {
  const [pending, setPending] = useState(PENDING);
  const [actioned, setActioned] = useState<{ id: string; action: "approved" | "rejected" }[]>([]);

  const act = (id: string, action: "approved" | "rejected") => {
    setPending((p) => p.filter((c) => c.id !== id));
    setActioned((a) => [...a, { id, action }]);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Community management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Review and approve community creation requests.</p>

      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Pending approval ({pending.length})</h2>
      {pending.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>All caught up — no pending requests.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {pending.map((c) => (
          <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>@{c.founder} · {c.category} · {c.created_at}</div>
                <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>{c.description}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => act(c.id, "rejected")} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>Reject</button>
                <button onClick={() => act(c.id, "approved")} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {actioned.length > 0 && (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Actioned this session</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actioned.map(({ id, action }) => {
              const c = PENDING.find((p) => p.id === id)!;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: action === "approved" ? "var(--forest-soft)" : "var(--bone)", border: `1px solid ${action === "approved" ? "var(--forest)" : "var(--border)"}` }}>
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: action === "approved" ? "var(--forest)" : "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{action}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
