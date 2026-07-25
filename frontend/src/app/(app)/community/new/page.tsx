"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Shield, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { SectionLabel } from "@/components/ui";
import { ADD_CATEGORIES } from "@/lib/catalog";

// v4 CreateCommunity maps the global 5-category CATEGORIES (incl. TCG) as plain
// chipLabel pills, no icons. ADD_CATEGORIES is that exact list in v4 order.
const CATEGORIES = ADD_CATEGORIES;

const TONES = ["plum", "forest", "teal", "red", "ink", "gold"];

function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 14);
  return `${base || "community"}-${Date.now().toString().slice(-4)}`;
}

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px",
  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
};

function Label({ children, required, missing, hint }: {
  children: React.ReactNode; required?: boolean; missing?: boolean; hint?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, marginTop: 20 }}>
      <SectionLabel>{children}</SectionLabel>
      {required && <span style={{ color: missing ? "var(--stamp-red)" : "var(--ink-ghost)", fontSize: 13, fontWeight: 700 }}>*</span>}
      {hint && !missing && <span style={{ fontSize: 11, color: "var(--ink-ghost)", marginLeft: "auto" }}>{hint}</span>}
      {missing && <span style={{ fontSize: 11, color: "var(--stamp-red)", marginLeft: "auto", fontWeight: 600 }}>Required</span>}
    </div>
  );
}

