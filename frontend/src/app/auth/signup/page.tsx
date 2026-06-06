"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, storeTokens } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ handle: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token, refresh_token } = await api.post<{
        access_token: string;
        refresh_token: string;
      }>("/auth/signup", form);
      storeTokens(access_token, refresh_token);
      router.push("/onboarding");
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

        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Create account
        </h2>

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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-[var(--ink-faint)] text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-[var(--stamp-red)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
