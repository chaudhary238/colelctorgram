"use client";

// Closed beta first login — swap the team-issued password for the user's own.
// Reached with a live session straight from /auth/signin (login returns
// must_reset_password) or via AuthProvider's guard if they wander off; every
// other API call 403s until this succeeds.

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api, clearTokens } from "@/lib/api";
import { AuthShell, AuthTitle, AuthField, BlockButton } from "../_ui";

export default function SetPasswordPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No session → nothing to reset; the user needs to log in first.
    if (!localStorage.getItem("ch_access_token")) window.location.replace("/auth/signin");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw !== confirm) { setError("Passwords don't match"); return; }
    if (pw.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.post("/auth/set-password", { new_password: pw });
      // Same post-login routing as /auth/signin: first-timers go through the wizard.
      let dest = "/feed";
      try {
        const me = await api.get<{ onboarded_at?: string | null }>("/users/me");
        if (!me?.onboarded_at) dest = "/onboarding";
      } catch {
        // can't tell — default to /feed
      }
      window.location.assign(dest);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't set password");
      setLoading(false);
    }
  }

  const eye = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      aria-label={show ? "Hide password" : "Show password"}
      className="p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors cursor-pointer"
      style={{ background: "none", border: "none", display: "flex" }}
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <AuthShell padBottom={24}>
      <AuthTitle
        title="Set your password"
        sub="You signed in with the password the Scorred team sent you. Choose your own to continue — you'll use it from now on."
      />

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col" style={{ gap: 12 }}>
          <AuthField
            label="New password"
            type={show ? "text" : "password"}
            value={pw}
            onChange={setPw}
            placeholder="At least 8 characters"
            required
            trailing={eye}
          />
          <AuthField
            label="Confirm new password"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className="text-sm text-[var(--stamp-red)]" style={{ marginTop: 10 }}>{error}</p>}

        <div style={{ marginTop: 22 }}>
          <BlockButton type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save and continue"}
          </BlockButton>
        </div>
      </form>

      <div style={{ textAlign: "center", marginTop: 26, fontSize: 13.5, color: "var(--ink-mute)" }}>
        Not you?{" "}
        <button
          type="button"
          onClick={() => { clearTokens(); window.location.assign("/auth/signin"); }}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontWeight: 600, fontSize: 13.5 }}
        >
          Log out
        </button>
      </div>
    </AuthShell>
  );
}
