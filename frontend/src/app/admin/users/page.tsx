"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead, STATUS_CLS, dateShort, useConsole } from "../_console";

interface Row { id: string; handle: string; name: string; city: string; joined: string | null; status: string; strikes: number; vouches: number; listings: number; reports: number; badges: string[]; group: string }

export default function UsersPage() {
  const { openUser } = useConsole();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get<Row[]>(`/admin/console/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`).then(setRows).catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const shown = (rows ?? []).filter((u) => group === "All" || u.group === group || (group === "Flagged" && (u.reports > 0 || u.status !== "Active")));
  return (
    <>
      <PageHead title="Users" sub="Search any account to see its history and take action."
        right={<input className="search" placeholder="Search name, @handle, email or city" value={q} onChange={(e) => setQ(e.target.value)} />} />
      <div className="fil">{["All", "Tester", "Team", "Flagged"].map((g) => <button key={g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>{g}</button>)}</div>
      <div className="card">
        {rows === null ? <div className="empty">Loading…</div> : !shown.length ? <div className="empty">No accounts match.</div> : (
          <table className="t">
            <thead><tr><th>User</th><th>Group</th><th>City</th><th>Joined</th><th>Status</th><th className="r">Strikes</th><th className="r">Vouches</th><th className="r">Listings</th><th className="r">Reports</th><th>Badges</th></tr></thead>
            <tbody>{shown.map((u) => (
              <tr key={u.id} className="click" onClick={() => openUser(u.handle)}>
                <td><b>{u.name}</b><div className="mut">@{u.handle}</div></td>
                <td><span className="tag">{u.group}</span></td>
                <td>{u.city}</td><td className="nw">{dateShort(u.joined)}</td>
                <td><span className={`st st-${STATUS_CLS[u.status] ?? "ok"}`}>{u.status}</span></td>
                <td className="r">{u.strikes}</td><td className="r">{u.vouches}</td><td className="r">{u.listings}</td>
                <td className={`r ${u.reports > 2 ? "warnt" : ""}`}>{u.reports}</td>
                <td>{u.badges.map((b) => <span key={b} className="bdg">{b === "Early Believer" ? "🌱 " : ""}{b}</span>)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
