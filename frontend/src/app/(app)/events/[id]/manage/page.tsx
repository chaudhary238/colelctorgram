"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Clock, Calendar, MapPin, Globe, Tag, ChevronRight, X, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { ApiEvent } from "@/components/cards";
import { shortDate } from "@/lib/utils";
import { resolvePincode } from "@/lib/pincode";
import { Avatar, SectionLabel, EmptyNote } from "@/components/ui";
import { BackButton } from "@/components/BackButton";

interface Guest { handle: string; name: string; avatar_url: string | null; city: string | null; status: "going" | "interested" }

// v3 category short-labels (design_v3 data.jsx CATEGORIES.short).
const CAT_LABEL: Record<string, string> = {
  figures: "Action Figures", designer: "Designer Toys", kits: "Model Kits", diecast: "Diecast",
};

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", height: 44, padding: "0 12px",
  borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none",
};

function DetailRow({ icon: Icon, title, sub, last }: { icon: React.ComponentType<{ size?: number }>; title: string; sub?: string; last?: boolean }) {
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

function GuestRow({ guest }: { guest: Guest }) {
  return (
    <Link href={`/profile/${guest.handle}`} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: 10, textDecoration: "none", borderRadius: 12, background: "var(--paper-soft)", border: "1px solid var(--border)" }}>
      <Avatar name={guest.name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{guest.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{guest.handle}{guest.city ? ` · ${guest.city}` : ""}</div>
      </div>
    </Link>
  );
}

function Stat({ n, label, accent }: { n: number | string; label: string; accent: string }) {
  return (
    <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: accent, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 5 }}>{label}</div>
    </div>
  );
}

