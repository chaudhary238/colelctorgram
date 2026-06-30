"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, storeTokens } from "@/lib/api";
import { SocialButtons } from "@/components/SocialButtons";

export default function SignUpPage() {
  const [form, setForm] = useState({ handle: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // GM-05 referral — captured from ?ref=<handle>. Read from the URL directly to
  // avoid a useSearchParams Suspense boundary on this client page.
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Read the ?ref= handle once after mount. Effect (not a lazy initializer) so
    // the server renders null and the client fills it in post-hydration — no SSR
    // mismatch on the optional "Invited by" banner.
    const ref = new URLSearchParams(window.location.search).get("ref");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of an external (URL) value on mount
    if (ref) setReferralCode(ref);
  }, []);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token, refresh_token, debug_otp } = await api.post<{
        access_token: string;
        refresh_token: string;
        debug_otp?: string | null;
      }>("/auth/signup", { ...form, referral_code: referralCode });
      storeTokens(access_token, refresh_token);
      // DF-06 — confirm email via OTP before onboarding.
      // Full page load (not router.push): AuthProvider must refetch /users/me with the
      // NEW token, otherwise the previous account's user object stays in context.
      // dev_otp: backend echoes the code in local debug only (no email domain yet).
      const devOtp = debug_otp ? `&dev_otp=${debug_otp}` : "";
      window.location.assign(`/auth/verify?email=${encodeURIComponent(form.email)}${devOtp}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "handle", label: "Handle", type: "text", placeholder: "@yourhandle" },
    { key: "name", label: "Name", type: "text", placeholder: "Your display name" },
    { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bone)] px-4">
      <div className="w-full max-w-sm bg-[var(--paper)] rounded-2xl shadow-[var(--shadow-3)] p-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-[var(--stamp-red)] flex items-center justify-center text-white font-black text-sm shrink-0">
            CH
          </span>
          <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
            CollectorHub
          </span>
        </div>

        <h2 className="text-[26px] font-bold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
          Create your account
        </h2>
        <p className="text-sm text-[var(--ink-mute)] mb-6">Build your collection and start trading.</p>

        {referralCode && (
          <p className="text-[13px] mb-5 px-3 py-2 rounded-lg bg-[var(--rose-tint-bg)] text-[var(--ink-soft)]">
            Invited by <span className="font-semibold text-[var(--stamp-red)]">@{referralCode.replace(/^@/, "")}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[var(--ink-mute)] mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={set(key)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                placeholder={placeholder}
              />
            </div>
          ))}

          {error && <p className="text-sm text-[var(--stamp-red)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--stamp-red)] text-white font-semibold text-sm transition-colors hover:bg-[var(--stamp-red-deep)] disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Continue"}
          </button>
        </form>

        <SocialButtons onError={setError} />

        <p className="text-sm text-[var(--ink-faint)] text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-[var(--stamp-red)] font-medium hover:underline">
            Log in
          </Link>
        </p>
        <p className="text-[11.5px] text-[var(--ink-faint)] text-center leading-relaxed mt-4">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
