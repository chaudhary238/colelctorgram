"use client";

import { KV, Queue, UserLink, age, type QItem } from "../_console";

const SLA: Record<string, number> = { High: 24, Medium: 48, Low: 72 };
const TYPE_LABEL: Record<string, string> = { post: "Post", listing: "Listing", user: "User", message: "Message", comment: "Comment", catalogue: "Database" };
type Note = { by: string; text: string };
type Hist = { strikes: number; reports: number; age_days: number | null };

export default function ReportsQueue() {
  return (
    <Queue
      kind="reports"
      title="Reports"
      sub="User reports and automatic flags. High priority (scams, counterfeits) within 24 h."
      filters={["All", "High", "Listing", "User", "Post", "Message", "Comment"]}
      filterFn={(r, f) => r.priority === f || TYPE_LABEL[String(r.type)] === f}
      row={(r) => <><b><span className={`pr pr-${r.priority}`}>{String(r.priority)}</span>{String(r.reason_label)}</b><span>{TYPE_LABEL[String(r.type)] ?? String(r.type)} · {String(r.target)}</span></>}
      sla={(r) => SLA[String(r.priority)] ?? 72}
      nameOf={(r) => String(r.target)}
      targetOf={(r) => (r.user ? String(r.user) : null)}
      detail={(r: QItem) => {
        const h = r.history as Hist;
        const notes = r.notes as Note[];
        return <>
          <div className="rhead">
            <span className={`pr pr-${r.priority}`}>{String(r.priority)} priority</span>
            <span className="tag">{TYPE_LABEL[String(r.type)] ?? String(r.type)}</span>
            <span className="tag">{r.source === "System" ? "Auto-flag" : `${r.count} report${Number(r.count) > 1 ? "s" : ""}`}</span>
            {!r.exists && <span className="tag">Already removed</span>}
          </div>
          <h2>{String(r.reason_label)}</h2>
          {(r.reasons as string[]).length > 1 && <div className="mut">Also reported as: {(r.reasons as string[]).filter((x) => x !== r.reason_label).join(", ")}</div>}
          <KV rows={[["Reported", String(r.target)], ["Account", <UserLink key="u" handle={r.user as string | null} />], ["First reported", age(r.age_h)]]} />
          {Boolean(r.snap) && <div className="blk snap"><div className="mono">Reported content</div><p>{String(r.snap)}</p></div>}
          {notes.length > 0 && <div className="blk"><div className="mono">{r.source === "System" ? "Why it was flagged" : "Reporter notes"}</div>
            {notes.map((n, i) => <p key={i}>{r.source === "System" ? "" : <b>@{n.by}: </b>}{n.text}</p>)}</div>}
          {Boolean(r.user) && <div className="hist">
            <div><b>{h.strikes}</b><span>strikes</span></div>
            <div><b>{h.reports}</b><span>reports total</span></div>
            <div><b>{h.age_days === null ? "—" : h.age_days < 1 ? "<1 day" : `${h.age_days} days`}</b><span>account age</span></div>
          </div>}
        </>;
      }}
      actions={(r) => [
        { key: "dismiss", label: "Dismiss" },
        ...(r.removable && r.exists ? [{ key: "remove", label: "Remove content" }] : []),
        ...(r.user ? [{ key: "warn", label: "Warn user" }, { key: "suspend", label: "Suspend", variant: "d" as const }, { key: "ban", label: "Ban", variant: "d" as const }] : []),
      ]}
    />
  );
}
