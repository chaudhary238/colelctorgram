"use client";

import { useState } from "react";

const REPORTS = [
  { id: "r-001", kind: "post", target: "Post by @figurehead — NECA Alien showcase", reason: "spam", reporter: "anon_user", time: "15m ago", detail: "Seems like a duplicate of yesterday's post" },
  { id: "r-002", kind: "user", target: "@scalper_99", reason: "harassment", reporter: "blindbox_queen", time: "2h ago", detail: "Sent multiple unsolicited DMs with price manipulation tactics" },
  { id: "r-003", kind: "listing", target: "Listing: Kaws Dissected (comm-003) by @blindbox_queen", reason: "counterfeit", reporter: "arjun_collects", time: "5h ago", detail: "Photos look like they're from a known bootleg seller" },
  { id: "r-004", kind: "comment", target: "Comment on PG Unicorn post", reason: "spam", reporter: "anon_user", time: "1d ago", detail: null },
];

const REASON_COLOR: Record<string, string> = {
  spam: "var(--ink-mute)",
  harassment: "var(--stamp-red)",
  counterfeit: "var(--grail-gold-deep)",
  other: "var(--ink-faint)",
};

export default function ModerationPage() {
  const [queue, setQueue] = useState(REPORTS);
  const [actioned, setActioned] = useState<{ id: string; action: string }[]>([]);

  const act = (id: string, action: string) => {
    setQueue((q) => q.filter((r) => r.id !== id));
    setActioned((a) => [...a, { id, action }]);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Moderation queue</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Reports submitted by the community. Act or dismiss.</p>

      {queue.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Queue is clear.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {queue.map((r) => (
          <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--paper-soft)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: REASON_COLOR[r.reason] ?? "var(--ink-faint)", color: "var(--paper)" }}>{r.reason}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-faint)", textTransform: "uppercase" }}>{r.kind}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-faint)" }}>{r.time}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.target}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Reported by @{r.reporter}{r.detail && ` — "${r.detail}"`}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <button onClick={() => act(r.id, "dismissed")} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", color: "var(--ink)" }}>Dismiss</button>
              <button onClick={() => act(r.id, "content_removed")} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--grail-gold)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Remove content</button>
              <button onClick={() => act(r.id, "user_suspended")} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Suspend user</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
