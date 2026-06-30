"use client";

// Password reset (DF-37a / B-71) — set a new password from the emailed link.

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { api } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw !== confirm) { setError("Passwords don't match"); return; }
    if (pw.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: pw });
      setDone(true);
      setTimeout(() => router.replace("/auth/signin"), 1600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bone)] px-4">
      <div className="w-full max-w-sm bg-[var(--paper)] rounded-2xl shadow-[var(--shadow-3)] p-8">
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--stamp-red-soft)", color: "var(--stamp-red)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <KeyRound size={24} />
        </div>

        {!token ? (
          <>
            <h2 className="text-[22px] font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>Invalid reset link</h2>
            <p className="text-sm text-[var(--ink-mute)] mb-5">This link is missing or malformed. Request a new one.</p>
            <Link href="/auth/forgot" className="text-sm font-semibold text-[var(--stamp-red)] hover:underline">Request a new link →</Link>
          </>
        ) : done ? (
          <>
            <h2 className="text-[22px] font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>Password updated</h2>
            <p className="text-sm text-[var(--ink-mute)]">Taking you to sign in…</p>
          </>
        ) : (
          <>
            <h2 className="text-[24px] font-bold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>Choose a new password</h2>
            <p className="text-sm text-[var(--ink-mute)] mb-6">Make it at least 8 characters.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                  placeholder="New password"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-2.5 text-[var(--ink-faint)]">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <input
                type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                placeholder="Confirm new password"
              />
              {error && <p className="text-sm text-[var(--stamp-red)]">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60">
                {loading ? "Updating…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
