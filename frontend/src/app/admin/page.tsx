"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuditTable, PageHead, useConsole, type AuditRow, type Counts } from "./_console";

interface Overview { counts: Counts; overdue: number; database_dupes: number; week: [string, string][]; recent: AuditRow[] }

export default function AdminOverview() {
  const router = useRouter();
  const { me } = useConsole();
  const [o, setO] = useState<Overview | null>(null);
  useEffect(() => { api.get<Overview>("/admin/console/overview").then(setO).catch(() => {}); }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const c = o?.counts;
  const cards: [string, string, number | undefined, string][] = [
    ["/admin/reports", "Open reports", c?.reports, `${c?.reports_high ?? 0} high priority`],
    ["/admin/communities", "Community requests", c?.communities, me?.beta_auto_approve ? "auto-approved · review" : "target 48 h"],
    ["/admin/events", "Event approvals", c?.events, me?.beta_auto_approve ? "auto-approved · review" : "target 48 h"],
    ["/admin/database", "Database entries", c?.database, `${o?.database_dupes ?? 0} possible duplicate${o?.database_dupes === 1 ? "" : "s"}`],
    ["/admin/appeals", "Appeals & grievances", c?.appeals, "ack within 24 h"],
    ["/admin/data", "Data requests", c?.data, "complete within 30 days"],
  ];
  return (
    <>
      <PageHead title={`${greet}, ${me?.name.split(" ")[0] ?? ""}`}
        sub={<>{o && o.overdue > 0 && <b className="warnt">{o.overdue} item{o.overdue > 1 ? "s are" : " is"} overdue. </b>}Here&rsquo;s what needs a decision.</>} />
      <div className="ocards">
        {cards.map(([href, label, n, sub]) => (
          <button key={href} className="oc" onClick={() => router.push(href)}>
            <span className="mono">{label}</span><b>{n ?? "–"}</b><span className="sub">{sub}</span>
          </button>
        ))}
      </div>
      <button className="oc" onClick={() => router.push("/admin/analytics")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="mono">Analytics</span>
          <span style={{ fontSize: 14 }}>Growth, signups and content — feature use lives in GA4 and the weekly DB report</span>
        </div>
        <span className="btn p">Open dashboard →</span>
      </button>
      <div className="g2">
        <div className="card"><h3>Recent actions</h3>{o ? <AuditTable rows={o.recent} /> : <div className="empty">Loading…</div>}</div>
        <div className="card"><h3>Moderation this week</h3>
          <div className="mini">{(o?.week ?? []).map(([k, v]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}</div>
        </div>
      </div>
    </>
  );
}
