"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface AdminStats {
  total_users: number;
  new_users_week: number;
  posts_today: number;
  active_listings: number;
  pending_reports: number;
  pending_communities: number;
  pending_events: number;
}

const QUICK_LINKS = [
  { href: "/admin/communities", label: "Review community requests" },
  { href: "/admin/events",      label: "Approve pending events" },
  { href: "/admin/moderation",  label: "Open moderation queue" },
  { href: "/admin/catalogue",   label: "Review catalogue submissions" },
  { href: "/admin/posts/new",   label: "Create seed post" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminStats>("/admin/stats")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = stats
    ? [
        { label: "Registered users", value: stats.total_users, delta: `+${stats.new_users_week} this week` },
        { label: "Posts today", value: stats.posts_today, delta: "last 24h" },
        { label: "Active listings", value: stats.active_listings, delta: "status: available" },
        { label: "Pending reports", value: stats.pending_reports, delta: "moderation queue" },
        { label: "Pending communities", value: stats.pending_communities, delta: "awaiting review" },
        { label: "Pending events", value: stats.pending_events, delta: "awaiting review" },
      ]
    : [];

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Scorred Admin</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 28px" }}>Overview · {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", height: 96 }}>
                <div style={{ width: "60%", height: 11, borderRadius: 6, background: "var(--bone)", marginBottom: 12 }} />
                <div style={{ width: "40%", height: 26, borderRadius: 6, background: "var(--bone)" }} />
              </div>
            ))
          : kpis.map((s) => (
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
