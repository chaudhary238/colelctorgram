"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal, PageHead, ROLE_LABEL, when, useConsole } from "../_console";

interface Data {
  team: { id: string; name: string; handle: string; email: string; role: string; last_active_at: string | null }[];
  roles: string[];
  perms: Record<string, string[]>;
}
const PERM_ROWS: [string, string][] = [
  ["approve", "Approve communities & events"], ["catalogue", "Approve database entries"], ["reports", "Handle reports"],
  ["users", "Warn / suspend users"], ["ban", "Ban users (needs 2nd admin)"], ["appeals", "Appeals & grievances"],
  ["data", "Data deletion & export"], ["announce", "Announcements"], ["team", "Manage team & roles"],
];

export default function TeamPage() {
  const { me, can, toast } = useConsole();
  const [d, setD] = useState<Data | null>(null);
  const [inviting, setInviting] = useState(false);
  const load = useCallback(() => { api.get<Data>("/admin/console/team").then(setD).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);
  const owner = can("team");

  async function setRole(handle: string, role: string) {
    try { await api.post("/admin/console/team", { handle, role }); toast("Role updated ✓"); load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn't update", true); }
  }
  async function remove(id: string) {
    try { await api.delete(`/admin/console/team/${id}`); toast("Removed from team"); load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn't remove", true); }
  }

  return (
    <>
      <PageHead title="Team & roles" sub="Give each person only the access they need. Every action is recorded in the audit log."
        right={owner ? <button className="btn p" onClick={() => setInviting(true)}>Add teammate</button> : null} />
      <div style={{ display: "grid", gap: 12 }}>
        <div className="card">
          <table className="t"><thead><tr><th>Name</th><th>Role</th><th>Last active</th><th></th></tr></thead>
            <tbody>{(d?.team ?? []).map((t) => (
              <tr key={t.id}>
                <td><b>{t.name}</b><div className="mut">@{t.handle} · {t.email}</div></td>
                <td>{owner && t.id !== me?.id
                  ? <select value={t.role} onChange={(e) => setRole(t.handle, e.target.value)} style={{ border: "1px solid var(--line2)", borderRadius: 8, padding: "4px 6px", background: "var(--card)" }}>
                      {(d?.roles ?? []).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  : <span className="tag">{ROLE_LABEL[t.role] ?? t.role}</span>}</td>
                <td className="nw">{when(t.last_active_at)}</td>
                <td className="r">{owner && t.id !== me?.id && <button className="btn sm" onClick={() => remove(t.id)}>Remove</button>}</td>
              </tr>
            ))}</tbody></table>
          <p className="note">Team accounts are staff accounts: they sit outside rewards and XP, and their posts show as “Scorred · Official”. Use a separate staff account rather than your personal collector account.</p>
        </div>
        <div className="card">
          <h3>Permissions</h3>
          <table className="t perm"><thead><tr><th></th>{(d?.roles ?? []).map((r) => <th key={r}>{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>{PERM_ROWS.map(([p, label]) => (
              <tr key={p}><td>{label}</td>{(d?.roles ?? []).map((r) => {
                const y = d?.perms[r]?.includes(p);
                return <td key={r} className={`c ${y ? "y" : ""}`}>{y ? "✓" : "—"}</td>;
              })}</tr>
            ))}</tbody></table>
          <p className="note">Everyone on the team can view users and the audit log.</p>
        </div>
      </div>
      {inviting && <AddMember roles={d?.roles ?? []} onClose={() => setInviting(false)} onDone={() => { setInviting(false); load(); }} />}
    </>
  );
}

function AddMember({ roles, onClose, onDone }: { roles: string[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useConsole();
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("moderator");
  async function save() {
    try { await api.post("/admin/console/team", { handle, role }); toast("Added to team ✓"); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn't add", true); }
  }
  return (
    <Modal title="Add a teammate" onClose={onClose}>
      <p className="mut">They need a Scorred account first. Adding them makes it a staff account (outside rewards; posts show as “Scorred · Official”).</p>
      <label className="fl">Account (@handle)<input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" /></label>
      <label className="fl">Role<select value={role} onChange={(e) => setRole(e.target.value)}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>
      <div className="mf"><button className="btn" onClick={onClose}>Cancel</button><button className="btn p" onClick={save} disabled={!handle}>Add to team</button></div>
    </Modal>
  );
}
