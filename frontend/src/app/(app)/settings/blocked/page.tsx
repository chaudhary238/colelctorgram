"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Ban } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui";

interface BlockedUser {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
}

// Settings → Blocked users (DF-23 / W-48) — lists users the caller has blocked,
// with one-tap unblock. Backed by GET /blocks + DELETE /blocks/{id}.
export default function BlockedUsersPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.get<BlockedUser[]>("/blocks").catch(() => []);
    setBlocked(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function unblock(u: BlockedUser) {
    setBusyId(u.id);
    try {
      await api.delete(`/blocks/${u.id}`);
      setBlocked((b) => (b ? b.filter((x) => x.id !== u.id) : b));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Blocked users</span>
        </div>
      </div>

      {blocked === null ? (
        <div style={{ padding: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-[var(--bone-deep)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded bg-[var(--bone)]" />
                <div className="h-3 w-20 rounded bg-[var(--bone)]" />
              </div>
            </div>
          ))}
        </div>
      ) : blocked.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 32px", textAlign: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--paper-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)" }}>
            <Ban size={24} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>No blocked users</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-faint)", lineHeight: 1.55, maxWidth: 280 }}>
            Users you block won&apos;t be able to see your profile, listings or message you.
          </div>
        </div>
      ) : (
        <div>
          {blocked.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <Avatar name={u.name} size={44} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{u.handle}</div>
              </div>
              <button
                onClick={() => unblock(u)}
                disabled={busyId === u.id}
                style={{ height: 32, padding: "0 14px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: busyId === u.id ? "wait" : "pointer" }}
              >
                {busyId === u.id ? "…" : "Unblock"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
