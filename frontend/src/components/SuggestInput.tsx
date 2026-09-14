"use client";

import { useState } from "react";
import { Plus, Search, Tag, X } from "lucide-react";

/* QA #13/#14/#23 — shared type-ahead input: filters a known list as you type,
   free text stays allowed via an explicit teal "Add …" row (the anti-duplicate
   escape hatch, same pattern as /add/catalogue's brand combobox). */
export function SuggestInput({
  value,
  onChange,
  options,
  placeholder,
  addLabel = "as new entry",
  borderColor,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  /** Suffix of the free-text accept row: Add "x" {addLabel}. */
  addLabel?: string;
  /** Optional override (e.g. validation red). */
  borderColor?: string;
}) {
  const [focus, setFocus] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = q
    ? options.filter((o) => o.toLowerCase().includes(q)).slice(0, 6)
    : options.slice(0, 6);
  const exact = options.some((o) => o.toLowerCase() === q);

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 12px", borderRadius: 11,
        border: `1px solid ${borderColor ?? "var(--border-strong)"}`, background: "var(--paper-soft)",
      }}>
        <Search size={15} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
        <input
          value={value}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }}
        />
        {value && (
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(""); }} aria-label="Clear"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 0 }}>
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>
      {focus && (matches.length > 0 || (q.length > 1 && !exact)) && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 20, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 11, overflow: "hidden", boxShadow: "var(--shadow-3)", maxHeight: 260, overflowY: "auto" }}>
          {matches.map((o) => (
            <button key={o} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(o); setFocus(false); }} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
              padding: "10px 13px", background: "transparent", border: "none", borderBottom: "1px solid var(--border)",
            }}>
              <Tag size={14} style={{ color: "var(--ink-faint)" }} />
              <span style={{ fontSize: 14, color: "var(--ink)" }}>{o}</span>
            </button>
          ))}
          {q.length > 1 && !exact && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(value.trim()); setFocus(false); }} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
              padding: "10px 13px", background: "var(--verified-teal-soft)", border: "none",
            }}>
              <Plus size={14} strokeWidth={2.4} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "var(--verified-teal)", fontWeight: 600 }}>Add &ldquo;{value.trim()}&rdquo; {addLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
