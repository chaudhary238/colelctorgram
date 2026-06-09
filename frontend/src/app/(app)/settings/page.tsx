"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { AvatarUploader } from "@/components/ImageUploader";
import { Avatar } from "@/components/ui";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)", padding: "22px 20px 8px" }}>
      {children}
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid var(--border)", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink)" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 46, height: 26, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
        background: value ? "var(--stamp-red)" : "var(--border-strong)",
        position: "relative", transition: "background 0.18s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 23 : 3, width: 20, height: 20,
        borderRadius: "50%", background: "var(--paper)", transition: "left 0.18s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </button>
  );
}

type PrivacyVal = "public" | "private";

export default function SettingsPage() {
  const { user, setUser } = useUser();
  const router = useRouter();

  // Profile fields
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Privacy
  const [portfolioPrivacy, setPortfolioPrivacy] = useState<PrivacyVal>(
    user?.privacy_portfolio === "private" ? "private" : "public"
  );
  const [valuePrivacy, setValuePrivacy] = useState<PrivacyVal>(
    user?.privacy_value === "private" ? "private" : "public"
  );
  const [privacySaving, setPrivacySaving] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setCity(user.city ?? "");
      setAvatarUrl(user.avatar_url ?? "");
    }
  }, [user]);

  async function saveProfile() {
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const updated = await api.patch<typeof user>("/users/me", {
        name: name || undefined,
        bio: bio || undefined,
        city: city || undefined,
        avatar_url: avatarUrl || undefined,
      });
      if (updated && setUser) setUser(updated as Parameters<typeof setUser>[0]);
      setProfileMsg("Saved!");
      setTimeout(() => setProfileMsg(""), 2500);
    } catch (e) {
      setProfileMsg(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePrivacy(field: "privacy_portfolio" | "privacy_value", val: PrivacyVal) {
    setPrivacySaving(true);
    try {
      await api.patch("/users/me", { [field]: val });
    } finally {
      setPrivacySaving(false);
    }
  }

  async function changePassword() {
    setPwError("");
    setPwMsg("");
    if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPw, new_password: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg("Password changed!");
      setTimeout(() => setPwMsg(""), 3000);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, padding: "0 13px", borderRadius: 10,
    border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
    fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Settings</span>
        </div>
      </div>

      {/* ── Profile ───────────────────────────────────────── */}
      <SectionTitle>Profile</SectionTitle>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <AvatarUploader
          previewUrl={avatarUrl || undefined}
          onUpload={(url) => setAvatarUrl(url)}
        />
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>Profile photo</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>Click the photo to upload a new one</div>
        </div>
      </div>

      <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid var(--border)" }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", marginBottom: 6 }}>Display name</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", marginBottom: 6 }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell collectors who you are…"
            style={{ ...inputStyle, height: "auto", padding: "10px 13px", resize: "none" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", marginBottom: 6 }}>City</label>
          <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4 }}>
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            style={{ height: 38, padding: "0 20px", borderRadius: 10, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: profileSaving ? "wait" : "pointer", opacity: profileSaving ? 0.7 : 1 }}
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
          {profileMsg && (
            <span style={{ fontSize: 13, color: profileMsg.includes("ailed") ? "var(--stamp-red)" : "var(--forest)" }}>{profileMsg}</span>
          )}
        </div>
      </div>

      {/* ── Privacy ───────────────────────────────────────── */}
      <SectionTitle>Privacy</SectionTitle>

      <SettingRow
        label="Public collection"
        sub="Allow anyone to view your portfolio and owned items"
      >
        <Toggle
          value={portfolioPrivacy === "public"}
          onChange={(v) => {
            const val: PrivacyVal = v ? "public" : "private";
            setPortfolioPrivacy(val);
            savePrivacy("privacy_portfolio", val);
          }}
        />
      </SettingRow>

      <SettingRow
        label="Show item values"
        sub="Display estimated value on items in your collection"
      >
        <Toggle
          value={valuePrivacy === "public"}
          onChange={(v) => {
            const val: PrivacyVal = v ? "public" : "private";
            setValuePrivacy(val);
            savePrivacy("privacy_value", val);
          }}
        />
      </SettingRow>

      {privacySaving && (
        <div style={{ padding: "6px 20px", fontSize: 12, color: "var(--ink-faint)" }}>Saving privacy…</div>
      )}

      {/* ── Account ───────────────────────────────────────── */}
      <SectionTitle>Account</SectionTitle>

      <SettingRow label="Email" sub={user?.email ?? "—"}>
        <Lock size={15} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} />
      </SettingRow>

      <SettingRow label="Handle" sub={`@${user?.handle ?? ""}`}>
        <Lock size={15} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} />
      </SettingRow>

      {/* Change password */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink)" }}>Change password</div>
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current password"
            style={{ ...inputStyle, paddingRight: 42 }}
          />
          <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 12, top: 11, background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)" }}>
            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <input
          type={showPw ? "text" : "password"}
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New password (min. 8 chars)"
          style={inputStyle}
        />
        <input
          type={showPw ? "text" : "password"}
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Confirm new password"
          style={inputStyle}
        />
        {pwError && <p style={{ fontSize: 12.5, color: "var(--stamp-red)", margin: 0 }}>{pwError}</p>}
        {pwMsg && <p style={{ fontSize: 12.5, color: "var(--forest)", margin: 0 }}>{pwMsg}</p>}
        <button
          onClick={changePassword}
          disabled={!currentPw || !newPw || !confirmPw || pwSaving}
          style={{
            alignSelf: "flex-start", height: 38, padding: "0 20px", borderRadius: 10, border: "none",
            background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)",
            fontWeight: 700, fontSize: 13.5, cursor: pwSaving ? "wait" : "pointer",
            opacity: (!currentPw || !newPw || !confirmPw) ? 0.45 : 1,
          }}
        >
          {pwSaving ? "Updating…" : "Update password"}
        </button>
      </div>

      {/* ── Danger zone ───────────────────────────────────── */}
      <SectionTitle>Danger zone</SectionTitle>
      <SettingRow label="Sign out">
        <button
          onClick={() => {
            document.cookie = "ch_refresh_token=; Max-Age=0; path=/";
            localStorage.removeItem("ch_access");
            router.push("/auth/signin");
          }}
          style={{ height: 34, padding: "0 16px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Sign out
        </button>
      </SettingRow>
    </div>
  );
}
