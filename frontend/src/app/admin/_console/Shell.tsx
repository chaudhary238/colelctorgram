"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { ScorredWordmark } from "@/components/ui";
import { ConsoleProvider, ROLE_LABEL, useConsole, type Counts } from ".";

type NavItem = { href: string; label: string; perm?: string; count?: keyof Counts };
const NAV: [string, NavItem[]][] = [
  ["Overview", [{ href: "/admin", label: "Overview" }, { href: "/admin/analytics", label: "Analytics" }]],
  ["Approvals", [
    { href: "/admin/communities", label: "Communities", perm: "approve", count: "communities" },
    { href: "/admin/events", label: "Events", perm: "approve", count: "events" },
    { href: "/admin/database", label: "Database entries", perm: "catalogue", count: "database" },
    { href: "/admin/official-posts", label: "Official posts", perm: "approve", count: "posts" },
  ]],
  ["Trust & safety", [
    { href: "/admin/reports", label: "Reports", perm: "reports", count: "reports" },
    { href: "/admin/appeals", label: "Appeals & grievances", perm: "appeals", count: "appeals" },
    { href: "/admin/users", label: "Users" },
  ]],
  ["Compliance", [
    { href: "/admin/data", label: "Data requests", perm: "data", count: "data" },
    { href: "/admin/audit", label: "Audit log" },
  ]],
  ["Admin", [
    { href: "/admin/announcements", label: "Announcements", perm: "announce" },
    { href: "/admin/team", label: "Team & roles" },
  ]],
  ["Tools", [
    { href: "/admin/catalogue", label: "Catalogue", perm: "catalogue" },
    { href: "/admin/posts/new", label: "Seed content" },
  ]],
];

function Frame({ children }: { children: React.ReactNode }) {
  const { me, counts, can } = useConsole();
  const path = usePathname();
  // Exact segment match — "/admin/data" must not light up on "/admin/database".
  const active = (href: string) => path === href || (href !== "/admin" && path.startsWith(href + "/"));
  return (
    <>
      <header className="bar">
        <Link href="/admin" aria-label="Admin home"><ScorredWordmark fontSize={18} /></Link>
        <span className="crumb">Admin console</span>
        {me?.beta_auto_approve && <span className="sample" title="Communities and events go live without waiting; review them here afterwards">Beta · auto-approve on</span>}
        <div className="me">
          <Link href="/feed" className="back">← Back to app</Link>
          {me && <span>{me.name} · {ROLE_LABEL[me.role] ?? me.role}</span>}
          <i>{(me?.name ?? "A").slice(0, 1).toUpperCase()}</i>
        </div>
      </header>
      <nav className="adm-side">
        {NAV.map(([group, items]) => {
          const visible = items.filter((i) => !i.perm || can(i.perm));
          if (!visible.length) return null;
          return (
            <div className="ng" key={group}>
              <div className="mono">{group}</div>
              {visible.map((i) => {
                const n = i.count && counts ? counts[i.count] : 0;
                return (
                  <Link key={i.href} href={i.href} className={`ni ${active(i.href) ? "on" : ""}`}>
                    <span>{i.label}</span>{n ? <b>{n}</b> : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <main className="adm-main">{children}</main>
    </>
  );
}

export function AdminShell({ fontClass, children }: { fontClass: string; children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className={fontClass ? `adm ${fontClass}` : "adm"}>
        <ConsoleProvider><Frame>{children}</Frame></ConsoleProvider>
      </div>
    </AdminGuard>
  );
}
