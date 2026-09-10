"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Clock, Calendar, MapPin, Globe, ChevronRight, X, Pencil, Share2, MessageCircle, Settings2 } from "lucide-react";
import { api } from "@/lib/api";
import { ApiEvent } from "@/components/cards";
import { Avatar, SectionLabel, EmptyNote, Segmented } from "@/components/ui";
import { BackButton } from "@/components/BackButton";
import { ImageUploader } from "@/components/ImageUploader";
import { CityField } from "@/components/CityField";
import { MoneyField } from "@/components/forms";
import { fireToast } from "@/components/gamification";
import { ADD_CATEGORIES } from "@/lib/catalog";
import { fmtEventWhen } from "../../_date";

interface Guest { handle: string; name: string; avatar_url: string | null; city: string | null; status: "going" | "interested" }

// DV8-16 pricing/ticketing fields now live on the shared ApiEvent (DV8-17).
// DV8 §8#17 — manage access keys off `can_manage` (host + site admin); `is_host`
// is now the actual host only. Extended locally until the shared type carries it.
type EventPayload = ApiEvent & { can_manage?: boolean };

// (CAT_LABEL retired here — v8's pending rows dropped the categories row; the
// detail page keeps its own map, incl. tcg.)
// v8 chip labels are the SINGULAR chipLabel variants — only figures differs.
const CHIP_LABEL: Record<string, string> = { figures: "Action Figure" };

// v8 edit-sheet field metrics — h46 / r11 / 15px.
const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px",
  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
};

function EditLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "16px 0 8px" }}>
      <SectionLabel>{children}</SectionLabel>
      {hint && <span style={{ fontSize: 11, color: "var(--ink-ghost)", marginLeft: "auto" }}>{hint}</span>}
    </div>
  );
}

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

// v8 GuestRow (EventManage.jsx:135-138) — real avatar photo, trailing chevron.
// An "interested" row keeps the name at FULL ink; v8's `muted` only suppresses the
// verified tick, which we don't render at all (host_tier dead both sides — §8#18),
// so the prop carries nothing here and is dropped.
function GuestRow({ guest }: { guest: Guest }) {
  return (
    <Link href={`/profile/${guest.handle}`} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: 10, textDecoration: "none", borderRadius: 12, background: "var(--paper-soft)", border: "1px solid var(--border)" }}>
      <Avatar name={guest.name} photo={guest.avatar_url ?? undefined} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{guest.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{guest.handle}{guest.city ? ` · ${guest.city}` : ""}</div>
      </div>
      <ChevronRight size={17} strokeWidth={2} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
    </Link>
  );
}

