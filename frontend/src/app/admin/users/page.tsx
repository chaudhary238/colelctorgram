"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, Ban, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui";

interface AdminUser {
  id: string;
  handle: string;
  name: string;
  email: string;
  avatar_url: string | null;
  is_suspended: boolean;
  is_admin: boolean;
  is_seed_account: boolean;
  followers_count: number;
  active_listings_count: number;
  vouches: number;
  created_at: string;
}

type Filter = "all" | "suspended";

function joined(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function UsersAdminPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // debounced search + filter
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (filter === "suspended") params.set("suspended", "true");
    const t = setTimeout(() => {
      setLoading(true);
      api.get<AdminUser[]>(`/admin/users?${params.toString()}`)
        .then((d) => { if (!cancelled) setUsers(d ?? []); })
        .catch(console.error)
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, filter]);

  const toggleSuspend = async (u: AdminUser) => {
    if (busy) return;
    setBusy(u.id);
    setError(null);
    const action = u.is_suspended ? "unsuspend" : "suspend";
    try {
      await api.post(`/admin/users/${u.id}/${action}`);
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, is_suspended: !u.is_suspended } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ maxWidth: 880 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>User management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 20px" }}>Search any account and suspend or restore it — independent of the report queue.</p>

      {/* search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by handle, name, or email…"
            style={{ width: "100%", height: 40, padding: "0 12px 0 36px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
          {(["all", "suspended"] as Filter[]).map((f, i) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer", textTransform: "capitalize",
                border: "none", borderLeft: i ? "1px solid var(--border)" : "none",
                background: filter === f ? "var(--ink)" : "var(--paper)", color: filter === f ? "var(--paper)" : "var(--ink-mute)" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--stamp-red)", marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>}
      {!loading && users.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>No users match.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {users.map((u) => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 13, border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px", background: u.is_suspended ? "var(--stamp-red-soft)" : "var(--paper-soft)" }}>
            <Avatar name={u.name} photo={u.avatar_url} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{u.handle}</span>
                {u.is_admin && <Badge color="var(--verified-teal)" icon={<ShieldCheck size={11} />}>Admin</Badge>}
                {u.is_seed_account && !u.is_admin && <Badge color="var(--grail-gold-deep)">Seed</Badge>}
                {u.is_suspended && <Badge color="var(--stamp-red)" icon={<Ban size={11} />}>Suspended</Badge>}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
                {u.email} · {u.followers_count} followers · {u.vouches} vouches · joined {joined(u.created_at)}
              </div>
            </div>
            {u.is_admin ? (
              <span style={{ fontSize: 12, color: "var(--ink-faint)", flexShrink: 0, padding: "0 8px" }}>protected</span>
            ) : (
              <button onClick={() => toggleSuspend(u)} disabled={busy === u.id}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 13px", borderRadius: 9, flexShrink: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
                  border: u.is_suspended ? "1px solid var(--border-strong)" : "none",
                  background: u.is_suspended ? "transparent" : "var(--stamp-red)",
                  color: u.is_suspended ? "var(--ink)" : "var(--paper)" }}>
                {u.is_suspended ? <><RotateCcw size={14} />Restore</> : <><Ban size={14} />Suspend</>}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 5, background: color, color: "var(--paper)" }}>
      {icon}{children}
    </span>
  );
}
