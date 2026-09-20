"use client";

import { BackButton } from "@/components/BackButton";

/**
 * THE header for pushed detail screens — port of v8 Chrome.jsx `DetailHeader`
 * (founder call 2026-09-20: one common header, stop hand-rolling it per page).
 *
 * v8 metrics, applied verbatim:
 *   - title 19/700, or 24/800 in `centerTitle` mode (the tab-root AppBar treatment)
 *   - letterSpacing −0.03em in BOTH modes (v8 Sep-20 nudged the base from −0.02)
 *   - subtitle 12 / ink-faint / 1px top gap
 *   - centerTitle balances the back arrow with an equal-width spacer
 *   - trailing controls sit in a gap-8 cluster pinned right
 *
 * WEB ADAPTATIONS (deliberate, keep):
 *   - back is our shared history-pop BackButton (36px, needs `fallback`), not v8's
 *     40px pop() button;
 *   - `sticky` (default) wraps the row in the app's standard sticky chrome
 *     (paper bg, border-b, 10/20 padding). Pass `sticky={false}` when the page
 *     hosts the row inside its own sticky block (e.g. Events' header+search+tabs
 *     stack) — the component then renders the bare row and the caller owns
 *     background/padding/offsets;
 *   - `mobileOnlyBack` width-gates the back arrow (and the centerTitle spacer)
 *     below lg — for screens the desktop Sidebar already navigates to (Events).
 *     With it, a centred title re-left-aligns on desktop (pages are left-aligned,
 *     WEB_UI_GUIDELINES).
 *
 * NOT this component: transparent hero headers (listing/item/event/db-entry pages
 * float scrim buttons over the photo — v8's `transparent` variant, no title row)
 * and chat's avatar-link header. Those stay page-owned.
 */
export function DetailHeader({
  title,
  subtitle,
  trailing,
  fallback,
  centerTitle = false,
  mobileOnlyBack = false,
  sticky = true,
  style,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  /** BackButton's cold/deep-link destination (section home). */
  fallback: string;
  centerTitle?: boolean;
  mobileOnlyBack?: boolean;
  sticky?: boolean;
  /** Merged onto the sticky container (padding overrides etc.). Ignored when sticky={false}. */
  style?: React.CSSProperties;
}) {
  const gated = mobileOnlyBack ? "lg:hidden" : undefined;
  const row = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className={gated} style={{ display: "flex", flexShrink: 0 }}>
        <BackButton fallback={fallback} />
      </span>
      <div
        className={centerTitle ? (mobileOnlyBack ? "text-center lg:text-left" : "text-center") : undefined}
        style={{ flex: 1, minWidth: 0 }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)", fontWeight: centerTitle ? 800 : 700,
            fontSize: centerTitle ? 24 : 19, letterSpacing: "-0.03em",
            color: "var(--ink)", lineHeight: 1.15,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle != null && (
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </div>
        )}
      </div>
      {/* v8 — the spacer mirrors the back arrow so a centred title is truly centred. */}
      {centerTitle && <span className={gated} aria-hidden style={{ width: 36, flexShrink: 0 }} />}
      {trailing && <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>{trailing}</div>}
    </div>
  );

  if (!sticky) return row;
  return (
    <div
      className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]"
      style={{ padding: "10px 20px", ...style }}
    >
      {row}
    </div>
  );
}
