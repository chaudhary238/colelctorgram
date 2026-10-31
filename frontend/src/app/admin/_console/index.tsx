"use client";

// Admin console shared pieces — port of the Claude Design "Scorred Admin Console"
// (admin/admin-app.js): the context (me / counts / toast), the queue framework
// (list + detail + actions + J/K/A/R shortcuts), the decision modal, the user
// drawer and small render helpers. Data comes from /admin/console/* (backend
// routers/admin_console.py) — no sample data.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Me { id: string; name: string; handle: string; role: string; perms: string[]; beta_auto_approve: boolean }
export interface Counts { communities: number; events: number; database: number; reports: number; reports_high: number; appeals: number; data: number }
export interface AuditRow { id: string; t: string | null; who: string; action: string; target_type: string; obj: string; why: string; note: string | null; meta: Record<string, unknown> | null }

// ── Helpers ──────────────────────────────────────────────────────────────────
export const esc = (s: unknown) => (s ?? "") as string;
export const age = (h: number) => (h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`);
export const slaCls = (h: number, lim: number) => (h >= lim ? "sla-bad" : h >= lim * 0.75 ? "sla-warn" : "sla-ok");
export const when = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  const hm = d.toTimeString().slice(0, 5);
  if (d.toDateString() === today.toDateString()) return `Today ${hm}`;
  if (d.toDateString() === y.toDateString()) return `Yesterday ${hm}`;
  return `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })} ${hm}`;
};
export const dateShort = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");
export const ROLE_LABEL: Record<string, string> = { owner: "Owner", moderator: "Moderator", catalog: "Catalog editor", support: "Support" };

const ACTION_LABEL: Record<string, string> = {
  "community.approve": "Approved community", "community.changes": "Requested changes · community", "community.reject": "Rejected community",
  "event.approve": "Approved event", "event.changes": "Requested changes · event", "event.reject": "Rejected event",
  "catalogue.approve": "Approved DB entry", "catalogue.edit": "Edited & approved DB entry", "catalogue.merge": "Merged DB entry", "catalogue.reject": "Removed DB entry",
  "report.dismiss": "Dismissed report", "report.remove": "Removed content", "report.warn": "Warned user", "report.suspend": "Suspended user",
  "user.ban_request": "Ban requested · awaiting 2nd admin", "user.ban_confirm": "Banned user", "user.warn": "Warned user",
  "user.suspend": "Suspended user", "user.unsuspend": "Lifted suspension", "user.badge": "Gave badge", "user.unbadge": "Removed badge",
  "user.reset": "Sent password reset", "user.xp": "Added XP", "user.cancel_ban": "Cancelled ban request",
  "appeal.uphold": "Upheld decision", "appeal.reverse": "Reversed decision", "appeal.partial": "Partially reversed", "appeal.logged": "Logged appeal from email",
  "data.export": "Sent data export", "data.delete": "Deleted account", "data.reject": "Rejected data request", "data.logged": "Logged data request from email",
  "announce.send": "Sent announcement", "team.role": "Changed role", "team.remove": "Removed from team",
};
export function actLabel(a: AuditRow): string {
  const base = ACTION_LABEL[a.action] ?? a.action;
  const m = a.meta ?? {};
  if ((a.action === "report.suspend" || a.action === "user.suspend") && m.days) return `${base} · ${m.days} day${m.days === 1 ? "" : "s"}`;
  if (a.action === "user.xp" && m.amount) return `${base} · +${m.amount}`;
  if (m.was_auto_approved && a.action.endsWith(".approve")) return `${base} (was auto-approved)`;
  return base;
}

// ── Context ──────────────────────────────────────────────────────────────────
interface Ctx {
  me: Me | null;
  counts: Counts | null;
  refreshCounts: () => void;
  toast: (msg: string, err?: boolean) => void;
  can: (perm: string) => boolean;
  openUser: (handle: string) => void;
}
const ConsoleCtx = createContext<Ctx>({ me: null, counts: null, refreshCounts: () => {}, toast: () => {}, can: () => false, openUser: () => {} });
export const useConsole = () => useContext(ConsoleCtx);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);

  const refreshCounts = useCallback(() => {
    api.get<Counts>("/admin/console/counts").then(setCounts).catch(() => {});
  }, []);
  useEffect(() => {
    api.get<Me>("/admin/console/me").then(setMe).catch(() => {});
    refreshCounts();
  }, [refreshCounts]);

  const toast = useCallback((text: string, err = false) => {
    setMsg({ text, err });
    window.setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 2800);
  }, []);
  const value = useMemo<Ctx>(() => ({
    me, counts, refreshCounts, toast,
    can: (p) => Boolean(me?.perms.includes(p)),
    openUser: (h) => setDrawer(h),
  }), [me, counts, refreshCounts, toast]);

  return (
    <ConsoleCtx.Provider value={value}>
      {children}
      {drawer && <UserDrawer handle={drawer} onClose={() => setDrawer(null)} />}
      {msg && <div className={`adm-toast ${msg.err ? "err" : ""}`}>{msg.text}</div>}
    </ConsoleCtx.Provider>
  );
}

// ── Small renderers ──────────────────────────────────────────────────────────
export function Flags({ flags }: { flags?: string[] }) {
  if (!flags?.length) return null;
  return <div className="flags">{flags.map((f) => <div key={f} className="flag">⚠ {f}</div>)}</div>;
}
export function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && v !== "");
  return <dl className="kv">{shown.map(([k, v]) => <FragmentKV key={k} k={k} v={v} />)}</dl>;
}
function FragmentKV({ k, v }: { k: string; v: React.ReactNode }) {
  return <><dt>{k}</dt><dd>{v}</dd></>;
}
export function UserLink({ handle }: { handle?: string | null }) {
  const { openUser } = useConsole();
  if (!handle) return <>—</>;
  return <a href="#" onClick={(e) => { e.preventDefault(); openUser(handle); }}>@{handle}</a>;
}
export function PageHead({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return <div className="ph1"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{right}</div>;
}
export function Modal({ title, wide, onClose, children }: { title: React.ReactNode; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="adm-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`mbox ${wide ? "wide" : ""}`}>
        <div className="mh"><div>{typeof title === "string" ? <h2>{title}</h2> : title}</div><button className="x" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}
export function AuditTable({ rows }: { rows: AuditRow[] }) {
  if (!rows.length) return <div className="empty">No actions yet.</div>;
  return (
    <table className="t"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>On</th><th>Reason</th></tr></thead>
      <tbody>{rows.map((a) => (
        <tr key={a.id}><td className="nw">{when(a.t)}</td><td>{a.who}</td><td><b>{actLabel(a)}</b></td><td>{a.obj}</td>
          <td className="mut">{a.why || "—"}{a.note ? ` · note: ${a.note}` : ""}</td></tr>
      ))}</tbody></table>
  );
}

// ── Queue framework ──────────────────────────────────────────────────────────
export type QueueKind = "communities" | "events" | "database" | "reports" | "appeals";
export interface QItem { id: string; age_h: number; [k: string]: unknown }
export interface QAction { key: string; label: string; variant?: "p" | "d" | "" }

export const REASONS: Record<QueueKind, string[]> = {
  communities: ["Meets guidelines", "Duplicate of an existing community", "Promotes counterfeits / replicas", "Unclear purpose — needs a better description", "Inappropriate name or cover"],
  events: ["Meets guidelines", "Missing venue or date details", "Unverified payment / ticket link", "Misuses the Scorred name", "Not a collector event"],
  database: ["Accurate and complete", "Duplicate — merged into existing entry", "Not enough detail or photos", "Counterfeit / bootleg product", "Wrong category or brand"],
  reports: ["No violation found", "Counterfeit / replica", "Scam or fraud", "Harassment or abuse", "Spam", "Impersonation", "Other policy violation"],
  appeals: ["Decision upheld", "Decision reversed", "Partially reversed"],
};
const ACT_TITLE: Record<string, string> = {
  approve: "Approve", changes: "Request changes", reject: "Reject", edit: "Edit & approve", merge: "Merge into existing",
  dismiss: "Dismiss report", remove: "Remove content", warn: "Warn user", suspend: "Suspend user", ban: "Ban user",
  uphold: "Uphold decision", reverse: "Reverse decision", partial: "Partially reverse",
};

function msgFor(action: string, name: string, reason: string, days: number): string {
  switch (action) {
    case "approve": case "edit": return `Good news! “${name}” has been approved on Scorred.`;
    case "changes": return `Thanks for submitting “${name}”. Before we can approve it, please update: ${reason}. Edit it and it will be resubmitted.`;
    case "reject": return `“${name}” wasn't approved. Reason: ${reason}. You can appeal from Settings → Appeal a decision.`;
    case "merge": return `Thanks! “${name}” already exists in the database, so we've merged your details into it. You keep the credit.`;
    case "remove": return `Your content was removed for violating our Community Guidelines: ${reason}. You can appeal within 7 days from Settings.`;
    case "warn": return `This is a warning for: ${reason}. Repeated violations can lead to suspension.`;
    case "suspend": return `Your account is suspended for ${days} day${days === 1 ? "" : "s"} for: ${reason}. To appeal, email contact@scorred.com.`;
    case "ban": return `Your account has been permanently banned for: ${reason}. To appeal, email contact@scorred.com.`;
    case "reverse": return "We reviewed your appeal and reversed the decision. Sorry for the trouble.";
    case "partial": return "We reviewed your appeal and partly reversed the decision.";
    case "uphold": return `We reviewed your appeal. The original decision stands: ${reason}.`;
    default: return "";
  }
}

