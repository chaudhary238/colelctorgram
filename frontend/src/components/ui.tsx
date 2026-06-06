"use client";

/* ─────────────────────────────────────────────────────────────
   CollectorHub — shared UI primitives
   Ported 1:1 from design/mobile/app/shared.jsx so the Next.js web
   app matches the design's sizes, colors, and type exactly.
   ───────────────────────────────────────────────────────────── */

import React from "react";

/* ── Brand mark (logo-stamp.svg) ─────────────────────────────── */
export function SealMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 144 144" style={{ flexShrink: 0 }}>
      <g transform="translate(72 72) rotate(-4)">
        <rect x={-72} y={-72} width={144} height={144} rx={14} fill="#D93324" />
        <rect
          x={-58}
          y={-58}
          width={116}
          height={116}
          rx={8}
          fill="none"
          stroke="rgba(244,239,230,0.35)"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <text
          x={0}
          y={22}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight={800}
          fontSize={96}
          fill="#F4EFE6"
          letterSpacing={-4}
        >
          C
        </text>
      </g>
    </svg>
  );
}

/* ── Avatar (initial bubble, optional verified tick) ─────────── */
const AVATAR_PALETTE = [
  "var(--stamp-red)",
  "var(--plum)",
  "var(--verified-teal)",
  "var(--forest)",
  "var(--grail-gold)",
  "var(--ink-mute)",
];

export function Avatar({
  name = "?",
  color,
  size = 36,
  verified = false,
}: {
  name?: string;
  color?: string;
  size?: number;
  verified?: boolean;
}) {
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const bg = color ?? AVATAR_PALETTE[(name || "x").charCodeAt(0) % AVATAR_PALETTE.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.4,
        position: "relative",
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {initial}
      {verified && (
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: "50%",
            background: "var(--verified-teal)",
            color: "var(--paper)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--paper)",
          }}
        >
          <svg width={size * 0.22} height={size * 0.22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── Tag (sale / sold / reserved / vouch / event …) ──────────── */
type TagKind = "sale" | "po" | "misb" | "sold" | "reserved" | "vouch" | "event" | "default";
const TAG_STYLES: Record<TagKind, React.CSSProperties> = {
  sale: { background: "var(--stamp-red)", color: "var(--paper)" },
  po: { background: "var(--grail-gold)", color: "var(--ink)" },
  misb: { background: "var(--ink)", color: "var(--paper)" },
  sold: { background: "var(--forest)", color: "var(--paper)" },
  reserved: { background: "var(--grail-gold-soft)", color: "var(--grail-gold-deep)", border: "1px solid var(--grail-gold)" },
  vouch: { background: "var(--verified-teal-soft)", color: "var(--verified-teal)", border: "1px solid var(--verified-teal)" },
  event: { background: "var(--plum-soft)", color: "var(--plum)", border: "1px solid var(--plum)" },
  default: { background: "var(--bone)", color: "var(--ink)" },
};

export function Tag({ kind = "default", children, style }: { kind?: TagKind; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 7px",
        borderRadius: 4,
        lineHeight: 1,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...TAG_STYLES[kind],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Post-type pill (Showcase / Discussion / Review) ─────────── */
export function PostTypeTag({ type }: { type: string }) {
  const map: Record<string, { label: string; c: string }> = {
    showcase: { label: "Showcase", c: "var(--verified-teal)" },
    discussion: { label: "Discussion", c: "var(--plum)" },
    review: { label: "Review", c: "var(--grail-gold-deep)" },
    poll: { label: "Poll", c: "var(--stamp-red)" },
  };
  const m = map[type] || map.showcase;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: m.c,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.c }} />
      {m.label}
    </span>
  );
}

/* ── Ownership-verification badge (Claimed / Shown / Verified) ─ */
export function VerifyBadge({ tier = "claimed", size = "sm" }: { tier?: string; size?: "sm" | "lg" }) {
  const map: Record<string, { label: string; c: string; bg: string; icon: React.ReactNode }> = {
    verified: {
      label: "Verified",
      c: "var(--verified-teal)",
      bg: "var(--verified-teal-soft)",
      icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
    },
    shown: {
      label: "Shown",
      c: "var(--grail-gold-deep)",
      bg: "var(--grail-gold-soft)",
      icon: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="4" /></>,
    },
    claimed: {
      label: "Claimed",
      c: "var(--ink-faint)",
      bg: "var(--bone)",
      icon: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
    },
  };
  const m = map[tier] || map.claimed;
  const pad = size === "lg" ? "5px 9px" : "3px 6px";
  const fs = size === "lg" ? 11 : 10;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: pad,
        borderRadius: 5,
        background: m.bg,
        color: m.c,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: fs,
        letterSpacing: "0.04em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <svg width={fs + 2} height={fs + 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {m.icon}
      </svg>
      {m.label}
    </span>
  );
}

/* ── Trust tier chip (Top Seller / Trusted / Verified) ───────── */
export function TierChip({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    "Top Seller": "var(--stamp-red)",
    Trusted: "var(--forest)",
    Verified: "var(--verified-teal)",
  };
  const label = tier === "verified" ? "Verified" : tier === "trusted" ? "Trusted" : tier === "top_seller" ? "Top Seller" : tier;
  const c = map[label] || "var(--ink-mute)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 999,
        border: `1px solid ${c}`,
        color: c,
        background: "transparent",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: 10.5,
        letterSpacing: "0.04em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      {label}
    </span>
  );
}