// v8 ManageStat (EventManage.jsx:148-154) — optional onClick plumbed faithfully;
// no call site passes one yet, so today every tile stays cursor:default.
function Stat({ n, label, accent, onClick }: { n: number | string; label: string; accent: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 10px", textAlign: "center", cursor: onClick ? "pointer" : "default" }}>
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
  const [event, setEvent] = useState<EventPayload | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  // DV8-16 — the full edit surface (mirrors the create form field-for-field).
  const [editing, setEditing] = useState(false);
  const [shared, setShared] = useState(false);
  const [eCover, setECover] = useState<string | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eCats, setECats] = useState<string[]>([]);
  const [eDate, setEDate] = useState("");
  const [eTime, setETime] = useState("");
  const [eEndDate, setEEndDate] = useState("");
  const [eEndTime, setEEndTime] = useState("");
  const [eCity, setECity] = useState("");
  const [eVenue, setEVenue] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [eAbout, setEAbout] = useState("");
  // "What to bring" removed in v8 — no edit field, and `bring` is never patched.
  const [ePricing, setEPricing] = useState<"free" | "paid">("free");
  const [ePrice, setEPrice] = useState("");
  const [ePriceCur, setEPriceCur] = useState("INR");
  const [eTicketUrl, setETicketUrl] = useState("");
  const [eContact, setEContact] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ev = await api.get<EventPayload>(`/events/${id}`);
        if (!active) return;
        // DV8 §8#17 — can_manage (host + site admin) gates this page, not is_host.
        if (!ev.can_manage) { setDenied(true); return; }
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
    const start = isoToParts(event.starts_at);
    setECover(event.cover_image_url ?? null);
    setETitle(event.title);
    setECats(event.categories ?? []);
    setEDate(start.date);
    setETime(start.time);
    if (event.ends_at) {
      const end = isoToParts(event.ends_at);
      setEEndDate(end.date);
      setEEndTime(end.time);
    } else {
      setEEndDate("");
      setEEndTime("");
    }
    setECity(event.city ?? "");
    setEVenue(event.venue ?? "");
    setEAddress(event.address ?? "");
    setEAbout(event.description ?? "");
    setEPricing(event.is_free === false ? "paid" : "free");
    setEPrice(event.is_free === false && event.price ? String(Math.round(event.price / 100)) : "");
    setEPriceCur(event.currency ?? "INR");
    setETicketUrl(event.ticket_url ?? "");
    setEContact(event.contact ?? "");
    setEditing(true);
  };

  const toggleECat = (cid: string) =>
    setECats((cs) => (cs.includes(cid) ? cs.filter((x) => x !== cid) : [...cs, cid]));

  const online = event?.mode === "online";
  const editInvalid =
    !eTitle.trim() || !eDate || !eTime || eCats.length === 0 || !eAbout.trim() ||
    (!online && (!eCity.trim() || !eVenue.trim())) ||
    (ePricing === "paid" && !(Number(ePrice) > 0)) ||
    !!(eEndDate && eEndDate < eDate);

  const saveEdit = async () => {
    if (!event || busy || editInvalid) return;
    setBusy(true);
    try {
      const starts_at = new Date(`${eDate}T${eTime || "00:00"}`).toISOString();
      let ends_at: string | null = null;
      if (eEndTime || eEndDate) {
        const ed = eEndDate || eDate;
        ends_at = new Date(`${ed}T${eEndTime || eTime || "00:00"}`).toISOString();
      }
      const isFree = ePricing === "free";
      const priceMinor = isFree ? 0 : Math.round(Number(ePrice) * 100);

      // PATCH carries exactly what changed — every field is accepted server-side,
      // but an untouched one shouldn't travel (exclude_unset semantics).
      const patch: Record<string, unknown> = {};
      if (eTitle.trim() !== event.title) patch.title = eTitle.trim();
      if ((eCover ?? null) !== (event.cover_image_url ?? null)) patch.cover_image_url = eCover;
      const oldCats = event.categories ?? [];
      if (eCats.length !== oldCats.length || eCats.some((c) => !oldCats.includes(c))) patch.categories = eCats;
      if (new Date(starts_at).getTime() !== new Date(event.starts_at).getTime()) patch.starts_at = starts_at;
      const oldEnd = event.ends_at ? new Date(event.ends_at).getTime() : null;
      const newEnd = ends_at ? new Date(ends_at).getTime() : null;
      if (newEnd !== oldEnd) patch.ends_at = ends_at;
      if (!online && eCity.trim() !== (event.city ?? "")) patch.city = eCity.trim();
      if (eVenue.trim() !== (event.venue ?? "")) patch.venue = eVenue.trim();
      if ((eAddress.trim() || null) !== (event.address ?? null)) patch.address = eAddress.trim() || null;
      if (eAbout.trim() !== (event.description ?? "")) patch.description = eAbout.trim();
      if (isFree !== (event.is_free ?? true)) patch.is_free = isFree;
      if (!isFree && priceMinor !== (event.price ?? 0)) patch.price = priceMinor;
      if (!isFree && ePriceCur !== (event.currency ?? "INR")) patch.currency = ePriceCur;
      if ((eTicketUrl.trim() || null) !== (event.ticket_url ?? null)) patch.ticket_url = eTicketUrl.trim() || null;
      if ((eContact.trim() || null) !== (event.contact ?? null)) patch.contact = eContact.trim() || null;

      if (Object.keys(patch).length > 0) {
        const updated = await api.patch<EventPayload>(`/events/${event.id}`, patch);
        setEvent(updated);
      }
      setEditing(false);
      fireToast("Event updated");   // v8 EventManage.jsx:70
    } finally {
      setBusy(false);
    }
  };

  const cancelEvent = async () => {
    if (!event || busy) return;
    const isPending = event.status === "pending_approval";
    // v8 confirms nothing and toasts after the fact. We keep ONE lightweight confirm
    // for the live-event cancel (destructive: attendees get notified); withdrawing a
    // pending event is low-stakes, so it just happens.
    if (!isPending && !window.confirm("Cancel this event? Attendees will be notified.")) return;
    setBusy(true);
    try {
      await api.post(`/events/${event.id}/cancel`);
      router.push("/events");
      fireToast(isPending ? "Event withdrawn" : "Event cancelled — attendees notified");
    } finally {
      setBusy(false);
    }
  };

  async function share() {
    const url = `${window.location.origin}/events/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: event?.title ?? "Scorred", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1600); }
    } catch { /* cancelled */ }
  }

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
          {!pending && (
            <button onClick={share} title={shared ? "Link copied" : "Share"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: shared ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer", flexShrink: 0 }}>
              <Share2 size={17} />
            </button>
          )}
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
            {/* v8 pending rows — when/city · where/"Venue" · bound community (when present) */}
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", margin: "16px 0" }}>
              {/* v8 §8#14 — same date grammar as the detail page: "Sat · 24 May · 4:00 pm – 8:00 pm". */}
              <DetailRow icon={Calendar} title={fmtEventWhen(event.starts_at, event.ends_at)} sub={event.city ?? undefined} />
              <DetailRow icon={online ? Globe : MapPin} title={event.where ?? event.venue ?? "TBA"} sub="Venue" last={!event.community} />
              {event.community && <DetailRow icon={MessageCircle} title={event.community.name} sub="Bound community" last />}
            </div>

            {/* v8 — while you wait: manage the bound community from here. */}
            {event.community && (
              <Link href={`/community/${event.community.id}/manage`} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none", marginBottom: 16, padding: 13,
                background: "var(--ink)", color: "var(--paper)", borderRadius: 13,
              }}>
                <Settings2 size={19} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Manage {event.community.name}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(244,239,230,0.7)" }}>Edit details, rules and members while you wait</div>
                </div>
                <ChevronRight size={18} style={{ opacity: 0.7 }} />
              </Link>
            )}
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
                <MessageCircle size={19} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Post an update</div>
                  <div style={{ fontSize: 12.5, color: "rgba(244,239,230,0.7)" }}>Reach attendees in {event.community.name}</div>
                </div>
                <ChevronRight size={18} style={{ opacity: 0.7 }} />
              </Link>
            )}
          </>
        )}

        {/* Edit details — DV8-16 full surface, mirrors the create-event fields.
            v8 shows NO edit surface while pending (withdraw-and-resubmit is the path);
            the inline panel (vs v8's modal sheet) stays a deliberate divergence. */}
        {!pending && !cancelled && (
          editing ? (
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "2px 14px 14px", marginBottom: 18, background: "var(--paper-soft)" }}>
              <EditLabel hint="optional">Cover photo</EditLabel>
              {/* v8 EventManage cover tile is the same 96px camera tile as the create form (§8#28). */}
              <ImageUploader onUpload={(url) => setECover(url)} previewUrl={eCover ?? undefined} label="Add a cover photo" height={96} compact />

              <EditLabel>Event title</EditLabel>
              <input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="Title" style={fieldStyle} />

              <EditLabel hint="pick one or more">Categories</EditLabel>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {ADD_CATEGORIES.map((c) => {
                  const on = eCats.includes(c.id);
                  return (
                    // v8 — label-only pills (no check glyph), 7px/13px, singular chipLabel.
                    <button key={c.id} type="button" onClick={() => toggleECat(c.id)} style={{
                      display: "inline-flex", alignItems: "center", padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                      // v8 EventManage.jsx:217 — off-state chips sit on paper-soft.
                      background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                      border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                      fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, lineHeight: 1, whiteSpace: "nowrap",
                    }}>
                      {CHIP_LABEL[c.id] ?? c.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <EditLabel>Start date</EditLabel>
                  <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <EditLabel hint="optional">End date</EditLabel>
                  <input type="date" value={eEndDate} min={eDate || undefined} onChange={(e) => setEEndDate(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13 }} />
                </div>
              </div>
              {/* v8 — time inputs at 14px mono; no "Shows as…" echo. */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <EditLabel>Start time</EditLabel>
                  <input type="time" value={eTime} onChange={(e) => setETime(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <EditLabel hint="optional">End time</EditLabel>
                  <input type="time" value={eEndTime} onChange={(e) => setEEndTime(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 14 }} />
                </div>
              </div>

              {!online && (
                <>
                  <EditLabel>City</EditLabel>
                  <CityField value={eCity} onChange={(c) => setECity(c)} />
                </>
              )}

              {/* v8 — venue NAME + optional address DETAILS, like the create form. */}
              <EditLabel>{online ? "Stream / link name" : "Venue name"}</EditLabel>
              <input value={eVenue} onChange={(e) => setEVenue(e.target.value)} placeholder={online ? "Stream / link name" : "e.g. Phoenix Marketcity, LBS Marg, Kurla West"} style={fieldStyle} />

              {!online && (
                <>
                  <EditLabel hint="optional">Address details</EditLabel>
                  <textarea value={eAddress} onChange={(e) => setEAddress(e.target.value)} rows={2} placeholder="e.g. 3rd floor atrium, near the food court"
                    style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none" }} />
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0", lineHeight: 1.5 }}>Attendees see this exact address once they RSVP.</div>
                </>
              )}

              <EditLabel>Description</EditLabel>
              <textarea value={eAbout} onChange={(e) => setEAbout(e.target.value)} rows={3} placeholder="Description" style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none" }} />

              <EditLabel>Entry</EditLabel>
              <Segmented value={ePricing} onChange={(v) => setEPricing(v)} options={[{ id: "free", label: "Free" }, { id: "paid", label: "Paid" }]} />
              {ePricing === "paid" && (
                <div style={{ marginTop: 10 }}>
                  <MoneyField value={ePrice} onChange={setEPrice} cur={ePriceCur} onCur={setEPriceCur} bad={!(Number(ePrice) > 0)} placeholder="e.g. 500" />
                </div>
              )}

              <EditLabel hint="optional">Ticket link</EditLabel>
              <input type="url" value={eTicketUrl} onChange={(e) => setETicketUrl(e.target.value)} placeholder="e.g. https://in.bookmyshow.com/…" style={fieldStyle} />

              <EditLabel hint="optional">Contact details</EditLabel>
              <input value={eContact} onChange={(e) => setEContact(e.target.value)} placeholder="Phone, email or WhatsApp for questions" style={fieldStyle} />

              <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
                <button onClick={() => setEditing(false)} disabled={busy} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveEdit} disabled={busy || editInvalid} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: busy ? "wait" : "pointer", opacity: editInvalid ? 0.5 : 1 }}>{busy ? "Saving…" : "Save changes"}</button>
              </div>
            </div>
          ) : (
            <button onClick={openEdit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 18 }}>
              <Pencil size={16} />Edit event details
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
