"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2, Bell, Calendar, Check, MapPin, Globe, Users, Star, Settings2, Tag as TagIcon, ChevronRight, MessageCircle, X } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { api } from "@/lib/api";
import { ApiEvent } from "@/components/cards";
import { Avatar, EmptyNote, ProductPhoto, SectionLabel } from "@/components/ui";
import { useUser } from "@/lib/auth-context";
import { fireToast } from "@/components/gamification";
import { ShareSheet } from "@/components/ShareSheet";
import { formatMoney } from "@/lib/catalog";
import { eventDateParts, fmtEventWhen } from "../_date";

// DV8-16 pricing/ticketing fields now live on the shared ApiEvent (DV8-17).
// DV8 §8#17 — `is_host` is now true ONLY for the actual host; `can_manage`
// covers host + site admin. Extended locally until the shared type carries it.
type EventPayload = ApiEvent & { can_manage?: boolean };

interface Guest { handle: string; name: string; avatar_url: string | null; city: string | null; status: "going" | "interested" }

/* QA2 — full guest list (both "going" and "interested" are expandable to the real roster). */
function GuestListModal({ title, guests, onClose }: { title: string; guests: Guest[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[80vh]">
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3 shrink-0">
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }} className="flex-1">{title} · {guests.length}</span>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)]"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-2 py-2">
          {guests.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)] text-center py-8">No one yet.</p>
          ) : guests.map((g) => (
            <Link key={g.handle} href={`/profile/${g.handle}`} onClick={onClose} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[var(--bone)]">
              <Avatar name={g.name} photo={g.avatar_url ?? undefined} size={42} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--ink)] truncate">{g.name}</div>
                <div className="text-xs text-[var(--ink-faint)] truncate">@{g.handle}{g.city ? ` · ${g.city}` : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// v4 category short-labels (design_v4 data.jsx CATEGORIES.short; incl. TCG per DV4-01).
const CAT_LABEL: Record<string, string> = {
  figures: "Action Figures", diecast: "Diecast", kits: "Model Kits", designer: "Designer Toys", tcg: "TCG",
};
// Community tone → solid tile colour (v4 EventDetail tones map).
const TONE_BG: Record<string, string> = {
  plum: "var(--plum)", forest: "var(--forest)", teal: "var(--verified-teal)",
  red: "var(--stamp-red)", ink: "var(--ink)", gold: "var(--grail-gold)",
};

const heroBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 38, height: 38, borderRadius: 12, border: "none",
  background: "rgba(20,17,15,0.5)", backdropFilter: "blur(6px)",
  cursor: "pointer",
};

