"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    id: "figures",
    label: "Action Figures",
    emoji: "🦸",
    desc: "Marvel, DC, NECA, McFarlane & more",
    suggest: { handle: "figurehead", name: "Figurehead" },
  },
  {
    id: "designer",
    label: "Designer Toys & Blind Boxes",
    emoji: "🎲",
    desc: "Kaws, Bearbrick, Popmart, Labubu",
    suggest: { handle: "blindbox_queen", name: "Blindbox Queen" },
  },
  {
    id: "kits",
    label: "Model Kits & Lego",
    emoji: "🧱",
    desc: "Gunpla, Tamiya, Lego Technic sets",
    suggest: { handle: "brickmaster", name: "Brickmaster" },
  },
  {
    id: "diecast",
    label: "Diecast & Scale Models",
    emoji: "🚗",
    desc: "Hot Wheels, Tomica, 1:18 scale cars",
    suggest: { handle: "diecast_dreams", name: "Diecast Dreams" },
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleFollow(handle: string) {
    setFollowing((prev) =>
      prev.includes(handle) ? prev.filter((x) => x !== handle) : [...prev, handle]
    );
  }

  const suggested = CATEGORIES.filter((c) =>
    interests.length === 0 || interests.includes(c.id)
  ).map((c) => c.suggest);

  async function handleFinish() {
    setLoading(true);
    try {
      if (interests.length > 0) {
        await api.patch("/users/me", { interests });
      }
      await Promise.allSettled(
        following.map((handle) => api.post(`/users/${handle}/follow`))
      );
    } catch {
      // non-fatal — proceed to feed
    } finally {
      router.push("/feed");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bone)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <span className="w-9 h-9 rounded-full bg-[var(--stamp-red)] flex items-center justify-center text-white font-black text-sm shrink-0">
            CH
          </span>
          <span
            className="text-2xl font-extrabold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            CollectorHub
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                s <= step ? "bg-[var(--stamp-red)]" : "bg-[var(--bone-deep)]"
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1
              className="text-2xl font-bold text-[var(--ink)] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What do you collect?
            </h1>
            <p className="text-sm text-[var(--ink-faint)] mb-6">
              Pick your categories — we&apos;ll personalise your feed.
            </p>

            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const active = interests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleInterest(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150",
                      active
                        ? "border-[var(--stamp-red)] bg-[var(--stamp-red-soft)]"
                        : "border-[var(--border-strong)] bg-[var(--paper)] hover:border-[var(--ink-ghost)]"
                    )}
                  >
                    <span className="text-2xl leading-none">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--ink)]">{cat.label}</p>
                      <p className="text-xs text-[var(--ink-faint)] mt-0.5">{cat.desc}</p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        active
                          ? "bg-[var(--stamp-red)] border-[var(--stamp-red)]"
                          : "border-[var(--border-strong)]"
                      )}
                    >
                      {active && <Check size={11} strokeWidth={3} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full py-3 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-50"
              disabled={interests.length === 0}
            >
              Next
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => { setInterests([]); setStep(2); }}
              className="mt-3 w-full py-2 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1
              className="text-2xl font-bold text-[var(--ink)] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Suggested collectors
            </h1>
            <p className="text-sm text-[var(--ink-faint)] mb-6">
              Follow a few collectors to get your feed started.
            </p>

            <div className="space-y-3">
              {suggested.map((user) => {
                const isFollowing = following.includes(user.handle);
                return (
                  <div
                    key={user.handle}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--paper)] border border-[var(--border)]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--stamp-red-soft)] flex items-center justify-center text-[var(--stamp-red)] font-bold text-sm shrink-0 select-none">
                      {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--ink)]">{user.name}</p>
                      <p className="text-xs text-[var(--ink-faint)]">@{user.handle}</p>
                    </div>
                    <button
                      onClick={() => toggleFollow(user.handle)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                        isFollowing
                          ? "bg-[var(--bone)] border-[var(--border-strong)] text-[var(--ink)]"
                          : "bg-[var(--stamp-red)] border-transparent text-white hover:bg-[var(--stamp-red-deep)]"
                      )}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="mt-6 w-full py-3 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60"
            >
              {loading ? "Setting up…" : "Go to feed"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