function RadioRow({ title, sub, on, onClick }: {
  title: string; sub: string; on: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} type="button" style={{
      display: "flex", alignItems: "flex-start", gap: 11, width: "100%", textAlign: "left",
      cursor: "pointer", padding: "12px 13px", borderRadius: 12,
      border: `1.5px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
      background: on ? "var(--bone)" : "var(--paper-soft)",
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
      }}>
        {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink)" }} />}
      </span>
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>{sub}</span>
      </span>
    </button>
  );
}

function readParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export default function CreateCommunityPage() {
  const router = useRouter();
  // When launched from EventCreate ("Create new" community for an event) the URL
  // carries ?forEvent=1 + prefills; lazy init reads it once (no setState-in-effect).
  const [forEvent] = useState(() => readParams().get("forEvent") !== null);
  const [name, setName] = useState(() => readParams().get("prefillName") ?? "");
  const [cats, setCats] = useState<string[]>(() => {
    const pc = readParams().get("prefillCat");
    return pc && CATEGORIES.some((c) => c.id === pc) ? [pc] : [];
  });
  const [desc, setDesc] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "invite">("public");
  const [posting, setPosting] = useState<"open" | "approval">("open");
  const [rules, setRules] = useState("");
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // QA2 — live duplicate-name check: is the name free, and if not, what to suggest.
  const [nameCheck, setNameCheck] = useState<{ available: boolean; suggestion: string | null } | null>(null);
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleCat = (id: string) =>
    setCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  // Debounced availability probe as the name is typed (QA2).
  useEffect(() => {
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    const n = name.trim();
    // All setState lives inside the debounced callback (never synchronously in the
    // effect body) so a keystroke doesn't cascade a render.
    nameDebounce.current = setTimeout(async () => {
      if (n.length < 2) { setNameCheck(null); return; }
      try {
        setNameCheck(await api.get(`/communities/check-name?name=${encodeURIComponent(n)}`));
      } catch { setNameCheck(null); }
    }, 350);
    return () => { if (nameDebounce.current) clearTimeout(nameDebounce.current); };
  }, [name]);

  const nameTaken = nameCheck?.available === false;
  const miss = { name: !name.trim(), desc: !desc.trim() };
  const invalid = miss.name || miss.desc || nameTaken;

  const submit = async () => {
    if (invalid) { setTried(true); return; }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const tone = TONES[Math.floor(Math.random() * TONES.length)];
    const ruleList = rules.split("\n").map((r) => r.trim()).filter(Boolean);
    const id = slugify(name);
    try {
      await api.post("/communities", {
        id,
        name: name.trim(),
        // The model stores a single category; first pick is primary (multi-select is UI sugar).
        category: cats[0] || "figures",
        tag: (name.trim().replace(/[^A-Za-z]/g, "").slice(0, 2) || "CH").toUpperCase(),
        tone,
        short_desc: desc.trim(),
        description: desc.trim(),
        post_mode: posting,
        is_invite_only: privacy === "invite",
        rules: ruleList,
      });
      router.push(forEvent ? `/events/new?newCommunity=${id}` : "/community");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit community");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/community" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <X size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Create a community</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Reviewed before it goes public</div>
          </div>
          <button onClick={submit} disabled={submitting} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: invalid ? "var(--bone)" : "var(--stamp-red)", color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      <div style={{ padding: "4px 20px 16px" }}>
        <Label required missing={tried && miss.name}>Community name</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mumbai Figure Heads" style={{ ...fieldStyle, borderColor: (tried && miss.name) || nameTaken ? "var(--stamp-red)" : "var(--border-strong)" }} />
        {nameTaken ? (
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 7, fontSize: 12.5, color: "var(--stamp-red)" }}>
            <AlertCircle size={13} />
            <span>&ldquo;{name.trim()}&rdquo; is taken.</span>
            {nameCheck?.suggestion && (
              <button type="button" onClick={() => setName(nameCheck.suggestion!)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--verified-teal)", fontWeight: 700 }}>
                Use &ldquo;{nameCheck.suggestion}&rdquo;
              </button>
            )}
          </div>
        ) : nameCheck?.available && name.trim().length >= 2 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 12.5, color: "var(--forest)" }}>
            <Check size={13} /> Name is available
          </div>
        ) : null}

        <Label required>Category <span style={{ fontWeight: 400, color: "var(--ink-faint)" }}>(pick one or more)</span></Label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggleCat(c.id)} style={{
                display: "inline-flex", alignItems: "center", padding: "7px 13px", borderRadius: 999,
                cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1,
                background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13,
              }}>
                {c.label}
              </button>
            );
          })}
        </div>

        <Label required missing={tried && miss.desc}>Short description</Label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 140))} rows={2} placeholder="What this community is about — one line."
          style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", borderColor: tried && miss.desc ? "var(--stamp-red)" : "var(--border-strong)" }} />
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "right", margin: "5px 2px 0" }}>{desc.length}/140</div>

        <Label required>Who can join</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <RadioRow title="Public" sub="Anyone can find and join" on={privacy === "public"} onClick={() => setPrivacy("public")} />
          <RadioRow title="Invite-only" sub="People join by approval or invite" on={privacy === "invite"} onClick={() => setPrivacy("invite")} />
        </div>

        <Label required>Who can post</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <RadioRow title="Anyone can post" sub="Members post freely" on={posting === "open"} onClick={() => setPosting("open")} />
          <RadioRow title="Admin-approved" sub="Posts are reviewed before they show" on={posting === "approval"} onClick={() => setPosting("approval")} />
        </div>

        <Label hint="optional">Community rules &amp; terms</Label>
        <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={7}
          placeholder={"1. Be respectful — no harassment or hate speech.\n2. No spam or self-promotion without context.\n3. Trades are off-platform — always vouch after a deal.\n4. Verified photos only for listings…"}
          style={{ ...fieldStyle, height: "auto", padding: "12px 13px", lineHeight: 1.6, resize: "vertical", minHeight: 160, fontSize: 13.5 }} />
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "6px 2px 0", lineHeight: 1.5 }}>One rule per line. You can edit rules and manage members after the community goes live.</div>

        {error && <div style={{ marginTop: 16, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

        <button onClick={submit} disabled={submitting} type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          height: 48, marginTop: 22, borderRadius: 12, border: "none",
          background: "var(--ink)", color: "var(--paper)",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
          cursor: submitting ? "wait" : "pointer", opacity: invalid ? 0.5 : 1,
        }}>
          <Shield size={18} />{submitting ? "Submitting…" : "Submit for review"}
        </button>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
          Scorred reviews new communities before they&rsquo;re public.
        </div>
      </div>
    </div>
  );
}
