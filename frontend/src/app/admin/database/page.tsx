"use client";

import { api } from "@/lib/api";
import { Flags, KV, Queue, UserLink, age, type QItem } from "../_console";

type Dupe = { sku: string; title: string; match: number; photos: string[] };

const loadEntry = (id: string) => api.get<QItem>(`/admin/console/queue/database/${encodeURIComponent(id)}`);

function Photos({ urls, small }: { urls: string[]; small?: boolean }) {
  return <div className="photos">{urls.length
    ? urls.map((u) => (
      <a key={u} href={u} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element -- R2 photos, admin-only thumbnails */}
        <img className={small ? "ph sm" : "ph"} src={u} alt="" />
      </a>
    ))
    : <div className={small ? "ph sm" : "ph"}>No photo</div>}</div>;
}

export default function DatabaseQueue() {
  return (
    <Queue
      kind="database"
      title="Database entries"
      sub="Tester-submitted entries are live straight away as “Pending Review”. Approving marks one Scorred Reviewed; remove takes it down."
      row={(d) => <><b>{String(d.title)}</b><span>{String(d.brand ?? "—")} · {String(d.category)} · @{String(d.handle)}</span></>}
      loadDetail={loadEntry}
      sla={() => 72}
      nameOf={(d) => String(d.title)}
      targetOf={(d) => (d.handle && d.handle !== "?" ? String(d.handle) : null)}
      detail={(d: QItem) => {
        const dupes = d.dupes as Dupe[];
        const photos = d.photos as string[];
        return <>
          <h2>{String(d.title)}</h2>
          <Flags flags={d.flags as string[]} />
          <Photos urls={photos} />
          {dupes.length > 0 && <div className="dupbox"><div className="mono">Possible duplicates</div>
            {dupes.map((x) => <div key={x.sku}>
              <div className="duprow"><span><a href={`/db/${encodeURIComponent(x.sku)}`} target="_blank" rel="noreferrer">{x.title}</a> <small>{x.sku}</small></span><b>{x.match}% match</b></div>
              <Photos urls={x.photos} small />
            </div>)}</div>}
          <KV rows={[["SKU", <a key="s" href={`/db/${encodeURIComponent(d.id)}`} target="_blank" rel="noreferrer">{d.id}</a>], ["Brand", String(d.brand ?? "—")],
            ["Category", String(d.category)], ["Scale", String(d.scale ?? "—")], ["Year", String(d.year ?? "—")], ["Est. value", String(d.value)],
            ["Submitted by", <><UserLink handle={String(d.handle)} /> · {age(d.age_h)}</>]]} />
          <div className="blk"><div className="mono">Description</div><p>{String(d.desc || "—")}</p></div>
        </>;
      }}
      actions={(d) => [
        { key: "approve", label: "Approve", variant: "p" },
        { key: "edit", label: "Edit & approve" },
        { key: "merge", label: (d.dupes as Dupe[] | undefined)?.length ? "Merge into existing" : "Merge…" },
        { key: "reject", label: "Remove", variant: "d" as const },
      ]}
    />
  );
}
