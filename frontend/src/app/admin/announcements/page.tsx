"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal, PageHead, dateShort, useConsole } from "../_console";

interface Data {
  audiences: { key: string; label: string; count: number }[];
  sent: { id: string; title: string; audience: string; channels: string[]; recipients: number; emails_sent: number; opened_pct: number; created_at: string | null }[];
  email_configured: boolean;
}

export default function AnnouncementsPage() {
  const { toast } = useConsole();
  const [d, setD] = useState<Data | null>(null);
  const [audience, setAudience] = useState("testers");
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { api.get<Data>("/admin/console/announcements").then(setD).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const aud = d?.audiences.find((a) => a.key === audience);
  async function send() {
    setBusy(true);
    try {
      const r = await api.post<{ recipients: number; emails_sent: number }>("/admin/console/announcements", {
        audience, title, body, channels: [inApp && "in_app", email && "email"].filter(Boolean),
      });
      toast(`Sent to ${r.recipients} ✓${email ? ` · ${r.emails_sent} emails` : ""}`);
      setConfirm(false); setTitle(""); setBody(""); load();
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't send", true); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="Announcements" sub="Send an in-app notice (and optionally an email) to testers." />
      <div className="g2">
        <div className="card form">
          <label className="fl">Audience
            <select value={audience} onChange={(e) => setAudience(e.target.value)}>
              {(d?.audiences ?? []).map((a) => <option key={a.key} value={a.key}>{a.label} ({a.count})</option>)}
            </select>
          </label>
          <div className="fl">Channel
            <div className="chk">
              <label><input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} /> In-app notification</label>
              <label className={d?.email_configured ? "" : "off"} title={d?.email_configured ? "" : "Email isn't configured on the server (RESEND_API_KEY)"}>
                <input type="checkbox" checked={email} disabled={!d?.email_configured} onChange={(e) => setEmail(e.target.checked)} /> Email{d?.email_configured ? " (max 100/day)" : " (not configured)"}
              </label>
              <label className="off" title="Push arrives with the mobile app"><input type="checkbox" disabled /> Push (mobile app)</label>
            </div>
          </div>
          <label className="fl">Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New: pre-order reminders 🔔" maxLength={120} /></label>
          <label className="fl">Message<textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's new, and why it matters" maxLength={2000} /></label>
          <div className="mf"><button className="btn p" disabled={!title.trim() || !body.trim() || (!inApp && !email)} onClick={() => setConfirm(true)}>Send announcement</button></div>
        </div>
        <div className="card">
          <h3>Preview</h3>
          <div className="prev"><b>{title || "Title"}</b><p>{body || "Your message appears here."}</p></div>
          <h3 style={{ marginTop: 20 }}>Sent</h3>
          {!d?.sent.length ? <div className="empty">Nothing sent yet.</div> : (
            <table className="t"><tbody>{d.sent.map((s) => (
              <tr key={s.id}><td><b>{s.title}</b><div className="mut">{s.audience} · {dateShort(s.created_at)} · {s.recipients} people · opened {s.opened_pct}%{s.emails_sent ? ` · ${s.emails_sent} emails` : ""}</div></td></tr>
            ))}</tbody></table>
          )}
        </div>
      </div>
      {confirm && (
        <Modal title="Send announcement?" onClose={() => setConfirm(false)}>
          <p>“{title}” goes to <b>{aud?.count ?? 0}</b> {aud?.label.toLowerCase()} by {[inApp && "in-app notification", email && "email"].filter(Boolean).join(" and ")}. This can&rsquo;t be unsent.</p>
          <div className="mf"><button className="btn" onClick={() => setConfirm(false)}>Cancel</button><button className="btn p" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send now"}</button></div>
        </Modal>
      )}
    </>
  );
}
