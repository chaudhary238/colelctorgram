"use client";

// Create / Compose — DV8 design parity (design_v8/app/Overlays.jsx ComposeOverlay).
//
// Stage 0 "Create" chooser (Overlays.jsx:106-138) is BACK (P0-5): a bare /compose
// opens on "What would you like to create?" — plum "Create a Post" tile advances to
// the composer, red "Add an item" tile routes to the Database tab (/db). Deep links
// (?type= / ?community=) skip the chooser; only then does the header show an X that
// leaves the composer — otherwise the back-arrow returns to the chooser.
//
// Composer order follows v8: title → stars → body → tag chips ABOVE the hashtag
// input → toolbar (Emoji · Photo · Tag item · counter) → tagged-item card/search →
// emoji grid → ISO form → poll → image strip → Category LAST (now OPTIONAL — the
// QA2 mandatory-category gate is dropped per v8). Founder extra beyond v8: hashtag
// suggestions from /feed/tags + /search/trending while typing, and an ISO City
// input (iso_city, prefilled from the profile city).

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ArrowLeft, Check, Camera, PlusCircle, Star, ChevronDown, ChevronRight, Tag, Search, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity, refTone } from "@/components/cards";
import { useUser } from "@/lib/auth-context";
import { Avatar, Button, CategoryChip, ProductPhoto, Segmented, SectionLabel } from "@/components/ui";
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
// Single choice per design_v7 — a dropdown, not multi-select chips. Values are stored
// LOWERCASE (v8); "any" = no restriction (the backend nulls it out).
const CONDITIONS = [
  { value: "any", label: "Any" },
  { value: "sealed", label: "Sealed" },
  { value: "mib", label: "MIB" },
  { value: "bib", label: "BIB" },
  { value: "loose", label: "Loose" },
];

// v8 Data.jsx CATEGORIES — composer chips read the SINGULAR chipLabel, not the
// plural browse label. Local map so ADD_CATEGORIES stays the single source of ids.
const CHIP_LABELS: Record<string, string> = {
  figures: "Action Figure",
  diecast: "Diecast",
  kits: "Model Kits & Lego",
  designer: "Designer Toys & Blind Boxes",
  tcg: "Trading Cards (TCG)",
};

interface UploadUrlResponse { upload_url: string; key: string; public_url: string; }

// design_v8 — "Tag item": link a post to a catalogue entry. Same /catalogue/search
// endpoint (and hit shape) the add-item SearchStep uses.
interface CatalogueHit {
  sku: string; title: string; brand: string; category?: string;
  thumbnail_url?: string | null;
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

// Header shared by the chooser and the composer — v8 OverlayShell metrics:
// leading button 38px / r11 / icon 20, title 19px display-700.
function ComposeHeader({ leading, onLeading, title, trailing }: {
  leading: "back" | "close";
  onLeading: () => void;
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    /* DV8 §2#1 — safe-area top inset (v8 Overlays.jsx:9 pads the overlay header for the
       notch): on a standalone PWA the sticky header otherwise sits under the status bar.
       Same calc() pattern as /search's chrome. */
    <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "calc(8px + env(safe-area-inset-top)) 14px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40 }}>
        <button
          aria-label={leading === "back" ? "Back" : "Close"}
          onClick={onLeading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, border: "1px solid var(--slate-200)", background: "transparent", color: "var(--ink)", cursor: "pointer", flexShrink: 0 }}
        >
          {leading === "back" ? <ArrowLeft size={20} /> : <X size={20} />}
        </button>
        <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em" }}>{title}</span>
        {trailing}
      </div>
    </div>
  );
}

