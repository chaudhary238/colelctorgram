"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal, PageHead, UserLink, useConsole } from "../_console";

interface Req { id: string; user: string; user_id: string; email: string | null; kind: "delete" | "export"; source: string; note: string | null; age_d: number }

export default function DataRequestsPage() {
  const { toast, refreshCounts } = useConsole();
  const [rows, setRows] = useState<Req[] | null>(null);
  const [confirm, setConfirm] = useState<Req | null>(null);
  const [logging, setLogging] = useState(false);
  const load = useCallback(() => { api.get<Req[]>("/admin/console/data-requests").then(setRows).catch(() => setRows([])); }, []);
  useEffect(() => { load(); }, [load]);

  async function complete(r: Req, action: "export_sent" | "delete" | "reject") {
    try {
      await api.post(`/admin/console/data-requests/${r.id}/complete`, { action });
      toast(action === "delete" ? "Account deleted ✓" : action === "reject" ? "Request rejected" : "Marked as sent ✓");
      setConfirm(null); load(); refreshCounts();
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't complete", true); }
  }
  async function download(r: Req) {
    try {
      const data = await api.get<unknown>(`/admin/console/data-requests/${r.id}/export`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = `scorred-data-${r.user}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast(e instanceof Error ? e.message : "Export failed", true); }
  }

  return (
    <>
      <PageHead title="Data requests"
        sub="Account deletion and data export requests. Complete within 30 days, as the Privacy Policy promises (DPDP Act 2023)."
        right={<button className="btn" onClick={() => setLogging(true)}>+ Log request from email</button>} />
      <div className="card">
        {rows === null ? <div className="empty">Loading…</div> : !rows.length ? <div className="empty">No open requests.</div> : (
          <table className="t">
            <thead><tr><th>User</th><th>Request</th><th>Received</th><th>Due</th><th>Source</th><th></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td><UserLink handle={r.user} /><div className="mut">{r.email}</div></td>
                <td><b>{r.kind === "delete" ? "Delete account" : "Export my data"}</b></td>
                <td>{r.age_d}d ago</td>
                <td className={30 - r.age_d < 7 ? "warnt" : ""}>in {30 - r.age_d} days</td>
                <td className="mut">{r.note ?? r.source}</td>
                <td className="r" style={{ whiteSpace: "nowrap" }}>
                  {r.kind === "export" ? <>
                    <button className="btn sm" onClick={() => download(r)}>Download export</button>{" "}
                    <button className="btn sm p" onClick={() => complete(r, "export_sent")}>Mark sent</button>
                  </> : <button className="btn sm d" onClick={() => setConfirm(r)}>Verify &amp; delete</button>}
                  {" "}<button className="btn sm" onClick={() => complete(r, "reject")}>Reject</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <p className="note">Before deleting: confirm the request came from the registered email. Deleting erases personal details (name, email, bio, photo, city), takes posts, comments and unsold listings down, and locks the account. Collection records stay, attached to the anonymous account. Exports download as JSON — email the file to the user, then mark it sent.</p>
      </div>
      {confirm && (
        <Modal title={`Delete @${confirm.user}?`} onClose={() => setConfirm(null)}>
          <p>This erases the account&rsquo;s personal data and can&rsquo;t be undone. Only continue if the request came from <b>{confirm.email}</b>.</p>
          <div className="mf"><button className="btn" onClick={() => setConfirm(null)}>Cancel</button><button className="btn d" onClick={() => complete(confirm, "delete")}>Delete account</button></div>
        </Modal>
      )}
      {logging && <LogRequest onClose={() => setLogging(false)} onDone={() => { setLogging(false); load(); refreshCounts(); }} />}
    </>
  );
}

function LogRequest({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { toast } = useConsole();
  const [handle, setHandle] = useState("");
  const [kind, setKind] = useState("delete");
  const [note, setNote] = useState("Email to contact@scorred.com");
  async function save() {
    try { await api.post("/admin/console/data-requests", { handle, kind, note }); toast("Logged ✓"); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : "Couldn't log it", true); }
  }
  return (
    <Modal title="Log a data request" onClose={onClose}>
      <label className="fl">Account (@handle)<input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" /></label>
      <label className="fl">Request<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="delete">Delete account</option><option value="export">Export my data</option></select></label>
      <label className="fl">Note<input value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="mf"><button className="btn" onClick={onClose}>Cancel</button><button className="btn p" onClick={save} disabled={!handle}>Log it</button></div>
    </Modal>
  );
}
