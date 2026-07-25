"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SeedAccount { id: string; handle: string; name: string; role: string }

const CATEGORIES = ["figures", "designer", "kits", "diecast", "tcg"];
const POST_TYPES = ["showcase", "discussion", "review"];

export default function SeedContentPage() {
  const [accounts, setAccounts] = useState<SeedAccount[]>([]);
  const [account, setAccount] = useState("");
  const [type, setType] = useState("showcase");
  const [category, setCategory] = useState("figures");
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<SeedAccount[]>("/admin/seed-accounts")
      .then((d) => {
        setAccounts(d ?? []);
        if (d && d.length) setAccount(d[0].handle);
      })
      .catch(console.error);
  }, []);

  const publish = async () => {
    if (!body.trim() || !account || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/seed-post", {
        account_handle: account,
        type,
        category,
        body: body.trim(),
      });
      setPosted(true);
      setTimeout(() => { setPosted(false); setBody(""); }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  const selectStyle = { width: "100%", height: 42, padding: "0 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" } as const;
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", display: "block", marginBottom: 6 } as const;

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Create seed post</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 28px" }}>Post as a seed account to prime the feed before organic UGC takes over.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={labelStyle}>Post as</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)} style={selectStyle}>
            {accounts.length === 0 && <option value="">Loading accounts…</option>}
            {accounts.map((a) => <option key={a.handle} value={a.handle}>{a.name} (@{a.handle} · {a.role})</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Post type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              {POST_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Post body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write the seed post…" style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.55, color: "var(--ink)", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>

        {error && <div style={{ fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

        <button onClick={publish} disabled={!body.trim() || !account || busy} style={{ height: 48, borderRadius: 13, border: "none", background: body.trim() && account ? (posted ? "var(--forest)" : "var(--stamp-red)") : "var(--bone)", color: body.trim() && account ? "var(--paper)" : "var(--ink-ghost)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: body.trim() && account && !busy ? "pointer" : "not-allowed", transition: "background 200ms" }}>
          {posted ? "✓ Posted to feed" : busy ? "Posting…" : "Post to feed"}
        </button>
      </div>
    </div>
  );
}
