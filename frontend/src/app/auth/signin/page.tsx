"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { api, storeTokens } from "@/lib/api";
import { SocialButtons } from "@/components/SocialButtons";
import { SealMark, ScorredWordmark } from "@/components/ui";

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bone)] px-4">
      <div className="w-full max-w-sm bg-[var(--paper)] rounded-2xl shadow-[var(--shadow-3)] p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <SealMark size={34} />
          <ScorredWordmark fontSize={22} />
        </div>

        <h2 className="text-[26px] font-bold mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
          Welcome back
        </h2>
        <p className="text-sm text-[var(--ink-mute)] mb-6">Log in to pick up where you left off.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink-mute)] mb-1">Email or username</label>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
              placeholder="you@example.com or @handle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink-mute)] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-11 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="text-right -mt-1">
            <Link href="/auth/forgot" className="text-[13px] font-semibold text-[var(--stamp-red)] hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="text-sm text-[var(--stamp-red)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--stamp-red)] text-white font-semibold text-sm transition-colors hover:bg-[var(--stamp-red-deep)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <SocialButtons onError={setError} />

        <p className="text-sm text-[var(--ink-faint)] text-center mt-6">
          New to Scorred?{" "}
          <Link href="/auth/signup" className="text-[var(--stamp-red)] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
