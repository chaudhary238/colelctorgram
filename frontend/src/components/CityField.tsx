"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// CityField — type-to-search canonical city picker (DV8-16, port of
// design_v8/app/shared.jsx CityPicker).
//
// A fed list, not free text: typo'd and inconsistently-spelled cities
// ("Bangalore" / "Bengaluru" / "banglore") fragment every location filter,
// meetup search and shipping estimate. The list is served by GET /cities
// (founder 2026-09-06: "city list is not dynamic" — growing it is now a DB
// insert, not a frontend deploy); aliases are matched server-side but never
// stored. City and country are reported SEPARATELY (never as one
// "City, Country" string) because event and listing matching compares bare
// city names.
// ─────────────────────────────────────────────────────────────

type CityRow = { name: string; region: string | null; country: string };

// Suggestions barely change within a session — cache per query across every
// CityField instance so reopening the field or retyping costs no request.
const cityCache = new Map<string, CityRow[]>();

// The dropdown's secondary line: region where one exists, otherwise the country alone.
const cityRegion = (c: CityRow) => (c.region ? `${c.region}, ${c.country}` : c.country);

export function CityField({
  value,
  country = "",
  onChange,
  label,
  placeholder = "Start typing your city…",
  missing = false,
  height = 46,
}: {
  value: string;
  /** The picked city's country — when provided, the closed field displays
      "City, Country" (v8 shared.jsx:342). Storage stays split: onChange still
      reports city and country separately. */
  country?: string;
  /** Reports city and country separately — callers that only store city can ignore the 2nd arg. */
  onChange: (city: string, country: string) => void;
  /** Optional built-in label; pages that render their own label row can omit it. */
  label?: string;
  placeholder?: string;
  /** Paints the required-field red border (matches the events form fields). */
  missing?: boolean;
  /** Field height (px). Events forms use the 46px default; Edit profile passes 48 (v8 field spec). */
  height?: number;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [matches, setMatches] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  // Guards against a slow response for an old query landing after a newer one.
  const latestQ = useRef("");

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  // Server-side matching (city, region, country or alias — "Kerala", "Japan"
  // and "bombay" all surface the right rows). Debounced; previous matches stay
  // rendered while the next query is in flight so the dropdown doesn't flicker.
  useEffect(() => {
    if (!open) return;
    const s = q.trim().toLowerCase();
    latestQ.current = s;
    const cached = cityCache.get(s);
    if (cached) { setMatches(cached); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.get<{ cities: CityRow[] }>(`/cities?q=${encodeURIComponent(s)}`)
        .then((r) => {
          cityCache.set(s, r.cities);
          if (latestQ.current === s) { setMatches(r.cities); setLoading(false); }
        })
        .catch(() => { if (latestQ.current === s) setLoading(false); });
    }, s ? 160 : 0);
    return () => clearTimeout(t);
  }, [q, open]);

  const pick = (c: CityRow) => {
    onChange(c.name, c.country);
    setQ("");
    setOpen(false);
  };

  // v8 shared.jsx:342 — the closed field shows the pick as "City, Country".
  const shown = value ? (country ? `${value}, ${country}` : value) : "";

  // v8 shared.jsx:345,354 — at the 48px field spec the pin sits at left 14 and the
  // input pads '0 40px'; the 46px events-form variant keeps its original metrics.
  const v8Spec = height >= 48;
  const fieldStyle: React.CSSProperties = {
    display: "block", width: "100%", boxSizing: "border-box", height, padding: v8Spec ? "0 40px" : "0 40px 0 38px",
    borderRadius: v8Spec ? 12 : 11, border: `1px solid ${missing ? "var(--stamp-red)" : "var(--border-strong)"}`,
    background: "var(--paper-soft)",
    fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      {label && (
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.02em", marginBottom: 7 }}>{label}</span>
      )}
      <div style={{ position: "relative" }}>
        <MapPin size={16} style={{ position: "absolute", left: v8Spec ? 14 : 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)", pointerEvents: "none" }} />
        <input
          value={open ? q : shown}
          onFocus={() => { setQ(""); setOpen(true); setHi(0); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(i + 1, matches.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); if (matches[hi]) pick(matches[hi]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={shown || placeholder}
          style={fieldStyle}
        />
        {value && !open && (
          <button
            type="button"
            onClick={() => onChange("", "")}
            aria-label="Clear city"
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, borderRadius: 8,
              border: "none", background: "var(--bone)", color: "var(--ink-faint)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        )}
        {open && (
          <Search size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)", pointerEvents: "none" }} />
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "100%", marginTop: 6, zIndex: 40,
          background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 12,
          boxShadow: "var(--shadow-3)", overflow: "hidden", maxHeight: 268, overflowY: "auto",
        }}>
          {matches.length === 0 ? (
            <div style={{ padding: "13px 14px", fontSize: 13, color: "var(--ink-faint)", lineHeight: 1.45 }}>
              {loading ? "Searching…" : "No match. Try the nearest large city — this keeps location filters consistent for everyone."}
            </div>
          ) : matches.map((c, i) => (
            <button
              key={c.name + c.country}
              type="button"
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(c)}
              style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "11px 13px",
                border: "none", borderTop: i ? "1px solid var(--border)" : "none", cursor: "pointer",
                background: i === hi ? "var(--bone)" : "transparent", fontFamily: "var(--font-body)",
              }}
            >
              <MapPin size={14} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>{c.name}</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)", marginLeft: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cityRegion(c)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// "4:00 pm" — the one 12-hour formatter every events surface shares (DV8-16:
// native <input type=time> values echo back in this shape wherever displayed).
export function formatTime12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

/** Same "4:00 pm" shape from a Date (for ISO timestamps echoed on detail pages). */
export function formatTime12FromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return formatTime12(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
}