function defaultReason(kind: QueueKind, action: string, item: QItem): string {
  const r = REASONS[kind];
  if (action === "approve" || action === "edit") return r[0];
  if (action === "merge") return r[1];
  if (kind === "appeals") return action === "reverse" ? r[1] : action === "partial" ? r[2] : r[0];
  if (kind === "reports") {
    if (action === "dismiss") return r[0];
    const lbl = String(item.reason_label ?? "").toLowerCase();
    return r.find((x) => lbl && x.toLowerCase().startsWith(lbl.split(" ")[0])) ?? r[r.length - 1];
  }
  return r[1];
}

export function DecisionModal({ kind, item, action, name, target, onClose, onDone }: {
  kind: QueueKind; item: QItem; action: string; name: string; target: string | null;
  onClose: () => void; onDone: (result: string) => void;
}) {
  const { toast } = useConsole();
  const reasons = REASONS[kind];
  const [reason, setReason] = useState(defaultReason(kind, action, item));
  const [days, setDays] = useState(7);
  const [title, setTitle] = useState(String(item.title ?? ""));
  const dupes = (item.dupes as { sku: string; title: string; match: number }[] | undefined) ?? [];
  const [mergeInto, setMergeInto] = useState(dupes[0]?.sku ?? "");
  const [message, setMessage] = useState(msgFor(action, name, defaultReason(kind, action, item), 7));
  const [notify, setNotify] = useState(true);
  const [notifyReporters, setNotifyReporters] = useState(true);
  const [strike, setStrike] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const danger = ["reject", "suspend", "ban", "remove"].includes(action);
  const showsUserMessage = action !== "dismiss";

  const refresh = (r: string, d: number) => setMessage(msgFor(action, name, r, d));
  async function submit() {
    setBusy(true);
    try {
      const res = await api.post<{ result: string }>("/admin/console/decide", {
        queue: kind, id: item.id, action, reason, message: showsUserMessage ? message : "", notify: notify && showsUserMessage,
        notify_reporters: notifyReporters, strike, duration_days: days, note: note || null,
        title: action === "edit" ? title : null, merge_into: action === "merge" ? mergeInto : null,
      });
      onDone(res?.result ?? "done");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong", true);
      setBusy(false);
    }
  }

  return (
    <Modal title={ACT_TITLE[action] ?? action} onClose={onClose}>
      <label className="fl">Reason (shown in the audit log{showsUserMessage ? " and to the user" : ""})
        <select value={reason} onChange={(e) => { setReason(e.target.value); refresh(e.target.value, days); }}>
          {reasons.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      {action === "suspend" && (
        <label className="fl">Duration
          <select value={days} onChange={(e) => { const d = Number(e.target.value); setDays(d); refresh(reason, d); }}>
            <option value={1}>24 hours</option><option value={7}>7 days</option><option value={30}>30 days</option>
          </select>
        </label>
      )}
      {action === "edit" && <label className="fl">Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>}
      {action === "merge" && (
        <label className="fl">Merge into (SKU of the existing entry)
          <input value={mergeInto} onChange={(e) => setMergeInto(e.target.value)} placeholder="e.g. HT-MMS624D" list="adm-dupes" />
          <datalist id="adm-dupes">{dupes.map((d) => <option key={d.sku} value={d.sku}>{d.title} · {d.match}%</option>)}</datalist>
        </label>
      )}
      {showsUserMessage && target && (
        <label className="fl">Message to @{target}<textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
      )}
      <div className="chk">
        {showsUserMessage && target && <label><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify the user</label>}
        {kind === "reports" && <label><input type="checkbox" checked={notifyReporters} onChange={(e) => setNotifyReporters(e.target.checked)} /> Tell reporters the outcome</label>}
        {["remove", "warn", "suspend", "ban"].includes(action) && <label><input type="checkbox" checked={strike} onChange={(e) => setStrike(e.target.checked)} /> Add a strike</label>}
      </div>
      {action === "ban" && <div className="flag">Bans need a second admin. The first ban records a request; a different admin confirms it.</div>}
      <label className="fl">Internal note (team only)<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></label>
      <div className="mf">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? "d" : "p"}`} onClick={submit} disabled={busy}>{busy ? "Saving…" : ACT_TITLE[action] ?? action}</button>
      </div>
    </Modal>
  );
}

export function Queue({ kind, title, sub, row, detail, actions, filters, filterFn, sla, nameOf, targetOf, extraTop }: {
  kind: QueueKind; title: string; sub: React.ReactNode;
  row: (x: QItem) => React.ReactNode; detail: (x: QItem) => React.ReactNode;
  actions: (x: QItem) => QAction[];
  filters?: string[]; filterFn?: (x: QItem, f: string) => boolean;
  sla: (x: QItem) => number | null;
  nameOf: (x: QItem) => string; targetOf: (x: QItem) => string | null;
  extraTop?: React.ReactNode;
}) {
  const { refreshCounts, toast } = useConsole();
  const path = kind === "appeals" ? "/admin/console/appeals" : `/admin/console/queue/${kind}`;
  const [items, setItems] = useState<QItem[] | null>(null);
  const [error, setError] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<QItem[]>(path).then((d) => { setItems(d ?? []); setError(""); })
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load"));
  }, [path]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (items ?? []).filter((x) => !filterFn || filter === "All" || filterFn(x, filter)), [items, filter, filterFn]);
  const cur = shown.find((x) => x.id === sel) ?? shown[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (deciding || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName) || !cur) return;
      const i = shown.indexOf(cur);
      if (e.key === "j" || e.key === "k") {
        const n = shown[Math.max(0, Math.min(shown.length - 1, i + (e.key === "j" ? 1 : -1)))];
        if (n) setSel(n.id);
      }
      if (e.key === "a" || e.key === "r") {
        const keys = actions(cur).map((a) => a.key);
        const pick = e.key === "a" ? ["approve", "dismiss", "reverse"].find((k) => keys.includes(k))
          : ["reject", "remove", "uphold"].find((k) => keys.includes(k));
        if (pick) setDeciding(pick);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, shown, deciding, actions]);

  return (
    <>
      <PageHead title={title} sub={sub} right={<div className="kbd">Shortcuts: <b>J</b>/<b>K</b> next/prev · <b>A</b> approve · <b>R</b> reject</div>} />
      {extraTop}
      {filters && <div className="fil">{filters.map((f) => <button key={f} className={filter === f ? "on" : ""} onClick={() => { setFilter(f); setSel(null); }}>{f}</button>)}</div>}
      {error ? <div className="card empty">{error}</div> : (
        <div className="qwrap">
          <div className="qlist">
            {items === null ? <div className="empty">Loading…</div> : shown.length ? shown.map((x) => {
              const lim = sla(x);
              return (
                <button key={x.id} className={`qi ${cur && x.id === cur.id ? "on" : ""}`} onClick={() => setSel(x.id)}>
                  {row(x)}
                  {lim === null
                    ? <i className="sla-ok">auto-approved · live · {age(x.age_h)}</i>
                    : <i className={slaCls(x.age_h, lim)}>{age(x.age_h)}{x.age_h >= lim ? " · overdue" : ""}</i>}
                </button>
              );
            }) : <div className="empty">All clear. Nothing waiting. 🎉</div>}
          </div>
          <div className="qdet">
            {cur ? <>
              <div className="dbody">{detail(cur)}</div>
              <div className="dact">{actions(cur).map((a) => <button key={a.key} className={`btn ${a.variant ?? ""}`} onClick={() => setDeciding(a.key)}>{a.label}</button>)}</div>
            </> : <div className="empty">Select an item.</div>}
          </div>
        </div>
      )}
      {deciding && cur && (
        <DecisionModal kind={kind} item={cur} action={deciding} name={nameOf(cur)} target={targetOf(cur)}
          onClose={() => setDeciding(null)}
          onDone={(result) => {
            setDeciding(null); setSel(null);
            toast(`${ACT_TITLE[deciding] ?? deciding} ✓${result && result !== "done" ? ` · ${result}` : ""}`);
            load(); refreshCounts();
          }} />
      )}
    </>
  );
}

// ── User drawer ──────────────────────────────────────────────────────────────
interface UserDetail {
  id: string; handle: string; name: string; city: string; joined: string | null; status: string; strikes: number;
  vouches: number; listings: number; reports: number; badges: string[]; group: string; is_admin: boolean; email: string;
  xp: number; last_active_at: string | null; suspended_until: string | null; suspension_reason: string | null;
  first_start_badge: string | null; ban_requested_by: string | null; ban_reason: string | null; logged_in: boolean;
  open_reports: { reason: string; type: string; count: number }[]; history: AuditRow[];
}
export const STATUS_CLS: Record<string, string> = { Active: "ok", Warned: "warn", Suspended: "bad", "Ban pending": "bad", Banned: "bad" };

export function UserDrawer({ handle, onClose }: { handle: string; onClose: () => void }) {
  const { toast, can, refreshCounts } = useConsole();
  const [u, setU] = useState<UserDetail | null>(null);
  const [err, setErr] = useState("");
  const [act, setAct] = useState<string | null>(null);
  const load = useCallback(() => {
    api.get<UserDetail>(`/admin/console/users/${encodeURIComponent(handle)}`).then(setU)
      .catch((e) => setErr(e instanceof Error ? e.message : "No account found"));
  }, [handle]);
  useEffect(() => { load(); }, [load]);

  if (err) return <Modal title="User" onClose={onClose}><div className="empty">{err}</div></Modal>;
  if (!u) return <Modal title="User" onClose={onClose}><div className="empty">Loading…</div></Modal>;
  const staff = u.is_admin;
  const buttons: [string, string, string?][] = [
    ...(!staff ? [u.first_start_badge ? ["unbadge", "Remove badge"] : ["badge", "Give Early Believer badge"]] as [string, string][] : []),
    ["reset", "Send password reset"],
    ...(!staff ? [["xp", "Add XP"]] as [string, string][] : []),
    ...(!staff ? [["warn", "Warn"], ["suspend", "Suspend", "d"]] as [string, string, string?][] : []),
    ...(u.status === "Suspended" || u.status === "Banned" ? [["unsuspend", "Lift suspension / ban"]] as [string, string][] : []),
    ...(!staff && u.status !== "Banned" ? [[u.ban_requested_by ? "ban" : "ban", u.ban_requested_by ? "Confirm ban" : "Ban", "d"]] as [string, string, string][] : []),
    ...(u.ban_requested_by ? [["cancel_ban", "Cancel ban request"]] as [string, string][] : []),
  ];
  return (
    <Modal wide onClose={onClose} title={<><h2>{u.name}</h2><div className="mut">@{u.handle} · {u.city} · joined {dateShort(u.joined)} · <span className="tag">{u.group}</span></div></>}>
      <div className="mini">
        {([["Status", <span key="s" className={`st st-${STATUS_CLS[u.status] ?? "ok"}`}>{u.status}</span>], ["Strikes", u.strikes], ["Vouches", u.vouches],
          ["Listings", u.listings], ["Reports against", u.reports], ["XP", u.xp]] as [string, React.ReactNode][]).map(([k, v]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}
      </div>
      <KV rows={[["Email", u.email], ["Last active", when(u.last_active_at)], ["Logged in yet", u.logged_in ? "Yes" : "No — still on the starter password"],
        ["Suspended until", u.suspended_until ? when(u.suspended_until) : ""], ["Suspension reason", u.suspension_reason ?? ""],
        ["Ban requested by", u.ban_requested_by ? `${u.ban_requested_by} — ${u.ban_reason ?? ""}` : ""]]} />
      <div className="blk"><div className="mono">Badges</div><p>{u.badges.length ? u.badges.map((b) => <span key={b} className="bdg">{b === "Early Believer" ? "🌱 " : ""}{b}</span>) : "—"}</p></div>
      {u.open_reports.length > 0 && <div className="blk"><div className="mono">Open reports</div>{u.open_reports.map((r, i) => <p key={i}>• {r.reason} ({r.type}{r.count > 1 ? ` ×${r.count}` : ""})</p>)}</div>}
      {u.history.length > 0 && <div className="blk"><div className="mono">History</div><AuditTable rows={u.history} /></div>}
      {can("users") && <div className="dact wrap">{buttons.map(([k, l, v]) => <button key={k + l} className={`btn ${v ?? ""}`} onClick={() => setAct(k)}>{l}</button>)}</div>}
      {act && <UserActionModal user={u} action={act} onClose={() => setAct(null)} onDone={(result) => {
        setAct(null); toast(`Done ✓${result && result !== "done" ? ` · ${result}` : ""}`); load(); refreshCounts();
      }} />}
    </Modal>
  );
}

const USER_ACT: Record<string, { title: string; msg: (r: string, d: number, a: number) => string; reason?: boolean }> = {
  badge: { title: "Give Early Believer badge", msg: () => "You've earned the 🌱 Early Believer badge for being one of Scorred's first collectors. Thank you!" },
  unbadge: { title: "Remove badge", msg: () => "" },
  reset: { title: "Send password reset", msg: () => "" },
  xp: { title: "Add XP", msg: (_r, _d, a) => `The Scorred team added +${a} XP to your account. Thanks for helping build Scorred!` },
  warn: { title: "Warn user", reason: true, msg: (r) => `This is a warning for: ${r}. Repeated violations can lead to suspension.` },
  suspend: { title: "Suspend user", reason: true, msg: (r, d) => `Your account is suspended for ${d} day${d === 1 ? "" : "s"} for: ${r}. To appeal, email contact@scorred.com.` },
  unsuspend: { title: "Lift suspension / ban", msg: () => "Your account is active again. Welcome back." },
  ban: { title: "Ban user", reason: true, msg: (r) => `Your account has been permanently banned for: ${r}. To appeal, email contact@scorred.com.` },
  cancel_ban: { title: "Cancel ban request", msg: () => "" },
};

function UserActionModal({ user, action, onClose, onDone }: { user: UserDetail; action: string; onClose: () => void; onDone: (r: string) => void }) {
  const { toast } = useConsole();
  const spec = USER_ACT[action];
  const reasons = REASONS.reports.slice(1);
  const [reason, setReason] = useState(spec.reason ? reasons[3] : "Manual action");
  const [days, setDays] = useState(7);
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState(spec.msg(reasons[3], 7, 50));
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const upd = (r: string, d: number, a: number) => setMessage(spec.msg(r, d, a));
  async function go() {
    setBusy(true);
    try {
      const res = await api.post<{ result: string }>(`/admin/console/users/${user.id}/action`, {
        action, reason, days, amount, message, notify, badge: "early_believer",
      });
      onDone(res?.result ?? "done");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong", true);
      setBusy(false);
    }
  }
  return (
    <Modal title={`${spec.title} · @${user.handle}`} onClose={onClose}>
      {spec.reason && <label className="fl">Reason<select value={reason} onChange={(e) => { setReason(e.target.value); upd(e.target.value, days, amount); }}>{reasons.map((r) => <option key={r}>{r}</option>)}</select></label>}
      {action === "suspend" && <label className="fl">Duration<select value={days} onChange={(e) => { const d = Number(e.target.value); setDays(d); upd(reason, d, amount); }}><option value={1}>24 hours</option><option value={7}>7 days</option><option value={30}>30 days</option></select></label>}
      {action === "xp" && <label className="fl">XP to add (XP is never deducted)<input type="number" min={1} max={5000} value={amount} onChange={(e) => { const a = Number(e.target.value); setAmount(a); upd(reason, days, a); }} /></label>}
      {action === "ban" && <div className="flag">{user.ban_requested_by ? `Requested by ${user.ban_requested_by}. Confirming bans the account permanently.` : "This records a ban request. A second admin must confirm it."}</div>}
      {action === "reset" && <p className="mut">Emails {user.email} a one-time link to set a new password.</p>}
      {spec.msg(reason, days, amount) && <>
        <label className="fl">Message to @{user.handle}<textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <div className="chk"><label><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify the user</label></div>
      </>}
      <div className="mf"><button className="btn" onClick={onClose}>Cancel</button>
        <button className={`btn ${["suspend", "ban"].includes(action) ? "d" : "p"}`} onClick={go} disabled={busy}>{busy ? "Saving…" : spec.title}</button></div>
    </Modal>
  );
}
