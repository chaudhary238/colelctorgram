"use client";

import { ChevronDown, Info } from "lucide-react";
import { Segmented } from "@/components/ui";
import { CURRENCIES, symOf, PO_MONTHS, PO_YEARS, type PoPrecision } from "@/lib/catalog";

// ─────────────────────────────────────────────────────────────
// Shared add-item form widgets (design_v4 AddListing / AddToCollection).
// MoneyField — leading currency selector + numeric input (DV4-05).
// ReleaseWindowPicker — pre-order release window precision selector (DV4-03a).
// ─────────────────────────────────────────────────────────────

const poSelectStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, boxSizing: "border-box", height: 46, padding: "0 11px", borderRadius: 11,
  border: "1px solid var(--border-strong)", background: "var(--paper)",
  fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none", cursor: "pointer",
};

// Money input with a leading currency selector — default INR (v4 MoneyField).
export function MoneyField({
  value, onChange, cur, onCur, bad, placeholder = "0", big = false,
}: {
  value: string;
  onChange: (v: string) => void;
  cur: string;
  onCur: (c: string) => void;
  bad?: boolean;
  placeholder?: string;
  big?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "stretch", height: big ? 54 : 46, borderRadius: 12,
      border: `1px solid ${bad ? "var(--stamp-red)" : "var(--border-strong)"}`, background: "var(--paper-soft)", overflow: "hidden",
    }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", borderRight: "1px solid var(--border)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 11px", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--ink-soft)", pointerEvents: "none" }}>
          {symOf(cur)} {cur}
          <ChevronDown size={13} strokeWidth={2.2} style={{ color: "var(--ink-faint)" }} />
        </span>
        <select value={cur} onChange={(e) => onCur(e.target.value)}
          aria-label="Currency"
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", fontSize: 16 }}>
          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.sym} {c.code}</option>)}
        </select>
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", padding: "0 13px",
          fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: big ? 21 : 16, color: "var(--ink)" }} />
    </div>
  );
}

// Pre-order release-window precision picker (Date / Month / Quarter / Year / TBD).
export function ReleaseWindowPicker({
  prec, onPrec, date, onDate, monthIdx, onMonth, quarter, onQuarter, year, onYear,
}: {
  prec: PoPrecision;
  onPrec: (p: PoPrecision) => void;
  date: string;
  onDate: (v: string) => void;
  monthIdx: string;
  onMonth: (v: string) => void;
  quarter: string;
  onQuarter: (v: string) => void;
  year: string;
  onYear: (v: string) => void;
}) {
  return (
    <>
      <Segmented<PoPrecision> value={prec} onChange={onPrec}
        options={[{ id: "date", label: "Date" }, { id: "month", label: "Month" }, { id: "quarter", label: "Qtr" }, { id: "year", label: "Year" }, { id: "tbd", label: "TBD" }]} />
      <div style={{ marginTop: 11 }}>
        {prec === "date" && (
          <input type="date" value={date} onChange={(e) => onDate(e.target.value)}
            style={{ ...poSelectStyle, width: "100%", cursor: "auto", fontFamily: "var(--font-mono)", fontSize: 14 }} />
        )}
        {prec === "month" && (
          <div style={{ display: "flex", gap: 10 }}>
            <select value={monthIdx} onChange={(e) => onMonth(e.target.value)} style={poSelectStyle}>
              <option value="">Month</option>
              {PO_MONTHS.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => onYear(e.target.value)} style={poSelectStyle}>
              {PO_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        {prec === "quarter" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              {["1", "2", "3", "4"].map((q) => {
                const on = quarter === q;
                return (
                  <button key={q} type="button" onClick={() => onQuarter(q)} style={{
                    flex: 1, height: 46, borderRadius: 11, cursor: "pointer",
                    border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                    background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink)",
                    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
                  }}>Q{q}</button>
                );
              })}
            </div>
            <select value={year} onChange={(e) => onYear(e.target.value)} style={{ ...poSelectStyle, flex: "none", width: 96 }}>
              {PO_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        {prec === "year" && (
          <select value={year} onChange={(e) => onYear(e.target.value)} style={poSelectStyle}>
            {PO_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {prec === "tbd" && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "11px 13px", background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 11, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--ink-faint)" }} />
            No date announced yet — it sits under &ldquo;Date to be announced&rdquo; on your PO Calendar. Set a window once the maker confirms.
          </div>
        )}
      </div>
    </>
  );
}
