"use client";

/* ─────────────────────────────────────────────────────────────
   Scorred — shared UI primitives
   Ported 1:1 from design/mobile/app/shared.jsx so the Next.js web
   app matches the design's sizes, colors, and type exactly.
   ───────────────────────────────────────────────────────────── */

import React from "react";

/* ── Scorred icon mark (brand/icon-crop.png) ─────────────────── */
export function SealMark({ size = 30, bg = null }: { size?: number; bg?: string | null }) {
  const img = (
    <img
      src="/brand/icon-crop.png"
      width={size}
      height={size}
      alt="Scorred"
      style={{ objectFit: "contain", display: "block", flexShrink: 0 }}
    />
  );
  if (!bg) return img;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        src="/brand/icon-crop-white.png"
        width={size * 0.72}
        height={size * 0.72}
        alt="Scorred"
        style={{ objectFit: "contain", display: "block" }}
      />
    </div>
  );
}

/* ── Scorred wordmark (brand/wordmark-crop.png) ──────────────── */
export function ScorredWordmark({ fontSize = 22 }: { fontSize?: number }) {
  const h = Math.max(22, Math.round(fontSize * 1.15));
  const w = Math.round(h * (3487 / 842)); // natural aspect ratio
  return (
    <img
      src="/brand/wordmark-crop.png"
      width={w}
      height={h}
      alt="Scorred"
      style={{ objectFit: "contain", display: "block", flexShrink: 0 }}
    />
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
  photo,
}: {
  name?: string;
  color?: string;
  size?: number;
  verified?: boolean;
  photo?: string | null;
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
        backgroundImage: photo ? `url(${photo})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!photo && initial}
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

/* ── Tag (sale / sold / vouch / event …) ─────────────────────── */
/* "reserved" retired with DV8-13 — a listing is available | sold | closed. */
type TagKind = "sale" | "po" | "misb" | "sold" | "intel" | "teal" | "vouch" | "event" | "default";
const TAG_STYLES: Record<TagKind, React.CSSProperties> = {
  sale: { background: "var(--stamp-red)", color: "var(--paper)" },
  po: { background: "var(--grail-gold)", color: "var(--ink)" },
  misb: { background: "var(--ink)", color: "var(--paper)" },
  sold: { background: "var(--forest)", color: "var(--paper)" },
  intel: { background: "var(--verified-teal-soft)", color: "var(--verified-teal)", border: "1px solid var(--verified-teal)" },
  teal: { background: "var(--verified-teal-soft)", color: "var(--verified-teal)", border: "1px solid var(--verified-teal)" },
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
        padding: "4px 8px",
        borderRadius: 6,
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

/* ── Post-type pill (Post / Showcase / Discussion / Review / Poll / ISO) ──
   v8 post-type differentiation: FEED cards no longer use this — they carry the
   TypeRibbon corner pill + matching card border (cards.tsx) instead. This pill
   survives only in non-feed contexts (post detail header, community manage
   queue) in its neutral ink/slate hue. */
export function PostTypeTag({ type }: { type: string }) {
  const label: Record<string, string> = {
    post: "Post",
    showcase: "Showcase",
    discussion: "Discussion",
    review: "Review",
    poll: "Poll",
    iso: "ISO",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: 6,
        background: "var(--slate-800)",
        color: "var(--paper)",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label[type] ?? label.post}
    </span>
  );
}

/* Ownership-verification badge (VerifyBadge) and seller TierChip were REMOVED
   2026-07-18. Verification was dropped entirely (anyone lists, plain uploads);
   "Top Seller"/"Trusted" tiers were static & underivable (deals are off-platform).
   Trust is now the vouch count, shown inline via <TrustSignals /> below and the
   profile's Vouches stat tiles — matching design_v6. See DECISIONS.md. */

/* ── Trust signals row (vouches / response / joined) ─────────────
   Ported from design/mobile/app/shared.jsx. Only renders the metrics that are
   provided, so it degrades gracefully when the API lacks one. Deals and star
   ratings are DEAD (deals retired with the deal flow; ratings QA 7.1) — trust
   is vouches, plus "Joined {year}" now that the listing payload carries
   seller_joined. `rating`/`ratingCount` props kept for API compat but unused. */
export function TrustSignals({
  vouches,
  rating,
  ratingCount,
  response,
  joined,
  compact = false,
}: {
  vouches?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  response?: string | null;
  joined?: string | number | null;
  compact?: boolean;
}) {
  // v8 shared.jsx:502-504 — labels are Capitalized (Vouches · Replies · Joined).
  // The "New / new seller" zero-state is ours (v8 always has all three metrics).
  const items: { v: string; l: string }[] = [];
  if (vouches != null) items.push({ v: String(vouches), l: "Vouches" });
  void rating; void ratingCount;
  if (response) items.push({ v: response, l: "Replies" });
  if (joined) items.push({ v: String(joined), l: "Joined" });
  if (items.length === 0) items.push({ v: "New", l: "new seller" });
  return (
    <div
      style={{
        display: "flex",
        gap: compact ? 14 : 0,
        justifyContent: compact ? "flex-start" : "space-between",
      }}
    >
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: compact ? "auto" : 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>
            {it.v}
          </span>
          <span style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.02em" }}>{it.l}</span>
        </div>
      ))}
    </div>
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
  /** `icon` renders inline before the label (design_v7 shared.jsx Segmented) — used by
   *  the profile Collection tab, where tapping the already-active "Owned" segment opens
   *  its filter popover and the sliders glyph is what advertises that. */
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", background: "var(--bone)", borderRadius: 12, padding: 4, gap: 2, ...style }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1,
              padding: "8px 6px",
              borderRadius: 9,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: active ? "var(--paper)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-faint)",
              fontFamily: "var(--font-body)",
              fontWeight: active ? 600 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: 1,
              boxShadow: active ? "var(--shadow-2)" : "none",
              transition: "all 120ms",
            }}
          >
            {o.icon}
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
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ""; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ""; }}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        background: active ? "var(--stamp-red)" : "var(--paper-soft)",
        color: active ? "var(--paper)" : "var(--ink)",
        border: `1px solid ${active ? "var(--stamp-red)" : "var(--border-strong)"}`,
        fontFamily: "var(--font-body)",
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        cursor: "pointer",
        whiteSpace: "nowrap",
        lineHeight: 1,
        flexShrink: 0,
        transition: "all 150ms var(--ease-out), transform 80ms",
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
  fit = "cover",
  style,
  children,
}: {
  tone?: string;
  src?: string | null;
  label?: string;
  ratio?: string;
  rounded?: number;
  /** "cover" (default) for uniform grid tiles; "contain" on detail heroes,
      where cropping the upload would hide part of the photo. */
  fit?: "cover" | "contain";
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
        <img src={src} alt={label || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit }} />
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
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--slate-400)" }}>
      {children}
    </div>
  );
}

/* ── Empty note ──────────────────────────────────────────────── */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "28px 0", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.16 }}>
        <SealMark size={40} />
      </div>
      <div style={{ color: "var(--slate-400)", fontSize: 13 }}>{children}</div>
    </div>
  );
}

/* ── Status → display label ──────────────────────────────────── */
/* wishlist → "Wishlist" (NOT v8's "Intel") is our datamodel vocabulary — deliberate. */
const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  preorder: "Pre-order",
  wishlist: "Wishlist",
  intel: "DB Contribution",
  owned: "Owned",
};
export function statusLabel(s: string) {
  return STATUS_LABEL[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
}

/* ── Badge (v3 DF-29c) — pill, lighter than Tag, many variants ── */
type BadgeVariant =
  | "default" | "secondary" | "outline" | "success" | "warning"
  | "destructive" | "teal" | "plum" | "sky" | "violet" | "slate" | "dark";
const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: "var(--stamp-red)", color: "var(--paper)" },
  secondary: { background: "var(--slate-100)", color: "var(--slate-600)", border: "1px solid var(--slate-200)" },
  outline: { background: "transparent", color: "var(--slate-700)", border: "1px solid var(--slate-300)" },
  success: { background: "var(--emerald-soft)", color: "var(--emerald)" },
  warning: { background: "var(--amber-soft)", color: "var(--amber)" },
  destructive: { background: "var(--stamp-red-soft)", color: "var(--stamp-red)" },
  teal: { background: "var(--verified-teal-soft)", color: "var(--verified-teal)" },
  plum: { background: "var(--plum-soft)", color: "var(--plum)" },
  sky: { background: "var(--sky-soft)", color: "var(--sky)" },
  violet: { background: "var(--violet-soft)", color: "var(--violet)" },
  slate: { background: "var(--slate-100)", color: "var(--slate-500)" },
  dark: { background: "var(--slate-800)", color: "var(--paper)" },
};
export function Badge({ variant = "default", children, style }: { variant?: BadgeVariant; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 999, lineHeight: 1,
        fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11.5,
        letterSpacing: "0.01em", whiteSpace: "nowrap",
        ...BADGE_STYLES[variant], ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Button (v3 DF-29c) — variant + size, press/focus motion ──── */
type ButtonVariant =
  | "primary" | "secondary" | "outline" | "ghost" | "dark" | "teal" | "grail" | "link" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "block";
const BUTTON_VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--stamp-red)", color: "var(--paper)", border: "1px solid var(--stamp-red)" },
  secondary: { background: "var(--bone)", color: "var(--ink-soft)", border: "1px solid var(--border-strong)" },
  outline: { background: "transparent", color: "var(--ink)", border: "1px solid var(--border-strong)" },
  ghost: { background: "transparent", color: "var(--ink)", border: "1px solid transparent" },
  dark: { background: "var(--ink)", color: "var(--paper)", border: "1px solid var(--ink)" },
  teal: { background: "var(--verified-teal)", color: "var(--paper)", border: "1px solid var(--verified-teal)" },
  grail: { background: "var(--grail-gold)", color: "var(--ink)", border: "1px solid var(--grail-gold-deep)", boxShadow: "var(--shadow-stamp)" },
  link: { background: "transparent", color: "var(--stamp-red)", border: "none", textDecoration: "underline", textUnderlineOffset: "3px" },
  destructive: { background: "var(--stamp-red-soft)", color: "var(--stamp-red)", border: "1px solid rgba(255,36,66,0.25)" },
};
const BUTTON_SIZES: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 34, padding: "0 14px", fontSize: 13, borderRadius: 9 },
  md: { height: 46, padding: "0 20px", fontSize: 15, borderRadius: 14 },
  lg: { height: 54, padding: "0 24px", fontSize: 16, borderRadius: 16 },
  block: { height: 52, padding: "0 22px", fontSize: 16, borderRadius: 14, width: "100%", justifyContent: "center" },
};
export function Button({
  variant = "primary", size = "md", icon, children, onClick, style, disabled, type = "button",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: "var(--font-body)", fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        transition: "transform 120ms var(--ease-out), background 120ms, box-shadow 120ms",
        lineHeight: 1, whiteSpace: "nowrap", outline: "none",
        ...BUTTON_VARIANTS[variant], ...BUTTON_SIZES[size], ...style,
      }}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = ""; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = ""; }}
      // v8 shared.jsx:584 — outline:none needs the ring or keyboard focus is invisible
      onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--ring)"; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ── IconButton (v3 DF-29c) — square icon w/ optional badge ───── */
export function IconButton({
  icon, onClick, active, badge,
}: {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 40, height: 40, borderRadius: 13, position: "relative",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink)",
        border: "1px solid " + (active ? "var(--ink)" : "var(--border)"),
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0, outline: "none",
        transition: "background 120ms, border-color 120ms, box-shadow 120ms",
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--ring)"; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
    >
      {icon}
      {badge != null && (
        <span
          style={{
            position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)",
            fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid var(--paper)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Tone → CSS var (community tiles/banners/tags) ────────────────
   The API stores short tone names; three of them (teal/red/gold) have NO
   matching bare CSS var — the real tokens are --verified-teal / --stamp-red /
   --grail-gold. Every `var(--${tone})` construction must go through here or
   half the tones paint transparent. Unknown tones fall back to slate-500. */
const TONE_VARS: Record<string, string> = {
  teal: "--verified-teal",
  red: "--stamp-red",
  gold: "--grail-gold",
  plum: "--plum",
  forest: "--forest",
  sky: "--sky",
  // v8 EditAvatarView PROFILE_COLORS — persisted as users.avatar_tone ids.
  ink: "--ink",
  mute: "--ink-mute",
};
export function toneVar(tone: string | null | undefined): string {
  if (!tone) return "var(--slate-500)";
  if (tone.startsWith("var(--")) return tone; // already a var() reference
  const v = TONE_VARS[tone];
  return v ? `var(${v})` : "var(--slate-500)";
}

/* ── Disclosure — one collapsible primitive (v8 shared.jsx:434) ───
   Same header rhythm, chevron behaviour and collapsed height for every long
   section (About, Q&A, ownership…). Meta renders mono beside the title; icon
   and accent tint the header for special sections. */
export function Disclosure({
  title, meta, children, defaultOpen = false, icon, accent, style,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid var(--border)", ...style }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 0",
          background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)",
        }}
      >
        {icon && <span style={{ display: "flex", color: accent ?? "var(--ink-faint)", flexShrink: 0 }}>{icon}</span>}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.015em", color: accent ?? "var(--ink)" }}>{title}</span>
        {meta != null && <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{meta}</span>}
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          style={{ marginLeft: "auto", color: "var(--ink-faint)", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 130ms" }}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

/* ── ClampText — long copy stays clamped until asked for (v8 shared.jsx:454) ── */
export function ClampText({ children, lines = 3, size = 14.5 }: { children: React.ReactNode; lines?: number; size?: number }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 2);
  }, [children, lines]);
  return (
    <div>
      <div
        ref={ref}
        style={{
          fontSize: size, lineHeight: 1.6, color: "var(--ink-soft)",
          ...({ textWrap: "pretty" } as React.CSSProperties),
          ...(open ? {} : { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }),
        }}
      >
        {children}
      </div>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ marginTop: 5, padding: 0, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12.5, color: "var(--ink-mute)" }}
        >
          {open ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* ── compactNum — 1284 → 1.3K, 3.45M → 3.4M (v8 shared.jsx:746) ──
   Compacts from 1000 up; <10 keeps one decimal, ≥10 rounds. Keeps stat tiles
   uniform at any size. */
export function compactNum(n: number): string {
  n = n || 0;
  if (n < 1000) return n.toLocaleString("en-IN");
  if (n < 1000000) { const v = n / 1000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v))) + "K"; }
  if (n < 1000000000) { const v = n / 1000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v))) + "M"; }
  const v = n / 1000000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v))) + "B";
}

/* ── LocationTag (v3 DF-29c) ─────────────────────────────────── */
export function LocationTag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "4px 9px", borderRadius: 999,
        background: "rgba(14,165,233,0.10)", border: "1px solid rgba(14,165,233,0.22)",
        color: "var(--sky)", fontSize: 12, fontWeight: 600, lineHeight: 1,
        ...style,
      }}
    >
      📍 {children}
    </span>
  );
}

/* QA #27 — shared yes/no confirmation modal for destructive actions (extracted
   from the community leave-confirm card so every "Are you sure?" looks the same).
   Render it conditionally: {confirming && <ConfirmDialog …/>} */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Remove",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  body?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140, border: "none", cursor: "default" }}
      />
      <div style={{
        position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 141,
        width: "min(calc(100% - 40px), 380px)", background: "var(--paper)", borderRadius: 18, padding: 20,
        boxShadow: "var(--shadow-2)", boxSizing: "border-box",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
          {title}
        </div>
        {body && (
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 6 }}>{body}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" style={{ flex: 1, justifyContent: "center" }} disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </>
  );
}
