"use client";

// Create / Compose — design feedback round 3 (DF-30). Single-window composer:
// a Segmented type switch (Post · ISO · Poll · Review), optional title, body + emoji +
// char counter, per-type fields (ISO form / poll choices / review StarPicker), a 6-image
// strip, hashtag entry, and a multi-select "Post to" (feed + communities, DF-30h).
//
// The "Post or Add item?" chooser that used to sit in front of this screen is GONE
// (Change Spec §1.1). Create now opens straight on the four post types, so there is no
// stage machine left and Close always LEAVES the composer — there is nothing behind it
// to fall back to. Adding an item to the DB is its own flow, reached from the Database
// tab's three entry points, not from a fork inside Create.

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Check, Camera, Plus, Smile, Star, ChevronDown, Tag, Search } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { Avatar, Segmented, SectionLabel } from "@/components/ui";
import { fireToast, fireXpToast } from "@/components/gamification";
import { ADD_CATEGORIES } from "@/lib/catalog";
import { invalidateFeedSnapshot } from "@/lib/feedSnapshot";

type ComposeType = "post" | "iso" | "poll" | "review";

const TYPES: { id: ComposeType; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "iso", label: "ISO" },
  { id: "poll", label: "Poll" },
  { id: "review", label: "Review" },
];

const BODY_MAX = 600;
const EMOJIS = ["😍", "🔥", "🤩", "😎", "🥹", "👀", "🙌", "👏", "💎", "🏆", "📦", "🚀", "✨", "❤️", "🤝", "💰", "🫡", "🧩", "🎯", "😱"];
// Single choice per design_v7 — a dropdown, not multi-select chips. "Any" = no restriction.
const CONDITIONS = ["Any", "Sealed", "MIB", "BIB", "Loose"];

interface UploadUrlResponse { upload_url: string; key: string; public_url: string; }

// design_v8 — "Tag item": link a post to a catalogue entry. Same /catalogue/search
// endpoint (and hit shape) the add-item SearchStep uses.
interface CatalogueHit {
  sku: string; title: string; brand: string; category?: string;
  pending?: boolean; is_verified?: boolean;
}

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

