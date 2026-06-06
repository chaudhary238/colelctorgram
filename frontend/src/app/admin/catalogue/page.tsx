"use client";

import { useState } from "react";

const SUBMISSIONS = [
  { id: "cat-001", title: "Hot Toys MMS721 — Iron Man Mark 50", brand: "Hot Toys", category: "figures", scale: "1/6", year: "2024", submitter: "aman_toys", time: "1h ago" },
  { id: "cat-002", title: "Popmart Labubu The Monsters Tasty Macarons", brand: "Pop Mart", category: "designer", scale: "—", year: "2024", submitter: "blindbox_queen", time: "3h ago" },
  { id: "cat-003", title: "LEGO 75290 — Mos Eisley Cantina", brand: "LEGO", category: "kits", scale: "—", year: "2020", submitter: "brickmaster", time: "8h ago" },
  { id: "cat-004", title: "Mini GT 1:64 — Lamborghini Huracán STO", brand: "Mini GT", category: "diecast", scale: "1/64", year: "2023", submitter: "karan_k", time: "1d ago" },
];

export default function CatalogueAdminPage() {
  const [items, setItems] = useState(SUBMISSIONS);
  const [done, setDone] = useState<{ id: string; action: string }[]>([]);

  const act = (id: string, action: string) => {
    setItems((i) => i.filter((s) => s.id !== id));
    setDone((d) => [...d, { id, action }]);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Catalogue management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Review user-submitted products before they appear in search and collections.</p>

      {items.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>No pending submissions.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((s) => (
          <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                  {s.brand} · {s.category} · {s.scale !== "—" ? `${s.scale} · ` : ""}{s.year} · submitted by @{s.submitter} · {s.time}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => act(s.id, "rejected")} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", color: "var(--ink)" }}>Reject</button>
                <button onClick={() => act(s.id, "approved")} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
