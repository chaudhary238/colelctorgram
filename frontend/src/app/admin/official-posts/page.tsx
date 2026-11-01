"use client";

import { KV, Queue, UserLink, age, type QItem } from "../_console";
import { splitOfficialLink } from "@/lib/utils";

export default function OfficialPostsQueue() {
  return (
    <Queue
      kind="posts"
      title="Official posts"
      sub="Drafted release posts. Nothing shows to users until it's approved here, and it publishes at that moment, so approve each one when you want it in the feed."
      row={(p) => <><b>{String(p.title || "Untitled")}</b><span>by @{String(p.handle)}</span></>}
      sla={() => 48}
      nameOf={(p) => String(p.title || "Untitled")}
      targetOf={() => null}
      detail={(p: QItem) => {
        const link = splitOfficialLink(String(p.body));
        return <>
          <h2>{String(p.title || "Untitled")}</h2>
          <KV rows={[["Posts as", <><UserLink handle={String(p.handle)} /> · Scorred · Official</>],
            ["Link", link.url ? <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a> : "None"],
            ["Tags", (p.tags as string[]).join(" ")], ["Drafted", age(p.age_h)]]} />
          <div className="blk"><div className="mono">Post text</div><p style={{ whiteSpace: "pre-line" }}>{link.text}</p></div>
        </>;
      }}
      actions={() => [
        { key: "approve", label: "Approve & publish", variant: "p" },
        { key: "edit", label: "Edit & publish" },
        { key: "reject", label: "Reject", variant: "d" },
      ]}
    />
  );
}
