"use client";

// Login (design_v8/app/Onboarding.jsx Auth mode="login"). Kept beyond v8:
// username login (QA 2026-07-18), password eye toggle, error + busy states.

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { api, storeTokens } from "@/lib/api";
import { SocialButtons } from "@/components/SocialButtons";
import { AuthShell, AuthTitle, AuthField, BlockButton } from "../_ui";

export default function SignInPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token, refresh_token } = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login", { identifier, password });
      storeTokens(access_token, refresh_token);
      // Full page load so AuthProvider refetches the user for the new session
      window.location.assign("/feed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell back="/auth">
      <AuthTitle title="Welcome back" sub="Log in to pick up where you left off." />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col" style={{ gap: 12 }}>
          <AuthField
            label="Email or username"
            value={identifier}
            onChange={setIdentifier}
            placeholder="you@email.com or @handle"
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
          <AuthField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                style={{ background: "none", border: "none", display: "flex" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>

        <div style={{ textAlign: "right", marginTop: 10 }}>
          <Link href="/auth/forgot" style={{ fontSize: 13, color: "var(--stamp-red)", fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-[var(--stamp-red)]" style={{ marginTop: 10 }}>{error}</p>}

        <div style={{ marginTop: 22 }}>
          <BlockButton type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </BlockButton>
        </div>
      </form>

      <SocialButtons onError={setError} />

      <div style={{ textAlign: "center", marginTop: 26, fontSize: 13.5, color: "var(--ink-mute)" }}>
        New to Scorred?{" "}
        <Link href="/auth/signup" style={{ color: "var(--stamp-red)", fontWeight: 600, fontSize: 13.5 }}>
          Sign up
        </Link>
      </div>
    </AuthShell>
  );
}
