"use client";

// Onboarding wizard — design feedback round 1 (DF-01..DF-04):
// 3 steps: profile (bio/gender/age) → categories → communities.
// "Get specific" step removed; line-by-line checkbox rows, no photo tiles.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useUser, AuthUser } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// v4 order (CATEGORIES in data.jsx): figures → diecast → kits → designer → tcg.
const CATEGORIES = [
  { id: "figures", label: "Action Figures" },
  { id: "diecast", label: "Diecast" },
  { id: "kits", label: "Model Kits & Lego" },
  { id: "designer", label: "Designer Toys & Blind Boxes" },
  { id: "tcg", label: "Trading Cards (TCG)" },
];

// Per-category sub-interest chips (DV4-06; v4 design_v4/Onboarding.jsx SUBINTERESTS map).
// Revealed under a category once it's picked, for finer feed tuning (BRD §6.2/§9.2).
const SUBINTERESTS: Record<string, string[]> = {
  figures: ["Hot Toys", "SH Figuarts", "Sideshow", "Marvel Legends", "McFarlane", "Premium Format"],
  designer: ["Pop Mart", "Skullpanda", "Labubu", "KAWS", "Soft vinyl", "Sonny Angel"],
  kits: ["LEGO", "Gunpla", "MOC builds", "Bandai", "Scale models"],
  diecast: ["Tomica", "Mini GT", "Hot Wheels", "Inno64", "Kyosho"],
  tcg: ["Pokémon", "One Piece TCG", "Magic: The Gathering", "Yu-Gi-Oh!", "Dragon Ball Super TCG", "Digimon TCG"],
};

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
  const [gender, setGender] = useState<"" | "f" | "m">("");
  const [age, setAge] = useState(24);
  // only persist birth_year if the user actually moved the slider
  const [ageTouched, setAgeTouched] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  // category → selected sub-interest chips (DV4-06)
  const [subInterests, setSubInterests] = useState<Record<string, string[]>>({});
  const [joins, setJoins] = useState<string[]>([]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [loading, setLoading] = useState(false);

  // Prefill display name from signup
  useEffect(() => {
    if (user?.name) setName((n) => n || user.name);
  }, [user]);

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((c) => setCommunities(c ?? []))
      .catch(console.error);
  }, []);

  const suggested = useMemo(
    () => communities.filter((c) => interests.includes(c.category)),
    [communities, interests]
  );

  function toggleInterest(id: string) {
    setInterests((prev) => {
      const removing = prev.includes(id);
      if (removing) {
        // Drop the category's sub-interests too so we never persist orphans.
        setSubInterests((subs) => {
          const next = { ...subs };
          delete next[id];
          return next;
        });
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function toggleSub(cat: string, chip: string) {
    setSubInterests((prev) => {
      const cur = prev[cat] ?? [];
      const nextChips = cur.includes(chip) ? cur.filter((c) => c !== chip) : [...cur, chip];
      const next = { ...prev };
      if (nextChips.length === 0) delete next[cat];
      else next[cat] = nextChips;
      return next;
    });
  }

  function toggleJoin(id: string) {
    setJoins((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const canNext = step === 1 ? interests.length > 0 : true;

  async function handleFinish() {
    setLoading(true);
    try {
      const updated = await api.patch<AuthUser>("/users/me", {
        name: name || undefined,
        bio: bio || undefined,
        gender: gender || undefined,
        birth_year: ageTouched ? currentYear - age : undefined,
        interests,
        sub_interests: Object.keys(subInterests).length ? subInterests : undefined,
        // Customize-feed defaults (DF-08): tuned to picks, listings hidden
        feed_prefs: { categories: interests, hide_listings: true },
      });
      if (updated) setUser(updated);
      await Promise.allSettled(joins.map((id) => api.post(`/communities/${id}/join`)));
    } catch {
      // non-fatal — proceed to feed
    } finally {
      router.push("/feed");
    }
  }

  // Skip = abandon the wizard WITHOUT writing anything. (It previously called
  // handleFinish, which silently PATCHed prefilled/default values onto the account.)
  function skip() {
    router.push("/feed");
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
            className="w-[50px] text-right text-[13.5px] font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)] cursor-pointer bg-transparent border-none"
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
                  <div className="w-[84px] h-[84px] rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center text-2xl font-bold select-none">
                    {(name || "You")[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] rounded-full bg-[var(--stamp-red)] text-white border-[3px] border-[var(--paper)] flex items-center justify-center">
                    <Camera size={15} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                <label className="block">
                  <span className="text-[12.5px] font-semibold text-[var(--ink-mute)] tracking-wide">
                    Display name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aman Iyer"
                    className="block w-full mt-[7px] px-3.5 py-[11px] rounded-xl border border-[var(--border-strong)] bg-[var(--paper-soft)] text-[15px] text-[var(--ink)] outline-none focus:border-[var(--stamp-red)] transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="text-[12.5px] font-semibold text-[var(--ink-mute)] tracking-wide">
                    Bio
                  </span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={150}
                    placeholder="Who you are and what you collect — e.g. “Gunpla builder chasing 90s grails.”"
                    className="block w-full mt-[7px] px-3.5 py-[11px] rounded-xl border border-[var(--border-strong)] bg-[var(--paper-soft)] text-[15px] leading-[1.45] text-[var(--ink)] outline-none resize-none focus:border-[var(--stamp-red)] transition-colors"
                  />
                  <span className="block text-[11.5px] text-[var(--ink-faint)] text-right mt-[5px]">
                    {bio.length}/150
                  </span>
                </label>

                <div>
                  <span className="text-[12.5px] font-semibold text-[var(--ink-mute)] tracking-wide">
                    Gender
                  </span>
                  <div className="flex gap-2 mt-[7px]">
                    {([["f", "Female"], ["m", "Male"]] as const).map(([val, lbl]) => {
                      const on = gender === val;
                      return (
                        <button
                          key={val}
                          onClick={() => setGender(on ? "" : val)}
                          className={cn(
                            "flex-1 h-12 rounded-xl border-[1.5px] font-semibold text-[14.5px] cursor-pointer transition-colors",
                            on
                              ? "bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]"
                              : "bg-[var(--paper-soft)] border-[var(--border-strong)] text-[var(--ink)]"
                          )}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] font-semibold text-[var(--ink-mute)] tracking-wide">
                      How old are you?
                    </span>
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
                  const chips = SUBINTERESTS[c.id] ?? [];
                  const picked = subInterests[c.id] ?? [];
                  return (
                    <div key={c.id} className="flex flex-col gap-2.5">
                      <CheckRow on={on} onClick={() => toggleInterest(c.id)}>
                        <span
                          className="flex-1 font-bold text-[16.5px] text-[var(--ink)]"
                          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
                        >
                          {c.label}
                        </span>
                        <CheckBox on={on} />
                      </CheckRow>
                      {on && chips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-1 pb-1">
                          {chips.map((chip) => {
                            const chipOn = picked.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleSub(c.id, chip)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px",
                                  borderRadius: 999, cursor: "pointer", lineHeight: 1,
                                  fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5,
                                  background: chipOn ? "var(--ink)" : "var(--paper-soft)",
                                  color: chipOn ? "var(--paper)" : "var(--ink-soft)",
                                  border: `1px solid ${chipOn ? "var(--ink)" : "var(--border-strong)"}`,
                                }}
                              >
                                {chipOn && <Check size={12} strokeWidth={2.6} />}{chip}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[12.5px] text-[var(--ink-faint)] leading-relaxed mt-3 mb-0">
                Optional: tap what you collect within each to fine-tune your feed.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle
                title="Join your communities"
                sub="Recommended from what you collect. Pick all you like — you can join more anytime."
              />
              <div className="flex flex-col gap-2.5 mt-[18px]">
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
                  <p className="text-sm text-[var(--ink-faint)] text-center py-8">
                    Pick a category first to see recommended communities.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="pt-5 shrink-0">
          <button
            onClick={next}
            disabled={!canNext || loading}
            className="w-full py-3 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? "Setting up…"
              : step === 0
                ? "Continue"
                : step === 1
                  ? `Continue${interests.length ? ` · ${interests.length} picked` : ""}`
                  : "Enter CollectorHub"}
          </button>
        </div>
      </div>
    </div>
  );
}
