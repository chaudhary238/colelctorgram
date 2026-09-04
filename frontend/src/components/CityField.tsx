"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CityField — type-to-search canonical city picker (DV8-16, port of
// design_v8/app/shared.jsx CityPicker + CITIES).
//
// A fed list, not free text: typo'd and inconsistently-spelled cities
// ("Bangalore" / "Bengaluru" / "banglore") fragment every location filter,
// meetup search and shipping estimate. Each entry is
// [city, region, country, ...aliases] — aliases are searchable but never
// stored, so a user typing a former or short name still lands on one
// canonical value. City and country are reported SEPARATELY (never as one
// "City, Country" string) because event and listing matching compares bare
// city names.
// ─────────────────────────────────────────────────────────────

const CITIES: readonly (readonly string[])[] = [
  // India
  ["Mumbai", "Maharashtra", "India", "bombay"], ["Pune", "Maharashtra", "India", "poona"], ["Nagpur", "Maharashtra", "India"], ["Nashik", "Maharashtra", "India"], ["Thane", "Maharashtra", "India"], ["Navi Mumbai", "Maharashtra", "India"],
  ["Delhi", "Delhi", "India", "ncr"], ["New Delhi", "Delhi", "India"],
  ["Bengaluru", "Karnataka", "India", "bangalore", "blr"], ["Mysuru", "Karnataka", "India", "mysore"], ["Mangaluru", "Karnataka", "India", "mangalore"], ["Hubballi", "Karnataka", "India", "hubli"],
  ["Chennai", "Tamil Nadu", "India", "madras"], ["Coimbatore", "Tamil Nadu", "India"], ["Madurai", "Tamil Nadu", "India"], ["Tiruchirappalli", "Tamil Nadu", "India", "trichy"],
  ["Hyderabad", "Telangana", "India", "hyd"], ["Warangal", "Telangana", "India"],
  ["Kolkata", "West Bengal", "India", "calcutta"], ["Howrah", "West Bengal", "India"], ["Siliguri", "West Bengal", "India"],
  ["Ahmedabad", "Gujarat", "India", "amdavad"], ["Surat", "Gujarat", "India"], ["Vadodara", "Gujarat", "India", "baroda"], ["Rajkot", "Gujarat", "India"],
  ["Jaipur", "Rajasthan", "India"], ["Jodhpur", "Rajasthan", "India"], ["Udaipur", "Rajasthan", "India"], ["Kota", "Rajasthan", "India"],
  ["Lucknow", "Uttar Pradesh", "India"], ["Kanpur", "Uttar Pradesh", "India"], ["Noida", "Uttar Pradesh", "India"], ["Ghaziabad", "Uttar Pradesh", "India"], ["Agra", "Uttar Pradesh", "India"], ["Varanasi", "Uttar Pradesh", "India", "banaras"], ["Prayagraj", "Uttar Pradesh", "India", "allahabad"], ["Meerut", "Uttar Pradesh", "India"],
  ["Gurugram", "Haryana", "India", "gurgaon"], ["Faridabad", "Haryana", "India"], ["Panchkula", "Haryana", "India"], ["Chandigarh", "Chandigarh", "India"],
  ["Ludhiana", "Punjab", "India"], ["Amritsar", "Punjab", "India"], ["Jalandhar", "Punjab", "India"],
  ["Bhopal", "Madhya Pradesh", "India"], ["Indore", "Madhya Pradesh", "India"], ["Jabalpur", "Madhya Pradesh", "India"], ["Gwalior", "Madhya Pradesh", "India"],
  ["Patna", "Bihar", "India"], ["Gaya", "Bihar", "India"],
  ["Kochi", "Kerala", "India", "cochin", "ernakulam"], ["Thiruvananthapuram", "Kerala", "India", "trivandrum"], ["Kozhikode", "Kerala", "India", "calicut"], ["Thrissur", "Kerala", "India"],
  ["Bhubaneswar", "Odisha", "India"], ["Cuttack", "Odisha", "India"], ["Guwahati", "Assam", "India"],
  ["Raipur", "Chhattisgarh", "India"], ["Ranchi", "Jharkhand", "India"], ["Jamshedpur", "Jharkhand", "India"],
  ["Dehradun", "Uttarakhand", "India"], ["Shimla", "Himachal Pradesh", "India"], ["Srinagar", "Jammu & Kashmir", "India"], ["Jammu", "Jammu & Kashmir", "India"],
  ["Visakhapatnam", "Andhra Pradesh", "India", "vizag"], ["Vijayawada", "Andhra Pradesh", "India"], ["Guntur", "Andhra Pradesh", "India"],
  ["Goa", "Goa", "India", "panaji"], ["Puducherry", "Puducherry", "India", "pondicherry"], ["Imphal", "Manipur", "India"], ["Shillong", "Meghalaya", "India"], ["Agartala", "Tripura", "India"], ["Aizawl", "Mizoram", "India"], ["Kohima", "Nagaland", "India"], ["Gangtok", "Sikkim", "India"], ["Itanagar", "Arunachal Pradesh", "India"],
  // Asia-Pacific
  ["Singapore", "", "Singapore", "sg"], ["Hong Kong", "", "Hong Kong SAR", "hk"], ["Tokyo", "Kantō", "Japan"], ["Osaka", "Kansai", "Japan"], ["Kyoto", "Kansai", "Japan"], ["Nagoya", "Chūbu", "Japan"], ["Yokohama", "Kantō", "Japan"],
  ["Seoul", "", "South Korea"], ["Busan", "", "South Korea"], ["Taipei", "", "Taiwan"], ["Kaohsiung", "", "Taiwan"],
  ["Shanghai", "", "China"], ["Beijing", "", "China", "peking"], ["Shenzhen", "", "China"], ["Guangzhou", "", "China", "canton"], ["Chengdu", "", "China"],
  ["Bangkok", "", "Thailand"], ["Kuala Lumpur", "", "Malaysia", "kl"], ["Penang", "", "Malaysia"], ["Jakarta", "", "Indonesia"], ["Manila", "", "Philippines"], ["Ho Chi Minh City", "", "Vietnam", "saigon"], ["Hanoi", "", "Vietnam"],
  ["Sydney", "New South Wales", "Australia"], ["Melbourne", "Victoria", "Australia"], ["Brisbane", "Queensland", "Australia"], ["Perth", "Western Australia", "Australia"], ["Auckland", "", "New Zealand"], ["Wellington", "", "New Zealand"],
  ["Colombo", "", "Sri Lanka"], ["Kathmandu", "", "Nepal"], ["Dhaka", "", "Bangladesh"], ["Karachi", "", "Pakistan"], ["Lahore", "", "Pakistan"], ["Islamabad", "", "Pakistan"],
  // Middle East & Africa
  ["Dubai", "", "United Arab Emirates", "uae"], ["Abu Dhabi", "", "United Arab Emirates"], ["Sharjah", "", "United Arab Emirates"], ["Doha", "", "Qatar"], ["Riyadh", "", "Saudi Arabia"], ["Jeddah", "", "Saudi Arabia"], ["Kuwait City", "", "Kuwait"], ["Manama", "", "Bahrain"], ["Muscat", "", "Oman"],
  ["Tel Aviv", "", "Israel"], ["Istanbul", "", "Turkey"], ["Cairo", "", "Egypt"], ["Nairobi", "", "Kenya"], ["Lagos", "", "Nigeria"], ["Johannesburg", "", "South Africa", "jozi"], ["Cape Town", "", "South Africa"],
  // Europe
  ["London", "England", "United Kingdom", "uk"], ["Manchester", "England", "United Kingdom"], ["Birmingham", "England", "United Kingdom"], ["Glasgow", "Scotland", "United Kingdom"], ["Edinburgh", "Scotland", "United Kingdom"], ["Dublin", "", "Ireland"],
  ["Paris", "Île-de-France", "France"], ["Lyon", "", "France"], ["Marseille", "", "France"],
  ["Berlin", "", "Germany"], ["Munich", "Bavaria", "Germany", "münchen"], ["Frankfurt", "", "Germany"], ["Hamburg", "", "Germany"], ["Cologne", "", "Germany", "köln"],
  ["Amsterdam", "", "Netherlands"], ["Rotterdam", "", "Netherlands"], ["Brussels", "", "Belgium"], ["Zürich", "", "Switzerland", "zurich"], ["Geneva", "", "Switzerland"], ["Vienna", "", "Austria", "wien"],
  ["Madrid", "", "Spain"], ["Barcelona", "", "Spain"], ["Lisbon", "", "Portugal", "lisboa"], ["Rome", "", "Italy", "roma"], ["Milan", "", "Italy", "milano"],
  ["Stockholm", "", "Sweden"], ["Copenhagen", "", "Denmark"], ["Oslo", "", "Norway"], ["Helsinki", "", "Finland"], ["Warsaw", "", "Poland"], ["Prague", "", "Czechia"], ["Budapest", "", "Hungary"], ["Athens", "", "Greece"],
  // Americas
  ["New York", "New York", "United States", "nyc", "new york city"], ["Los Angeles", "California", "United States", "la"], ["San Francisco", "California", "United States", "sf"], ["San Jose", "California", "United States"], ["San Diego", "California", "United States"],
  ["Chicago", "Illinois", "United States"], ["Houston", "Texas", "United States"], ["Dallas", "Texas", "United States"], ["Austin", "Texas", "United States"], ["Seattle", "Washington", "United States"], ["Portland", "Oregon", "United States"],
  ["Boston", "Massachusetts", "United States"], ["Philadelphia", "Pennsylvania", "United States"], ["Atlanta", "Georgia", "United States"], ["Miami", "Florida", "United States"], ["Orlando", "Florida", "United States"], ["Denver", "Colorado", "United States"], ["Phoenix", "Arizona", "United States"], ["Las Vegas", "Nevada", "United States"], ["Washington", "District of Columbia", "United States", "dc"],
  ["Toronto", "Ontario", "Canada"], ["Vancouver", "British Columbia", "Canada"], ["Montreal", "Quebec", "Canada"], ["Calgary", "Alberta", "Canada"], ["Ottawa", "Ontario", "Canada"],
  ["Mexico City", "", "Mexico", "cdmx"], ["São Paulo", "", "Brazil", "sao paulo"], ["Rio de Janeiro", "", "Brazil", "rio"], ["Buenos Aires", "", "Argentina"], ["Santiago", "", "Chile"], ["Bogotá", "", "Colombia", "bogota"], ["Lima", "", "Peru"],
];

