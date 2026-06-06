"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Share2, Calendar, MapPin, Globe, Ticket } from "lucide-react";
import { api } from "@/lib/api";
import { shortDate } from "@/lib/utils";
import { ApiEvent } from "@/components/cards";
import { Avatar, ProductPhoto, SectionLabel, Tag } from "@/components/ui";

function DetailRow({ icon: Icon, title, sub, last }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; title: string; sub?: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bone)", color: "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [interested, setInterested] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);

  useEffect(() => {
    api.get<ApiEvent>(`/events/${id}`)
      .then((e) => {
        setEvent(e);
        setInterested(e.is_interested);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !event) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "3/2", borderRadius: 12, background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
        <div style={{ height: 16, width: "90%", borderRadius: 6, background: "var(--bone)" }} />
      </div>
    );
  }

  const { day, month } = shortDate(event.starts_at);
  const eventDate = new Date(event.starts_at);
  const dayName = eventDate.toLocaleString("en-IN", { weekday: "short" });
  const timeStr = eventDate.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const TICKET_CODE = `CH-${event.id.slice(0, 8).toUpperCase()}-0142`;

  const toggleInterest = () => {
    api.post(`/events/${event.id}/interest`).catch(console.error);
    setInterested((v) => !v);
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/events" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Event</span>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "none", cursor: "pointer" }}>
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {/* Hero banner */}
      <div style={{ position: "relative" }}>
        <ProductPhoto tone="plum" ratio="3/2" rounded={0} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(20,17,15,0.8) 100%)" }} />
        <div style={{ position: "absolute", bottom: 14, left: 20, right: 20, display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ width: 64, borderRadius: 12, background: "var(--paper)", color: "var(--ink)", textAlign: "center", padding: "8px 0", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.24)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--stamp-red)" }}>{month}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{day}</div>
            <div style={{ fontSize: 10, color: "var(--ink-faint)" }}>{dayName}</div>
          </div>
          <div style={{ flex: 1, color: "var(--paper)" }}>
            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: event.mode === "online" ? "var(--verified-teal)" : "var(--plum)", color: "var(--paper)", marginBottom: 6 }}>
              {event.mode === "online" ? "Online" : "In person"}
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{event.title}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* Free ticket */}
        {hasTicket && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 18, background: "var(--paper)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "var(--ink)", color: "var(--paper)", padding: "11px 16px", display: "flex", alignItems: "center", gap: 9 }}>
              <Ticket size={17} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em" }}>FREE ENTRY TICKET</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.7 }}>× 1</span>
            </div>
            <div style={{ display: "flex", gap: 16, padding: 16, alignItems: "center" }}>
              <div style={{ width: 118, height: 118, borderRadius: 8, background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--ink-faint)", textAlign: "center", fontFamily: "var(--font-mono)" }}>QR code</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{event.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 4 }}>{month} {day} · {timeStr}</div>
                {event.venue && <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{event.venue}</div>}
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-mute)", marginTop: 8, letterSpacing: "0.04em" }}>{TICKET_CODE}</div>
              </div>
            </div>
            <div style={{ borderTop: "1px dashed var(--border-strong)", padding: "9px 16px", background: "var(--paper-soft)" }}>
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Scanned at the door. Tickets are always free in Phase 1.</span>
            </div>
          </div>
        )}

        {/* Date + location */}
        <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 18 }}>
          <DetailRow icon={Calendar} title={`${dayName}, ${month} ${day} · ${timeStr}`} sub="Add to calendar" />
          <DetailRow icon={event.mode === "online" ? Globe : MapPin} title={event.venue ?? (event.mode === "online" ? "Online event" : "TBA")} sub={event.city ?? undefined} last />
        </div>

        <SectionLabel>About</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", margin: "10px 0 18px" }}>
          {event.description ?? "No description provided."}
        </div>

        <SectionLabel>Hosted by</SectionLabel>
        <Link href={`/profile/${event.host_handle}`} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", marginTop: 10, padding: 12, cursor: "pointer", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, textDecoration: "none" }}>
          <Avatar name={event.host_name ?? "?"} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{event.host_name}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{event.host_handle}</div>
          </div>
        </Link>
      </div>

      {/* Sticky footer */}
      <div style={{ position: "fixed", bottom: 0, left: 245, right: 0, maxWidth: 680, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "12px 20px 20px", display: "flex", gap: 10, alignItems: "center", zIndex: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15 }}>{event.interested_count + (interested && !event.is_interested ? 1 : 0)}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>interested</div>
        </div>
        {hasTicket ? (
          <button style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: "var(--verified-teal)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            <Ticket size={18} />View ticket
          </button>
        ) : (
          <button
            onClick={() => { setHasTicket(true); toggleInterest(); }}
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: interested ? "var(--stamp-red)" : "var(--bone)", color: interested ? "var(--paper)" : "var(--ink)", border: interested ? "none" : "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            <Ticket size={18} />Get free ticket
          </button>
        )}
      </div>
    </div>
  );
}
