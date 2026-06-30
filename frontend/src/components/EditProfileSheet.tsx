"use client";

import { useState } from "react";
import { X, Check, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/auth-context";
import { AvatarUploader } from "@/components/ImageUploader";

interface EditProfileSheetProps {
  user: AuthUser;
  onClose: () => void;
  onSaved: (updated: AuthUser) => void;
}

const GENDERS: [string, string][] = [
  ["f", "Female"],
  ["m", "Male"],
  ["x", "Prefer not to say"],
];

const CURRENT_YEAR = new Date().getFullYear();
const ageFromBirthYear = (by?: number | null) =>
  by && by > 1900 ? Math.min(80, Math.max(13, CURRENT_YEAR - by)) : 24;

// ProfileEdit (DF-22) — converted from design app/ProfileEdit.jsx. Fields mirror
// onboarding step 0: avatar, name, bio (150), city, gender (3-way), age slider.
// Interests were dropped here to match design v2 (they live in onboarding).
export function EditProfileSheet({ user, onClose, onSaved }: EditProfileSheetProps) {
  const [name, setName] = useState(user.name === "You" ? "" : user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [age, setAge] = useState(ageFromBirthYear(user.birth_year));
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<AuthUser>("/users/me", {
        name: name.trim() || undefined,
        bio: bio.trim(),
        city: city.trim(),
        avatar_url: avatarUrl || undefined,
        gender: gender || undefined,
        birth_year: CURRENT_YEAR - age,
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.02em",
  };
  const fieldStyle: React.CSSProperties = {
    display: "block", width: "100%", boxSizing: "border-box", height: 46, marginTop: 7, padding: "0 14px",
    borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
    fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
          <div>
            <h2 className="font-bold text-base text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
              Edit profile
            </h2>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1 }}>What other collectors see</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
            <AvatarUploader previewUrl={avatarUrl || undefined} onUpload={(url) => setAvatarUrl(url)} />
            <span style={{ fontSize: 13, color: "var(--stamp-red)", fontWeight: 600 }}>Change profile photo</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Display name */}
            <label style={{ display: "block" }}>
              <span style={labelStyle}>Display name</span>
              <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aman Iyer" />
            </label>

            {/* Bio */}
            <label style={{ display: "block" }}>
              <span style={labelStyle}>Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                rows={3}
                placeholder="Who you are and what you collect — e.g. “Hot Toys obsessive, chasing 1/6 Marvel.”"
                style={{ ...fieldStyle, height: "auto", padding: "11px 14px", lineHeight: 1.45, resize: "none" }}
              />
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "right", margin: "5px 2px 0" }}>{bio.length}/150</div>
            </label>

            {/* City */}
            <label style={{ display: "block" }}>
              <span style={labelStyle}>City</span>
              <input style={fieldStyle} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />
            </label>

            {/* Gender */}
            <div>
              <span style={labelStyle}>Gender</span>
              <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
                {GENDERS.map(([val, lbl]) => {
                  const on = gender === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(on ? "" : val)}
                      style={{
                        flex: 1, height: 46, borderRadius: 12, cursor: "pointer", padding: "0 6px",
                        border: `1.5px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                        background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, lineHeight: 1.1,
                      }}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age */}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={labelStyle}>How old are you?</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
                  {age >= 80 ? "80+" : age}
                </span>
              </div>
              <input
                type="range" min={13} max={80} step={1} value={age}
                onChange={(e) => setAge(+e.target.value)}
                style={{ width: "100%", marginTop: 12, accentColor: "var(--stamp-red)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>
                <span>13</span><span>80+</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 4, fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.5 }}>
              <Shield size={15} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
              <span>A clear photo and a real bio help other collectors trust you when trading.</span>
            </div>

            {error && <p style={{ fontSize: 12.5, color: "var(--stamp-red)", margin: 0 }}>{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
