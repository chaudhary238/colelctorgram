"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { shortDate } from "@/lib/utils";
import { ApiEvent } from "@/components/cards";

type AdminEvent = ApiEvent & { adminStatus: "active" | "rejected" };

export default function EventsAdminPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiEvent[]>("/events?limit=50")
      .then((data) => setEvents((data ?? []).map((e) => ({ ...e, adminStatus: "active" as const }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const reject = (id: string) =>
    setEvents((ev) => ev.map((e) => e.id === id ? { ...e, adminStatus: "rejected" as const } : e));

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Events management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 24px" }}>Approve, reject, or manage upcoming events.</p>

      {loading ? (
        <div style={{ color: "var(--ink-faint)" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((ev) => {
            const { day, month } = shortDate(ev.starts_at);
            const active = ev.adminStatus === "active";
            return (
              <div key={ev.id} style={{ border: `1px solid ${active ? "var(--border)" : "var(--border-strong)"}`, borderRadius: 14, padding: 16, background: active ? "var(--paper-soft)" : "var(--bone)", opacity: active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 52, borderRadius: 10, background: "var(--paper)", border: "1px solid var(--border)", textAlign: "center", padding: "6px 0", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--stamp-red)" }}>{month}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{day}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
                      {ev.mode === "in_person" ? `${ev.city ?? "TBA"} · In person` : "Online"} · @{ev.host_handle} · {ev.interested_count} interested
                    </div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-mute)", lineHeight: 1.4 }}>
                      {ev.description ? ev.description.slice(0, 120) + (ev.description.length > 120 ? "…" : "") : "No description."}
                    </div>
                  </div>
                  {active ? (
                    <button onClick={() => reject(ev.id)} style={{ height: 34, padding: "0 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, cursor: "pointer", color: "var(--ink)", flexShrink: 0 }}>Reject</button>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rejected</span>
                  )}
                </div>
              </div>
            );
          })}
          {events.length === 0 && <div style={{ color: "var(--ink-faint)" }}>No events to review.</div>}
        </div>
      )}
    </div>
  );
}
