"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PendingCatalogue {
  sku: string;
  title: string;
  brand: string | null;
  category: string | null;
}

export default function CatalogueAdminPage() {
  const [items, setItems] = useState<PendingCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<{ title: string; action: string }[]>([]);

  useEffect(() => {
    api.get<PendingCatalogue[]>("/admin/catalogue/pending")
      .then((d) => setItems(d ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const act = async (s: PendingCatalogue, action: "approved" | "rejected") => {
    if (busy) return;
    setBusy(s.sku);
    try {
      // approve → mark approved; reject → take the submission down (status=removed)
      await api.patch(`/admin/catalogue/${encodeURIComponent(s.sku)}/${action === "approved" ? "approve" : "remove"}`);
      setItems((i) => i.filter((x) => x.sku !== s.sku));
      setDone((d) => [...d, { title: s.title, action }]);
    } catch (e) { console.error(e); } finally { setBusy(null); }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Catalogue management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Review user-submitted products before they appear in search and collections.</p>

      {loading && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>}
      {!loading && items.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>No pending submissions.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {items.map((s) => (
          <div key={s.sku} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                  {[s.brand, s.category, s.sku].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => act(s, "rejected")} disabled={busy === s.sku} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", color: "var(--ink)" }}>Reject</button>
                <button onClick={() => act(s, "approved")} disabled={busy === s.sku} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Reviewed this session</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {done.map(({ title, action }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, background: action === "approved" ? "var(--forest-soft)" : "var(--bone)", border: `1px solid ${action === "approved" ? "var(--forest)" : "var(--border)"}` }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: action === "approved" ? "var(--forest)" : "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{action}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
