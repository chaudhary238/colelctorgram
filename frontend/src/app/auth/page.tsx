"use client";

import { useRouter } from "next/navigation";
import { SealMark, ScorredWordmark } from "@/components/ui";
import { BlockButton } from "./_ui";

// Splash (design_v8/app/Onboarding.jsx) — the unauthenticated landing.
export default function SplashPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--paper)" }}
    >
      <style>{`
        @keyframes scr-fade-up { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scr-pop { 0% { opacity: 0; transform: scale(0.72) rotate(-6deg); } 70% { transform: scale(1.08) rotate(2deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        .scr-pop  { animation: scr-pop 0.55s cubic-bezier(.34,1.56,.64,1) both; }
        .scr-fu-1 { animation: scr-fade-up 0.5s 0.3s ease both; }
        .scr-fu-2 { animation: scr-fade-up 0.5s 0.45s ease both; }
        .scr-fu-3 { animation: scr-fade-up 0.5s 0.6s ease both; }
      `}</style>

      {/* Ambient bg glow (v8 tint) */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "none", backgroundImage: "radial-gradient(circle at 50% 38%, rgba(196,18,48,0.10), transparent 60%), radial-gradient(circle at 85% 90%, rgba(20,17,15,0.04), transparent 50%)" }}
      />

      <div className="flex-1 flex flex-col items-center justify-center relative px-8" style={{ gap: 14 }}>
        <div className="scr-pop flex justify-center">
          <SealMark size={96} />
        </div>
        <div className="scr-fu-1 flex justify-center">
          <ScorredWordmark fontSize={38} />
        </div>
        {/* v8 two-line lockup: red uppercase eyebrow over the grey tagline */}
        <p
          className="scr-fu-2"
          style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--stamp-red)", margin: "0 0 2px", textAlign: "center" }}
        >
          For the collectors, by the collectors
        </p>
        <p
          className="scr-fu-2"
          style={{ fontSize: 15.5, color: "var(--ink-mute)", lineHeight: 1.55, margin: 0, maxWidth: 264, textAlign: "center" }}
        >
          Track, trade &amp; network on the #1 collectibles platform.
        </p>
      </div>

      {/* v8 Button size "block" (shared.jsx:554-585) — BlockButton carries the paper
          text token, press scale, focus ring and 120ms transitions (DV8 §11#3+#4). */}
      <div className="scr-fu-3 relative flex flex-col" style={{ gap: 10, padding: "0 24px 44px", maxWidth: 420, width: "100%", marginLeft: "auto", marginRight: "auto" }}>
        <BlockButton onClick={() => router.push("/auth/signup")}>Create account</BlockButton>
        <BlockButton variant="secondary" onClick={() => router.push("/auth/signin")}>
          I already have an account
        </BlockButton>
      </div>
    </div>
  );
}
