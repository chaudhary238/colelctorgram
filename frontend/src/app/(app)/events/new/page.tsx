"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Shield, Check, Info, Plus, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity, ApiEvent } from "@/components/cards";
import { Segmented, SectionLabel } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { CityField, formatTime12 } from "@/components/CityField";
import { MoneyField } from "@/components/forms";
import { fireToast } from "@/components/gamification";
import { ADD_CATEGORIES } from "@/lib/catalog";

// v8 EventCreate maps the global 5-category CATEGORIES (incl. TCG) as plain chipLabel
// pills, no icons. ADD_CATEGORIES is that exact list in v8 order. Kept in lockstep.
const CATEGORIES = ADD_CATEGORIES;

const DRAFT_KEY = "ch_event_draft";

type ComMode = "none" | "create" | "existing";
type Pricing = "free" | "paid";
interface ModCommunity extends ApiCommunity { member_role?: string }

interface Draft {
  cover: string | null; title: string; cats: string[];
  date: string; endDate: string; time: string; endTime: string;
  city: string; venue: string; about: string; bring: string;
  pricing: Pricing; price: string; priceCur: string;
  ticketUrl: string; contact: string;
  comMode: ComMode; existingCom: string;
}

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px",
  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
};

function Label({ children, required, missing, hint }: {
  children: React.ReactNode; required?: boolean; missing?: boolean; hint?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, marginTop: 20 }}>
      <SectionLabel>{children}</SectionLabel>
      {required && <span style={{ color: missing ? "var(--stamp-red)" : "var(--ink-ghost)", fontSize: 13, fontWeight: 700 }}>*</span>}
      {hint && !missing && <span style={{ fontSize: 11, color: "var(--ink-ghost)", marginLeft: "auto" }}>{hint}</span>}
      {missing && <span style={{ fontSize: 11, color: "var(--stamp-red)", marginLeft: "auto", fontWeight: 600 }}>Required</span>}
    </div>
  );
}

// DV8-16 — the draft restores whenever one exists, not only on the ?newCommunity=
// round-trip. Abandoning the community form (back button, closed tab within the
// session) used to strand everything typed here; now the form comes back either way
// and a "Discard draft" affordance covers the deliberate-restart case.
function readBoot(): { draft: Draft | null; newCommunityId: string | null } {
  if (typeof window === "undefined") return { draft: null, newCommunityId: null };
  const newCommunityId = new URLSearchParams(window.location.search).get("newCommunity");
  let draft: Draft | null = null;
  try { draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); } catch { /* ignore */ }
  return { draft, newCommunityId };
}

