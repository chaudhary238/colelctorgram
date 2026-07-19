"use client";

// Create / Compose — design feedback round 3 (DF-30). Single-window composer:
// Stage 0 chooser (Create a Post vs Add an item) → one screen with a Segmented
// type switch (Post · ISO · Poll · Review), optional title, body + emoji + char
// counter, per-type fields (ISO form / poll choices / review StarPicker), a 6-image
// strip, hashtag entry, and a multi-select "Post to" (feed + communities, DF-30h).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Check, Camera, ChevronLeft, ChevronRight, Plus, Smile, Star, Edit3, Tag as TagIcon } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { Avatar, Segmented, SectionLabel } from "@/components/ui";
import { fireXpToast } from "@/components/gamification";
import { ADD_CATEGORIES } from "@/lib/catalog";

type ComposeType = "post" | "iso" | "poll" | "review";

const TYPES: { id: ComposeType; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "iso", label: "ISO" },
  { id: "poll", label: "Poll" },
  { id: "review", label: "Review" },
];

const BODY_MAX = 600;
const TAG_SUGGEST = ["NewDrops", "Grails", "HotToys", "Gunpla", "Diecast", "PopMart", "Sealed", "Marvel"];
const EMOJIS = ["😍", "🔥", "🤩", "😎", "🥹", "👀", "🙌", "👏", "💎", "🏆", "📦", "🚀", "✨", "❤️", "🤝", "💰", "🫡", "🧩", "🎯", "😱"];
const CONDITIONS = ["Any", "Sealed", "MIB", "BIB", "Loose"];

interface UploadUrlResponse { upload_url: string; key: string; public_url: string; }

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <button
            key={n}
            onClick={() => onChange(n === value ? 0 : n)}
            aria-label={`${n} star`}
            style={{ background: "none", border: "none", padding: 2, cursor: "pointer", lineHeight: 0 }}
          >
            <Star size={26} fill={on ? "var(--grail-gold-deep)" : "none"} color={on ? "var(--grail-gold-deep)" : "var(--border-strong)"} strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
}

