"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Filter, Plus, MapPin, Search, Star, X } from "lucide-react";
import { api } from "@/lib/api";
import { ApiEvent, EventCard } from "@/components/cards";
import { BackButton } from "@/components/BackButton";
import { Segmented, SectionLabel, EmptyNote, Tag, ProductPhoto, CategoryChip, Badge, Button } from "@/components/ui";
import { useUser } from "@/lib/auth-context";
import { ADD_CATEGORIES } from "@/lib/catalog";
import { fmtEventWhen } from "./_date";

// v8 chips read the SINGULAR chipLabel (data.jsx) — only figures differs from label.
const CHIP_LABEL: Record<string, string> = { figures: "Action Figure" };

type PriceFilter = "all" | "free" | "paid";
type RsvpFilter = "all" | "going" | "interested";

/* DV8 §3#16 — v8's WINNING FilterChip definition (Rewards.jsx:564-578, same local
   copy as db/page.tsx), extended with an optional leading icon for the Interested
   star (v8 EventsView.jsx:189). */
function FilterChip({ active, onClick, children, icon }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "7px 14px", borderRadius: 999, cursor: "pointer", transition: "all 120ms",
      border: `1px solid ${active ? "var(--ink)" : "var(--border)"}`,
      background: active ? "var(--ink)" : "var(--paper)", color: active ? "var(--paper)" : "var(--ink-mute)",
      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", lineHeight: 1.2,
    }}>
      {icon}
      {children}
    </button>
  );
}

