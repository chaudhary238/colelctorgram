"use client";

import { useRouter } from "next/navigation";
import { SealMark, ScorredWordmark } from "@/components/ui";

// Splash (v6 Onboarding.jsx) — the unauthenticated landing.
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

      {/* Ambient bg glow */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "none", backgroundImage: "radial-gradient(circle at 50% 38%, rgba(255,36,66,0.10), transparent 60%), radial-gradient(circle at 85% 90%, rgba(20,17,15,0.04), transparent 50%)" }}
      />

      <div className="flex-1 flex flex-col items-center justify-center relative px-8" style={{ gap: 14 }}>
        <div className="scr-pop flex justify-center">
          <SealMark size={96} />
        </div>
        <div className="scr-fu-1 flex justify-center">
          <ScorredWordmark fontSize={38} />
        </div>
        <p
          className="scr-fu-2"
          style={{ fontSize: 15.5, color: "var(--ink-mute)", lineHeight: 1.55, margin: 0, maxWidth: 264, textAlign: "center" }}
        >
          Track, trade &amp; network — Score every grail on India&apos;s #1 collectibles platform.
        </p>
      </div>

      <div className="scr-fu-3 relative flex flex-col gap-2.5" style={{ padding: "0 24px 44px", maxWidth: 420, width: "100%", marginLeft: "auto", marginRight: "auto" }}>
        <button
          onClick={() => router.push("/auth/signup")}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--stamp-red)", color: "#fff" }}
        >
          Create account
        </button>
        <button
          onClick={() => router.push("/auth/signin")}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: "var(--paper-soft)", color: "var(--ink)", border: "1px solid var(--border-strong)" }}
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
