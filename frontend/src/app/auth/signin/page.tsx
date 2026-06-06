"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, storeTokens } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      }>("/auth/login", { email, password });
      storeTokens(access_token, refresh_token);
      router.push("/feed");
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
        <div className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-[var(--stamp-red)] flex items-center justify-center text-white font-black text-sm shrink-0">
            CH
          </span>
          <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
            CollectorHub
          </span>
        </div>

        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Sign in
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink-mute)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink-mute)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--stamp-red)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--stamp-red)] text-white font-semibold text-sm transition-colors hover:bg-[var(--stamp-red-deep)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-[var(--ink-faint)] text-center mt-6">
          No account?{" "}
          <Link href="/auth/signup" className="text-[var(--stamp-red)] font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