// The dropdown's secondary line: region where one exists, otherwise the country alone.
const cityRegion = (c: readonly string[]) => (c[1] ? `${c[1]}, ${c[2]}` : c[2]);

export function CityField({
  value,
  onChange,
  label,
  placeholder = "Start typing your city…",
  missing = false,
}: {
  value: string;
  /** Reports city and country separately — callers that only store city can ignore the 2nd arg. */
  onChange: (city: string, country: string) => void;
  /** Optional built-in label; pages that render their own label row can omit it. */
  label?: string;
  placeholder?: string;
  /** Paints the required-field red border (matches the events form fields). */
  missing?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  // Matches city, region, country or alias, so "Kerala", "Japan" and "bombay"
  // all surface the right rows.
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CITIES.slice(0, 8);
    const starts: (readonly string[])[] = [];
    const contains: (readonly string[])[] = [];
    CITIES.forEach((c) => {
      const city = c[0].toLowerCase();
      const region = (c[1] || "").toLowerCase();
      const ctry = c[2].toLowerCase();
      const aliases = c.slice(3);
      if (city.startsWith(s) || aliases.some((a) => a.startsWith(s))) starts.push(c);
      else if (city.includes(s) || region.startsWith(s) || ctry.startsWith(s) || region.includes(s) || ctry.includes(s) || aliases.some((a) => a.includes(s))) contains.push(c);
    });
    return [...starts, ...contains].slice(0, 8);
  }, [q]);

  const pick = (c: readonly string[]) => {
    onChange(c[0], c[2]);
    setQ("");
    setOpen(false);
  };

  const fieldStyle: React.CSSProperties = {
    display: "block", width: "100%", boxSizing: "border-box", height: 46, padding: "0 40px 0 38px",
    borderRadius: 11, border: `1px solid ${missing ? "var(--stamp-red)" : "var(--border-strong)"}`,
    background: "var(--paper-soft)",
    fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      {label && (
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.02em", marginBottom: 7 }}>{label}</span>
      )}
      <div style={{ position: "relative" }}>
        <MapPin size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)", pointerEvents: "none" }} />
        <input
          value={open ? q : value}
          onFocus={() => { setQ(""); setOpen(true); setHi(0); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(i + 1, matches.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); if (matches[hi]) pick(matches[hi]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={value || placeholder}
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
              No match. Try the nearest large city — this keeps location filters consistent for everyone.
            </div>
          ) : matches.map((c, i) => (
            <button
              key={c[0] + c[2]}
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
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>{c[0]}</span>
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