/* ── Stars ───────────────────────────────────────────────────── */
export function Stars({ n = 0, size = 13, c = "var(--grail-gold-deep)" }: { n?: number; size?: number; c?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: c }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= n ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6}>
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}

/* ── Segmented control ───────────────────────────────────────── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", background: "var(--bone)", borderRadius: 10, padding: 3, gap: 2, ...style }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1,
              padding: "7px 6px",
              borderRadius: 8,
              border: "none",
              background: active ? "var(--paper)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-faint)",
              fontFamily: "var(--font-body)",
              fontWeight: active ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: 1,
              boxShadow: active ? "var(--shadow-1)" : "none",
              transition: "all 120ms",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Category chip ───────────────────────────────────────────── */
export function CategoryChip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 999,
        background: active ? "var(--ink)" : "var(--paper-soft)",
        color: active ? "var(--paper)" : "var(--ink)",
        border: `1px solid ${active ? "var(--ink)" : "var(--border-strong)"}`,
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ── Money (tabular, ₹) ──────────────────────────────────────── */
export function Money({ value, currency = "₹", strike = false, size }: { value: number; currency?: string; strike?: boolean; size?: number }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontFeatureSettings: '"tnum" 1',
        fontWeight: 600,
        textDecoration: strike ? "line-through" : "none",
        color: strike ? "var(--ink-faint)" : "inherit",
        fontSize: size,
      }}
    >
      {currency} {value.toLocaleString("en-IN")}
    </span>
  );
}

/* ── Stamp (hard-shadow accent) ──────────────────────────────── */
export function Stamp({ children, color = "var(--stamp-red)", rotate = 2, style }: { children: React.ReactNode; color?: string; rotate?: number; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        background: color,
        color: "var(--paper)",
        padding: "4px 8px",
        borderRadius: 4,
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        boxShadow: "var(--shadow-stamp)",
        transform: `rotate(${rotate}deg)`,
        lineHeight: 1,
        whiteSpace: "nowrap",
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── ProductPhoto (tone gradient + figure silhouette placeholder) */
const PHOTO_TONES: Record<string, string> = {
  red: "linear-gradient(135deg, #B73B2E 0%, #842A24 100%)",
  gold: "linear-gradient(135deg, #E8A33D 0%, #B07724 100%)",
  teal: "linear-gradient(135deg, #3FA39B 0%, #1F6E68 100%)",
  plum: "linear-gradient(135deg, #8B4870 0%, #4E2640 100%)",
  forest: "linear-gradient(135deg, #4A8E5F 0%, #234A30 100%)",
  ink: "linear-gradient(135deg, #3A332E 0%, #14110F 100%)",
  bone: "linear-gradient(135deg, #D6CDB9 0%, #B8AFA3 100%)",
};

export function ProductPhoto({
  tone = "red",
  src,
  label,
  ratio = "4/3",
  rounded = 10,
  style,
  children,
}: {
  tone?: string;
  src?: string | null;
  label?: string;
  ratio?: string;
  rounded?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        aspectRatio: ratio,
        width: "100%",
        background: PHOTO_TONES[tone] || PHOTO_TONES.red,
        borderRadius: rounded,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.2), transparent 60%)",
              mixBlendMode: "soft-light",
            }}
          />
          <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3 }}>
            <ellipse cx="60" cy="84" rx="22" ry="3" fill="rgba(0,0,0,0.5)" />
            <path
              d="M60 22 q6 0 7 6 t-2 12 q4 4 4 14 l3 18 q1 8 -4 10 l-2 2 -3 -2 q-1 -8 -2 -14 l0 14 -3 4 -3 -4 0 -14 q-1 6 -2 14 l-3 2 -2 -2 q-5 -2 -4 -10 l3 -18 q0 -10 4 -14 q-3 -6 -2 -12 t7 -6 z"
              fill="rgba(0,0,0,0.55)"
            />
          </svg>
          {label && (
            <div style={{ position: "absolute", bottom: 8, left: 10, color: "rgba(244,239,230,0.72)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.05em" }}>
              {label}
            </div>
          )}
        </>
      )}
      {children}
    </div>
  );
}

/* ── Section label (mono, all-caps) ──────────────────────────── */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
      {children}
    </div>
  );
}

/* ── Empty note ──────────────────────────────────────────────── */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-faint)", fontSize: 13 }}>{children}</div>;
}

/* ── Initials helper ─────────────────────────────────────────── */
export function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
