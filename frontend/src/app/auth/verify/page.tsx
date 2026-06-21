"use client";

// Email OTP confirmation after signup (DF-06 / B-72).
// Until the email provider (B-71) is wired, the code is printed in backend logs;
// "Skip for now" keeps the flow usable pre-email-infra.

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { api } from "@/lib/api";

function VerifyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [secs, setSecs] = useState(30);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // dev-only: code echoed by the backend in local debug (no email domain yet)
  const [devOtp, setDevOtp] = useState(search.get("dev_otp") ?? "");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const full = digits.every((d) => d !== "");

  function setAt(i: number, v: string) {
    const nv = (v || "").replace(/\D/g, "").slice(-1);
    setDigits((d) => {
      const c = [...d];
      c[i] = nv;
      return c;
    });
    if (nv && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!t) return;
    e.preventDefault();
    const c = ["", "", "", "", "", ""];
    for (let i = 0; i < t.length; i++) c[i] = t[i];
    setDigits(c);
    refs.current[Math.min(t.length, 5)]?.focus();
  }

  async function verify() {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { code: digits.join("") });
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    try {
      const d = await api.post<{ debug_otp?: string | null }>("/auth/resend-otp");
      if (d?.debug_otp) setDevOtp(d.debug_otp);
      setSecs(30);
      setResent(true);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bone)] px-4">
      <div className="w-full max-w-sm bg-[var(--paper)] rounded-2xl shadow-[var(--shadow-3)] p-8">
        <div className="w-14 h-14 rounded-[15px] bg-[var(--stamp-red-soft)] text-[var(--stamp-red)] flex items-center justify-center mb-[18px]">
          <Mail size={26} />
        </div>
        <h1
          className="text-[28px] font-bold text-[var(--ink)] mb-1.5"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
        >
          Check your email
        </h1>
        <p className="text-[15px] text-[var(--ink-mute)] leading-relaxed mb-6">
          We sent a 6-digit code to{" "}
          <b className="text-[var(--ink)]">{email || "your email"}</b>. Enter it below to
          confirm your account.
        </p>

        <div className="flex gap-2 justify-between" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              inputMode="numeric"
              maxLength={1}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="w-full h-[58px] text-center rounded-[13px] border-[1.5px] bg-[var(--paper-soft)] font-mono font-semibold text-2xl text-[var(--ink)] outline-none transition-colors"
              style={{
                borderColor: d ? "var(--ink)" : "var(--border-strong)",
                caretColor: "var(--stamp-red)",
              }}
            />
          ))}
        </div>

        {error && <p className="text-sm text-[var(--stamp-red)] mt-3">{error}</p>}

        <button
          onClick={verify}
          disabled={!full || loading}
          className="w-full mt-6 py-3 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Verifying…" : "Verify & continue"}
        </button>

        <div className="text-center mt-5 text-[13.5px] text-[var(--ink-mute)]">
          {secs > 0 ? (
            <span>
              Resend code in{" "}
              <b className="font-mono text-[var(--ink)]">0:{String(secs).padStart(2, "0")}</b>
            </span>
          ) : (
            <button
              onClick={resend}
              className="bg-transparent border-none text-[var(--stamp-red)] font-semibold text-[13.5px] cursor-pointer p-0"
            >
              Resend code
            </button>
          )}
        </div>
        {resent && secs > 0 && (
          <p className="text-center mt-2 text-[12.5px] text-[var(--forest)]">
            A new code is on its way.
          </p>
        )}

        {/* Dev-only: until a sending domain exists (blocked on the name decision),
            the backend echoes the OTP in local debug so testing isn't a dead end.
            Double-gated: backend only sends it when app_debug && env != production;
            this block only renders in non-production builds. */}
        {process.env.NODE_ENV !== "production" && devOtp && (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bone)] px-4 py-3 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
              Dev only — emails not wired yet
            </div>
            <div className="font-mono font-bold text-xl tracking-[6px] text-[var(--ink)] mt-1">
              {devOtp}
            </div>
          </div>
        )}

        {process.env.NODE_ENV !== "production" && (
          <p className="text-center mt-4 text-[13px] text-[var(--ink-faint)]">
            <button
              onClick={() => router.push("/onboarding")}
              className="bg-transparent border-none text-[var(--ink-soft)] font-semibold text-[13px] underline cursor-pointer p-0"
            >
              Skip for now <span className="no-underline">(dev only — code is in backend logs)</span>
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