export default function ComposePage() {
  const router = useRouter();
  // Pre-selected community when arriving from a community page (?community=…) skips
  // the chooser and goes straight to the composer scoped to that community.
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const preCommunity = params?.get("community") ?? "";
  // ?type=iso|poll|review|post deep-links straight into that composer (e.g. the
  // Market ISO Board's "Post ISO" button) — skips the chooser like preCommunity.
  const preTypeRaw = params?.get("type") ?? "";
  const preType = TYPES.some((t) => t.id === preTypeRaw) ? (preTypeRaw as ComposeType) : null;

  const [stage, setStage] = useState<"choose" | "compose">(preCommunity || preType ? "compose" : "choose");
  const [type, setType] = useState<ComposeType>(preType ?? "post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // Category targets the feed's interest scoring + Customize-feed filter. Optional —
  // a post with no category is "untagged" and always passes the category filter.
  const [category, setCategory] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [choices, setChoices] = useState(["", ""]);
  const [rating, setRating] = useState(0);
  const [isoItem, setIsoItem] = useState("");
  const [isoBudget, setIsoBudget] = useState("");
  const [isoConds, setIsoConds] = useState<string[]>(["Any"]);
  // "Post to" — feed + any joined communities (DF-30h). 'feed' is a sentinel id.
  const [postTo, setPostTo] = useState<string[]>(preCommunity ? [preCommunity] : ["feed"]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [publishing, setPublishing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => setCommunities((data ?? []).filter((c) => c.is_member)))
      .catch(console.error);
  }, []);

  async function handlePhotoFile(file: File) {
    if (!file.type.startsWith("image/") || images.length >= 6) return;
    setUploading(true);
    try {
      const meta = await api.post<UploadUrlResponse>(
        `/media/upload-url?prefix=posts&content_type=${encodeURIComponent(file.type)}`
      );
      await fetch(meta.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setImages((prev) => (prev.length < 6 ? [...prev, meta.public_url] : prev));
    } finally {
      setUploading(false);
    }
  }

  function addTag(t?: string) {
    const v = (t ?? tagInput).replace(/[^a-zA-Z0-9]/g, "");
    if (v && tags.length < 8 && !tags.includes(v)) setTags((ts) => [...ts, v]);
    setTagInput("");
  }
  const rmTag = (t: string) => setTags((ts) => ts.filter((x) => x !== t));
  const addEmoji = (e: string) => setBody((b) => (b + e).slice(0, BODY_MAX));

  function toggleIsoCond(c: string) {
    if (c === "Any") { setIsoConds(["Any"]); return; }
    setIsoConds((cs) => {
      const base = cs.filter((x) => x !== "Any" && x !== c);
      return cs.includes(c) ? (base.length ? base : ["Any"]) : [...base, c];
    });
  }

  function togglePostTo(id: string) {
    setPostTo((ps) =>
      ps.includes(id)
        ? (ps.length > 1 ? ps.filter((p) => p !== id) : ps) // keep at least one target
        : [...ps, id]
    );
  }

  const pollValid = choices.filter((c) => c.trim()).length >= 2;
  // QA 3.1 / 3.2 — ISO and Review posts require at least one photo.
  const photoRequired = type === "iso" || type === "review";
  const canPost =
    type === "poll" ? Boolean(body.trim()) && pollValid :
    type === "review" ? rating > 0 && Boolean(title.trim() || body.trim()) && images.length > 0 :
    type === "iso" ? isoItem.trim().length > 0 && images.length > 0 :
    Boolean(title.trim() || body.trim() || images.length > 0);

  // Any selected approval-mode community → the post waits for a mod there.
  const approvalNote = communities.some(
    (c) => postTo.includes(c.id) && c.post_mode === "approval"
  );

  const publish = async () => {
    if (!canPost || publishing) return;
    setPublishing(true);
    try {
      const targetCommunities = postTo.filter((p) => p !== "feed");
      const pollOptions = type === "poll"
        ? Object.fromEntries(choices.filter((c) => c.trim()).map((c) => [c.trim(), 0]))
        : null;
      const res = await api.post<{ id: string; status?: string }>("/posts", {
        // "Post" maps to the generic showcase type the feed renders.
        type: type === "post" ? "showcase" : type,
        title: title.trim() || null,
        body: body.trim(),
        category,
        images: type === "poll" ? [] : images,
        tags,
        poll_options: pollOptions,
        review_rating: type === "review" ? rating : null,
        iso_item: type === "iso" ? isoItem.trim() : null,
        iso_budget: type === "iso" && isoBudget ? Math.round(Number(isoBudget) * 100) : null,
        iso_conditions: type === "iso" ? isoConds : [],
        communities: targetCommunities,
        community_id: targetCommunities[0] ?? null,
        to_feed: postTo.includes("feed"),
      });
      // DV6-04 — surface the XP earned (review +15; showcase/poll/ISO +25).
      fireXpToast(type === "review" ? 15 : 25);
      // Held for mod review and not on the feed → land the author in the community.
      if (res?.status === "pending" && targetCommunities[0]) {
        router.push(`/community/${targetCommunities[0]}`);
      } else {
        router.push("/feed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  // ── Stage 0 — choose Post vs Listing ──
  if (stage === "choose") {
    const OPTIONS = [
      { id: "post", label: "Add a Post", desc: "Showcase, ask, review or poll the community.", color: "var(--plum)", icon: Edit3 },
      { id: "listing", label: "Add an item", desc: "Add to your shelf — in hand, pre-order, or DB contribution.", color: "var(--stamp-red)", icon: TagIcon },
    ] as const;
    return (
      <div className="w-full max-w-[680px] flex flex-col" style={{ minHeight: "100vh", background: "var(--canvas)" }}>
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Close = return to wherever Create was opened from (market, profile, …);
                /feed only on a cold/deep-link entry with no in-app history. */}
            <button type="button" aria-label="Close" onClick={() => (window.history.length > 1 ? router.back() : router.push("/feed"))} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--slate-200)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>
              <X size={18} />
            </button>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Add</span>
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 13.5, color: "var(--ink-mute)", margin: "0 2px 14px" }}>What would you like to add?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => { if (o.id === "listing") router.push("/add/catalogue"); else setStage("compose"); }}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", cursor: "pointer", background: "var(--card-surface)", border: "1px solid var(--slate-200)", borderRadius: 16, padding: 16, boxShadow: "var(--card-shadow)" }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 13, background: o.color, color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <o.icon size={23} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>{o.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 2 }}>{o.desc}</div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--ink-faint)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 1 — the composer ──
  const placeholder = type === "poll"
    ? "Ask your question…"
    : type === "review"
      ? "What did you think? Build, value, would you buy again…"
      : "What's on your mind? Use # to tag topics.";

  const postToSummary = postTo.includes("feed") && postTo.length === 1
    ? "your feed"
    : postTo.includes("feed")
      ? `feed + ${postTo.length - 1} more`
      : `${postTo.length} ${postTo.length === 1 ? "community" : "communities"}`;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-10" style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setStage("choose")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--slate-200)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Add a post</span>
          <button onClick={publish} disabled={!canPost || publishing} style={{ height: 36, padding: "0 18px", borderRadius: 9, border: "none", background: canPost ? "var(--stamp-red)" : "var(--slate-100)", color: canPost ? "var(--paper)" : "var(--slate-400)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: canPost ? "pointer" : "not-allowed" }}>
            {publishing ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 20px 24px" }}>
        {/* type switch */}
        <Segmented value={type} onChange={setType} options={TYPES} />

        {/* author + destination summary */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
          <Avatar name="You" size={38} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            You<span style={{ color: "var(--ink-faint)", fontWeight: 400 }}> · {postToSummary}</span>
          </div>
        </div>

        {/* title — all types incl. ISO (v4 ComposeOverlay shows the title field for ISO too, DV4-07e) */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "poll" ? "Poll title (optional)" : "Add a title"}
          style={{ width: "100%", boxSizing: "border-box", marginTop: 14, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", color: "var(--ink)" }}
        />

        {/* review stars */}
        {type === "review" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px" }}>
            <StarPicker value={rating} onChange={setRating} />
            <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{rating ? `${rating} / 5` : "Tap to rate"}</span>
          </div>
        )}

        {/* body + emoji + counter — all types except ISO. For ISO the body holds the
            optional "Extra details" and is rendered (labeled) inside the ISO block below,
            matching design_v4's ComposeOverlay layout (item → budget/condition → details). */}
        {type !== "iso" && (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
              rows={type === "poll" ? 2 : 4}
              placeholder={placeholder}
              style={{ width: "100%", boxSizing: "border-box", marginTop: 8, border: "none", outline: "none", resize: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.55, color: "var(--ink)" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setShowEmoji((v) => !v)}
                aria-label="Add emoji"
                style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 11px", borderRadius: 9, border: `1px solid ${showEmoji ? "var(--ink)" : "var(--border-strong)"}`, background: showEmoji ? "var(--bone)" : "var(--paper-soft)", color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13 }}
              >
                <Smile size={15} />Emoji
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: body.length > BODY_MAX - 60 ? "var(--stamp-red)" : "var(--ink-ghost)" }}>
                {body.length}/{BODY_MAX}
              </span>
            </div>
            {showEmoji && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, padding: 10, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12 }}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => addEmoji(e)} style={{ width: 38, height: 38, borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ISO fields — what you're looking for + budget + condition (v4 places these after the body) */}
        {type === "iso" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <SectionLabel>What are you looking for? *</SectionLabel>
              <input
                value={isoItem}
                onChange={(e) => setIsoItem(e.target.value)}
                placeholder="e.g. Hot Toys Iron Man Mark III"
                style={{ width: "100%", boxSizing: "border-box", marginTop: 8, height: 44, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <SectionLabel>Max budget</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, height: 44, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
                  <span style={{ fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                  <input
                    type="number"
                    value={isoBudget}
                    onChange={(e) => setIsoBudget(e.target.value)}
                    placeholder="Any"
                    style={{ flex: 1, width: 0, border: "none", background: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 14.5, color: "var(--ink)" }}
                  />
                </div>
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <SectionLabel>Condition</SectionLabel>
                <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                  {CONDITIONS.map((c) => {
                    const on = isoConds.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleIsoCond(c)}
                        style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${on ? "var(--stamp-red)" : "var(--border-strong)"}`, background: on ? "var(--stamp-red)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <SectionLabel>Extra details (optional)</SectionLabel>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                rows={3}
                placeholder="Variant, colourway, packaging notes…"
                style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: "10px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", resize: "none" }}
              />
            </div>
          </div>
        )}

        {/* poll choices */}
        {type === "poll" && (
          <div style={{ marginTop: 6 }}>
            <SectionLabel>Choices</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {choices.map((ch, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    value={ch}
                    onChange={(e) => setChoices((cs) => cs.map((c, j) => (j === i ? e.target.value : c)))}
                    placeholder={`Choice ${i + 1}`}
                    style={{ flex: 1, height: 42, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }}
                  />
                  {choices.length > 2 && (
                    <button onClick={() => setChoices((cs) => cs.filter((_, j) => j !== i))} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {choices.length < 5 && (
              <button onClick={() => setChoices((cs) => [...cs, ""])} style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 0 }}>
                <Plus size={17} />Add choice
              </button>
            )}
            {!pollValid && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>A poll needs at least two choices.</div>}
          </div>
        )}

        {/* images — all types except Poll (6 max, horizontal strip; v4 shows the strip for ISO too) */}
        {type !== "poll" && (
          <div style={{ marginTop: 12 }}>
            {photoRequired && (
              <div style={{ marginBottom: 8 }}>
                <SectionLabel>Photo *</SectionLabel>
                {images.length === 0 && (
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 4 }}>
                    Add at least one photo to {type === "iso" ? "post an ISO" : "post a review"}.
                  </div>
                )}
              </div>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { Array.from(e.target.files ?? []).forEach(handlePhotoFile); e.target.value = ""; }} />
            <div style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 4 }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 12, display: "block" }} />
                  <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label="Remove" style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", cursor: "pointer", background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={11} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <button onClick={() => photoInputRef.current?.click()} disabled={uploading} style={{ width: 84, height: 84, flexShrink: 0, borderRadius: 12, cursor: uploading ? "wait" : "pointer", border: "1px dashed var(--border-strong)", background: "var(--paper-soft)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--ink-mute)" }}>
                  <Camera size={20} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>{uploading ? "…" : "Photo"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* category — all types. Tunes feed interest scoring + the Customize-feed filter.
            Optional: tap again to deselect (post becomes untagged). */}
        <div style={{ marginTop: 18 }}><SectionLabel>Category</SectionLabel></div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
          {ADD_CATEGORIES.map((c) => {
            const on = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(on ? null : c.id)}
                style={{
                  padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${on ? "var(--stamp-red)" : "var(--border-strong)"}`,
                  background: on ? "var(--stamp-red)" : "var(--paper-soft)",
                  color: on ? "var(--paper)" : "var(--ink)",
                  fontFamily: "var(--font-body)", fontWeight: on ? 700 : 500, fontSize: 13, whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* hashtags — all types */}
        <div style={{ marginTop: 18 }}><SectionLabel>Hashtags</SectionLabel></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, height: 44, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--ink-faint)" }}>#</span>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addTag(); } }}
            placeholder="Add a tag — e.g. HotToys"
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)" }}
          />
          {tagInput.trim() && <button onClick={() => addTag()} style={{ background: "none", border: "none", color: "var(--stamp-red)", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>Add</button>}
        </div>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
            {tags.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 7px 5px 11px", borderRadius: 999, background: "var(--slate-800)", color: "var(--paper)", fontSize: 12.5, fontWeight: 600 }}>
                #{t}
                <button onClick={() => rmTag(t)} aria-label="Remove tag" style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.22)", color: "var(--paper)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
          {TAG_SUGGEST.filter((t) => !tags.includes(t)).map((t) => (
            <button key={t} onClick={() => addTag(t)} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "5px 11px", borderRadius: 999, background: "var(--paper-soft)", border: "1px solid var(--border-strong)", color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
              <span style={{ color: "var(--ink-faint)" }}>#</span>{t}
            </button>
          ))}
        </div>

        {/* post to — multi-select feed + communities */}
        <div style={{ marginTop: 20 }}><SectionLabel>Post to</SectionLabel></div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
          <PostToChip active={postTo.includes("feed")} onClick={() => togglePostTo("feed")}>Your feed</PostToChip>
          {communities.map((c) => (
            <PostToChip key={c.id} active={postTo.includes(c.id)} onClick={() => togglePostTo(c.id)}>{c.name}</PostToChip>
          ))}
        </div>
        {approvalNote && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink-faint)", lineHeight: 1.5 }}>
            Some selected communities review posts before they appear.
          </div>
        )}
      </div>
    </div>
  );
}

function PostToChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, cursor: "pointer",
        border: `1px solid ${active ? "var(--stamp-red)" : "var(--border-strong)"}`,
        background: active ? "var(--stamp-red)" : "var(--paper-soft)",
        color: active ? "var(--paper)" : "var(--ink)",
        fontFamily: "var(--font-body)", fontWeight: active ? 700 : 500, fontSize: 13, whiteSpace: "nowrap",
      }}
    >
      {active && <Check size={13} strokeWidth={3} />}{children}
    </button>
  );
}