/* v8 shared.jsx IconLabel — rose-tint icon box beside a mono micro-label. */
function IconLabel({ icon: Icon, children, style }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, ...style }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8,
        background: "var(--rose-tint-bg)", border: "1px solid var(--rose-tint-border)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={14} strokeWidth={2} style={{ color: "var(--rose-tint-text)" }} />
      </div>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.11em",
        textTransform: "uppercase", fontWeight: 700, color: "var(--slate-500)",
      }}>{children}</span>
    </div>
  );
}

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
  // v8 EventsView (Sep-13) filter sheet — applied values + drafts seeded on open.
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftEvCats, setDraftEvCats] = useState<string[]>([]);
  const [draftPriceFilter, setDraftPriceFilter] = useState<PriceFilter>("all");
  const [draftRsvpFilter, setDraftRsvpFilter] = useState<RsvpFilter>("all");

  // Public (active) events — split into upcoming / past client-side, as the design does.
  // upcoming=false: this page owns the Past tab, so it wants the full set (the
  // API now defaults to upcoming-only for every other consumer, e.g. the rail).
  useEffect(() => {
    api.get<ApiEvent[]>("/events?limit=50&upcoming=false")
      .then((data) => setEvents(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // "My Events" (hosting) — the caller's own events in any status. Loaded from the tab
  // handler on first open (not an effect, to avoid synchronous setState-in-effect).
  const openTab = (v: TabId) => {
    setTab(v);
    // ⚖ v8 EventsView.jsx:96 resets only evCats + priceFilter on tab change; leaving
    // rsvpFilter silently armed looks like a prototype oversight — we reset all three.
    setEvCats([]);
    setPriceFilter("all");
    setRsvpFilter("all");
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
  const toggleDraftEvCat = (id: string) =>
    setDraftEvCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));
  const openSheet = () => { setDraftEvCats(evCats); setDraftPriceFilter(priceFilter); setDraftRsvpFilter(rsvpFilter); setSheetOpen(true); };
  const applySheet = () => { setEvCats(draftEvCats); setPriceFilter(draftPriceFilter); setRsvpFilter(draftRsvpFilter); setSheetOpen(false); };
  const clearSheet = () => { setDraftEvCats([]); setDraftPriceFilter("all"); setDraftRsvpFilter("all"); };

  const [now] = useState(() => Date.now());   // stable "now" for the upcoming/past split
  const myCity = (user?.city ?? "").toLowerCase();

  // v4 search (title / city) + multi-category filter.
  const qMatch = (e: ApiEvent) =>
    !q || e.title.toLowerCase().includes(q.toLowerCase()) || (e.city ?? "").toLowerCase().includes(q.toLowerCase());
  const catMatch = (e: ApiEvent) => evCats.length === 0 || e.categories.some((c) => evCats.includes(c));
  // "Free" mirrors how events/[id] derives priceLabel: paid ⇔ is_free === false
  // AND price > 0; anything else displays (and filters) as free.
  const isFreeEvent = (e: ApiEvent) => !(e.is_free === false && (e.price ?? 0) > 0);
  const priceMatch = (e: ApiEvent) => priceFilter === "all" || (priceFilter === "free" ? isFreeEvent(e) : !isFreeEvent(e));
  const rsvpMatch = (e: ApiEvent) => rsvpFilter === "all" || e.my_rsvp === rsvpFilter;
  const activeFilterCount = evCats.length + (priceFilter !== "all" ? 1 : 0) + (rsvpFilter !== "all" ? 1 : 0);

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

  // v8 — price/RSVP filters apply to Upcoming and Past; the Going tab stays search-only.
  const filteredUpcoming = upcoming.filter((e) => qMatch(e) && catMatch(e) && priceMatch(e) && rsvpMatch(e));
  const filteredPast = past.filter((e) => qMatch(e) && catMatch(e) && priceMatch(e) && rsvpMatch(e));
  const filteredGoing = goingList.filter(qMatch);

  const cityCount = myCity ? upcoming.filter((e) => e.city?.toLowerCase() === myCity).length : 0;
  const featured = filteredUpcoming[0];

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 16px 10px" }}>
        {/* row 0: back (mobile-only) + title. DV7-02 — Events lost its bottom-nav tab
            to Database, so on mobile it's a pushed screen off the AppBar calendar icon
            and carries its own back affordance (R-06 pattern). v8 keeps the title
            visible at EVERY width, so only the back arrow is width-gated. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span className="lg:hidden" style={{ display: "flex" }}><BackButton fallback="/feed" /></span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Events</span>
        </div>
        {/* row 1: search + list button (v8 EventsView metrics) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 12px", borderRadius: 12, border: "1px solid var(--slate-200)", background: "var(--card-surface)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Search size={16} style={{ color: "var(--slate-400)", flexShrink: 0 }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }} />
            {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "var(--slate-400)", display: "flex" }}><X size={14} strokeWidth={2} /></button>}
            {/* v8 EventsView:76 — filter trigger lives INSIDE the search field (market/db pattern). */}
            <button type="button" onClick={openSheet} aria-label={`Filters${activeFilterCount ? ` · ${activeFilterCount} active` : ""}`} style={{
              display: "flex", alignItems: "center", gap: 4, flexShrink: 0, padding: 0,
              background: "none", border: "none", cursor: "pointer",
              color: activeFilterCount ? "var(--stamp-red)" : "var(--slate-400)",
            }}>
              <Filter size={17} strokeWidth={2} />
              {activeFilterCount > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{activeFilterCount}</span>}
            </button>
          </div>
          <Link href="/events/new" style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 13px", borderRadius: 12, border: "none", background: "var(--slate-900)", color: "var(--paper)", textDecoration: "none", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" }}>
            <Plus size={15} strokeWidth={2.2} />List an event
          </Link>
        </div>
        {/* row 2: tabs */}
        <Segmented options={TABS as unknown as { id: string; label: string }[]} value={tab} onChange={(v) => openTab(v as TabId)} />
        {/* row 3 (v8 EventsView:97-102, Sep-13) — the full chip row moved into the filter
            sheet; inline we echo only the SELECTED chips (tap removes) + Clear. */}
        {(tab === "upcoming" || tab === "past") && evCats.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, marginTop: 10, paddingBottom: 2 }}>
            {evCats.map((id) => (
              <CategoryChip key={id} active onClick={() => toggleEvCat(id)}>
                {CHIP_LABEL[id] ?? ADD_CATEGORIES.find((c) => c.id === id)?.label ?? id}
              </CategoryChip>
            ))}
            <button onClick={() => setEvCats([])} style={{ background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}>Clear</button>
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
                {/* v8 — no mode Tag overlay; the subtitle reads "{when} · {city}". */}
                <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, color: "var(--paper)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{featured.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(244,239,230,0.85)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} strokeWidth={2} />
                    {featuredWhen(featured)}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {user?.city && !q && cityCount === 0 && (
            <div style={{ margin: "14px 20px 0", display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "var(--slate-100)", border: "1px solid var(--slate-200)", borderRadius: 13 }}>
              <MapPin size={16} style={{ color: "var(--ink-faint)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                No events in <b>{user.city}</b> yet — showing events from nearby cities.{" "}
                <Link href="/events/new" style={{ color: "var(--stamp-red)", fontWeight: 600, textDecoration: "none" }}>List one →</Link>
              </span>
            </div>
          )}

          <div style={{ padding: "20px 20px 0" }}>
            {/* v8 — the "All upcoming" icon-label renders only when there's more than one result */}
            {filteredUpcoming.length > 1 && <IconLabel icon={Calendar} style={{ marginBottom: 10 }}>All upcoming</IconLabel>}
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 10 }}>
              {filteredUpcoming.slice(1).map((ev) => <EventCard key={ev.id} event={ev} />)}
              {filteredUpcoming.length === 0 && (
                <EmptyNote>{q ? `No events match "${q}".` : "No upcoming events for now."}</EmptyNote>
              )}
            </div>
          </div>

          <div style={{ padding: "12px 20px 28px", textAlign: "center", fontSize: 11.5, color: "var(--ink-faint)" }}>
            Events are reviewed by Scorred before going live.
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
            {/* v8 EventsView:128 — the past tab's search-empty copy is its own string. */}
            {filteredPast.length === 0 && (
              <EmptyNote>{q ? "No events match your search." : evCats.length ? "No past events in this category." : "No past events yet."}</EmptyNote>
            )}
          </div>
        </div>
      ) : (
        // My Events (hosting)
        // QA follow-up 2026-09-13 — no in-tab "List an event" CTA: the header
        // button is always visible right above it, so the duplicate read as noise.
        <div style={{ padding: "16px 20px 28px" }}>
          {mineLoading && mine === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {Array.from({ length: 2 }).map((_, i) => <div key={i} style={{ height: 96, borderRadius: 16, background: "var(--bone)" }} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {/* v8 EventsView:163-169 (Sep-13) — hosted rows are the SHARED EventCard with a
                  status overlay pinned top-right, not a bespoke manage row. */}
              {(mine ?? []).map((ev) => {
                const pending = ev.status === "pending_approval";
                const cancelled = ev.status === "cancelled" || ev.status === "rejected";
                return (
                  <div key={ev.id} style={{ position: "relative" }}>
                    <EventCard event={ev} />
                    {/* v8 Sep-13 nav change — approved hosted rows open the DETAIL page (it
                        carries the host "Manage your event" affordance); only PENDING rows
                        go straight to manage. EventCard always links to detail, so pending
                        gets a full-cover Link overlay retargeting the tap. */}
                    {pending && (
                      <Link href={`/events/${ev.id}/manage`} aria-label={`Manage ${ev.title}`} style={{ position: "absolute", inset: 0, borderRadius: 16 }} />
                    )}
                    <div style={{ position: "absolute", top: 10, right: 10, pointerEvents: "none" }}>
                      {pending ? (
                        <Tag kind="po">Pending approval</Tag>
                      ) : cancelled ? (
                        // ⚖ ours — v8 doesn't model cancelled/rejected hosted rows; keep the QA tags.
                        <Tag kind="default">{ev.status === "rejected" ? "Not approved" : "Cancelled"}</Tag>
                      ) : (
                        <Badge variant="secondary">Hosting</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {(mine ?? []).length === 0 && <EmptyNote>You&rsquo;re not hosting any events yet. Tap &ldquo;List an event&rdquo;.</EmptyNote>}
            </div>
          )}
        </div>
      )}

      {/* v8 EventsView:176-207 filter sheet, on OUR responsive sheet shell
          (ReportSheet.tsx — bottom sheet on mobile, centered card on desktop). */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div onClick={() => setSheetOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div className="relative w-full" style={{ maxWidth: 480, maxHeight: "78%", overflowY: "auto", background: "var(--paper)", borderRadius: "20px 20px 0 0", padding: "10px 18px 20px", boxShadow: "var(--shadow-4)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "4px auto 14px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Filters</div>
              <button type="button" onClick={clearSheet} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13 }}>Clear</button>
            </div>
            <SectionLabel>RSVP</SectionLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              <FilterChip active={draftRsvpFilter === "all"} onClick={() => setDraftRsvpFilter("all")}>All</FilterChip>
              <FilterChip active={draftRsvpFilter === "going"} onClick={() => setDraftRsvpFilter("going")}>Going</FilterChip>
              <FilterChip
                active={draftRsvpFilter === "interested"}
                onClick={() => setDraftRsvpFilter("interested")}
                icon={<Star size={13} fill={draftRsvpFilter === "interested" ? "currentColor" : "none"} />}
              >Interested</FilterChip>
            </div>
            <div style={{ marginTop: 20 }}><SectionLabel>Price</SectionLabel></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              <FilterChip active={draftPriceFilter === "all"} onClick={() => setDraftPriceFilter("all")}>All</FilterChip>
              <FilterChip active={draftPriceFilter === "free"} onClick={() => setDraftPriceFilter("free")}>Free</FilterChip>
              <FilterChip active={draftPriceFilter === "paid"} onClick={() => setDraftPriceFilter("paid")}>Paid</FilterChip>
            </div>
            <div style={{ marginTop: 20 }}><SectionLabel>Category</SectionLabel></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
              {ADD_CATEGORIES.map((c) => (
                <FilterChip key={c.id} active={draftEvCats.includes(c.id)} onClick={() => toggleDraftEvCat(c.id)}>{CHIP_LABEL[c.id] ?? c.label}</FilterChip>
              ))}
            </div>
            <Button variant="dark" size="block" style={{ marginTop: 22 }} onClick={applySheet}>Apply filters</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// v8 FeaturedEvent subtitle — "{when} · {city}" where when reads
// "Sat · 24 May · 4:00 – 8:00 pm" (mixed-case month, end-time range when set).
function featuredWhen(ev: ApiEvent): string {
  const when = fmtEventWhen(ev.starts_at, ev.ends_at, { compact: true });
  return ev.city ? `${when} · ${ev.city}` : when;
}
