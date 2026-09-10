// v8 event date/time formatting, local to the events surfaces (list · detail ·
// manage). Deliberately NOT in lib/utils.ts — shortDate there serves other
// surfaces with an UPPERCASE month + unpadded day, and v8's events read
// mixed-case ("May") with " · " separators; changing the shared helper would
// ripple app-wide (DV8 §8 #7/#9/#14).
//
// Shapes (v8 EventCreate.jsx parseDate/formatTime12 + EventsView/EventDetail):
//   list featured   "Sat · 24 May · 4:00 – 8:00 pm"   (compact: shared am/pm collapses)
//   detail + manage "Sat · 24 May · 4:00 pm – 8:00 pm"
//   multi-day       "24 May – 26 May · 4:00 pm – 8:00 pm" (weekday dropped, v8)
//   tile/pill day   "05" (v8 parseDate zero-pads the tile day; strings never pad)

const EV_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EV_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "4:00 pm" — v8 formatTime12 shape, from a Date. */
function time12(d: Date): string {
  const period = d.getHours() >= 12 ? "pm" : "am";
  const h12 = d.getHours() % 12 || 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, "0")} ${period}`;
}

/** Date-tile / hero-pill parts. Month is mixed-case ("May") — tiles uppercase it
 *  via CSS, exactly like v8; the day is zero-padded per v8 parseDate. */
export function eventDateParts(iso: string): { weekday: string; dayPadded: string; month: string } {
  const d = new Date(iso);
  return {
    weekday: EV_DAYS[d.getDay()],
    dayPadded: String(d.getDate()).padStart(2, "0"),
    month: EV_MONTHS[d.getMonth()],
  };
}

/** The v8 `when` string. `compact` is the list-featured variant: when both times
 *  share an am/pm period the first marker drops ("4:00 – 8:00 pm"). */
export function fmtEventWhen(startsIso: string, endsIso?: string | null, opts: { compact?: boolean } = {}): string {
  const s = new Date(startsIso);
  const e = endsIso ? new Date(endsIso) : null;
  const sameDay = !e || e.toDateString() === s.toDateString();
  const dateStr = sameDay
    ? `${EV_DAYS[s.getDay()]} · ${s.getDate()} ${EV_MONTHS[s.getMonth()]}`
    : `${s.getDate()} ${EV_MONTHS[s.getMonth()]} – ${e!.getDate()} ${EV_MONTHS[e!.getMonth()]}`;
  let timeStr = time12(s);
  if (e) {
    const endStr = time12(e);
    if (opts.compact && timeStr.slice(-2) === endStr.slice(-2)) timeStr = timeStr.slice(0, -3);
    timeStr = `${timeStr} – ${endStr}`;
  }
  return `${dateStr} · ${timeStr}`;
}
