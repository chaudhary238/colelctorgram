"use client";

import { useRouter } from "next/navigation";
import { enterGuest } from "@/lib/api";

// Splash (v3 Onboarding.jsx Splash) — the unauthenticated landing (DF-37a).
export default function SplashPage() {
  const router = useRouter();

  function exploreAsGuest() {
    enterGuest();
    window.location.assign("/feed"); // full load so the shell mounts in guest state
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--paper)" }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 22% 18%, rgba(255,36,66,0.07), transparent 55%), radial-gradient(circle at 84% 86%, rgba(20,17,15,0.05), transparent 55%)" }}
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative px-8">
        <div
          style={{ width: 96, height: 96, borderRadius: 22, background: "var(--stamp-red)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 58, transform: "rotate(-4deg)", boxShadow: "var(--shadow-stamp)" }}
        >
          C
        </div>
        <div className="text-center">
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38, letterSpacing: "-0.035em", margin: 0, color: "var(--ink)" }}>CollectorHub</h1>
          <p style={{ fontSize: 16, color: "var(--ink-mute)", lineHeight: 1.5, margin: "12px auto 0", maxWidth: 280 }}>
            The home for collectors. Showcase what you own, find your niche, and trade with people you can trust.
          </p>
        </div>
      </div>
      <div className="relative flex flex-col gap-3" style={{ padding: "0 24px 40px", maxWidth: 420, width: "100%", marginLeft: "auto", marginRight: "auto" }}>
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
        <button
          onClick={exploreAsGuest}
          className="mt-0.5 py-2 font-semibold text-sm"
          style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer" }}
        >
          Explore as guest →
        </button>
      </div>
    </div>
  );
}
