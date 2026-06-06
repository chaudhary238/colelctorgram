const DAILY = [
  { date: "Jun 1", dau: 42, posts: 18, deals: 2 },
  { date: "Jun 2", dau: 51, posts: 24, deals: 3 },
  { date: "Jun 3", dau: 67, posts: 31, deals: 4 },
  { date: "Jun 4", dau: 89, posts: 38, deals: 5 },
  { date: "Jun 5", dau: 102, posts: 44, deals: 6 },
  { date: "Jun 6", dau: 124, posts: 38, deals: 7 },
];

const COHORT = [
  { label: "Action Figures", users: 38, pct: 31 },
  { label: "Designer Toys", users: 41, pct: 33 },
  { label: "Kits & Lego", users: 27, pct: 22 },
  { label: "Diecast", users: 18, pct: 14 },
];

export default function AnalyticsPage() {
  const maxDau = Math.max(...DAILY.map((d) => d.dau));

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Analytics</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 28px" }}>Phase 1 growth metrics · PostHog dashboard embed (wired on production).</p>

      {/* DAU chart (bar) */}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 16px" }}>Daily active users — last 6 days</h2>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 160, marginBottom: 32, padding: "0 0 0 4px" }}>
        {DAILY.map((d) => (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-mute)" }}>{d.dau}</div>
            <div style={{ width: "100%", background: "var(--stamp-red)", borderRadius: "4px 4px 0 0", height: Math.round((d.dau / maxDau) * 120) }} />
            <div style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>{d.date}</div>
          </div>
        ))}
      </div>

      {/* Posts + deals table */}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>Posts & deals</h2>
      <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "var(--bone)", padding: "10px 16px", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-faint)" }}>
          <span>Date</span><span>Posts</span><span>Deals</span>
        </div>
        {DAILY.map((d, i) => (
          <div key={d.date} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "11px 16px", fontSize: 14, borderTop: i === 0 ? "1px solid var(--border)" : "none", borderBottom: i < DAILY.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span>{d.date}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{d.posts}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{d.deals}</span>
          </div>
        ))}
      </div>

      {/* Interest cohort */}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>User interest breakdown</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {COHORT.map((c) => (
          <div key={c.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-faint)" }}>{c.users} users · {c.pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--bone)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${c.pct}%`, background: "var(--stamp-red)", borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: "16px 20px", borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>PostHog integration</div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>Full PostHog dashboard is embedded on production at /admin/analytics. Init W-44 is pending — add the PostHog script to app/layout.tsx with the project API key from env.</div>
      </div>
    </div>
  );
}
