"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { KV, Modal, Queue, UserLink, age, useConsole, type QItem } from "../_console";

export default function AppealsQueue() {
  const [logging, setLogging] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <>
      <Queue
        key={key}
        kind="appeals"
        title="Appeals & grievances"
        sub="Grievances: acknowledged automatically on submission; resolve within 15 days (India IT Rules 2021). Appeals within 7 days."
        extraTop={<div><button className="btn sm" onClick={() => setLogging(true)}>+ Log one received by email</button></div>}
        row={(a) => <><b><span className="tag">{a.kind === "grievance" ? "Grievance" : "Appeal"}</span> @{String(a.user)}</b><span>{String(a.about)}</span></>}
        sla={() => 24}
        nameOf={(a) => `your ${String(a.kind)}`}
        targetOf={(a) => String(a.user)}
        detail={(a: QItem) => <>
          <div className="rhead"><span className="tag">{a.kind === "grievance" ? "Grievance" : "Appeal"}</span><span className="tag">{a.source === "email" ? "By email" : "In app"}</span></div>
          <h2>@{String(a.user)}</h2>
          <KV rows={[["About", String(a.about)], ["Account", <UserLink key="u" handle={String(a.user)} />], ["Received", age(a.age_h)],
            ["Resolve by", a.kind === "grievance" ? "15 days from receipt" : "7 days from receipt"]]} />
          <div className="blk"><div className="mono">Their message</div><p>{String(a.text)}</p></div>
        </>}
        actions={() => [
          { key: "uphold", label: "Uphold" },
          { key: "partial", label: "Partially reverse" },
          { key: "reverse", label: "Reverse decision", variant: "p" },
        ]}
      />
      {logging && <LogAppeal onClose={() => setLogging(false)} onDone={() => { setLogging(false); setKey((k) => k + 1); }} />}
    </>
  );
}

function LogAppeal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { toast, refreshCounts } = useConsole();
  const [handle, setHandle] = useState("");
  const [kind, setKind] = useState("grievance");
  const [about, setAbout] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api.post("/admin/console/appeals", { handle, kind, about, text });
      toast("Logged ✓"); refreshCounts(); onDone();
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't log it", true); setBusy(false); }
  }
  return (
    <Modal title="Log an appeal or grievance" onClose={onClose}>
      <label className="fl">Account (@handle)<input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" /></label>
      <label className="fl">Type<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="grievance">Grievance</option><option value="appeal">Appeal</option></select></label>
      <label className="fl">About<input value={about} onChange={(e) => setAbout(e.target.value)} placeholder="e.g. Event rejected" /></label>
      <label className="fl">Their message<textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="mf"><button className="btn" onClick={onClose}>Cancel</button><button className="btn p" onClick={save} disabled={busy || !handle || text.length < 3}>Log it</button></div>
    </Modal>
  );
}
