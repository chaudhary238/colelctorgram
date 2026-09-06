"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Shield, Info } from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/auth-context";
import { AvatarUploader } from "@/components/ImageUploader";
import { CityField } from "@/components/CityField";

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

/* DV8 (ProfileEdit.jsx:94-127) — the four @username helper states. `checking`
   renders the neutral helper (no glyph) while the availability probe is in flight. */
type HandleStatus = "" | "checking" | "available" | "taken" | "invalid";

// ProfileEdit (DF-22 → DV8) — mirrors onboarding step 0: avatar, name, @username
// (live availability), bio (150), CityField (city+country), gender (2-col grid),
// age slider. Fields are h48 per the v8 field spec.
export function EditProfileSheet({ user, onClose, onSaved }: EditProfileSheetProps) {
  const [name, setName] = useState(user.name === "You" ? "" : user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [age, setAge] = useState(ageFromBirthYear(user.birth_year));
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // @username — sanitized as typed; availability checked against the live API
  // (GET /users/handle-available treats your own current handle as available).
  const myHandle = (user.handle ?? "").toLowerCase();
  const [handle, setHandle] = useState(user.handle ?? "");
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("");
  const [handleChanged, setHandleChanged] = useState(false);
  const handleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onHandleChange(raw: string) {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setHandle(v);
    setHandleChanged(true);
    if (handleDebounce.current) clearTimeout(handleDebounce.current);
    if (!v || v.length < 3) { setHandleStatus("invalid"); return; }
    setHandleStatus("checking");
    handleDebounce.current = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean; reason: string | null }>(
          `/users/handle-available?handle=${encodeURIComponent(v)}`
        );
        setHandleStatus(res.available ? "available" : res.reason === "format" ? "invalid" : "taken");
      } catch {
        setHandleStatus("");
      }
    }, 350);
  }
  useEffect(() => () => { if (handleDebounce.current) clearTimeout(handleDebounce.current); }, []);

  const handleIsNew = handle.trim() !== "" && handle.trim().toLowerCase() !== myHandle;

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<AuthUser>("/users/me", {
        name: name.trim() || undefined,
        bio: bio.trim(),
        city: city.trim(),
        country: country.trim(),
        avatar_url: avatarUrl || undefined,
        gender: gender || undefined,
        birth_year: CURRENT_YEAR - age,
        // The handle rides along only when it actually changed AND the live check
        // cleared it — a taken/invalid draft never blocks saving the rest.
        ...(handleIsNew && handleStatus === "available" ? { handle: handle.trim() } : {}),
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      // 409 from PATCH (raced a rename) — surface it on the field, not just the footer.
      if (/taken/i.test(msg)) setHandleStatus("taken");
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.02em",
  };
  const fieldStyle: React.CSSProperties = {
    display: "block", width: "100%", boxSizing: "border-box", height: 48, marginTop: 7, padding: "0 14px",
    borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
    fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
  };

  const handleBorder =
    handleStatus === "available" ? "var(--forest)"
    : handleStatus === "taken" || handleStatus === "invalid" ? "var(--stamp-red)"
    : "var(--border-strong)";
  const handleHelp =
    handleStatus === "available" ? "✓ Username available"
    : handleStatus === "taken" ? "✗ Already taken — try another"
    : handleStatus === "invalid" ? "✗ 3–20 characters · letters, numbers and _ only"
    : "Lowercase letters, numbers and _ only · 3–20 characters";
  const handleHelpColor =
    handleStatus === "available" ? "var(--forest)"
    : handleStatus === "taken" || handleStatus === "invalid" ? "var(--stamp-red)"
    : "var(--ink-faint)";

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

            {/* @username — unique identifier, live availability (DV8 ProfileEdit.jsx:94-127) */}
            <div>
              <span style={labelStyle}>@Username</span>
              <div style={{ position: "relative", marginTop: 7 }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, pointerEvents: "none",
                }}>@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => onHandleChange(e.target.value)}
                  maxLength={20}
                  placeholder={user.handle || "your_handle"}
                  style={{
                    display: "block", width: "100%", boxSizing: "border-box", height: 48,
                    padding: "0 42px 0 32px", borderRadius: 12,
                    border: `1px solid ${handleBorder}`,
                    background: "var(--paper-soft)", fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink)", outline: "none",
                  }}
                />
                {(handleStatus === "available" || handleStatus === "taken" || handleStatus === "invalid") && (
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                    {handleStatus === "available"
                      ? <Check size={18} strokeWidth={2.5} style={{ color: "var(--forest)" }} />
                      : <X size={18} strokeWidth={2.5} style={{ color: "var(--stamp-red)" }} />}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, marginTop: 5, lineHeight: 1.4, color: handleHelpColor }}>
                {handleHelp}
              </div>
              {handleChanged && handleIsNew && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 7, padding: "8px 10px", background: "var(--grail-gold-soft)", borderRadius: 9 }}>
                  <Info size={14} style={{ color: "var(--grail-gold-deep)", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11.5, color: "var(--grail-gold-deep)", lineHeight: 1.45 }}>
                    Changing your username may break links to your profile shared elsewhere.
                  </span>
                </div>
              )}
            </div>

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

            {/* City — canonical picker, stores city + country separately (DV8) */}
            <CityField
              label="City"
              height={48}
              value={country && city ? `${city}, ${country}` : city}
              onChange={(c, ct) => { setCity(c); setCountry(ct); }}
            />

            {/* Gender — 2-col grid, "Prefer not to say" spans both (DV8 GenderPicker) */}
            <div>
              <span style={labelStyle}>Gender</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 7 }}>
                {GENDERS.map(([val, lbl], i) => {
                  const on = gender === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGender(on ? "" : val)}
                      style={{
                        gridColumn: i === 2 ? "span 2" : "auto",
                        height: 48, borderRadius: 12, cursor: "pointer", padding: "0 10px",
                        border: `1.5px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                        background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap",
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
