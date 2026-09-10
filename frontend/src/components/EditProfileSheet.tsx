"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Shield, Info, Camera, ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/auth-context";
import { Avatar, Button, toneVar } from "@/components/ui";
import { CityField } from "@/components/CityField";
import { GenderPicker } from "@/components/forms";
import { fireToast } from "@/components/gamification";

/** "form" = Edit profile; "avatar" = the v8 EditAvatarView stage (?edit=avatar). */
export type EditProfileStage = "form" | "avatar";

interface EditProfileSheetProps {
  user: AuthUser;
  onClose: () => void;
  onSaved: (updated: AuthUser) => void;
  initialStage?: EditProfileStage;
}

/* v8 ProfileEdit.jsx:8-11 — the 7 avatar fallback colours. */
// v8 ProfileEdit.jsx:201-215 — persisted as users.avatar_tone ids (toneVar maps
// them back to the CSS vars).
const PROFILE_COLORS: { id: string; css: string }[] = [
  { id: "ink", css: "var(--ink)" },
  { id: "red", css: "var(--stamp-red)" },
  { id: "plum", css: "var(--plum)" },
  { id: "teal", css: "var(--verified-teal)" },
  { id: "forest", css: "var(--forest)" },
  { id: "gold", css: "var(--grail-gold)" },
  { id: "mute", css: "var(--ink-mute)" },
];

/* R2 presign response (same contract ImageUploader's AvatarUploader uses). */
interface UploadUrlResponse { upload_url: string; public_url: string }

const CURRENT_YEAR = new Date().getFullYear();
const ageFromBirthYear = (by?: number | null) =>
  by && by > 1900 ? Math.min(80, Math.max(13, CURRENT_YEAR - by)) : 24;

/* DV8 (ProfileEdit.jsx:94-127) — the four @username helper states. `checking`
   renders the neutral helper (no glyph) while the availability probe is in flight. */
type HandleStatus = "" | "checking" | "available" | "taken" | "invalid";

