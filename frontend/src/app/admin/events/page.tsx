"use client";

import { Flags, KV, Queue, UserLink, age, useConsole, type QItem } from "../_console";

const fmtWhen = (s: unknown, e: unknown) => {
  if (!s) return "—";
  const d = new Date(String(s));
  const day = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const t = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const end = e ? new Date(String(e)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : null;
  return `${day} · ${t}${end ? `–${end}` : ""}`;
};

export default function EventsQueue() {
  const { me } = useConsole();
  return (
    <Queue
      kind="events"
      title="Event approvals"
      sub={me?.beta_auto_approve
        ? "Beta: auto-approval is on — events go live at once and wait here for a review. Check venue, date and any payment link."
        : "Events go live after approval. Check venue, date and any payment link."}
      row={(e) => <><b>{String(e.title)}{e.auto_approved ? <span className="tag auto">Auto-approved</span> : null}</b>
        <span>{e.starts_at ? new Date(String(e.starts_at)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"} · {String(e.city ?? (e.mode === "online" ? "Online" : "—"))}</span></>}
      sla={(e) => (e.auto_approved ? null : 48)}
      nameOf={(e) => String(e.title)}
      targetOf={(e) => String(e.handle)}
      detail={(e: QItem) => <>
        <h2>{String(e.title)}</h2>
        {Boolean(e.auto_approved) && <div className="flag info">Live now (beta auto-approval). Approve to mark it reviewed; reject to take it down.</div>}
        <Flags flags={e.flags as string[]} />
        <KV rows={[[e.listed_by_staff ? "Listed by" : "Host", <><UserLink handle={String(e.handle)} /> · {String(e.host)}</>], ["When", fmtWhen(e.starts_at, e.ends_at)],
          ["Venue", [e.venue, e.city].filter(Boolean).join(", ") || "—"], ["Entry", String(e.pricing)],
          ["Ticket link", e.ticket ? <span className="warnt">{String(e.ticket)}</span> : ""], ["Contact", String(e.contact ?? "")],
          ["Community", String(e.community ?? "—")], ["Submitted", age(e.age_h)]]} />
        <div className="blk"><div className="mono">Description</div><p>{String(e.desc || "—")}</p></div>
      </>}
      actions={(e) => [
        { key: "approve", label: e.auto_approved ? "Mark reviewed" : "Approve", variant: "p" },
        { key: "changes", label: "Request changes" },
        { key: "reject", label: e.auto_approved ? "Take down" : "Reject", variant: "d" },
      ]}
    />
  );
}
