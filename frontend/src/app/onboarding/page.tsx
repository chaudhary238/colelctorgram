"use client";

// Onboarding wizard (design_v8/app/Onboarding.jsx Onboard) — DV8 P0-2/P0-4:
// 3 steps: profile (name → @username → bio → city → gender → age) →
// categories → communities. Skip commits whatever was typed (+ onboarded flag)
// instead of discarding it; @username is checked live against
// GET /users/handle-available and auto-suggested from the display name.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { useUser, AuthUser } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { CityField } from "@/components/CityField";
import { Avatar, EmptyNote } from "@/components/ui";
import { authLabelStyle, authInputStyle, BlockButton } from "@/app/auth/_ui";

// v4 order (CATEGORIES in data.jsx): figures → diecast → kits → designer → tcg.
const CATEGORIES = [
  { id: "figures", label: "Action Figures" },
  { id: "diecast", label: "Diecast" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "designer", label: "Designer Toys & Blind Boxes" },
  { id: "tcg", label: "Trading Cards (TCG)" },
];

// Sub-interest chip rows removed per DV8_DESIGN_GAPS ("Step 1: v8 has NO
// sub-interest chips") — the backend sub_interests field stays untouched; we
// just stop rendering and sending it here.

// Gender options — v8 shared.jsx GenderPicker: one list so signup and profile
// editing can never diverge. "Prefer not to say" spans both grid columns.
const GENDERS = [
  ["f", "Female"],
  ["m", "Male"],
  ["x", "Prefer not to say"],
] as const;

type HandleStatus = "" | "available" | "taken" | "invalid";

// v8 auto-suggestion rule: display name → lowercase, runs of other characters
// collapse to "_", trimmed, capped at the 20-char handle limit.
function suggestFrom(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

interface ApiCommunity {
  id: string;
  name: string;
  category: string;
  member_count: number;
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1
        className="text-[27px] font-bold leading-[1.1] text-[var(--ink)] m-0"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      <p className="text-[14.5px] text-[var(--ink-mute)] leading-relaxed mt-2 mb-0">{sub}</p>
    </div>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "w-6 h-6 rounded-[7px] shrink-0 flex items-center justify-center border-[1.5px] transition-colors",
        on
          ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]"
          : "border-[var(--border-strong)] bg-transparent"
      )}
    >
      {on && <Check size={15} strokeWidth={3} />}
    </span>
  );
}