// ProfileEdit (DF-22 → DV8) — mirrors onboarding step 0: avatar, name, @username
// (live availability), bio (150), CityField (city+country), gender (2-col grid),
// age slider. Fields are h48 per the v8 field spec.
export function EditProfileSheet({ user, onClose, onSaved, initialStage }: EditProfileSheetProps) {
  const [stage, setStage] = useState<EditProfileStage>(initialStage ?? "form");
  const [name, setName] = useState(user.name === "You" ? "" : user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [age, setAge] = useState(ageFromBirthYear(user.birth_year));
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [avatarTone, setAvatarTone] = useState(user.avatar_tone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── EditAvatarView stage (v8 ProfileEdit.jsx:161-224) ──
  // Photo changes persist IMMEDIATELY (v8 updateProfile-on-action), not on Save.
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!f || !f.type.startsWith("image/") || avatarBusy) return;
    setAvatarBusy(true);
    setAvatarError("");
    try {
      // Same presign flow as ImageUploader's AvatarUploader (kept out of that
      // file — another surface owns it): presign → PUT to R2 → PATCH the URL.
      const meta = await api.post<UploadUrlResponse>(
        `/media/upload-url?prefix=avatars&content_type=${encodeURIComponent(f.type)}`
      );
      const res = await fetch(meta.upload_url, { method: "PUT", body: f, headers: { "Content-Type": f.type } });
      if (!res.ok) throw new Error(`Storage rejected the upload (HTTP ${res.status})`);
      const updated = await api.patch<AuthUser>("/users/me", { avatar_url: meta.public_url });
      setAvatarUrl(meta.public_url);
      onSaved(updated);
      fireToast("Profile photo updated"); // v8 :172
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed — try again.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    if (avatarBusy) return;
    setAvatarBusy(true);
    setAvatarError("");
    try {
      // The PATCH body drops explicit nulls server-side (model_dump(exclude_none)),
      // so "" is the wire sentinel for "no avatar" — falsy everywhere it renders.
      const updated = await api.patch<AuthUser>("/users/me", { avatar_url: "" });
      setAvatarUrl("");
      onSaved(updated);
      fireToast("Photo removed"); // v8 :196
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't remove the photo — try again.");
    } finally {
      setAvatarBusy(false);
    }
  }

  // v8 :201-215 — the colour choice persists immediately, like the photo actions.
  async function pickTone(id: string) {
    if (avatarBusy) return;
    const prev = avatarTone;
    setAvatarTone(id);
    try {
      const updated = await api.patch<AuthUser>("/users/me", { avatar_tone: id });
      onSaved(updated);
      fireToast("Avatar colour updated");
    } catch {
      setAvatarTone(prev);
      fireToast("Couldn't save the colour — try again");
    }
  }

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
      fireToast("Profile updated"); // v8 ProfileEdit.jsx:63
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
        {/* Header — v8 ProfileEdit.jsx:68-69 pairs the DetailHeader's trailing
            "Save" pill with the footer's "Save changes"; the avatar stage swaps
            to "Profile photo" + Done (v8 :177-179). */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0" style={{ gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {stage === "avatar" && (
              <button
                onClick={() => setStage("form")}
                aria-label="Back"
                className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 className="font-bold text-base text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
                {stage === "avatar" ? "Profile photo" : "Edit profile"}
              </h2>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1 }}>
                {stage === "avatar" ? "Upload a photo or pick a colour" : "What other collectors see"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {stage === "form" ? (
              <Button size="sm" variant="dark" disabled={saving} onClick={handleSave}>Save</Button>
            ) : (
              <Button size="sm" variant="dark" onClick={() => setStage("form")}>Done</Button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── EditAvatarView stage (v8 ProfileEdit.jsx:176-223) ── */}
        {stage === "avatar" && (
          <div className="overflow-y-auto flex-1" style={{ padding: "24px 20px" }}>
            {/* live preview — v8 :183, 132px */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
              <Avatar name={name || "You"} photo={avatarUrl || undefined} color={avatarTone ? toneVar(avatarTone) : undefined} size={132} />
            </div>

            <input ref={avatarFileRef} type="file" accept="image/*" onChange={onAvatarFile} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="dark"
                style={{ flex: 1, justifyContent: "center" }}
                icon={<Camera size={18} />}
                disabled={avatarBusy}
                onClick={() => avatarFileRef.current?.click()}
              >
                {avatarBusy ? "Uploading…" : avatarUrl ? "Replace photo" : "Upload a photo"}
              </Button>
              {avatarUrl && (
                <Button variant="secondary" icon={<X size={17} />} disabled={avatarBusy} onClick={removeAvatar}>
                  Remove
                </Button>
              )}
            </div>
            {avatarError && (
              <p style={{ fontSize: 12.5, color: "var(--stamp-red)", marginTop: 10 }}>{avatarError}</p>
            )}

            {/* colour avatar fallback — v8 :201-215, persisted as users.avatar_tone. */}
            <div style={{ marginTop: 26 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
                Or pick an avatar colour
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              {PROFILE_COLORS.map((c) => (
                <button
                  key={c.id}
                  aria-label={`Avatar colour ${c.id}`}
                  onClick={() => pickTone(c.id)}
                  style={{
                    width: 50, height: 50, borderRadius: "50%", background: c.css, position: "relative",
                    border: "none", cursor: "pointer",
                    boxShadow: avatarTone === c.id ? "0 0 0 2px var(--paper), 0 0 0 4px var(--ink)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)",
                  }}
                >
                  {avatarTone === c.id && <Check size={20} strokeWidth={3} />}
                </button>
              ))}
            </div>

            {/* v8 :217-220 — exact copy */}
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 26, fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.5 }}>
              <Shield size={15} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
              <span>A clear face or collection photo helps other collectors trust you when trading.</span>
            </div>
          </div>
        )}

        {/* ── Edit-profile form stage ── */}
        {stage === "form" && (
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {/* Avatar — v8 ProfileEdit.jsx:77-88: 92px avatar with a 32px camera pip
              plus the red "Change profile photo" button; BOTH open the avatar stage. */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <button
              onClick={() => setStage("avatar")}
              style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Avatar name={name || "You"} photo={avatarUrl || undefined} color={avatarTone ? toneVar(avatarTone) : undefined} size={92} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 32, height: 32, borderRadius: "50%", background: "var(--stamp-red)", color: "var(--paper)", border: "3px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={16} />
              </div>
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: -14, marginBottom: 20 }}>
            <button
              onClick={() => setStage("avatar")}
              style={{ background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 4 }}
            >
              Change profile photo
            </button>
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

            {/* Gender — shared GenderPicker (components/forms.tsx) */}
            <div>
              <span style={labelStyle}>Gender</span>
              <GenderPicker value={gender} onChange={setGender} />
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

            {/* v8 ProfileEdit.jsx:219 — exact copy */}
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 4, fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.5 }}>
              <Shield size={15} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
              <span>A clear face or collection photo helps other collectors trust you when trading.</span>
            </div>

            {error && <p style={{ fontSize: 12.5, color: "var(--stamp-red)", margin: 0 }}>{error}</p>}
          </div>
        </div>
        )}

        {/* Footer — form stage only (the avatar stage persists per action) */}
        {stage === "form" && (
        <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