function DetailRow({ icon: Icon, title, sub, note, last }: { icon: React.ComponentType<{ size?: number }>; title: React.ReactNode; sub?: string; note?: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bone)", color: "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* pre-line keeps line breaks in multi-line address details */}
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{sub}</div>}
        {note && <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 3 }}>{note}</div>}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [event, setEvent] = useState<EventPayload | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [guestModal, setGuestModal] = useState<"going" | "interested" | null>(null);

  // RSVP state (mirrors the event; optimistic on tap)
  const [myRsvp, setMyRsvp] = useState<"going" | "interested" | null>(null);
  const [goingCount, setGoingCount] = useState(0);
  const [intCount, setIntCount] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    api.get<EventPayload>(`/events/${id}`)
      .then((e) => {
        setEvent(e);
        setMyRsvp(e.my_rsvp ?? null);
        setGoingCount(e.going_count ?? 0);
        setIntCount(e.interested_count);
        setReminder(!!e.my_reminder);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    api.get<Guest[]>(`/events/${id}/interested`).then((g) => setGuests(g ?? [])).catch(() => {});
  }, [id]);

  function share() {
    // v8 Overlays.jsx:716-767 — the branded ShareSheet replaces the bare
    // navigator.share/clipboard fallback (same treatment as post/listing).
    setShareOpen(true);
  }

  async function toggleReminder() {
    const next = !reminder;
    setReminder(next);   // optimistic
    try {
      if (next) await api.post(`/events/${id}/reminder`);
      else await api.delete(`/events/${id}/reminder`);
      // v8 EventDetail:76 toast pair (fired once the server agrees — the toggle reverts on error).
      fireToast(next ? "We’ll remind you before it starts" : "Reminder off");
    } catch {
      setReminder(!next);  // revert
    }
  }

  async function setRsvp(next: "going" | "interested") {
    if (busy || !event) return;
    const prev = { myRsvp, goingCount, intCount };
    // optimistic
    let g = goingCount;
    let i = intCount;
    let mine: "going" | "interested" | null = next;
    if (myRsvp === next) {
      mine = null;
      if (next === "going") g--; else i--;
    } else {
      if (myRsvp === "going") g--;
      if (myRsvp === "interested") i--;
      if (next === "going") g++; else i++;
    }
    setMyRsvp(mine); setGoingCount(Math.max(0, g)); setIntCount(Math.max(0, i));
    setBusy(true);
    try {
      // DV8 §8#2 — the RSVP response returns the refreshed event, so the withheld
      // address/where appear immediately once the viewer is on the guest list.
      const updated = await api.post<EventPayload>(`/events/${id}/interest?status=${next}`);
      if (updated?.id) {
        setEvent(updated);
        setMyRsvp(updated.my_rsvp ?? null);
        setGoingCount(updated.going_count ?? 0);
        setIntCount(updated.interested_count ?? 0);
      }
      // v8 EventDetail:43,50 — RSVP toast triplet (curly apostrophes).
      fireToast(
        mine === null ? "Removed your RSVP"
          : mine === "going" ? "You’re going — added to the guest list"
          : "Marked interested — you’ll get updates",
      );
      const fresh = await api.get<Guest[]>(`/events/${id}/interested`).catch(() => null);
      if (fresh) setGuests(fresh);
    } catch {
      setMyRsvp(prev.myRsvp); setGoingCount(prev.goingCount); setIntCount(prev.intCount);  // revert
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "3/2", borderRadius: 12, background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
        <div style={{ height: 16, width: "90%", borderRadius: 6, background: "var(--bone)" }} />
      </div>
    );
  }
  if (!event) {
    // v8 EventDetail:12 — a missing/404 event states it instead of skeleting forever.
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}><BackButton fallback="/events" /></div>
        <EmptyNote>This event isn&rsquo;t available.</EmptyNote>
      </div>
    );
  }

  // v8 §8#14 — one date grammar everywhere: "Sat · 24 May · 4:00 pm – 8:00 pm"
  // (day-first, mixed-case month, " · " separators); the pill day zero-pads.
  const { weekday, dayPadded, month } = eventDateParts(event.starts_at);
  const whenStr = fmtEventWhen(event.starts_at, event.ends_at);
  const eventDate = new Date(event.starts_at);
  const online = event.mode === "online";
  const past = eventDate.getTime() < now;
  const going = guests.filter((g) => g.status === "going");
  const interested = guests.filter((g) => g.status === "interested");
  const priceLabel = event.is_free === false && (event.price ?? 0) > 0
    ? `${formatMoney(event.price ?? 0, event.currency ?? "INR")} entry`
    : "Free entry";

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-28">
      {/* Hero banner — v7 overlays the header on the image rather than stacking a bar above it */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}>
          <BackButton fallback="/events" transparent />
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            {!past && !event.is_host && (
              // v8 EventDetail:76 — the active bell fills with paper, no colour swap.
              <button onClick={toggleReminder} title={reminder ? "Reminder on" : "Remind me before it starts"} style={{ ...heroBtn, color: "var(--paper)" }}>
                <Bell size={17} fill={reminder ? "var(--paper)" : "none"} />
              </button>
            )}
            <button onClick={share} title="Share" style={{ ...heroBtn, color: "var(--paper)" }}>
              <Share2 size={17} />
            </button>
          </div>
        </div>
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_image_url} alt="" style={{ display: "block", width: "100%", aspectRatio: "3/2", objectFit: "cover" }} />
        ) : (
          <ProductPhoto tone={event.community?.tone ?? "plum"} ratio="3/2" rounded={0} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(20,17,15,0.8) 100%)" }} />
        {/* DV8-16 — compact date pill ABOVE the title (v8 EventDetail): long titles get
            the full card width instead of sharing the row with a fixed 64px tile. */}
        <div style={{ position: "absolute", bottom: 14, left: 20, right: 20 }}>
          {/* v8 — the date pill stands alone; no mode Tag beside it. */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, borderRadius: 8, background: "var(--paper)", color: "var(--ink)", padding: "4px 10px", boxShadow: "var(--shadow-2)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>{dayPadded}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--stamp-red)" }}>{month}</span>
              <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>· {weekday}</span>
            </div>
          </div>
          <div style={{ color: "var(--paper)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.15, textWrap: "pretty" }}>{event.title}</div>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* RSVP summary strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "11px 14px", background: myRsvp === "going" ? "var(--forest-soft)" : "var(--paper-soft)", border: `1px solid ${myRsvp === "going" ? "var(--forest)" : "var(--border)"}`, borderRadius: 12 }}>
          <Users size={17} style={{ color: myRsvp === "going" ? "var(--forest)" : "var(--ink-mute)" }} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{goingCount} going</span>
          <span style={{ color: "var(--ink-ghost)" }}>·</span>
          <span style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>{intCount} interested</span>
          {myRsvp && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: myRsvp === "going" ? "var(--forest)" : "var(--grail-gold-deep)" }}>You&rsquo;re {myRsvp}</span>}
        </div>

        {/* Details */}
        <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 18 }}>
          {/* v8 — no is_host branch on the date-row sub. */}
          <DetailRow icon={Calendar} title={whenStr} sub={reminder ? "Reminder on" : past ? "Ended" : "Tap the bell to get reminded"} />
          {/* v8 — location leads with the joined "venue — address" display form; city below.
              DV8 §8#2 — the API nulls address/where until the viewer RSVPs (host and
              site admin always see it); a quiet note says why the row is venue-only.
              ⚖ note copy founder-confirmable. An event with no address at all is
              indistinguishable client-side pre-RSVP, so the note may show there too. */}
          <DetailRow
            icon={online ? Globe : MapPin}
            title={event.where ?? event.venue ?? (online ? "Online event" : "TBA")}
            sub={online ? "Online" : event.city ?? undefined}
            note={!online && !!event.venue && event.address == null && !event.is_host && !myRsvp ? "RSVP to see the exact address." : undefined}
          />
          {/* v8 — Entry + ticket + contact rows all carry the plain DetailRow chrome;
              "What to bring" is gone (removed in v8, column kept for legacy). */}
          <DetailRow icon={TagIcon} title={priceLabel} sub="Entry" last={event.categories.length === 0 && !event.ticket_url && !event.contact} />
          {event.categories.length > 0 && <DetailRow icon={TagIcon} title={event.categories.map((c) => CAT_LABEL[c] ?? c).join(" · ")} sub={event.categories.length > 1 ? "Categories" : "Category"} last={!event.ticket_url && !event.contact} />}
          {event.ticket_url && (
            <DetailRow
              icon={TagIcon}
              title={<a href={event.ticket_url} target="_blank" rel="noreferrer" style={{ color: "var(--ink)" }}>{event.ticket_url}</a>}
              sub="Ticket link"
              last={!event.contact}
            />
          )}
          {event.contact && <DetailRow icon={MessageCircle} title={event.contact} sub="Contact" last />}
        </div>

        {/* Who's going */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel>Who&rsquo;s going</SectionLabel>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>{goingCount}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 14px" }}>
          {going.slice(0, 10).map((g) => {
            const isMe = !!user && g.handle === user.handle;
            const chip: React.CSSProperties = {
              display: "flex", alignItems: "center", gap: 7, padding: "5px 11px 5px 5px", borderRadius: 999,
              textDecoration: "none",
              background: isMe ? "var(--forest-soft)" : "var(--paper-soft)",
              border: `1px solid ${isMe ? "var(--forest)" : "var(--border)"}`,
            };
            // v7 renders your own chip as a non-interactive label ("You"), not a profile link.
            return isMe ? (
              <span key={g.handle} style={chip}>
                <Avatar name={g.name} photo={g.avatar_url ?? undefined} size={22} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>You</span>
              </span>
            ) : (
              <Link key={g.handle} href={`/profile/${g.handle}`} style={chip}>
                <Avatar name={g.name} photo={g.avatar_url ?? undefined} size={22} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{g.name.split(" ")[0]}</span>
              </Link>
            );
          })}
          {going.length === 0 && <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>Be the first to RSVP.</span>}
          {/* QA2 — "+N more" opens the full going roster, same as interested. */}
          {going.length > going.slice(0, 10).length && (
            <button onClick={() => setGuestModal("going")} style={{ alignSelf: "center", fontSize: 12.5, fontWeight: 600, color: "var(--stamp-red)", background: "none", border: "none", cursor: "pointer", padding: "5px 4px" }}>
              +{going.length - 10} more
            </button>
          )}
        </div>
        {interested.length > 0 && (
          <button onClick={() => setGuestModal("interested")} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}>
            <span style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 600 }}>Interested</span>
            <div style={{ display: "flex" }}>
              {interested.slice(0, 6).map((g, idx) => (
                <div key={g.handle} style={{ marginLeft: idx ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--paper)" }}>
                  <Avatar name={g.name} photo={g.avatar_url ?? undefined} size={26} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--stamp-red)", fontWeight: 600 }}>{interested.length > 6 ? `+${interested.length - 6} · View all` : "View all"}</span>
          </button>
        )}

        {/* About */}
        <SectionLabel>About</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", margin: "10px 0 18px" }}>
          {event.description ?? "No description provided."}
        </div>

        {/* Event community */}
        {event.community && (
          <>
            <SectionLabel>Event community</SectionLabel>
            <Link href={`/community/${event.community.id}`} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none", margin: "10px 0 18px", padding: 13, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: TONE_BG[event.community.tone] ?? "var(--plum)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
                {event.community.tag ?? <MessageCircle size={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{event.community.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Talk, network &amp; post with attendees</div>
              </div>
              <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
            </Link>
          </>
        )}

        {/* Hosted by */}
        <SectionLabel>Hosted by</SectionLabel>
        <Link href={`/profile/${event.host_handle}`} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", marginTop: 10, padding: 12, textDecoration: "none", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13 }}>
          {/* v8 — host avatar carries the verified tick when the payload flags a tier. */}
          <Avatar name={event.host_name ?? "?"} photo={event.host_avatar_url ?? undefined} size={40} verified={!!event.host_tier} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{event.is_host ? "You" : event.host_name}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{event.host_handle}{event.host_city ? ` · ${event.host_city}` : ""}</div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
        </Link>
      </div>

      {/* Sticky footer */}
      <div className="ch-cta-bar">
        {past ? (
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-faint)", padding: "4px 0" }}>This event has ended.</div>
        ) : event.is_host ? (
          <Link href={`/events/${id}/manage`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 13, background: "var(--ink)", color: "var(--paper)", textDecoration: "none", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15 }}>
            <Settings2 size={18} />Manage your event
          </Link>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRsvp("going")} disabled={busy} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 50, borderRadius: 13, cursor: busy ? "default" : "pointer",
                border: `1.5px solid ${myRsvp === "going" ? "var(--forest)" : "var(--ink)"}`,
                background: myRsvp === "going" ? "var(--forest)" : "var(--ink)", color: "var(--paper)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
              }}>
                {/* v8 EventDetail:48 — check when going, users otherwise. */}
                {myRsvp === "going" ? <Check size={18} strokeWidth={2.2} /> : <Users size={18} strokeWidth={2.2} />}Going
              </button>
              <button onClick={() => setRsvp("interested")} disabled={busy} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 50, borderRadius: 13, cursor: busy ? "default" : "pointer",
                border: `1.5px solid ${myRsvp === "interested" ? "var(--grail-gold-deep)" : "var(--border-strong)"}`,
                background: myRsvp === "interested" ? "var(--grail-gold-soft)" : "var(--paper-soft)",
                color: myRsvp === "interested" ? "var(--grail-gold-deep)" : "var(--ink)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15,
              }}>
                <Star size={18} fill={myRsvp === "interested" ? "var(--grail-gold-deep)" : "none"} />Interested
              </button>
            </div>
            {event.community_id && (
              <Link href={`/community/${event.community_id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", marginTop: 10, height: 40, borderRadius: 11, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink-soft)", textDecoration: "none", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5 }}>
                <MessageCircle size={16} />Open event community
              </Link>
            )}
            {/* DV8 §8#17 — a site admin on someone else's event keeps the normal RSVP
                footer and host line, plus this quiet manage affordance (can_manage
                covers host + site admin; is_host alone hides the RSVP footer). */}
            {event.can_manage && (
              <Link href={`/events/${id}/manage`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", marginTop: 10, height: 40, borderRadius: 11, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink-soft)", textDecoration: "none", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5 }}>
                <Settings2 size={16} />Manage event
              </Link>
            )}
          </>
        )}
      </div>

      {guestModal && (
        <GuestListModal
          title={guestModal === "going" ? "Going" : "Interested"}
          guests={guestModal === "going" ? going : interested}
          onClose={() => setGuestModal(null)}
        />
      )}

      {shareOpen && (
        <ShareSheet
          url={`${window.location.origin}/events/${id}`}
          label="event"
          title={event.title}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
