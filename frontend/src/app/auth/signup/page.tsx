"use client";

// Signup (design_v8/app/Onboarding.jsx Auth mode="signup") — DV8 P0-3: slimmed
// to email/password/referral only; display name + @username moved to onboarding
// step 0 (the backend derives a provisional handle from the email until then).

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, storeTokens } from "@/lib/api";
import { SocialButtons } from "@/components/SocialButtons";
import { AuthShell, AuthTitle, AuthField, BlockButton } from "../_ui";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // DV6-05 referral — a SCOR-XXXXX code. Prefilled from ?ref=<code> but editable
  // so a friend can paste a code they were given. Read from the URL directly to
  // avoid a useSearchParams Suspense boundary on this client page.
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Read the ?ref= code once after mount. Effect (not a lazy initializer) so
    // the server renders empty and the client fills it in post-hydration — no SSR
    // mismatch on the prefilled input.
    const ref = new URLSearchParams(window.location.search).get("ref");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of an external (URL) value on mount
    if (ref) setReferralCode(ref);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token, refresh_token, debug_otp } = await api.post<{
        access_token: string;
        refresh_token: string;
        debug_otp?: string | null;
      }>("/auth/signup", { email, password, referral_code: referralCode.trim() || null });
      storeTokens(access_token, refresh_token);
      // DF-06 — confirm email via OTP before onboarding.
      // Full page load (not router.push): AuthProvider must refetch /users/me with the
      // NEW token, otherwise the previous account's user object stays in context.
      // dev_otp: backend echoes the code in local debug only (no email domain yet).
      const devOtp = debug_otp ? `&dev_otp=${debug_otp}` : "";
      window.location.assign(`/auth/verify?email=${encodeURIComponent(email)}${devOtp}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell back="/auth" padBottom={24}>
      <AuthTitle title="Create your account" sub="Build your collection and start trading." />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col" style={{ gap: 12 }}>
          <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
          <AuthField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
          <div>
            <AuthField label="Referral code (optional)" value={referralCode} onChange={setReferralCode} placeholder="e.g. SCOR-RAJ123" />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 5 }}>
              Have a friend&apos;s code? Both of you earn bonus XP.
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[var(--stamp-red)]" style={{ marginTop: 12 }}>{error}</p>}

        <div style={{ marginTop: 22 }}>
          <BlockButton type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Continue"}
          </BlockButton>
        </div>
      </form>

      <SocialButtons onError={setError} />

      <div style={{ textAlign: "center", marginTop: 26, fontSize: 13.5, color: "var(--ink-mute)" }}>
        Already have an account?{" "}
        <Link href="/auth/signin" style={{ color: "var(--stamp-red)", fontWeight: 600, fontSize: 13.5 }}>
          Log in
        </Link>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "center", lineHeight: 1.5, marginTop: 18 }}>
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}
