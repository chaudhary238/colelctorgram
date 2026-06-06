import Link from "next/link";

const STATS = [
  { label: "Registered users", value: "124", delta: "+12 this week" },
  { label: "Posts today", value: "38", delta: "+8 vs yesterday" },
  { label: "Active listings", value: "61", delta: "6 added today" },
  { label: "Deals this week", value: "14", delta: "↑ from 9 last week" },
  { label: "DAU / MAU", value: "21%", delta: "Target: 20–25%" },
  { label: "Pending approvals", value: "7", delta: "3 communities · 4 events" },
];

const QUICK_LINKS = [
  { href: "/admin/communities", label: "Review community requests" },
  { href: "/admin/events",      label: "Approve pending events" },
  { href: "/admin/moderation",  label: "Open moderation queue" },
  { href: "/admin/catalogue",   label: "Review catalogue submissions" },
  { href: "/admin/posts/new",   label: "Create seed post" },
];

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", margin: "0 0 6px" }}>CollectorHub Admin</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 28px" }}>Overview · Phase 1 · {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 6 }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Quick actions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {QUICK_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--paper)", textDecoration: "none", color: "var(--ink)", fontSize: 14, fontWeight: 500 }}>
            {label}
            <span style={{ color: "var(--ink-faint)" }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
