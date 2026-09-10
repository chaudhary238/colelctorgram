"use client";

import { X, Camera, Mail, Send, Share2, MoreHorizontal } from "lucide-react";
import { fireToast } from "@/components/gamification";

/* DV8 §2#2 — the v8 ShareSheet (Overlays.jsx:716-767): a bottom sheet of branded
   54px round targets (WhatsApp / Instagram / Facebook / X / Telegram / Email) over
   a Copy-link row that shows the ACTUAL url with a red "Copy" action. v8's prototype
   only toasts; here every target opens the platform's real share/intent URL.
   Instagram has no web share URL, so its target copies the link and says so.
   A native "More…" target leads the strip when navigator.share exists (web extension
   over v8 — the OS sheet reaches installed apps the URL targets can't).
   Chrome mirrors ShareToFeedSheet (listing/[id]): z-[70] scrim, 680px column,
   r20 top corners, '10px 18px 30px' padding. */

/* WhatsApp brand glyph — v8's inline mark verbatim (Overlays.jsx:723). */
function WhatsAppMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 0 16 8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 0 1 12 4zm-2.5 4c-.2 0-.5 0-.7.4-.3.3-1 .9-1 2.3s1 2.6 1.2 2.8c.2.2 2 3 4.8 4.1 2.4 1 2.9.8 3.4.8.5-.1 1.6-.7 1.9-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.6-.4l-2-1c-.3-.1-.5-.2-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.4-1.6-1.5-1.8-.1-.3 0-.4.1-.5l.4-.5c.2-.2.2-.3.3-.5l.2-.4c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5z" />
    </svg>
  );
}

export function ShareSheet({ url, label, title, onClose }: {
  /** The canonical link being shared — shown verbatim in the Copy-link row. */
  url: string;
  /** What's being shared — heads the sheet as "Share {label}" (v8 defaults to 'this'). */
  label?: string;
  /** Share text for the targets that carry one (X / Telegram / Email). */
  title?: string;
  onClose: () => void;
}) {
  const what = label || "this";
  const text = title || "Scorred";
  const eUrl = encodeURIComponent(url);
  const eText = encodeURIComponent(text);

  async function copy(toast: string) {
    try {
      await navigator.clipboard.writeText(url);
      fireToast(toast);
    } catch {
      fireToast("Couldn't copy the link");
    }
    onClose();
  }

  // v8 target order (Overlays.jsx:725-732) with the real platform URLs. `href: null`
  // marks Instagram's copy-link fallback — it has no web share endpoint.
  const targets: { name: string; bg: string; el: React.ReactNode; href: string | null }[] = [
    { name: "WhatsApp", bg: "#25D366", el: <WhatsAppMark />, href: `https://wa.me/?text=${eText}%20${eUrl}` },
    { name: "Instagram", bg: "linear-gradient(45deg,#f09433,#dc2743,#bc1888)", el: <Camera size={21} style={{ color: "#fff" }} />, href: null },
    { name: "Facebook", bg: "#1877F2", el: <span style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 22 }}>f</span>, href: `https://www.facebook.com/sharer/sharer.php?u=${eUrl}` },
    { name: "X", bg: "#000", el: <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>𝕏</span>, href: `https://twitter.com/intent/tweet?url=${eUrl}&text=${eText}` },
    { name: "Telegram", bg: "#229ED9", el: <Send size={22} style={{ color: "#fff", transform: "rotate(-12deg)" }} />, href: `https://t.me/share/url?url=${eUrl}&text=${eText}` },
    { name: "Email", bg: "var(--ink-mute)", el: <Mail size={21} style={{ color: "#fff" }} />, href: `mailto:?subject=${eText}&body=${eUrl}` },
  ];

  function openTarget(t: { name: string; href: string | null }) {
    if (!t.href) {
      // Instagram — no web share URL; hand over the link instead.
      void copy("Link copied — paste it in Instagram");
      return;
    }
    // mailto: must navigate the current context (a _blank tab would open and hang
    // empty); assign() keeps the SPA alive — the browser hands off to the mail app.
    if (t.href.startsWith("mailto:")) window.location.assign(t.href);
    else window.open(t.href, "_blank", "noopener,noreferrer");
    fireToast(`Shared to ${t.name}`);
    onClose();
  }

  // Rendered client-side only (behind a click), so the direct feature-check is safe.
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
  async function nativeShare() {
    try {
      await navigator.share({ title: text, url });
      onClose();
    } catch {
      /* cancelled — keep the sheet open */
    }
  }

  const targetBtn: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
    background: "none", border: "none", cursor: "pointer", flexShrink: 0, width: 60, padding: 0,
  };
  const targetCircle: React.CSSProperties = {
    width: 54, height: 54, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const targetLabel: React.CSSProperties = {
    fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap",
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(20,17,15,0.45)" }}>
      {/* box-sizing keeps the 18px padding INSIDE the 100% width (v8's own fix, :736) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[680px]"
        style={{ boxSizing: "border-box", overflowX: "hidden", background: "var(--paper)", borderRadius: "20px 20px 0 0", padding: "10px 18px 30px", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>Share {what}</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={17} />
          </button>
        </div>

        {/* targets — the strip scrolls horizontally; own bottom room for the labels (v8 :746) */}
        <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -18px", padding: "0 18px 10px", scrollbarWidth: "none" }}>
          {canNative && (
            <button type="button" onClick={nativeShare} style={targetBtn}>
              <span style={{ ...targetCircle, background: "var(--bone)", border: "1px solid var(--border-strong)" }}>
                <MoreHorizontal size={22} style={{ color: "var(--ink)" }} />
              </span>
              <span style={targetLabel}>More…</span>
            </button>
          )}
          {targets.map((t) => (
            <button type="button" key={t.name} onClick={() => openTarget(t)} style={targetBtn}>
              <span style={{ ...targetCircle, background: t.bg }}>{t.el}</span>
              <span style={targetLabel}>{t.name}</span>
            </button>
          ))}
        </div>

        {/* copy link — shows the ACTUAL url (v8 :756-763) */}
        <button
          type="button"
          onClick={() => copy("Link copied to clipboard")}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", boxSizing: "border-box", textAlign: "left", marginTop: 16, padding: "13px 14px", borderRadius: 13, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-mute)", flexShrink: 0 }}>
            <Share2 size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Copy link</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--stamp-red)", flexShrink: 0 }}>Copy</span>
        </button>
      </div>
    </div>
  );
}
