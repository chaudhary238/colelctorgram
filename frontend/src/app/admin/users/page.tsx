"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal, PageHead, STATUS_CLS, dateShort, useConsole } from "../_console";

interface Row { id: string; handle: string; name: string; city: string; joined: string | null; status: string; strikes: number; vouches: number; listings: number; reports: number; badges: string[]; group: string }

export default function UsersPage() {
  const { openUser, can } = useConsole();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get<Row[]>(`/admin/console/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`).then(setRows).catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, reload]);

  const shown = (rows ?? []).filter((u) => group === "All" || u.group === group || (group === "Flagged" && (u.reports > 0 || u.status !== "Active")));
  return (
    <>
      <PageHead title="Users" sub="Search any account to see its history and take action."
        right={<>
          <input className="search" placeholder="Search name, @handle, email or city" value={q} onChange={(e) => setQ(e.target.value)} />
          {can("users") && <button className="btn p" onClick={() => setAdding(true)}>Add testers</button>}
        </>} />
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
      {adding && <AddTesters onClose={() => setAdding(false)} onAdded={() => setReload((n) => n + 1)} />}
    </>
  );
}

interface AddResult { email: string; handle: string | null; status: "created" | "exists" | "invalid" }
const RESULT_LABEL: Record<AddResult["status"], string> = { created: "Created", exists: "Already has an account", invalid: "Not a valid email" };

/* Adds beta testers the way scripts/provision_beta_users.py does: verified email,
   provisional @handle, the shared starter password, forced reset on first login. */
function AddTesters({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { toast } = useConsole();
  const [emails, setEmails] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<AddResult[] | null>(null);
  const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);

  async function save() {
    setBusy(true);
    try {
      const r = await api.post<{ results: AddResult[]; created: number }>("/admin/console/testers", { emails: list, password });
      setResults(r.results);
      if (r.created) onAdded();
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't add testers", true); }
    finally { setBusy(false); }
  }

  const created = (results ?? []).filter((r) => r.status === "created");
  const shareText = created.map((r) => `${r.email}\nUsername: ${r.handle}\nPassword: ${password}`).join("\n\n")
    + "\n\nLog in at https://beta.scorred.com — you'll be asked to set your own password.";

  return (
    <Modal title="Add beta testers" onClose={onClose}>
      {results ? (
        <>
          <table className="t"><thead><tr><th>Email</th><th>Username</th><th>Result</th></tr></thead>
            <tbody>{results.map((r) => (
              <tr key={r.email}><td>{r.email}</td><td>{r.handle ? `@${r.handle}` : "—"}</td>
                <td><span className={`st st-${r.status === "created" ? "ok" : "warn"}`}>{RESULT_LABEL[r.status]}</span></td></tr>
            ))}</tbody></table>
          {created.length > 0 && <p className="note">They log in with their email or username and the starter password, then must set their own password.</p>}
          <div className="mf">
            {created.length > 0 && <button className="btn" onClick={() => { navigator.clipboard.writeText(shareText).then(() => toast("Login details copied ✓")).catch(() => toast("Couldn't copy", true)); }}>Copy login details</button>}
            <button className="btn p" onClick={onClose}>Done</button>
          </div>
        </>
      ) : (
        <>
          <p className="mut">Each person gets an account straight away. They sign in with the starter password and must set their own on first login.</p>
          <label className="fl">Emails (one per line, or separated by commas)
            <textarea rows={5} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={"name@gmail.com\nfriend@gmail.com"} />
          </label>
          <label className="fl">Starter password (min 8 characters — share it with them)
            <input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
          </label>
          <div className="mf">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn p" onClick={save} disabled={busy || !list.length || password.length < 8}>
              {busy ? "Adding…" : `Add ${list.length || ""} tester${list.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
