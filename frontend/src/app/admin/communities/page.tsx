"use client";

import { Flags, KV, Queue, UserLink, age, useConsole, type QItem } from "../_console";

export default function CommunitiesQueue() {
  const { me } = useConsole();
  return (
    <Queue
      kind="communities"
      title="Community requests"
      sub={me?.beta_auto_approve
        ? "Beta: auto-approval is on — new communities go live at once and wait here for a review. Reject takes one down."
        : "New communities wait here until approved. Target: decide within 48 h."}
      row={(c) => <><b>{String(c.name)}{c.auto_approved ? <span className="tag auto">Auto-approved</span> : null}</b><span>{String(c.privacy)} · by @{String(c.handle)}</span></>}
      sla={(c) => (c.auto_approved ? null : 48)}
      nameOf={(c) => String(c.name)}
      targetOf={(c) => String(c.handle)}
      detail={(c: QItem) => <>
        <h2>{String(c.name)}</h2>
        {Boolean(c.auto_approved) && <div className="flag info">Live now (beta auto-approval). Approve to mark it reviewed; reject to take it down.</div>}
        <Flags flags={c.flags as string[]} />
        <KV rows={[["Creator", <><UserLink handle={String(c.handle)} /> · {String(c.by)}</>], ["Category", String(c.category ?? "—")],
          ["Who can join", String(c.privacy)], ["Who can post", String(c.posting)], ["Submitted", age(c.age_h)]]} />
        <div className="blk"><div className="mono">Description</div><p>{String(c.desc || "—")}</p></div>
        {(c.rules as string[])?.length > 0 && <div className="blk"><div className="mono">Rules</div>{(c.rules as string[]).map((r) => <p key={r}>• {r}</p>)}</div>}
      </>}
      actions={(c) => [
        { key: "approve", label: c.auto_approved ? "Mark reviewed" : "Approve", variant: "p" },
        { key: "changes", label: "Request changes" },
        { key: "reject", label: c.auto_approved ? "Take down" : "Reject", variant: "d" },
      ]}
    />
  );
}