export default function CreateEventPage() {
  const router = useRouter();
  const [boot] = useState(readBoot);
  const d = boot.draft;
  const [cover, setCover] = useState<string | null>(d?.cover ?? null);
  const [title, setTitle] = useState(d?.title ?? "");
  const [cats, setCats] = useState<string[]>(d?.cats ?? []);
  const [date, setDate] = useState(d?.date ?? "");
  const [endDate, setEndDate] = useState(d?.endDate ?? "");
  const [time, setTime] = useState(d?.time ?? "");
  const [endTime, setEndTime] = useState(d?.endTime ?? "");
  const [city, setCity] = useState(d?.city ?? "");
  const [venue, setVenue] = useState(d?.venue ?? "");
  const [about, setAbout] = useState(d?.about ?? "");
  const [bring, setBring] = useState(d?.bring ?? "");
  const [pricing, setPricing] = useState<Pricing>(d?.pricing ?? "free");
  const [price, setPrice] = useState(d?.price ?? "");
  const [priceCur, setPriceCur] = useState(d?.priceCur ?? "INR");
  const [ticketUrl, setTicketUrl] = useState(d?.ticketUrl ?? "");
  const [contact, setContact] = useState(d?.contact ?? "");
  const [comMode, setComMode] = useState<ComMode>(boot.newCommunityId ? "create" : d?.comMode ?? "none");
  const [existingCom, setExistingCom] = useState(d?.existingCom ?? "");
  const [createdCom, setCreatedCom] = useState<ApiCommunity | null>(null);
  const [ownedComs, setOwnedComs] = useState<ModCommunity[]>([]);
  const [existing, setExisting] = useState<ApiEvent[]>([]);
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stranded-draft banner: only when the restore did NOT come from the expected
  // community round-trip (that flow restores silently, as before).
  const [draftRestored, setDraftRestored] = useState(!!d && !boot.newCommunityId);

  const dirty = !!(cover || title || cats.length || date || endDate || time || endTime ||
    city || venue || about || bring || ticketUrl || contact || price ||
    pricing !== "free" || existingCom || comMode !== "none");

  // Persist continuously (v8 pattern) so ANY exit — the community detour or a plain
  // navigation — can restore. An untouched form keeps no draft behind.
  useEffect(() => {
    if (submitting) return;
    if (dirty) {
      const snap: Draft = { cover, title, cats, date, endDate, time, endTime, city, venue, about, bring, pricing, price, priceCur, ticketUrl, contact, comMode, existingCom };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
    } else {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, [dirty, submitting, cover, title, cats, date, endDate, time, endTime, city, venue, about, bring, pricing, price, priceCur, ticketUrl, contact, comMode, existingCom]);

  const discardDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    setCover(null); setTitle(""); setCats([]); setDate(""); setEndDate(""); setTime(""); setEndTime("");
    setCity(""); setVenue(""); setAbout(""); setBring("");
    setPricing("free"); setPrice(""); setPriceCur("INR"); setTicketUrl(""); setContact("");
    setComMode("none"); setExistingCom(""); setCreatedCom(null);
    setTried(false); setDraftRestored(false);
  };

  // Bind the freshly-made community (async fetch + URL cleanup are effect-safe — the
  // setState happens inside the promise callback, not synchronously in the effect).
  useEffect(() => {
    if (!boot.newCommunityId) return;
    api.get<ApiCommunity>(`/communities/${boot.newCommunityId}`).then(setCreatedCom).catch(() => {});
    router.replace("/events/new");
  }, [boot.newCommunityId, router]);

  // Existing titles, for the v7 duplicate-name guard (matched case/whitespace-insensitively).
  useEffect(() => {
    api.get<ApiEvent[]>("/events?limit=50").then((e) => setExisting(e ?? [])).catch(() => {});
  }, []);

  // "Use mine" — communities the caller founds/mods.
  useEffect(() => {
    if (comMode !== "existing" || ownedComs.length) return;
    api.get<ModCommunity[]>("/communities?scope=moderating").then((c) => setOwnedComs(c ?? [])).catch(() => {});
  }, [comMode, ownedComs.length]);

  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");
  const dupEvent = title.trim() ? existing.find((e) => norm(e.title) === norm(title)) : undefined;

  const toggleCat = (id: string) =>
    setCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  const miss = {
    title: !title.trim(), cats: cats.length === 0, date: !date, time: !time.trim(),
    city: !city.trim(), venue: !venue.trim(), about: !about.trim(),
    // v7 blocks a submit whose title collides with an event that already exists.
    dup: !!dupEvent,
    endDate: !!(endDate && date && endDate < date),
    community: comMode === "existing" ? !existingCom : comMode === "create" ? !createdCom : false,
    price: pricing === "paid" && !(Number(price) > 0),
  };
  const invalid = Object.values(miss).some(Boolean);

  const launchCreateCommunity = () => {
    // The continuous-persistence effect already keeps the draft current; this is
    // just a belt-and-braces flush before we leave the page.
    const snap: Draft = { cover, title, cats, date, endDate, time, endTime, city, venue, about, bring, pricing, price, priceCur, ticketUrl, contact, comMode, existingCom };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
    const qs = new URLSearchParams({ forEvent: "1" });
    if (title.trim()) qs.set("prefillName", title.trim());
    if (cats[0]) qs.set("prefillCat", cats[0]);
    router.push(`/community/new?${qs.toString()}`);
  };

  const submit = async () => {
    if (invalid) { setTried(true); return; }
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // start / end → ISO. date is YYYY-MM-DD, time is HH:MM (24h from <input type=time>).
    const startsAt = new Date(`${date}T${time || "00:00"}`).toISOString();
    let endsAt: string | null = null;
    if (endTime || endDate) {
      const ed = endDate || date;
      endsAt = new Date(`${ed}T${endTime || time || "00:00"}`).toISOString();
    }
    const communityId =
      comMode === "existing" ? existingCom : comMode === "create" && createdCom ? createdCom.id : null;

    try {
      await api.post<ApiEvent>("/events", {
        title: title.trim(),
        description: about.trim(),
        categories: cats,
        // v8 EventCreate is physical-only — no online mode on the create surface.
        mode: "in_person",
        city: city.trim(),
        venue: venue.trim(),
        online_url: null,
        cover_image_url: cover,
        bring: bring.trim() || null,
        community_id: communityId,
        starts_at: startsAt,
        ends_at: endsAt,
        // DV8-16 — pricing + ticketing/contact. Price travels in minor units.
        is_free: pricing === "free",
        price: pricing === "paid" ? Math.round(Number(price) * 100) : 0,
        currency: priceCur,
        ticket_url: ticketUrl.trim() || null,
        contact: contact.trim() || null,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      // v7 returns to the list and points the host at "My Events"; replace (not push)
      // keeps the submitted composer out of the back stack.
      router.replace("/events");
      fireToast("Submitted for approval — find it under “My Events”");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit event");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/events" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <X size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>List an event</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Reviewed before it goes live</div>
          </div>
          <button onClick={submit} disabled={submitting} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: submitting ? "wait" : "pointer", opacity: invalid ? 0.5 : 1 }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      <div style={{ padding: "4px 20px 16px" }}>
        {draftRestored && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, padding: "10px 13px", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <Info size={15} style={{ flexShrink: 0, color: "var(--ink-faint)" }} />
            <span style={{ flex: 1, fontSize: 12.5, color: "var(--ink-soft)" }}>Picked up where you left off.</span>
            <button onClick={discardDraft} type="button" style={{ background: "none", border: "none", color: "var(--stamp-red)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 4, whiteSpace: "nowrap" }}>
              Discard draft
            </button>
          </div>
        )}

        {/* DV8-16 — cover shrunk to a 96px banner-style uploader */}
        <Label hint="optional">Cover photo</Label>
        <ImageUploader onUpload={(url) => setCover(url)} previewUrl={cover ?? undefined} label="Add a cover photo" />

        <Label required missing={tried && miss.title}>Event title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mumbai Collector Meet · Vol 5" style={{ ...fieldStyle, borderColor: (tried && miss.title) || dupEvent ? "var(--stamp-red)" : "var(--border-strong)" }} />
        {dupEvent && (
          <div style={{ display: "flex", gap: 7, alignItems: "flex-start", margin: "8px 2px 0", fontSize: 12, color: "var(--stamp-red)", lineHeight: 1.45 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>&ldquo;{dupEvent.title}&rdquo; already exists. Use a more specific name (add a volume, date or city).</span>
          </div>
        )}

        <Label required missing={tried && miss.cats} hint="pick one or more">Categories</Label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggleCat(c.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                border: `1px solid ${on ? "var(--ink)" : tried && miss.cats ? "var(--stamp-red)" : "var(--border-strong)"}`,
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, lineHeight: 1,
              }}>
                {on && <Check size={13} strokeWidth={2.6} />}{c.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label required missing={tried && miss.date}>Start date</Label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13, borderColor: tried && miss.date ? "var(--stamp-red)" : "var(--border-strong)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Label missing={tried && miss.endDate} hint="optional">End date</Label>
            <input type="date" value={endDate} min={date || undefined} onChange={(e) => setEndDate(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13, borderColor: tried && miss.endDate ? "var(--stamp-red)" : "var(--border-strong)" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label required missing={tried && miss.time}>Start time</Label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13, borderColor: tried && miss.time ? "var(--stamp-red)" : "var(--border-strong)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Label hint="optional">End time</Label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13 }} />
          </div>
        </div>
        {time.trim() && (
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>
            Shows as {formatTime12(time.trim())}{endTime.trim() ? ` – ${formatTime12(endTime.trim())}` : ""}
          </div>
        )}

        <Label required missing={tried && miss.city}>City</Label>
        <CityField value={city} onChange={(c) => setCity(c)} missing={tried && miss.city} />

        <Label required missing={tried && miss.venue}>Venue</Label>
        <textarea value={venue} onChange={(e) => setVenue(e.target.value)} rows={2} placeholder="Full address — e.g. Phoenix Marketcity, LBS Marg, Kurla West, 3rd floor atrium"
          style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", borderColor: tried && miss.venue ? "var(--stamp-red)" : "var(--border-strong)" }} />

        <Label required missing={tried && miss.about}>Description</Label>
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} placeholder="What's happening, who it's for, what to expect…"
          style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", borderColor: tried && miss.about ? "var(--stamp-red)" : "var(--border-strong)" }} />

        <Label hint="optional">What to bring</Label>
        <input value={bring} onChange={(e) => setBring(e.target.value)} placeholder="e.g. Up to 3 pieces to display or trade" style={fieldStyle} />

        {/* DV8-16 — Free/Paid entry with multi-currency price */}
        <Label required>Entry</Label>
        <Segmented value={pricing} onChange={(v) => setPricing(v)} options={[{ id: "free", label: "Free" }, { id: "paid", label: "Paid" }]} />
        {pricing === "paid" && (
          <div style={{ marginTop: 11 }}>
            <MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} bad={tried && miss.price} placeholder="e.g. 500" />
            {tried && miss.price && <div style={{ fontSize: 11.5, color: "var(--stamp-red)", marginTop: 6 }}>Add a ticket price.</div>}
          </div>
        )}

        <Label hint="optional">Ticket link</Label>
        <input type="url" value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="e.g. https://in.bookmyshow.com/…" style={fieldStyle} />

        <Label hint="optional">Contact details</Label>
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone, email or WhatsApp for questions" style={fieldStyle} />

        <Label hint="optional">Event community</Label>
        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "-2px 2px 10px", lineHeight: 1.5 }}>A space for attendees to talk, network and post. Totally optional.</div>
        <Segmented value={comMode} onChange={(v) => setComMode(v as ComMode)} options={[{ id: "none", label: "None" }, { id: "create", label: "Create new" }, { id: "existing", label: "Use mine" }]} />

        {comMode === "none" && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 11, padding: 13, background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--ink-faint)" }} />
            No community — attendees just RSVP. You can add one later.
          </div>
        )}

        {comMode === "create" && (
          <div style={{ marginTop: 11 }}>
            {createdCom ? (
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 12, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 13 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>{createdCom.tag}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{createdCom.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>New community · you&rsquo;re the admin</div>
                </div>
                <button onClick={launchCreateCommunity} style={{ background: "none", border: "none", color: "var(--stamp-red)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 4 }}>Edit</button>
              </div>
            ) : (
              <button onClick={launchCreateCommunity} type="button" style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer", padding: 13, borderRadius: 13,
                border: `1px dashed ${tried && miss.community ? "var(--stamp-red)" : "var(--border-strong)"}`, background: "var(--paper-soft)",
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={19} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Set up the community</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Name, privacy, posting &amp; rules</div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
              </button>
            )}
          </div>
        )}

        {comMode === "existing" && (
          <div style={{ marginTop: 11 }}>
            {ownedComs.length === 0 ? (
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 13, background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--ink-faint)" }} />
                You don&rsquo;t run any communities yet. Pick <b style={{ margin: "0 3px" }}>Create new</b> to start one.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ownedComs.map((c) => {
                  const on = existingCom === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => setExistingCom(c.id)} style={{
                      display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer", padding: 11, borderRadius: 12,
                      border: `1.5px solid ${on ? "var(--ink)" : tried && miss.community ? "var(--stamp-red)" : "var(--border-strong)"}`, background: on ? "var(--bone)" : "var(--paper-soft)",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14 }}>{c.tag}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>You&rsquo;re the {c.member_role ?? "admin"}</div>
                      </div>
                      {on && <Check size={17} strokeWidth={2.6} style={{ color: "var(--ink)" }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <div style={{ marginTop: 16, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

        <button onClick={submit} disabled={submitting} type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          height: 48, marginTop: 22, borderRadius: 12, border: "none",
          background: "var(--ink)", color: "var(--paper)",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
          cursor: submitting ? "wait" : "pointer", opacity: invalid ? 0.5 : 1,
        }}>
          <Shield size={18} />{submitting ? "Submitting…" : "Submit for approval"}
        </button>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
          Scorred reviews every event before it&rsquo;s public.
        </div>
      </div>
    </div>
  );
}
