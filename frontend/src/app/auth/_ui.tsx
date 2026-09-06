"use client";

// Shared v8 auth chrome (DV8_DESIGN_GAPS "Onboarding/auth"): one place for the
// v8 field spec (label 12.5/600 + input h48/r12/15px), block buttons
// (h52/r14/16px, secondary = --bone bg / --ink-soft), the 38px back button and
// the 30px display-800 title. Port of design_v8/app/Onboarding.jsx (Auth,
// AuthField) + shared.jsx Button size "block".

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const authLabelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-mute)",
  letterSpacing: "0.02em",
};

export const authInputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  height: 48,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--paper-soft)",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  color: "var(--ink)",
  outline: "none",
};

/* Full-page paper shell with the v8 back button (38px, r11, --slate-200
   border) routing to the previous screen. */
export function AuthShell({ back, children }: { back: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col" style={{ paddingTop: 20 }}>
        <div style={{ padding: "8px 14px" }}>
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.push(back)}
            style={{
              width: 38, height: 38, borderRadius: 11, border: "1px solid var(--slate-200)",
              background: "transparent", color: "var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="flex-1" style={{ padding: "12px 24px 32px" }}>{children}</div>
      </div>
    </div>
  );
}

/* v8 auth heading: 30px display 800 — no Seal+Wordmark lockup above it. */
export function AuthTitle({ title, sub, subMb = 26 }: { title: string; sub?: string; subMb?: number }) {
  return (
    <>
      <h1
        style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30,
          letterSpacing: "-0.03em", margin: "0 0 6px", color: "var(--ink)",
        }}
      >
        {title}
      </h1>
      {sub && (
        <p style={{ fontSize: 15, color: "var(--ink-mute)", margin: `0 0 ${subMb}px`, lineHeight: 1.5 }}>{sub}</p>
      )}
    </>
  );
}

export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  autoCapitalize,
  autoCorrect,
  trailing,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoCapitalize?: string;
  autoCorrect?: string;
  /** Optional absolutely-positioned right-side control (e.g. password eye). */
  trailing?: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={authLabelStyle}>{label}</span>
      <div style={{ position: "relative", marginTop: 7 }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={{ ...authInputStyle, ...(trailing ? { paddingRight: 44 } : null) }}
        />
        {trailing && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
            {trailing}
          </span>
        )}
      </div>
    </label>
  );
}

/* shared.jsx Button size "block": h52 / r14 / 16px 600. */
export function BlockButton({
  variant = "primary",
  disabled,
  onClick,
  type = "button",
  children,
  style,
}: {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const colors: React.CSSProperties =
    variant === "primary"
      ? { background: "var(--stamp-red)", color: "#fff", border: "1px solid var(--stamp-red)" }
      : { background: "var(--bone)", color: "var(--ink-soft)", border: "1px solid var(--border-strong)" };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%", height: 52, borderRadius: 14, fontSize: 16, fontWeight: 600,
        fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center",
        justifyContent: "center", gap: 8, lineHeight: 1, whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        ...colors, ...style,
      }}
    >
      {children}
    </button>
  );
}
