"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { ApiEvent } from "@/components/cards";
import { Segmented, SectionLabel, EmptyNote, Tag, ProductPhoto } from "@/components/ui";
import { EventCard } from "@/components/cards";
import { shortDate } from "@/lib/utils";

const MODES = [
  { id: "all", label: "All" },
  { id: "in_person", label: "In person" },
  { id: "online", label: "Online" },
] as const;

export default function EventsPage() {
  const [scope, setScope] = useState<(typeof MODES)[number]["id"]>("all");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = scope === "all" ? "" : `&mode=${scope}`;
    api.get<ApiEvent[]>(`/events?limit=20${q}`)
      .then((data) => setEvents(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => {
    setLoading(true);
  }, [scope]);

  const list = events;
  const featured = list[0];

  return (
    <div className="w-full max-w-[760px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <Segmented options={MODES as unknown as { id: string; label: string }[]} value={scope} onChange={(v) => setScope(v as typeof scope)} />
      </div>

      {loading ? (
        <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ height: 200, borderRadius: 16, background: "var(--bone)" }} />
          {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: 96, borderRadius: 14, background: "var(--bone)" }} />)}
        </div>
      ) : (
        <>
          {featured && (
            <div style={{ padding: "14px 20px 0" }}>
              <SectionLabel>Next up</SectionLabel>
              <Link href={`/events/${featured.id}`} style={{ display: "block", textDecoration: "none", marginTop: 10, borderRadius: 16, overflow: "hidden", background: "var(--ink)", position: "relative" }}>
                <ProductPhoto tone="plum" ratio="2/1" rounded={0} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(20,17,15,0.88) 100%)" }} />
                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                  <Tag kind={featured.mode === "online" ? "vouch" : "event"}>{featured.mode === "online" ? "Online" : "In person"}</Tag>
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, color: "var(--paper)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{featured.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(244,239,230,0.85)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} strokeWidth={2} />
                    {new Date(featured.starts_at).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div style={{ padding: "20px 20px 0" }}>
            <SectionLabel>Upcoming</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 10 }}>
              {list.slice(1).map((ev) => <EventCard key={ev.id} event={ev} />)}
              {list.length <= 1 && <EmptyNote>No more events in this view. Try &ldquo;All&rdquo;.</EmptyNote>}
            </div>
          </div>
        </>
      )}

      <div style={{ padding: "20px 20px 28px" }}>
        <button
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", height: 46, borderRadius: 12, border: "1px dashed var(--border-strong)",
            background: "transparent", color: "var(--ink-mute)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
          }}
        >
          <PlusCircle size={18} />
          Create an event
        </button>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
          User events are reviewed before they go live.
        </div>
      </div>
    </div>
  );
}