function isoToParts(iso: string) {
  // Local date + time strings for <input type=date|time>.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function EventManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  // edit form
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eVenue, setEVenue] = useState("");
  const [ePincode, setEPincode] = useState("");
  const [eAbout, setEAbout] = useState("");
  const [eBring, setEBring] = useState("");
  const [eDate, setEDate] = useState("");
  const [eTime, setETime] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ev = await api.get<ApiEvent>(`/events/${id}`);
        if (!active) return;
        if (!ev.is_host) { setDenied(true); return; }
        setEvent(ev);
        const guestList = await api.get<Guest[]>(`/events/${id}/interested`).catch(() => []);
        if (active) setGuests(guestList ?? []);
      } catch {
        if (active) setDenied(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const openEdit = () => {
    if (!event) return;
    const { date, time } = isoToParts(event.starts_at);
    setETitle(event.title);
    setEVenue(event.venue ?? "");
    setEPincode(event.pincode ?? "");
    setEAbout(event.description ?? "");
    setEBring(event.bring ?? "");
    setEDate(date);
    setETime(time);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!event || busy) return;
    setBusy(true);
    try {
      const starts_at = new Date(`${eDate}T${eTime || "00:00"}`).toISOString();
      const updated = await api.patch<ApiEvent>(`/events/${event.id}`, {
        title: eTitle.trim(),
        description: eAbout.trim(),
        venue: eVenue.trim(),
        city: event.mode === "online" ? null : resolvePincode(ePincode)?.city ?? null,
        pincode: event.mode === "online" ? null : ePincode,
        bring: eBring.trim() || null,
        starts_at,
      });
      setEvent(updated);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const cancelEvent = async () => {
    if (!event || busy) return;
    if (!confirm(event.status === "pending_approval" ? "Withdraw this event?" : "Cancel this event? Attendees will be notified.")) return;
    setBusy(true);
    try {
      await api.post(`/events/${event.id}/cancel`);
      router.push("/events");
    } finally {
      setBusy(false);
    }
  };

  if (denied) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <EmptyNote>You don&rsquo;t host this event.</EmptyNote>
        <Link href={`/events/${id}`} style={{ color: "var(--stamp-red)", fontSize: 14, fontWeight: 600 }}>Back to event</Link>
      </div>
    );
  }
  if (loading || !event) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ height: 64, borderRadius: 12, background: "var(--bone)", marginBottom: 12 }} />
        <div style={{ height: 200, borderRadius: 12, background: "var(--bone)" }} />
      </div>
    );
  }

  const { day, month } = shortDate(event.starts_at);
  const eventDate = new Date(event.starts_at);
  const dayName = eventDate.toLocaleString("en-IN", { weekday: "short" });
  const timeStr = eventDate.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const pending = event.status === "pending_approval";
  const cancelled = event.status === "cancelled" || event.status === "rejected";
  const goingGuests = guests.filter((g) => g.status === "going");
  const interestedGuests = guests.filter((g) => g.status === "interested");

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-10">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback={`/events/${id}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>{pending ? "Pending approval" : "Manage event"}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {pending && (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16, background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: "var(--grail-gold)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={20} /></div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--grail-gold-deep)" }}>Waiting for review</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 5 }}>Only you can see this event until Scorred approves it. We review for safety and accuracy — usually within a day.</div>
              </div>
            </div>
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", margin: "16px 0" }}>
              <DetailRow icon={Calendar} title={`${dayName}, ${month} ${day} · ${timeStr}`} sub={event.city ?? undefined} />
              <DetailRow icon={event.mode === "online" ? Globe : MapPin} title={event.venue ?? "TBA"} sub={event.mode === "online" ? "Online" : "In person"} />
              <DetailRow icon={Tag} title={event.categories.length ? event.categories.map((c) => CAT_LABEL[c] ?? c).join(" · ") : "—"} sub={event.community ? `Community: ${event.community.name}` : "No community"} last />
            </div>
          </>
        )}

        {cancelled && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 14, background: "var(--bone)", border: "1px solid var(--border-strong)", borderRadius: 14, marginBottom: 16 }}>
            <X size={18} style={{ color: "var(--stamp-red)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)" }}>This event was {event.status === "rejected" ? "not approved" : "cancelled"}.</span>
          </div>
        )}

        {!pending && !cancelled && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "var(--forest-soft)", border: "1px solid var(--forest)", borderRadius: 12, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--forest)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)" }}>Live &amp; public</span>
              <Link href={`/events/${id}`} style={{ marginLeft: "auto", color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>View public page →</Link>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <Stat n={event.going_count ?? 0} label="Going" accent="var(--forest)" />
              <Stat n={event.interested_count} label="Interested" accent="var(--grail-gold-deep)" />
              <Stat n={event.community ? event.community.member_count : "—"} label="Community" accent="var(--ink)" />
            </div>

            {event.community && (
              <Link href={`/community/${event.community.id}`} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none", marginBottom: 18, padding: 13,
                background: "var(--ink)", color: "var(--paper)", borderRadius: 13,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Post an update</div>
                  <div style={{ fontSize: 12.5, color: "rgba(244,239,230,0.7)" }}>Reach attendees in {event.community.name}</div>
                </div>
                <ChevronRight size={18} style={{ opacity: 0.7 }} />
              </Link>
            )}
          </>
        )}

        {/* Edit details */}
        {!cancelled && (
          editing ? (
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 18, background: "var(--paper-soft)" }}>
              <SectionLabel>Edit details</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="Title" style={fieldStyle} />
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13 }} />
                  <input type="time" value={eTime} onChange={(e) => setETime(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13 }} />
                </div>
                <input value={eVenue} onChange={(e) => setEVenue(e.target.value)} placeholder={event.mode === "online" ? "Stream / link name" : "Venue"} style={fieldStyle} />
                {event.mode !== "online" && (
                  <div>
                    <input value={ePincode} onChange={(e) => setEPincode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} inputMode="numeric" placeholder="Location pincode (6-digit PIN)"
                      style={{ ...fieldStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }} />
                    {resolvePincode(ePincode) ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                        <MapPin size={14} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
                        City set from PIN: <b style={{ color: "var(--ink)" }}>{resolvePincode(ePincode)!.city}</b>
                      </div>
                    ) : ePincode.length === 6 ? (
                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--stamp-red)" }}>We couldn&rsquo;t match that PIN — check the 6 digits.</div>
                    ) : null}
                  </div>
                )}
                <textarea value={eAbout} onChange={(e) => setEAbout(e.target.value)} rows={3} placeholder="Description" style={{ ...fieldStyle, height: "auto", padding: "10px 12px", lineHeight: 1.5, resize: "none" }} />
                <input value={eBring} onChange={(e) => setEBring(e.target.value)} placeholder="What to bring (optional)" style={fieldStyle} />
              </div>
              <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
                <button onClick={() => setEditing(false)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveEdit} disabled={busy || !eTitle.trim() || !eDate || (event.mode !== "online" && !resolvePincode(ePincode))} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: busy ? "wait" : "pointer" }}>{busy ? "Saving…" : "Save changes"}</button>
              </div>
            </div>
          ) : (
            <button onClick={openEdit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 18 }}>
              <Pencil size={16} />Edit details
            </button>
          )
        )}

        {/* Guest list */}
        {!pending && !cancelled && (
          <>
            <SectionLabel>Going · {goingGuests.length}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "10px 0 18px" }}>
              {goingGuests.map((g) => <GuestRow key={g.handle} guest={g} />)}
              {goingGuests.length === 0 && <EmptyNote>No one&rsquo;s RSVP&rsquo;d &ldquo;going&rdquo; yet. Share your event to spread the word.</EmptyNote>}
            </div>
            {interestedGuests.length > 0 && (
              <>
                <SectionLabel>Interested · {interestedGuests.length}</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "10px 0 18px" }}>
                  {interestedGuests.map((g) => <GuestRow key={g.handle} guest={g} />)}
                </div>
              </>
            )}
          </>
        )}

        {/* Cancel / withdraw */}
        {!cancelled && (
          <button onClick={cancelEvent} disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 46, borderRadius: 12, border: "1px solid var(--stamp-red)", background: "transparent", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: busy ? "wait" : "pointer", marginTop: 4 }}>
            <X size={16} />{pending ? "Withdraw event" : "Cancel event"}
          </button>
        )}
      </div>
    </div>
  );
}