function CheckRow({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3.5 text-left rounded-[14px] border-[1.5px] px-4 py-[15px] transition-colors duration-150 cursor-pointer",
        on
          ? "border-[var(--ink)] bg-[var(--bone)]"
          : "border-[var(--border-strong)] bg-[var(--paper-soft)] hover:border-[var(--ink-ghost)]"
      )}
    >
      {children}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const currentYear = new Date().getFullYear();

  const [step, setStep] = useState<0 | 1 | 2>(0); // 0 profile · 1 categories · 2 communities
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState<"" | "f" | "m" | "x">("");
  const [age, setAge] = useState(24);
  // only persist birth_year if the user actually moved the slider
  const [ageTouched, setAgeTouched] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [joins, setJoins] = useState<string[]>([]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  // loading flag so step 2 never shows the "pick a category" note mid-fetch
  const [commLoading, setCommLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // @username — auto-suggested from display name; uniqueness checked live
  // against GET /users/handle-available (DV8 P0-2).
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("");
  const [handleManual, setHandleManual] = useState(false); // true once user edits the field

  // Debounced live availability. The input already strips illegal characters,
  // so the only client-side invalid case is "too short"; the server re-checks
  // format anyway and answers taken/format.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived async-validation state keyed to the current handle value
    if (!handle) { setHandleStatus(""); return; }
    if (handle.length < 3) { setHandleStatus("invalid"); return; }
    setHandleStatus("");
    let stale = false;
    const t = setTimeout(() => {
      api
        .get<{ available: boolean; reason: "format" | "taken" | null }>(
          `/users/handle-available?handle=${encodeURIComponent(handle)}`
        )
        .then((r) => {
          if (stale) return;
          setHandleStatus(r.available ? "available" : r.reason === "format" ? "invalid" : "taken");
        })
        .catch(() => {
          if (!stale) setHandleStatus("");
        });
    }, 350);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [handle]);

  function onNameChange(v: string) {
    setName(v);
    // Auto-suggest the handle from the display name until the user edits it.
    if (!handleManual) setHandle(suggestFrom(v));
  }

  function onHandleChange(raw: string) {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setHandle(v);
    setHandleManual(true);
  }

  // Prefill display name from signup/OAuth — but not the provisional name
  // (slim signup sets name = derived handle, which isn't a real name). The
  // prefilled name also seeds the @username suggestion, like typing would.
  useEffect(() => {
    if (user?.name && user.name !== user.handle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot prefill from the fetched account
      setName((n) => n || user.name);
      setHandle((h) => h || suggestFrom(user.name));
    }
  }, [user]);

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((c) => setCommunities(c ?? []))
      .catch(console.error)
      .finally(() => setCommLoading(false));
  }, []);

  const suggested = useMemo(
    () => communities.filter((c) => interests.includes(c.category)),
    [communities, interests]
  );

  // v8 pre-selects the first suggested community ({itm: true}) — once, and only
  // if the user hasn't made their own picks yet.
  const preselected = useRef(false);
  useEffect(() => {
    if (step !== 2 || commLoading || preselected.current || suggested.length === 0) return;
    preselected.current = true;
    setJoins((j) => (j.length ? j : [suggested[0].id]));
  }, [step, commLoading, suggested]);

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleJoin(id: string) {
    setJoins((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const canNext = step === 1 ? interests.length > 0 : true;

  // The one PATCH both exits share: whatever was typed + the onboarded stamp.
  // Handle is sent only when the live availability check passed.
  async function saveProfile(includeInterests: boolean) {
    const patch: Record<string, unknown> = { onboarded: true };
    if (name.trim()) patch.name = name.trim();
    if (handle.trim() && handleStatus === "available") patch.handle = handle.trim();
    if (bio.trim()) patch.bio = bio.trim();
    if (city) {
      patch.city = city;
      patch.country = country;
    }
    if (gender) patch.gender = gender;
    if (ageTouched) patch.birth_year = currentYear - age;
    if (includeInterests && interests.length) {
      patch.interests = interests;
      // Customize-feed defaults (DF-08): tuned to picks, listings hidden
      patch.feed_prefs = { categories: interests, hide_listings: true };
    }
    const updated = await api.patch<AuthUser>("/users/me", patch);
    if (updated) setUser(updated);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await saveProfile(true);
      await Promise.allSettled(joins.map((id) => api.post(`/communities/${id}/join`)));
    } catch {
      // non-fatal — proceed to feed
    } finally {
      router.push("/feed");
    }
  }

  // DV8 P0-4 (the v7→v8 fix): Skip COMMITS whatever was typed — profile fields
  // + onboarded:true — it never silently discards the user's answers.
  async function skip() {
    setSaving(true);
    try {
      await saveProfile(false);
    } catch {
      // non-fatal — proceed to feed
    } finally {
      router.push("/feed");
    }
  }

  function next() {
    if (step < 2) setStep((step + 1) as 0 | 1 | 2);
    else handleFinish();
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex justify-center px-4">
      <div className="w-full max-w-lg flex flex-col min-h-screen pt-10 pb-8">
        {/* progress + back + skip */}
        <div className="flex items-center gap-2.5 mb-6">
          {step > 0 ? (
            <button
              onClick={() => setStep((step - 1) as 0 | 1 | 2)}
              className="w-[34px] h-[34px] rounded-[10px] border border-[var(--border)] flex items-center justify-center text-[var(--ink)] cursor-pointer bg-transparent"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-[34px]" />
          )}
          <div className="flex-1 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-[var(--stamp-red)]" : "bg-[var(--bone-deep)]"
                )}
              />
            ))}
          </div>
          <button
            onClick={skip}
            disabled={saving}
            className="w-[50px] text-right text-[13.5px] font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)] cursor-pointer bg-transparent border-none disabled:opacity-50"
          >
            Skip
          </button>
        </div>

        <div className="flex-1">
          {step === 0 && (
            <>
              <StepTitle
                title="Set up your profile"
                sub="A quick intro other collectors see when you trade. You can change these later."
              />

              {/* avatar */}
              <div className="flex justify-center my-6">
                <div className="relative">
                  <Avatar name={name || "You"} color="var(--ink)" size={84} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] rounded-full bg-[var(--stamp-red)] text-white border-[3px] border-[var(--paper)] flex items-center justify-center">
                    <Camera size={15} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: 14 }}>
                <label className="block">
                  <span style={authLabelStyle}>Display name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g. Aman Iyer"
                    style={{ ...authInputStyle, marginTop: 7 }}
                  />
                </label>

                {/* @username — unique identifier, auto-suggested from name,
                    uniqueness checked live (Onboarding.jsx:276-303) */}
                <div>
                  <span style={authLabelStyle}>@Username</span>
                  <div style={{ position: "relative", marginTop: 7 }}>
                    <span
                      style={{
                        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                        color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontWeight: 600,
                        fontSize: 16, pointerEvents: "none",
                      }}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => onHandleChange(e.target.value)}
                      maxLength={20}
                      placeholder="your_handle"
                      autoCapitalize="none"
                      autoCorrect="off"
                      style={{
                        ...authInputStyle,
                        padding: "0 42px 0 32px",
                        fontFamily: "var(--font-mono)",
                        border: `1px solid ${
                          handleStatus === "available"
                            ? "var(--forest)"
                            : handleStatus === "taken" || handleStatus === "invalid"
                              ? "var(--stamp-red)"
                              : "var(--border-strong)"
                        }`,
                      }}
                    />
                    {(handleStatus === "available" || handleStatus === "taken" || handleStatus === "invalid") && (
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                        {handleStatus === "available" ? (
                          <Check size={18} strokeWidth={2.5} style={{ color: "var(--forest)" }} />
                        ) : (
                          <X size={18} strokeWidth={2.5} style={{ color: "var(--stamp-red)" }} />
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5, marginTop: 5, lineHeight: 1.4,
                      color:
                        handleStatus === "available"
                          ? "var(--forest)"
                          : handleStatus
                            ? "var(--stamp-red)"
                            : "var(--ink-faint)",
                    }}
                  >
                    {handleStatus === "available"
                      ? "✓ Available"
                      : handleStatus === "taken"
                        ? "✗ Already taken — try another"
                        : handleStatus === "invalid"
                          ? "✗ 3–20 characters · letters, numbers and _ only"
                          : "Lowercase · letters, numbers and _ only · 3–20 characters"}
                  </div>
                </div>

                <label className="block">
                  <span style={authLabelStyle}>Bio</span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={150}
                    placeholder="Who you are and what you collect — e.g. “Sneakerhead & Gunpla builder, chasing 90s Jordans.”"
                    style={{
                      display: "block", width: "100%", boxSizing: "border-box", marginTop: 7,
                      padding: "11px 14px", borderRadius: 12, border: "1px solid var(--border-strong)",
                      background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 15,
                      lineHeight: 1.45, color: "var(--ink)", outline: "none", resize: "none",
                    }}
                  />
                  <span className="block text-[11.5px] text-[var(--ink-faint)] text-right" style={{ margin: "5px 2px 0" }}>
                    {bio.length}/150
                  </span>
                </label>

                {/* City is a picked value from a fed list — see CityField for why.
                    Stores city and country separately (DV8 P0-2). */}
                <CityField
                  label="City"
                  value={city}
                  onChange={(c, ct) => {
                    setCity(c);
                    setCountry(ct);
                  }}
                />

                {/* GenderPicker port (shared.jsx:404-426): two even columns —
                    "Prefer not to say" spans both so it never wraps. */}
                <div>
                  <span style={authLabelStyle}>Gender</span>
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
                            background: on ? "var(--ink)" : "var(--paper-soft)",
                            color: on ? "var(--paper)" : "var(--ink)",
                            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span style={authLabelStyle}>How old are you?</span>
                    <span className="font-mono font-semibold text-base text-[var(--ink)]">
                      {age >= 80 ? "80+" : age}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={13}
                    max={80}
                    step={1}
                    value={age}
                    onChange={(e) => { setAge(+e.target.value); setAgeTouched(true); }}
                    className="w-full mt-3 cursor-pointer"
                    style={{ accentColor: "var(--stamp-red)" }}
                  />
                  <div className="flex justify-between text-[11px] text-[var(--ink-faint)] mt-0.5">
                    <span>13</span>
                    <span>80+</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepTitle
                title="What do you collect?"
                sub="Pick all that apply. Your feed and communities tune to this instantly — no followers needed."
              />
              <div className="flex flex-col gap-2.5 mt-5">
                {CATEGORIES.map((c) => {
                  const on = interests.includes(c.id);
                  return (
                    <CheckRow key={c.id} on={on} onClick={() => toggleInterest(c.id)}>
                      <span
                        className="flex-1 font-bold text-[16.5px] text-[var(--ink)]"
                        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
                      >
                        {c.label}
                      </span>
                      <CheckBox on={on} />
                    </CheckRow>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle
                title="Join your communities"
                sub="Recommended from what you collect. Pick all you like — you can join more anytime."
              />
              <div className="flex flex-col gap-2.5 mt-[18px]">
                {commLoading ? (
                  <EmptyNote>Finding communities for you…</EmptyNote>
                ) : (
                  <>
                    {suggested.map((c) => {
                      const on = joins.includes(c.id);
                      return (
                        <CheckRow key={c.id} on={on} onClick={() => toggleJoin(c.id)}>
                          <span className="flex-1 min-w-0">
                            <span
                              className="block font-bold text-base text-[var(--ink)]"
                              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
                            >
                              {c.name}
                            </span>
                            <span className="block text-[12.5px] font-mono text-[var(--ink-faint)] mt-0.5">
                              {c.member_count.toLocaleString("en-IN")} members
                            </span>
                          </span>
                          <CheckBox on={on} />
                        </CheckRow>
                      );
                    })}
                    {suggested.length === 0 && (
                      <EmptyNote>Pick a category first to see recommended communities.</EmptyNote>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="pt-5 shrink-0">
          <BlockButton onClick={next} disabled={!canNext || saving}>
            {saving
              ? "Setting up…"
              : step === 0
                ? "Continue"
                : step === 1
                  ? `Continue${interests.length ? ` · ${interests.length} picked` : ""}`
                  : "Enter Scorred"}
          </BlockButton>
        </div>
      </div>
    </div>
  );
}
