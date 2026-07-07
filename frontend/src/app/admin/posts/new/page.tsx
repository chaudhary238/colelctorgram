"use client";

import { useState } from "react";

const SEED_ACCOUNTS = [
  { handle: "collectohub_admin", name: "Scorred Official", role: "Admin" },
  { handle: "figurehead", name: "Figurehead", role: "Seed" },
  { handle: "blindbox_queen", name: "Blindbox Queen", role: "Seed" },
];

const CATEGORIES = ["figures", "designer", "kits", "diecast"];
const POST_TYPES = ["showcase", "discussion", "review"];

export default function SeedContentPage() {
  const [account, setAccount] = useState("collectohub_admin");
  const [type, setType] = useState("showcase");
  const [category, setCategory] = useState("figures");
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);

  const publish = () => {
    if (!body.trim()) return;
    setPosted(true);
    setTimeout(() => { setPosted(false); setBody(""); }, 2000);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Create seed post</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 28px" }}>Post as a seed account to prime the feed before organic UGC takes over.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", display: "block", marginBottom: 6 }}>Post as</label>
          <select value={account} onChange={(e) => setAccount(e.target.value)} style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }}>
            {SEED_ACCOUNTS.map((a) => <option key={a.handle} value={a.handle}>{a.name} ({a.role})</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", display: "block", marginBottom: 6 }}>Post type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }}>
              {POST_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", display: "block", marginBottom: 6 }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", display: "block", marginBottom: 6 }}>Post body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write the seed post…" style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.55, color: "var(--ink)", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>

        <button onClick={publish} disabled={!body.trim()} style={{ height: 48, borderRadius: 13, border: "none", background: body.trim() ? (posted ? "var(--forest)" : "var(--stamp-red)") : "var(--bone)", color: body.trim() ? "var(--paper)" : "var(--ink-ghost)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: body.trim() ? "pointer" : "not-allowed", transition: "background 200ms" }}>
          {posted ? "✓ Posted to feed" : "Post to feed"}
        </button>
      </div>
    </div>
  );
}