function ComposePage() {
  const router = useRouter();
  // useSearchParams, NOT window.location — the latter is undefined during SSR, so a
  // ?type= deep link rendered the CHOOSER on the server and only corrected on hydration
  // (a visible flash of the screen the deep link exists to skip). Same pattern as
  // /add/catalogue; it's why this component sits under a Suspense boundary below.
  const params = useSearchParams();
  // Pre-selected community when arriving from a community page (?community=…) skips
  // the chooser and goes straight to the composer scoped to that community.
  const preCommunity = params.get("community") ?? "";
  // ?type=iso|poll|review|post picks the starting tab of the type switch (the Create
  // button sends `post`, the Market ISO Board's "Post ISO" sends `iso`). Anything else —
  // including a bare /compose — lands on Post, since there is no chooser to fall back to.
  const preTypeRaw = params.get("type") ?? "";
  const preType = TYPES.some((t) => t.id === preTypeRaw) ? (preTypeRaw as ComposeType) : null;

  const [type, setType] = useState<ComposeType>(preType ?? "post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // QA2 — at least one category is now MANDATORY (an untagged post breaks the feed's
  // category filter). Multi-select is allowed — a post can be relevant to several
  // categories; the first pick is the primary the feed filters/scores on.
  const [categories, setCategories] = useState<string[]>([]);
  const toggleCategory = (id: string) =>
    setCategories((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [choices, setChoices] = useState(["", ""]);
  const [rating, setRating] = useState(0);
  const [isoItem, setIsoItem] = useState("");
  const [isoBudget, setIsoBudget] = useState("");
  // Single acceptable condition ("Any" = no restriction) — design_v7 uses a dropdown.
  const [isoCond, setIsoCond] = useState("Any");
  // "Post to" — feed + any joined communities (DF-30h). 'feed' is a sentinel id.
  const [postTo, setPostTo] = useState<string[]>(preCommunity ? [preCommunity] : ["feed"]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [showPostTo, setShowPostTo] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // design_v8 (ComposeOverlay) — tag a database item. Required for reviews (the
  // backend 422s a review without ref_sku), optional everywhere else.
  const [refItem, setRefItem] = useState<CatalogueHit | null>(null);
  const [showItem, setShowItem] = useState(false);
  const [itemQ, setItemQ] = useState("");
  const [itemHits, setItemHits] = useState<CatalogueHit[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  const itemDeb = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced catalogue search — same call/params as /add/catalogue's SearchStep
  // (280ms, min 3 chars), trimmed to the top 6 per design_v8.
  useEffect(() => {
    if (itemDeb.current) clearTimeout(itemDeb.current);
    const query = itemQ.trim();
    itemDeb.current = setTimeout(async () => {
      if (query.length < 3) { setItemHits([]); setItemLoading(false); return; }
      setItemLoading(true);
      try {
        const data = await api.get<{ hits: CatalogueHit[] }>(`/catalogue/search?q=${encodeURIComponent(query)}`);
        setItemHits(data.hits.slice(0, 6));
      } catch { setItemHits([]); } finally { setItemLoading(false); }
    }, 280);
    return () => { if (itemDeb.current) clearTimeout(itemDeb.current); };
  }, [itemQ]);

  function pickItem(h: CatalogueHit) {
    setRefItem(h);
    setShowItem(false);
    setItemQ("");
    setItemHits([]);
    // v8: an ISO adopts the tagged item's title, and the entry's category joins the
    // post's categories (only if it maps onto the app's category set).
    if (type === "iso") setIsoItem(h.title);
    if (h.category && ADD_CATEGORIES.some((c) => c.id === h.category)) {
      setCategories((cs) => (cs.includes(h.category!) ? cs : [...cs, h.category!]));
    }
  }
  const untagItem = () => { setRefItem(null); setShowItem(false); };

  // Switching to ISO after tagging still prefills the (required) item field —
  // publish sends the tagged title either way, so the form must not look empty.
  function switchType(t: ComposeType) {
    setType(t);
    if (t === "iso" && refItem) setIsoItem((v) => (v.trim() ? v : refItem.title));
  }

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => setCommunities((data ?? []).filter((c) => c.is_member)))
      .catch(console.error);
  }, []);

  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePhotoFile(file: File) {
    if (!file.type.startsWith("image/") || images.length >= 6) return;
    setUploading(true);
    setUploadError(null);
    try {
      const meta = await api.post<UploadUrlResponse>(
        `/media/upload-url?prefix=posts&content_type=${encodeURIComponent(file.type)}`
      );
      // fetch only rejects on a NETWORK error, not on a 4xx/5xx — so an R2 403 (bad CORS,
      // signature or creds) would otherwise be swallowed and the photo silently dropped.
      const res = await fetch(meta.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error(`Storage rejected the upload (HTTP ${res.status})`);
      setImages((prev) => (prev.length < 6 ? [...prev, meta.public_url] : prev));
    } catch (e) {
      // A CORS-blocked PUT throws a generic "Failed to fetch" — call that out explicitly.
      const msg = e instanceof Error ? e.message : "Upload failed";
      setUploadError(/failed to fetch/i.test(msg) ? "Upload blocked — check the image server (R2/CORS) setup." : msg);
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
  // QA2 — every post/ISO/poll/review needs at least one category so the feed filter works.
  const categoryOk = categories.length > 0;
  const canPost = categoryOk && (
    // design_v8 — a review must be tagged to a database item (server 422s without it).
    type === "poll" ? Boolean(body.trim()) && pollValid :
    type === "review" ? rating > 0 && refItem !== null && Boolean(title.trim() || body.trim()) && images.length > 0 :
    type === "iso" ? (refItem !== null || isoItem.trim().length > 0) && images.length > 0 :
    Boolean(title.trim() || body.trim() || images.length > 0)
  );

  // Any selected approval-mode community → the post waits for a mod there.
  const approvalNote = communities.some(
    (c) => postTo.includes(c.id) && c.post_mode === "approval"
  );

  const publish = async () => {
    if (!canPost || publishing) return;
    // Client-side gate mirrors the server's 422 for untagged reviews (design_v8).
    if (type === "review" && !refItem) { fireToast("Reviews must be tagged to a database item"); return; }
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
        // Primary category (first selected) is what the feed filters/scores on.
        category: categories[0],
        images: type === "poll" ? [] : images,
        tags,
        poll_options: pollOptions,
        review_rating: type === "review" ? rating : null,
        // v8 — every type carries the tagged SKU; an ISO uses the tagged item's title
        // when one is set (the field is prefilled on pick, but the tag stays canonical).
        ref_sku: refItem?.sku ?? null,
        iso_item: type === "iso" ? (refItem?.title ?? isoItem.trim()) : null,
        iso_budget: type === "iso" && isoBudget ? Math.round(Number(isoBudget) * 100) : null,
        iso_condition: type === "iso" ? isoCond : null,
        communities: targetCommunities,
        community_id: targetCommunities[0] ?? null,
        to_feed: postTo.includes("feed"),
      });
      // The feed's restore snapshot predates this post, so leaving it in place would
      // send the author back to a list their own post isn't in until the 5-min TTL
      // lapsed (founder QA 2026-08-05). Drop it so /feed fetches fresh.
      invalidateFeedSnapshot();
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
      // Surface the server's message (422 untagged review / 404 unknown sku) instead
      // of failing silently — the api client rethrows the backend `detail` string.
      fireToast(e instanceof Error && e.message ? e.message : "Couldn't publish — try again");
    } finally {
      setPublishing(false);
    }
  };

  const placeholder = type === "poll"
    ? "Ask your question…"
    : type === "review"
      ? "What did you think? Build, value, would you buy again…"
      : "What's on your mind? Use # to tag topics.";

  const postToSummary = postTo.includes("feed") && postTo.length === 1
    ? "Your feed"
    : postTo.includes("feed")
      ? `Feed + ${postTo.length - 1} more`
      : `${postTo.length} ${postTo.length === 1 ? "community" : "communities"}`;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-10" style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Spec §1.1 — Back CLOSES the composer. With the chooser gone there is no screen
              behind this one, so it returns to wherever Create was opened from (feed, market,
              a community…), or /feed on a cold deep-link entry with no in-app history. */}
          <button
            aria-label="Close"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/feed"))}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--slate-200)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Create a post</span>
          <button onClick={publish} disabled={!canPost || publishing} style={{ height: 36, padding: "0 18px", borderRadius: 9, border: "none", background: canPost ? "var(--stamp-red)" : "var(--slate-100)", color: canPost ? "var(--paper)" : "var(--slate-400)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: canPost ? "pointer" : "not-allowed" }}>
            {publishing ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 20px 24px" }}>
        {/* type switch */}
        <Segmented value={type} onChange={switchType} options={TYPES} />

        {/* author + audience — the destination is a TAPPABLE PILL here (design_v7), not a
            read-only line with a separate "Post to" section further down the form. That
            was the same control stated twice, and the one you could actually use was the
            one furthest from the thing it described. */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
          <Avatar name="You" size={38} />
          <button
            onClick={() => setShowPostTo((v) => !v)}
            aria-expanded={showPostTo}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--paper-soft)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "5px 10px 5px 12px", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{postToSummary}</span>
            <ChevronDown size={13} strokeWidth={2.4} style={{ color: "var(--ink-faint)", transform: showPostTo ? "rotate(180deg)" : "none", transition: "transform 140ms" }} />
          </button>
        </div>
        {showPostTo && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 8, border: "1px solid var(--border-strong)", borderRadius: 12, overflow: "hidden", background: "var(--paper-soft)" }}>
            {[{ id: "feed", name: "Your feed" }, ...communities.map((c) => ({ id: c.id, name: c.name }))].map((c, i) => {
              const on = postTo.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => togglePostTo(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 9, minHeight: 40, padding: "0 12px", border: "none", borderTop: i > 0 ? "1px solid var(--border)" : "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", textAlign: "left" }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${on ? "var(--stamp-red)" : "var(--border-strong)"}`, background: on ? "var(--stamp-red)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <Check size={11} strokeWidth={3} style={{ color: "var(--paper)" }} />}
                  </span>
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

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

        {/* body + emoji + counter — EVERY type, including ISO. design_v7 uses one body
            field throughout; ISO used to get a second, separately-labelled "Extra details"
            textarea bound to the same state, which was the same field twice. */}
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
              {/* design_v8 — Tag item: links the post to a catalogue entry. Required
                  for reviews (hence the "*"), optional for posts/polls/ISOs. */}
              <button
                onClick={() => setShowItem((v) => !v)}
                aria-label="Tag an item from the database"
                aria-expanded={showItem}
                style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 11px", borderRadius: 999, border: `1px solid ${showItem || refItem ? "var(--ink)" : "var(--border-strong)"}`, background: showItem || refItem ? "var(--bone)" : "var(--paper-soft)", color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap" }}
              >
                <Tag size={14} />{refItem ? "Item ✓" : type === "review" ? "Tag item *" : "Tag item"}
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

            {/* tagged item — picked state (photo-less: title + brand + untag X) */}
            {refItem && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Tagged from DB</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{refItem.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)" }}>{refItem.brand}</div>
                </div>
                <button onClick={untagItem} aria-label="Remove tagged item" style={{ width: 28, height: 28, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* tagged item — inline catalogue search */}
            {showItem && !refItem && (
              <div style={{ marginTop: 8, border: "1px solid var(--border-strong)", borderRadius: 12, background: "var(--paper-soft)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 12px", borderBottom: "1px solid var(--border)" }}>
                  <Search size={15} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
                  <input
                    autoFocus
                    value={itemQ}
                    onChange={(e) => setItemQ(e.target.value)}
                    placeholder="Search the Scorred database…"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)" }}
                  />
                </div>
                {itemHits.map((h, i) => (
                  <button
                    key={h.sku}
                    onClick={() => pickItem(h)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 12px", border: "none", borderTop: i > 0 ? "1px solid var(--border)" : "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                        <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{h.brand}</span>
                        {h.pending && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--grail-gold-deep)" }}>Pending verification</span>}
                      </div>
                    </div>
                  </button>
                ))}
                {itemQ.trim().length >= 3 && !itemLoading && itemHits.length === 0 && (
                  <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Not in the database yet.</span>
                    <button onClick={() => router.push("/add/catalogue")} style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                      Add a new item
                    </button>
                  </div>
                )}
                {(itemLoading || itemQ.trim().length < 3) && itemHits.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12.5, color: "var(--ink-faint)" }}>
                    {itemLoading ? "Searching…" : "Type at least 3 characters to search."}
                  </div>
                )}
              </div>
            )}
        </>

        {/* ISO fields — what you're looking for + budget + condition */}
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
                {/* One choice, not several (design_v7). Every read path only ever
                    rendered a single chip, and the column is now a scalar. */}
                <select
                  value={isoCond}
                  onChange={(e) => setIsoCond(e.target.value)}
                  aria-label="Acceptable condition"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 8, height: 44, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none" }}
                >
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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
            {uploadError && (
              <div style={{ fontSize: 12, color: "var(--stamp-red)", marginTop: 8 }}>{uploadError}</div>
            )}
          </div>
        )}

        {/* category — MANDATORY (QA2), multi-select. Tunes feed interest scoring + the
            Customize-feed filter; a post can span several categories. */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 6 }}>
          <SectionLabel>Category</SectionLabel>
          <span style={{ color: categoryOk ? "var(--ink-ghost)" : "var(--stamp-red)", fontSize: 13, fontWeight: 700 }}>*</span>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", marginLeft: "auto" }}>Pick one or more</span>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
          {ADD_CATEGORIES.map((c) => {
            const on = categories.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
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
        {!categoryOk && (
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
            Add at least one category so your {type === "iso" ? "ISO" : "post"} shows up in the right feed filters.
          </div>
        )}

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
        {approvalNote && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink-faint)", lineHeight: 1.5 }}>
            Some selected communities review posts before they appear.
          </div>
        )}
      </div>
    </div>
  );
}

// useSearchParams must sit under a Suspense boundary for the production build
// (same wrapper as /add/catalogue).
export default function ComposePageWrapper() {
  return (
    <Suspense fallback={<div className="w-full max-w-[680px]" style={{ minHeight: "100vh", background: "var(--canvas)" }} />}>
      <ComposePage />
    </Suspense>
  );
}
