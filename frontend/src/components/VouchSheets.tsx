"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Shield, Check, Repeat, ShoppingBag, Users, Globe } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Avatar, TierChip, Button } from "@/components/ui";

/* Relation taxonomy — mirrors v3 ProfileView VOUCH_RELATIONS / VouchView REL. */
export const VOUCH_RELATIONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "app", label: "Traded on Scorred", icon: <Repeat size={18} /> },
  { id: "offapp", label: "Traded off-app", icon: <ShoppingBag size={18} /> },
  { id: "person", label: "Met in person", icon: <Users size={18} /> },
  { id: "community", label: "Known from a community", icon: <Globe size={18} /> },
  { id: "friend", label: "Trusted collector friend", icon: <Shield size={18} /> },
];
export const relationLabel = (id: string | null) =>
  VOUCH_RELATIONS.find((r) => r.id === id)?.label ?? "Vouched";

interface VouchRow {
  handle: string;
  name: string;
  avatar_url: string | null;
  tier: string;
  relation: string | null;
  note: string | null;
  created_at: string;
}

/* ── Sheet chrome (bottom sheet on mobile, centred card on desktop) ── */
function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[80vh]">
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center border-b border-[var(--border)] px-4 py-3 shrink-0">
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }} className="flex-1">
        {title}
      </span>
      <button onClick={onClose} className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors">
        <X size={18} />
      </button>
    </div>
  );
}

/* ── Give / edit a vouch ───────────────────────────────────────────── */
export function VouchGiveSheet({
  targetHandle, targetName, existing, onClose, onSaved,
}: {
  targetHandle: string;
  targetName: string;
  existing: { relation: string | null; note: string | null } | null;
  onClose: () => void;
  onSaved: (next: { relation: string; note: string } | null) => void;
}) {
  const editing = !!existing;
  const [rel, setRel] = useState<string | null>(existing?.relation ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const [busy, setBusy] = useState(false);
  const first = targetName.split(" ")[0];

  async function send() {
    if (!rel || busy) return;
    setBusy(true);
    try {
      await api.post(`/users/${targetHandle}/vouch`, { relation: rel, note: note || null });
      onSaved({ relation: rel, note });
      onClose();
    } catch {
      setBusy(false);
    }
  }
  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      await api.delete(`/users/${targetHandle}/vouch`);
      onSaved(null);
      onClose();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title={editing ? "Edit vouch" : `Vouch for ${first}`} onClose={onClose} />
      <div className="overflow-y-auto px-4 py-4">
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 12 }}>
          <Shield size={18} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            A vouch is your personal endorsement — it doesn&apos;t need a sale or trade. Vouch for anyone you trust, including people you know from outside Scorred.
          </p>
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 18 }}>
          How do you know them?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
          {VOUCH_RELATIONS.map((r) => {
            const on = rel === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRel(r.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "12px 14px", borderRadius: 13,
                  border: `1.5px solid ${on ? "var(--verified-teal)" : "var(--border-strong)"}`,
                  background: on ? "var(--verified-teal-soft)" : "var(--paper-soft)",
                }}
              >
                <span style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: on ? "var(--verified-teal)" : "var(--bone)", color: on ? "var(--paper)" : "var(--ink-mute)",
                }}>{r.icon}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.label}</span>
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${on ? "var(--verified-teal)" : "var(--border-strong)"}`, background: on ? "var(--verified-teal)" : "transparent", color: "var(--paper)",
                }}>{on && <Check size={12} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 18 }}>
          Add a note (optional)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={`Why do you vouch for ${first}?`}
          style={{ width: "100%", marginTop: 10, padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", resize: "none", fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
        />

        <Button variant="teal" style={{ width: "100%", justifyContent: "center", marginTop: 18 }} disabled={!rel || busy} onClick={send}>
          {editing ? "Update vouch" : `Vouch for ${first}`}
        </Button>
        {editing && (
          <button
            onClick={remove}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 mt-2.5 py-2 rounded-full text-sm font-semibold border transition-colors"
            style={{ color: "var(--stamp-red)", borderColor: "var(--stamp-red)", background: "transparent" }}
          >
            <X size={16} /> Remove vouch
          </button>
        )}
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          Your vouch will appear on @{targetHandle}&apos;s profile.
        </p>
      </div>
    </Sheet>
  );
}

/* ── Vouches received / given list ─────────────────────────────────── */
export function VouchListModal({
  handle, mode, onClose,
}: {
  handle: string;
  mode: "received" | "given";
  onClose: () => void;
}) {
  const [active, setActive] = useState<"received" | "given">(mode);
  const [rows, setRows] = useState<VouchRow[] | null>(null);

  const load = useCallback(async (m: "received" | "given") => {
    setRows(null);
    try {
      setRows(await api.get<VouchRow[]>(`/users/${handle}/vouches?mode=${m}`));
    } catch {
      setRows([]);
    }
  }, [handle]);

  useEffect(() => { load(active); }, [active, load]);

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center border-b border-[var(--border)] px-4 py-3 shrink-0">
        <div className="flex gap-6 flex-1">
          {(["received", "given"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`text-sm font-semibold capitalize pb-1 border-b-2 transition-colors ${
                active === t ? "border-[var(--ink)] text-[var(--ink)]" : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-2 py-2">
        {rows === null ? (
          <div className="space-y-3 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-[var(--bone-deep)]" />
                <div className="space-y-1.5"><div className="h-3 w-28 rounded bg-[var(--bone-deep)]" /><div className="h-2.5 w-20 rounded bg-[var(--bone)]" /></div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)] text-center py-10">
            {active === "received" ? "No vouches yet." : "Hasn't vouched for anyone yet."}
          </p>
        ) : (
          rows.map((u) => (
            <Link
              key={u.handle}
              href={`/profile/${u.handle}`}
              onClick={onClose}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[var(--bone)] transition-colors"
            >
              <Avatar name={u.name} photo={u.avatar_url} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--ink)] truncate">{u.name}</span>
                  <TierChip tier={u.tier} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Shield size={12} strokeWidth={2} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
                  <span className="text-xs text-[var(--ink-faint)] truncate">{u.note || relationLabel(u.relation)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Sheet>
  );
}

