"use client";

// Forgot password (design_v8/app/Onboarding.jsx Auth m="forgot") — request a
// reset link. v8 copy wins over the earlier enumeration-safe wording (DV8
// audit): success reads "We sent a reset link to {email}". Kept beyond v8:
// error state, busy label, and the dev-only reset link (no email infra yet).

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { api } from "@/lib/api";
import { AuthShell, AuthTitle, AuthField, BlockButton } from "../_ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
    <AuthShell back="/auth/signin">
      <AuthTitle
        title="Reset password"
        sub="Enter your email and we’ll send you a link to reset your password."
        subMb={28}
      />

      {!sent ? (
        <form onSubmit={handleSubmit}>
          <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
          {error && <p className="text-sm text-[var(--stamp-red)]" style={{ marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 22 }}>
            <BlockButton type="submit" disabled={loading} style={!email.trim() ? { opacity: 0.5 } : undefined}>
              {loading ? "Sending…" : "Send reset link"}
            </BlockButton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 24, textAlign: "center" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%", background: "var(--forest-soft)",
              border: "1px solid var(--forest)", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Mail size={28} style={{ color: "var(--forest)" }} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "var(--ink)" }}>
              Check your inbox
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-mute)", marginTop: 6, lineHeight: 1.55 }}>
              We sent a reset link to <strong>{email}</strong>. It expires in 15 minutes.
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/auth/signin")}
            style={{
              background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)",
              fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0,
            }}
          >
            Back to log in
          </button>

          {/* Dev-only until a sending domain exists: the backend echoes the reset
              token in local debug so testing isn't a dead end. */}
          {process.env.NODE_ENV !== "production" && devToken && (
            <div className="w-full rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bone)] px-4 py-3 text-center" style={{ marginTop: 12 }}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                Dev only — emails not wired yet
              </div>
              <Link href={`/auth/reset?token=${devToken}`} className="block text-sm font-semibold text-[var(--stamp-red)] underline mt-1">
                Open reset link →
              </Link>
            </div>
          )}
        </div>
      )}
    </AuthShell>
  );
}