// ── Stage 0: "Create" chooser — v8 Overlays.jsx:106-138 ─────────
function CreateChooser({ onPost, onClose }: { onPost: () => void; onClose: () => void }) {
  const router = useRouter();
  const options = [
    {
      // DV8 §2#5 — v8's Icons.edit is the BARE pencil, not the boxed SquarePen.
      id: "post", label: "Create a Post", desc: "Showcase, ask, review or poll the community.",
      c: "var(--plum)", bg: "oklch(96% 0.02 300)", icon: <Pencil size={22} />,
      go: onPost,
    },
    {
      // DV8 §2#4 — typographic apostrophe (v8 Overlays.jsx:110).
      id: "item", label: "Add an item", desc: "Browse the database — add it there if it’s missing.",
      c: "var(--stamp-red)", bg: "var(--stamp-red-soft)", icon: <Tag size={22} />,
      go: () => router.push("/db"),
    },
  ];
  return (
    <>
      <ComposeHeader leading="close" onLeading={onClose} title="Create" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 13.5, color: "var(--ink-mute)", margin: "0 2px 14px" }}>What would you like to create?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {options.map((o) => (
            <button
              key={o.id}
              onClick={o.go}
              style={{ display: "flex", alignItems: "flex-start", gap: 14, width: "100%", textAlign: "left", cursor: "pointer", background: o.bg, border: `1.5px solid ${o.c}`, borderRadius: 16, padding: 16 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: o.c, color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {o.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: "var(--ink)" }}>{o.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.45 }}>{o.desc}</div>
              </div>
              <ChevronRight size={18} strokeWidth={2} style={{ color: o.c, flexShrink: 0, marginTop: 4 }} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function ComposePage() {
  const router = useRouter();
  const { user } = useUser();
  // useSearchParams, NOT window.location — the latter is undefined during SSR, so a
  // ?type= deep link rendered the CHOOSER on the server and only corrected on hydration
  // (a visible flash of the screen the deep link exists to skip). Same pattern as
  // /add/catalogue; it's why this component sits under a Suspense boundary below.
  const params = useSearchParams();
  // Pre-selected community when arriving from a community page (?community=…) skips
  // the chooser and goes straight to the composer scoped to that community.
  const preCommunity = params.get("community") ?? "";
  // ?type=iso|poll|review|post picks the starting tab of the type switch (the Create
  // button sends no type — that path lands on the chooser — while e.g. the Market ISO
  // Board's "Post ISO" deep-links ?type=iso straight into the composer).
  const preTypeRaw = params.get("type") ?? "";
  const preType = TYPES.some((t) => t.id === preTypeRaw) ? (preTypeRaw as ComposeType) : null;
  // Deep links skip the chooser; only then does the composer header close with an X.
  const deepLinked = preType !== null || Boolean(preCommunity);
  const [stage, setStage] = useState<"choose" | "compose">(deepLinked ? "compose" : "choose");

  const [type, setType] = useState<ComposeType>(preType ?? "post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // v8 — category is OPTIONAL (the QA2 mandatory gate is dropped). Multi-select is
  // allowed; the first pick is the primary the feed filters/scores on.
  const [categories, setCategories] = useState<string[]>([]);
  // QA #6 + founder 2026-09-14 — ISO and Review are SINGLE-select (one item, one
  // category; a tap swaps, re-tapping clears). Other types stay multi-select
  // with the user's latest tap leading (categories[0] is the persisted primary;
  // extra picks ride along as tags at publish).
  const singleCategory = type === "iso" || type === "review";
  const toggleCategory = (id: string) =>
    setCategories((cs) => {
      if (singleCategory) return cs[0] === id ? [] : [id];
      return cs.includes(id) ? cs.filter((x) => x !== id) : [id, ...cs];
    });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [choices, setChoices] = useState(["", ""]);
  const [rating, setRating] = useState(0);
  const [isoBudget, setIsoBudget] = useState("");
  // Single acceptable condition, lowercase values ("any" = no restriction).
  const [isoCond, setIsoCond] = useState("any");
  // DV8 P0-7 (founder request) — ISO city, prefilled from the profile city.
  // null = untouched → derives from user.city (which loads async), so no
  // prefill effect is needed; any edit (including clearing) takes over.
  const [isoCityEdit, setIsoCityEdit] = useState<string | null>(null);
  const isoCity = isoCityEdit ?? user?.city ?? "";
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

  // Hashtag suggestion pool (founder request beyond v8) — curated feed tags merged
  // with real trending hashtags, fetched once and cached in state. Terms are
  // normalised to the composer's bare-alphanumeric tag form ("#NewDrops" → "NewDrops").
  const [tagPool, setTagPool] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      api.get<{ tags: string[] }>("/feed/tags"),
      api.get<{ trending: { term: string; count: number }[] }>("/search/trending?limit=10"),
    ]).then(([curated, trending]) => {
      if (!alive) return;
      const raw: string[] = [];
      if (curated.status === "fulfilled") raw.push(...(curated.value.tags ?? []));
      if (trending.status === "fulfilled") raw.push(...(trending.value.trending ?? []).map((t) => t.term));
      const seen = new Set<string>();
      const pool: string[] = [];
      for (const t of raw) {
        const clean = t.replace(/[^a-zA-Z0-9]/g, "");
        if (clean && !seen.has(clean.toLowerCase())) { seen.add(clean.toLowerCase()); pool.push(clean); }
      }
      setTagPool(pool);
    });
    return () => { alive = false; };
  }, []);

  const tagSuggestions = useMemo(() => {
    const q = tagInput.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!q) return [];
    return tagPool
      .filter((t) => t.toLowerCase().startsWith(q) && !tags.some((x) => x.toLowerCase() === t.toLowerCase()))
      .slice(0, 6);
  }, [tagInput, tagPool, tags]);

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
    // post's categories (only if it maps onto the app's category set). The headline
    // field IS the "what are you looking for" (founder 2026-09-06) — fill if empty.
    if (type === "iso") setTitle((v) => (v.trim() ? v : h.title));
    if (h.category && ADD_CATEGORIES.some((c) => c.id === h.category)) {
      setCategories((cs) => {
        if (cs.includes(h.category!)) return cs;
        // Single-select types: the SKU's category only fills an EMPTY selection —
        // it never overrides or joins the user's own pick.
        if (singleCategory) return cs.length ? cs : [h.category!];
        return [...cs, h.category!];
      });
    }
  }
  const untagItem = () => { setRefItem(null); setShowItem(false); };

  // Switching to ISO after tagging still prefills the headline — publish sends
  // the tagged title either way, so the form must not look empty.
  function switchType(t: ComposeType) {
    setType(t);
    if (t === "iso" && refItem) setTitle((v) => (v.trim() ? v : refItem.title));
    // Entering a single-select type with several categories picked keeps only
    // the primary (the user's latest tap) — the rest silently drop.
    if (t === "iso" || t === "review") setCategories((cs) => cs.slice(0, 1));
  }

  useEffect(() => {
    api.get<ApiCommunity[]>("/communities?limit=50")
      .then((data) => {
        const mine = (data ?? []).filter((c) => c.is_member);
        setCommunities(mine);
        // QA #31 — composing FROM a community defaults the category to the
        // community's own (still changeable; only seeds an empty selection).
        const c = mine.find((x) => x.id === preCommunity);
        if (c?.category && ADD_CATEGORIES.some((x) => x.id === c.category)) {
          setCategories((cs) => (cs.length ? cs : [c.category]));
        }
      })
      .catch(console.error);
  }, [preCommunity]);

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
  const canPost =
    // design_v8 — a review must be tagged to a database item (server 422s without it).
    type === "poll" ? Boolean(body.trim()) && pollValid :
    type === "review" ? rating > 0 && refItem !== null && Boolean(title.trim() || body.trim()) && images.length > 0 :
    // v8 gates an ISO on the photo only — the item title is optional free text.
    type === "iso" ? images.length > 0 :
    Boolean(title.trim() || body.trim() || images.length > 0);

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
        // Primary category (the user's latest pick) is what the feed filters/
        // scores on. Optional per v8 — an uncategorised post skips the filters.
        category: categories[0] ?? null,
        images: type === "poll" ? [] : images,
        // QA #6 — extra category picks persist as tags (Post.category is a single
        // column), so multi-select finally survives the round-trip.
        tags: [
          ...tags,
          ...categories.slice(1)
            .map((c) => `#${(ADD_CATEGORIES.find((x) => x.id === c)?.chipLabel ?? c).replace(/[^A-Za-z0-9]/g, "")}`)
            .filter((t) => t.length > 1 && !tags.includes(t)),
        ],
        poll_options: pollOptions,
        review_rating: type === "review" ? rating : null,
        // v8 — every type carries the tagged SKU; an ISO uses the tagged item's title
        // when one is set (the field is prefilled on pick, but the tag stays canonical).
        // Founder 2026-09-06: the post TITLE and "what you're looking for" are ONE
        // field on an ISO — the headline input carries both.
        ref_sku: refItem?.sku ?? null,
        iso_item: type === "iso" ? ((refItem?.title ?? title.trim()) || null) : null,
        iso_budget: type === "iso" && isoBudget ? Math.round(Number(isoBudget) * 100) : null,
        iso_condition: type === "iso" ? isoCond : null,
        iso_city: type === "iso" ? (isoCity.trim() || null) : null,
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
      : type === "iso"
        ? "Variant, colourway, condition notes…"
        : "What's on your mind? Use # to tag topics.";

  const postToSummary = postTo.includes("feed") && postTo.length === 1
    ? "Your feed"
    : postTo.includes("feed")
      ? `Feed + ${postTo.length - 1} more`
      : `${postTo.length} ${postTo.length === 1 ? "community" : "communities"}`;

  // Leaves the composer entirely — back to wherever Create was opened from
  // (feed, market, a community…), or /feed on a cold deep-link with no history.
  const closeCompose = () => (window.history.length > 1 ? router.back() : router.push("/feed"));

  // DV8 §2#13 — the compose surface is PAPER (v8 Overlays.jsx:8 OverlayShell),
  // not the canvas grey: the composer is a sheet, not a feed.
  if (stage === "choose") {
    return (
      <div className="w-full max-w-[680px] flex flex-col pb-10" style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <CreateChooser onPost={() => setStage("compose")} onClose={closeCompose} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-10" style={{ background: "var(--paper)", minHeight: "100vh" }}>
      {/* DV8 §2#6 — the composer ALWAYS leads with a back-arrow (v8 Overlays.jsx:171):
          deep-linked (?type= / ?community=) it goes back to wherever Create was opened
          from; otherwise it pops to the Stage-0 chooser. Only the chooser closes with X. */}
      <ComposeHeader
        leading="back"
        onLeading={deepLinked ? closeCompose : () => setStage("choose")}
        title="Create a post"
        trailing={
          <button
            onClick={publish}
            disabled={!canPost || publishing}
            style={{ height: 34, padding: "0 14px", borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", opacity: !canPost || publishing ? 0.5 : 1, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: !canPost || publishing ? "not-allowed" : "pointer" }}
          >
            {publishing ? "Posting…" : "Post"}
          </button>
        }
      />

      <div style={{ padding: "14px 16px 24px" }}>
        {/* type switch */}
        <Segmented value={type} onChange={switchType} options={TYPES} />

        {/* author + audience — the destination is a tappable pill (design_v7/v8) */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
          <Avatar name={user?.name ?? "You"} color="var(--ink)" size={34} photo={user?.avatar_url} />
          <button
            onClick={() => setShowPostTo((v) => !v)}
            aria-expanded={showPostTo}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--paper-soft)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "5px 10px 5px 12px", cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{postToSummary}</span>
            {/* DV8 §2#10 — chevron 12/2.4 in ink like the label (v8 Overlays.jsx:182);
                the open/close rotation is a kept web affordance. */}
            <ChevronDown size={12} strokeWidth={2.4} style={{ color: "var(--ink)", transform: showPostTo ? "rotate(180deg)" : "none", transition: "transform 140ms" }} />
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

        {/* title — all types. On an ISO this IS the "what are you looking for"
            (founder 2026-09-06: one field, not two); it publishes as title + iso_item. */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "poll" ? "Poll title (optional)" : type === "iso" ? "What are you looking for?" : "Add a title"}
          style={{ width: "100%", boxSizing: "border-box", marginTop: 10, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", color: "var(--ink)" }}
        />

        {/* review stars */}
        {type === "review" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px" }}>
            <StarPicker value={rating} onChange={setRating} />
            <span style={{ fontSize: 12.5, color: "var(--ink-faint)", whiteSpace: "nowrap" }}>{rating ? `${rating} / 5` : "Tap to rate"}</span>
          </div>
        )}

        {/* body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
          rows={type === "poll" ? 2 : 3}
          placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box", marginTop: 6, border: "none", outline: "none", resize: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: 15.5, lineHeight: 1.5, color: "var(--ink)" }}
        />

        {/* hashtags — chips row ABOVE the input (v8: micro-label + horizontal scroll) */}
        {tags.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", marginTop: 4, paddingBottom: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-faint)", flexShrink: 0 }}>Tags</span>
            {tags.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 6px 5px 10px", flexShrink: 0, borderRadius: 999, background: "var(--ink)", color: "var(--paper)", fontSize: 12, fontWeight: 600 }}>
                #{t}
                <button onClick={() => rmTag(t)} aria-label="Remove tag" style={{ width: 16, height: 16, borderRadius: "50%", border: "none", background: "rgba(244,239,230,0.2)", color: "var(--paper)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={9} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, height: 32, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--ink-faint)" }}>#</span>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addTag(); } }}
            placeholder="Add a custom tag"
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)" }}
          />
          {tagInput.trim() && <button onClick={() => addTag()} style={{ background: "none", border: "none", color: "var(--stamp-red)", fontWeight: 600, fontSize: 12.5, cursor: "pointer", padding: 0 }}>Add</button>}
        </div>
        {/* hashtag suggestions (founder request beyond v8) — /feed/tags + /search/trending */}
        {tagSuggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {tagSuggestions.map((t) => (
              <button
                key={t}
                onClick={() => addTag(t)}
                style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* toolbar — Emoji · Photo · Tag item · char counter (v8) */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <button
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Add emoji"
            style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 9px", borderRadius: 8, border: `1px solid ${showEmoji ? "var(--ink)" : "var(--border-strong)"}`, background: showEmoji ? "var(--bone)" : "var(--paper-soft)", color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5 }}
          >
            <span style={{ fontSize: 14 }}>😊</span>Emoji
          </button>
          {type !== "poll" && (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={images.length >= 6 || uploading}
              aria-label="Add photo"
              style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", color: "var(--ink)", cursor: images.length >= 6 ? "default" : uploading ? "wait" : "pointer", opacity: images.length >= 6 ? 0.5 : 1, fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap" }}
            >
              <Camera size={14} />
              {uploading ? "Uploading…" : <>Photo{photoRequired && images.length === 0 ? " *" : ""}{images.length > 0 ? ` (${images.length})` : ""}</>}
            </button>
          )}
          <button
            onClick={() => setShowItem((v) => !v)}
            aria-label="Tag an item from the database"
            aria-expanded={showItem}
            style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 9px", borderRadius: 8, border: `1px solid ${showItem || refItem ? "var(--ink)" : "var(--border-strong)"}`, background: showItem || refItem ? "var(--bone)" : "var(--paper-soft)", color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, whiteSpace: "nowrap" }}
          >
            <Tag size={14} />{refItem ? "Item ✓" : type === "review" ? "Tag item *" : "Tag item"}
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: body.length > BODY_MAX - 60 ? "var(--stamp-red)" : "var(--ink-ghost)" }}>
            {body.length}/{BODY_MAX}
          </span>
        </div>

        {/* tagged item — picked state (42px catalogue thumb per v8) */}
        {refItem && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, padding: 9, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
            <div style={{ width: 42, height: 42, flexShrink: 0 }}>
              <ProductPhoto tone={refTone(refItem.sku)} src={refItem.thumbnail_url} ratio="1/1" rounded={9} />
            </div>
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

        {/* tagged item — inline catalogue search (34px thumbs per v8) */}
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
                <div style={{ width: 34, height: 34, flexShrink: 0 }}>
                  <ProductPhoto tone={refTone(h.sku)} src={h.thumbnail_url} ratio="1/1" rounded={8} />
                </div>
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
                <Button size="sm" variant="secondary" onClick={() => router.push("/add/catalogue")}>Add a new item</Button>
              </div>
            )}
            {(itemLoading || itemQ.trim().length < 3) && itemHits.length === 0 && (
              <div style={{ padding: 12, fontSize: 12.5, color: "var(--ink-faint)" }}>
                {itemLoading ? "Searching…" : "Type at least 3 characters to search."}
              </div>
            )}
          </div>
        )}

        {/* emoji grid */}
        {showEmoji && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, padding: 10, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12 }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => addEmoji(e)}
                style={{ width: 38, height: 38, borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", fontSize: 22, lineHeight: 1 }}
                onMouseEnter={(ev) => { ev.currentTarget.style.background = "var(--bone)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* ISO fields — v8 Overlays :300-320 single budget/condition row (the want's
            NAME lives in the headline field above) + the city row (founder-kept:
            Aug 16-24 action point, posts.iso_city — the prototype JSX lags it). */}
        {type === "iso" && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
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
                <select
                  value={isoCond}
                  onChange={(e) => setIsoCond(e.target.value)}
                  aria-label="Acceptable condition"
                  style={{ width: "100%", boxSizing: "border-box", marginTop: 8, height: 44, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none", appearance: "none", WebkitAppearance: "none" }}
                >
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            {/* DV8 P0-7 — where you want the item found/shipped from (posts.iso_city) */}
            <div>
              <SectionLabel>City</SectionLabel>
              <input
                value={isoCity}
                onChange={(e) => setIsoCityEdit(e.target.value)}
                placeholder="e.g. Mumbai / Anywhere in India"
                style={{ width: "100%", boxSizing: "border-box", marginTop: 8, height: 44, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }}
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
              <button onClick={() => setChoices((cs) => [...cs, ""])} style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>
                <PlusCircle size={17} />Add choice
              </button>
            )}
            {!pollValid && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>A poll needs at least two choices.</div>}
          </div>
        )}

        {/* images — compact 60px strip, rendered only once photos exist (v8);
            adding goes through the toolbar Photo button. */}
        {type !== "poll" && (
          <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { Array.from(e.target.files ?? []).forEach(handlePhotoFile); e.target.value = ""; }} />
        )}
        {type !== "poll" && images.length > 0 && (
          <div style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: 8, paddingBottom: 2 }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: "relative", width: 60, height: 60, flexShrink: 0, borderRadius: 10, overflow: "visible" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10, display: "block" }} />
                <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label="Remove" style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", cursor: "pointer", background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={9} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}
        {type !== "poll" && uploadError && (
          <div style={{ fontSize: 12, color: "var(--stamp-red)", marginTop: 8 }}>{uploadError}</div>
        )}

        {/* category — LAST and OPTIONAL (v8), shared chips with singular labels.
            ISO/Review are single-select (founder 2026-09-14); other types
            multi-select with categories[0] as the persisted primary. */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 7 }}>
          <SectionLabel>Category</SectionLabel>
          {singleCategory && <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>pick one</span>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
          {ADD_CATEGORIES.map((c) => (
            <CategoryChip key={c.id} active={categories.includes(c.id)} onClick={() => toggleCategory(c.id)}>
              {CHIP_LABELS[c.id] ?? c.label}
            </CategoryChip>
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

// useSearchParams must sit under a Suspense boundary for the production build
// (same wrapper as /add/catalogue).
export default function ComposePageWrapper() {
  return (
    <Suspense fallback={<div className="w-full max-w-[680px]" style={{ minHeight: "100vh", background: "var(--paper)" }} />}>
      <ComposePage />
    </Suspense>
  );
}
