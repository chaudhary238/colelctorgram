"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { api } from "@/lib/api";

// Forgot password (DF-37a / B-71) — request a reset link.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ ok: boolean; debug_token?: string | null }>("/auth/forgot-password", { email });
      setDevToken(res.debug_token ?? null);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bone)] px-4">
      <div className="w-full max-w-sm bg-[var(--paper)] rounded-2xl shadow-[var(--shadow-3)] p-8">
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--stamp-red-soft)", color: "var(--stamp-red)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Mail size={24} />
        </div>

        {sent ? (
          <>
            <h2 className="text-[24px] font-bold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Check your inbox</h2>
            <p className="text-sm text-[var(--ink-mute)] leading-relaxed mb-5">
              If an account exists for <b className="text-[var(--ink)]">{email}</b>, we&apos;ve sent a link to reset your password. It expires in 15 minutes.
            </p>
            {devToken && (
              <Link href={`/auth/reset?token=${devToken}`} className="block text-center text-sm font-semibold text-[var(--stamp-red)] underline mb-4">
                Dev: open reset link →
              </Link>
            )}
            <Link href="/auth/signin" className="block text-center text-sm text-[var(--ink-faint)] hover:underline">Back to sign in</Link>
          </>
        ) : (
          <>
            <h2 className="text-[24px] font-bold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Reset your password</h2>
            <p className="text-sm text-[var(--ink-mute)] mb-6">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink-mute)] mb-1">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-[var(--stamp-red)]">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="text-sm text-[var(--ink-faint)] text-center mt-6">
              Remembered it?{" "}
              <Link href="/auth/signin" className="text-[var(--stamp-red)] font-medium hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