/* ── Request a vouch — ask people you follow ───────────────────────── */
interface PersonRow { handle: string; name: string; avatar_url: string | null; tier: string }

export function VouchRequestModal({ myHandle, onClose }: { myHandle: string; onClose: () => void }) {
  const [people, setPeople] = useState<PersonRow[] | null>(null);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // v4: ask anyone who knows you — connections first, then other collectors
    // (not just people you follow).
    api.get<PersonRow[]>(`/users/me/vouch-candidates`)
      .then(setPeople)
      .catch(() => setPeople([]));
  }, [myHandle]);

  async function ask(h: string) {
    setSent((s) => ({ ...s, [h]: true }));
    try { await api.post(`/users/${h}/vouch-request`); }
    catch { setSent((s) => ({ ...s, [h]: false })); }
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="Request a vouch" onClose={onClose} />
      <div className="px-4 pt-3">
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 12 }}>
          <Shield size={18} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Vouches build trust independent of trades. Ask collectors who know you — from a deal, a meet-up, or a community — to vouch for you.
          </p>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 px-2 py-2">
        {people === null ? (
          <p className="text-sm text-[var(--ink-faint)] text-center py-8">Loading…</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)] text-center py-8 px-4">
            No collectors to ask yet — follow people or make a trade, then request a vouch.
          </p>
        ) : (
          people.map((u) => {
            const done = sent[u.handle];
            return (
              <div key={u.handle} className="flex items-center gap-3 px-2 py-2.5">
                <Link href={`/profile/${u.handle}`} onClick={onClose}><Avatar name={u.name} photo={u.avatar_url} size={44} /></Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{u.name}</p>
                  <p className="text-xs text-[var(--ink-faint)]">@{u.handle}</p>
                </div>
                <Button size="sm" variant={done ? "secondary" : "dark"} disabled={done} onClick={() => ask(u.handle)}>
                  {done ? "Requested" : "Request"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Sheet>
  );
}
