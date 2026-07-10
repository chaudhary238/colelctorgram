"use client";

import Link from "next/link";
import { SealMark } from "@/components/ui";
import { AdminGuard } from "@/components/AdminGuard";

const ADMIN_NAV = [
  { href: "/admin",              label: "Overview" },
  { href: "/admin/posts/new",   label: "Seed content" },
  { href: "/admin/communities", label: "Communities" },
  { href: "/admin/events",      label: "Events" },
  { href: "/admin/moderation",  label: "Moderation" },
  { href: "/admin/catalogue",   label: "Catalogue" },
  { href: "/admin/analytics",   label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
    <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "var(--paper)", fontFamily: "var(--font-body)" }}>
      {/* Admin sidebar */}
      <nav style={{ width: 220, flexShrink: 0, height: "100vh", position: "sticky", top: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "24px 14px 20px", boxSizing: "border-box" }}>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 4px", marginBottom: 24, textDecoration: "none" }}>
          <SealMark size={24} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.03em", color: "var(--ink)" }}>Admin</span>
        </Link>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {ADMIN_NAV.map(({ href, label }) => (
            <Link key={href} href={href} style={{ padding: "9px 12px", borderRadius: 10, textDecoration: "none", color: "var(--ink)", fontSize: 14, fontWeight: 500, display: "block" }}
              className="admin-nav-item">
              {label}
            </Link>
          ))}
        </div>
        <Link href="/feed" style={{ padding: "9px 12px", borderRadius: 10, textDecoration: "none", color: "var(--ink-faint)", fontSize: 13, display: "block" }}>
          ← Back to app
        </Link>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: "32px 36px", overflowY: "auto", height: "100vh" }}>
        {children}
      </main>

      <style>{`
        .admin-nav-item:hover { background: var(--bone); }
      `}</style>
    </div>
    </AdminGuard>
  );
}
