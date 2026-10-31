"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuditTable, PageHead, actLabel, type AuditRow } from "../_console";

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  useEffect(() => { api.get<AuditRow[]>("/admin/console/audit?limit=1000").then(setRows).catch(() => setRows([])); }, []);

  function exportCsv() {
    const lines = [["When", "Who", "Action", "On", "Reason", "Note"].join(",")];
    for (const a of rows ?? []) lines.push([a.t ?? "", a.who, actLabel(a), a.obj, a.why, a.note ?? ""].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const el = document.createElement("a");
    el.href = url; el.download = `scorred-audit-${new Date().toISOString().slice(0, 10)}.csv`; el.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHead title="Audit log" sub="Every admin decision, who made it and why. Entries can't be edited or deleted."
        right={<button className="btn" onClick={exportCsv} disabled={!rows?.length}>Export CSV</button>} />
      <div className="card">{rows === null ? <div className="empty">Loading…</div> : <AuditTable rows={rows} />}</div>
    </>
  );
}
