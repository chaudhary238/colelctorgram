"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, MapPin, Search, X, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ApiEvent, EventCard } from "@/components/cards";
import { BackButton } from "@/components/BackButton";
import { Segmented, SectionLabel, EmptyNote, Tag, ProductPhoto, CategoryChip } from "@/components/ui";
import { shortDate } from "@/lib/utils";
import { useUser } from "@/lib/auth-context";
import { ADD_CATEGORIES } from "@/lib/catalog";

// v4 EventsView tabs: Upcoming · Going · Past · My Events.
const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "going", label: "Going" },
  { id: "past", label: "Past" },
  { id: "hosting", label: "My Events" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function EventsPage() {
  const { user } = useUser();
  const [tab, setTab] = useState<TabId>("upcoming");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<ApiEvent[] | null>(null);
  const [mineLoading, setMineLoading] = useState(false);
  const [q, setQ] = useState("");
  const [evCats, setEvCats] = useState<string[]>([]);

  // Public (active) events — split into upcoming / past client-side, as the design does.
  useEffect(() => {
    api.get<ApiEvent[]>("/events?limit=50")
      .then((data) => setEvents(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // "My Events" (hosting) — the caller's own events in any status. Loaded from the tab
  // handler on first open (not an effect, to avoid synchronous setState-in-effect).
  const openTab = (v: TabId) => {
    setTab(v);
    setEvCats([]);   // v4 clears the category filter on tab change
    if (v === "hosting" && mine === null && !mineLoading) {
      setMineLoading(true);
      api.get<ApiEvent[]>("/events?scope=mine&limit=50")
        .then((data) => setMine(data ?? []))
        .catch(() => setMine([]))
        .finally(() => setMineLoading(false));
    }
  };
  const toggleEvCat = (id: string) =>
    setEvCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  const [now] = useState(() => Date.now());   // stable "now" for the upcoming/past split
  const myCity = (user?.city ?? "").toLowerCase();

  // v4 search (title / city) + multi-category filter.
  const qMatch = (e: ApiEvent) =>
    !q || e.title.toLowerCase().includes(q.toLowerCase()) || (e.city ?? "").toLowerCase().includes(q.toLowerCase());
  const catMatch = (e: ApiEvent) => evCats.length === 0 || e.categories.some((c) => evCats.includes(c));

  const past = events.filter((e) => new Date(e.starts_at).getTime() < now);

  // Upcoming sorted so the viewer's own city comes first (city-aware sort).
  const upcoming = events
    .filter((e) => new Date(e.starts_at).getTime() >= now)
    .sort((a, b) => {
      const ac = a.city?.toLowerCase() === myCity ? 0 : 1;
      const bc = b.city?.toLowerCase() === myCity ? 0 : 1;
      return ac - bc;
    });
  // "Going" = anything the viewer RSVP'd to (going or interested), past or future.
  const goingList = events.filter((e) => e.my_rsvp);

  const filteredUpcoming = upcoming.filter((e) => qMatch(e) && catMatch(e));
  const filteredPast = past.filter((e) => qMatch(e) && catMatch(e));
  const filteredGoing = goingList.filter(qMatch);

  const cityCount = myCity ? upcoming.filter((e) => e.city?.toLowerCase() === myCity).length : 0;
  const featured = filteredUpcoming[0];

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        {/* row 0 (mobile only): back + title. DV7-02 — Events lost its bottom-nav tab
            to Database, so on mobile it's a pushed screen off the AppBar calendar icon
            and carries its own back affordance (R-06 pattern). Desktop keeps the Sidebar. */}
        <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <BackButton fallback="/feed" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Events</span>
        </div>
        {/* row 1: search + list button (v4 EventsView) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
            <Search size={16} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }} />
            {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "var(--ink-ghost)", display: "flex" }}><X size={14} strokeWidth={2} /></button>}
          </div>
          <Link href="/events/new" style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 13px", borderRadius: 11, border: "none", background: "var(--ink)", color: "var(--paper)", textDecoration: "none", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" }}>
            <Plus size={15} strokeWidth={2.2} />List an event
          </Link>
        </div>
        {/* row 2: tabs */}
        <Segmented options={TABS as unknown as { id: string; label: string }[]} value={tab} onChange={(v) => openTab(v as TabId)} />
        {/* row 3: category filter — upcoming / past only (v4) */}
        {(tab === "upcoming" || tab === "past") && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, marginTop: 10, paddingBottom: 2 }}>
            {ADD_CATEGORIES.map((c) => (
              <CategoryChip key={c.id} active={evCats.includes(c.id)} onClick={() => toggleEvCat(c.id)}>{c.label}</CategoryChip>
            ))}
            {evCats.length > 0 && (
              <button onClick={() => setEvCats([])} style={{ background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>Clear</button>
            )}
          </div>
        )}
      </div>

      {loading && tab !== "hosting" ? (
        <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ height: 200, borderRadius: 16, background: "var(--bone)" }} />
          {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: 96, borderRadius: 14, background: "var(--bone)" }} />)}
        </div>
      ) : tab === "upcoming" ? (
        <>
          {featured && (
            <div style={{ padding: "14px 20px 0" }}>
              <SectionLabel>{q ? `Results for "${q}"` : cityCount > 0 ? `Next up in ${user?.city}` : "Next up"}</SectionLabel>
              <Link href={`/events/${featured.id}`} style={{ display: "block", textDecoration: "none", marginTop: 10, borderRadius: 16, overflow: "hidden", background: "var(--ink)", position: "relative" }}>
                {featured.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.cover_image_url} alt="" style={{ display: "block", width: "100%", aspectRatio: "2/1", objectFit: "cover" }} />
                ) : (
                  <ProductPhoto tone={featured.community?.tone ?? "plum"} ratio="2/1" rounded={0} />
                )}
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

          {user?.city && !q && cityCount === 0 && filteredUpcoming.length > 0 && (
            <div style={{ margin: "14px 20px 0", display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 13 }}>
              <MapPin size={16} style={{ color: "var(--ink-faint)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                No events in <b>{user.city}</b> yet — showing national &amp; online events.{" "}
                <Link href="/events/new" style={{ color: "var(--stamp-red)", fontWeight: 600, textDecoration: "none" }}>List one →</Link>
              </span>
            </div>
          )}

          <div style={{ padding: "20px 20px 0" }}>
            <SectionLabel>All upcoming</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 10 }}>
              {filteredUpcoming.slice(1).map((ev) => <EventCard key={ev.id} event={ev} />)}
              {filteredUpcoming.length <= 1 && (
                <EmptyNote>{q ? `No events match "${q}".` : evCats.length ? "No upcoming events in this category." : "That’s every upcoming event for now."}</EmptyNote>
              )}
            </div>
          </div>

          <div style={{ padding: "20px 20px 28px", textAlign: "center", fontSize: 11.5, color: "var(--ink-faint)" }}>
            Events are reviewed by Scorred before they go live.
          </div>
        </>
      ) : tab === "going" ? (
        <div style={{ padding: "16px 20px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {filteredGoing.map((ev) => <EventCard key={ev.id} event={ev} />)}
            {filteredGoing.length === 0 && (
              <EmptyNote>{q ? "No events match your search." : "You haven’t RSVP’d to any events yet."}</EmptyNote>
            )}
          </div>
        </div>
      ) : tab === "past" ? (
        <div style={{ padding: "16px 20px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {filteredPast.map((ev) => <EventCard key={ev.id} event={ev} />)}
            {filteredPast.length === 0 && (
              <EmptyNote>{q ? `No events match "${q}".` : evCats.length ? "No past events in this category." : "No past events yet."}</EmptyNote>
            )}
          </div>
        </div>
      ) : (
        // My Events (hosting)
        <div style={{ padding: "16px 20px 28px" }}>
          <Link href="/events/new" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 46,
            borderRadius: 14, background: "var(--ink)", color: "var(--paper)", textDecoration: "none",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, marginBottom: 16,
          }}>
            <Plus size={18} />List an event
          </Link>
          {mineLoading && mine === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: 74, borderRadius: 14, background: "var(--bone)" }} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {(mine ?? []).map((ev) => <HostingRow key={ev.id} event={ev} />)}
              {(mine ?? []).length === 0 && <EmptyNote>You&rsquo;re not hosting any events yet. Tap &ldquo;List an event&rdquo;.</EmptyNote>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HostingRow({ event }: { event: ApiEvent }) {
  const { day, month } = shortDate(event.starts_at);
  const pending = event.status === "pending_approval";
  const cancelled = event.status === "cancelled" || event.status === "rejected";
  return (
    <Link href={`/events/${event.id}/manage`} style={{
      display: "flex", gap: 12, width: "100%", textDecoration: "none", alignItems: "center",
      background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 12,
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 11, flexShrink: 0,
        background: pending ? "var(--grail-gold-soft)" : "var(--ink)",
        color: pending ? "var(--grail-gold-deep)" : "var(--paper)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{month}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{day}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25, color: "var(--ink)" }}>{event.title}</div>
        <div style={{ marginTop: 5 }}>
          {pending ? (
            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "var(--grail-gold-soft)", color: "var(--grail-gold-deep)" }}>Pending approval</span>
          ) : cancelled ? (
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{event.status === "rejected" ? "Not approved" : "Cancelled"}</span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{event.going_count ?? 0} going · tap to manage</span>
          )}
        </div>
      </div>
      <ChevronRight size={18} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
    </Link>
  );
}
