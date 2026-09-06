"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Tag, PlusCircle, Shield, Clock, Check, Eye, ChevronRight, Search, Sparkles, Info, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { fireXpToast, fireToast } from "@/components/gamification";
import { SectionLabel, ProductPhoto, CategoryChip } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyField, ReleaseWindowPicker } from "@/components/forms";
import {
  ADD_CATEGORIES, CAT_SCALES, CAT_BRANDS, CAT_META, symOf, formatMoney, buildPoEta, conditionsFor,
  TCG_LANGUAGES, TCG_PRODUCT_TYPES, GRADERS, isGradedCondition, type PoPrecision,
} from "@/lib/catalog";

// DV8 — two-step flow: pick (mode) → form. The old SearchStep screen is gone; catalogue
// de-dup is INLINE under the Title field (design_v8 AddListing.jsx:659-691).
type AcqMode = "inhand" | "preorder";
type ModeId = AcqMode | "intel";

interface CatalogueHit {
  sku: string; title: string; brand: string; category: string;
  scale?: string | null; thumbnail_url: string | null;
  year?: string | null; description?: string | null;
  est_retail_price?: number | null;
  pending?: boolean; score?: number | null; is_verified?: boolean;
}

// v8's fuzzy-resolve threshold — a top hit at/above it renders the gold
// "Possible duplicate" treatment (backend MATCH_HIGH is the same 0.7).
const STRONG_MATCH = 0.7;

// v8 "What are you adding?" mode picker (design_v8/app/AddListing.jsx → AcqModePicker),
// including the THIRD tile — DB Contribution — which routes to /add/database.
const ACQ_MODES: {
  id: ModeId; label: string; desc: string; detail: string;
  color: string; bg: string; border: string; Icon: typeof Check;
}[] = [
  { id: "inhand", label: "In Hand", desc: "You own this physically.",
    detail: "Condition grade, photos and purchase price. You can also list it for sale.",
    color: "var(--stamp-red)", bg: "var(--stamp-red-soft)", border: "var(--stamp-red)", Icon: Check },
  { id: "preorder", label: "Pre-order", desc: "Ordered, not arrived yet.",
    detail: "Track the release window, deposit paid and expected delivery.",
    color: "var(--grail-gold-deep)", bg: "var(--grail-gold-soft)", border: "var(--grail-gold)", Icon: Clock },
  { id: "intel", label: "DB Contribution", desc: "Spotted it? Help the community find it.",
    detail: "Share what you know — brand, scale and title. Other collectors can track, wishlist and discover it. Earns +50 XP if you're first to add it to Scorred.",
    color: "var(--verified-teal)", bg: "var(--verified-teal-soft)", border: "var(--verified-teal)", Icon: Eye },
];

function ModePicker({ onPick, onClose }: { onPick: (m: ModeId) => void; onClose: () => void }) {
  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} aria-label="Back" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}>
            <X size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>What are you adding?</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Choose one to continue</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 13 }}>
        {ACQ_MODES.map((m) => (
          <button key={m.id} type="button" onClick={() => onPick(m.id)} style={{
            display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 14px",
            background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 16,
            cursor: "pointer", textAlign: "left", width: "100%",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: m.color }}>
              <m.Icon size={20} color="var(--paper)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: m.color, marginBottom: 5 }}>{m.desc}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{m.detail}</div>
            </div>
            <ChevronRight size={18} style={{ color: m.color, flexShrink: 0, marginTop: 4 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px",
  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
};

// v8 shared Toggle — ON is FOREST green (design_v8 AddToCollection.jsx Toggle).
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} style={{
      width: 46, height: 27, borderRadius: 999, flexShrink: 0, cursor: "pointer", position: "relative",
      border: "none", background: on ? "var(--forest)" : "var(--bone-deep)", transition: "background 160ms",
    }}>
      <span style={{ position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms" }} />
    </button>
  );
}

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

function AddListingPageInner() {
  const router = useRouter();
  const { user } = useUser();

  // ?mode= or ?sku= deep-links skip straight to the form. useSearchParams (not
  // window.location) so an in-place navigation to /add/catalogue?sku=… still reacts
  // when the page component is already mounted (App Router reuses it).
  const searchParams = useSearchParams();
  const preMode = searchParams.get("mode");
  const skuParam = searchParams.get("sku");
  const initAcq: AcqMode = preMode === "preorder" ? preMode : "inhand";
  const [acq, setAcq] = useState<AcqMode>(initAcq);
  // DV8 — two steps only: pick → form. Any deep-link (?mode / ?sku / ?new=1) lands on
  // the form; catalogue de-dup happens inline under Title, not on a separate screen.
  const isNewEntry = searchParams.get("new") === "1";
  const [step, setStep] = useState<"pick" | "form">(
    skuParam || isNewEntry || preMode ? "form" : "pick"
  );

  const [cat, setCat] = useState("figures");
  const [photos, setPhotos] = useState<string[]>([]);
  // DV6-13 — per-photo "share to catalogue" visibility (parallel to photos). Private by default.
  const [photoPublic, setPhotoPublic] = useState<boolean[]>([]);
  // DV6-13 — when linked to an existing entry you inherit its shared reference image (shown
  // as the identity-card photo; no upload required). Cleared once you're adding a new entry.
  const [refImage, setRefImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [brandIsOther, setBrandIsOther] = useState(false);
  const [brandFocus, setBrandFocus] = useState(false);
  const [scale, setScale] = useState("");
  const [scaleOther, setScaleOther] = useState("");
  const [size, setSize] = useState("");
  // TCG spec (DV4-01b) — language / product type chips live in the scale slot.
  const [tcgLang, setTcgLang] = useState("");
  const [tcgFormat, setTcgFormat] = useState("");
  const [year, setYear] = useState("");
  const [desc, setDesc] = useState("");

  // Inline catalogue de-dup on Title (DV8, v8 AddListing.jsx) — debounced fuzzy search.
  const [dupes, setDupes] = useState<CatalogueHit[]>([]);
  const [linkedSku, setLinkedSku] = useState<string | null>(skuParam);
  // The linked entry's est_retail_price — anchors "MRP ~₹X" inside the asking price.
  const [linkedEst, setLinkedEst] = useState(0);
  // DV8 — identity card "Fix item details" reveal state.
  const [idOpen, setIdOpen] = useState(false);
  const dupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Brand combobox = canonical CAT_BRANDS ∪ distinct catalogue brands for the category (DV6-12).
  const [catBrands, setCatBrands] = useState<string[]>([]);

  // acquisition
  const [cond, setCond] = useState("");
  const [paid, setPaid] = useState("");
  const [paidCur, setPaidCur] = useState("INR");
  // DV8 grading details — shown when cat is tcg and condition is the graded id.
  const [grader, setGrader] = useState<string>("PSA");
  const [graderOther, setGraderOther] = useState("");
  const [grade, setGrade] = useState("");
  const [certNo, setCertNo] = useState("");
  // pre-order (DV4-03a)
  const [poPrec, setPoPrec] = useState<PoPrecision>("month");
  const [poDate, setPoDate] = useState("");
  const [poMonth, setPoMonth] = useState("");
  const [poQuarter, setPoQuarter] = useState("");
  const [poYear, setPoYear] = useState("2026");
  const [poSeller, setPoSeller] = useState("");
  const [poOrderDate, setPoOrderDate] = useState("");
  const [poTotal, setPoTotal] = useState("");
  const [poDeposit, setPoDeposit] = useState("");
  const poBalance = Math.max(0, (parseInt(poTotal, 10) || 0) - (parseInt(poDeposit, 10) || 0));

  // for sale — ?sell=1 (from an owned item's "Sell / Trade") lands with the toggle on.
  const [forSale, setForSale] = useState(searchParams.get("sell") === "1");
  const [price, setPrice] = useState("");
  const [priceCur, setPriceCur] = useState("INR");
  const [condNote, setCondNote] = useState("");
  const [shipIncl, setShipIncl] = useState(false);
  const [returns, setReturns] = useState(false);

  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scales = CAT_SCALES[cat];
  const usesScale = !!scales;
  const meta = CAT_META[cat] ?? CAT_META.figures;
  const canSell = acq === "inhand"; // pre-orders can't be listed
  const photoMax = 8; // DV8 — v8's in-hand cap (MAX_ITEM_PHOTOS server-side)
  // DV8 — linked to an existing catalogue entry: identity renders as the fixed summary
  // card; "Fix item details" reveals the editable fields (editing any of them unlinks).
  const identityFixed = !!linkedSku;
  const isGraded = acq === "inhand" && isGradedCondition(cat, cond);

  const brandQuickChips = useMemo(() => (CAT_BRANDS[cat] ?? CAT_BRANDS.figures).slice(0, 6), [cat]);
  const brandList = useMemo(() => {
    const canonical = CAT_BRANDS[cat] ?? CAT_BRANDS.figures;
    const seen = new Set(canonical.map((b) => b.toLowerCase()));
    const extra = catBrands.filter((b) => !seen.has(b.toLowerCase()));
    return [...canonical, ...extra];
  }, [cat, catBrands]);
  const brandMatches = useMemo(() => {
    const q = brand.trim().toLowerCase();
    if (!q) return brandList.slice(0, 6);
    return brandList.filter((b) => b.toLowerCase().includes(q)).slice(0, 6);
  }, [brand, brandList]);
  const exactBrand = brandList.some((b) => b.toLowerCase() === brand.trim().toLowerCase());

  // Brand suggestions: pull the catalogue's distinct brands for the category (DV6-12).
  useEffect(() => {
    let alive = true;
    api.get<{ brands: string[] }>(`/catalogue/brands?category=${encodeURIComponent(cat)}`)
      .then((d) => { if (alive) setCatBrands(d.brands || []); })
      .catch(() => { if (alive) setCatBrands([]); });
    return () => { alive = false; };
  }, [cat]);

  // Inline de-dup (DV8): title + category only, like v8's catTitleMatches — brand/scale
  // filters would hide weak matches the header exists to surface.
  useEffect(() => {
    if (dupDebounce.current) clearTimeout(dupDebounce.current);
    const q = title.trim();
    dupDebounce.current = setTimeout(async () => {
      if (linkedSku || q.length < 3) { setDupes([]); return; }
      try {
        const qs = new URLSearchParams({ q, category: cat });
        const data = await api.get<{ hits: CatalogueHit[] }>(`/catalogue/search?${qs.toString()}`);
        setDupes(data.hits.slice(0, 3));
      } catch { setDupes([]); }
    }, 300);
    return () => { if (dupDebounce.current) clearTimeout(dupDebounce.current); };
  }, [title, cat, linkedSku]);
  const strongMatch = dupes.length > 0 && (dupes[0].score ?? 0) >= STRONG_MATCH;
  // "New to Scorred DB" → +50 XP as first contributor (only when not linked to an existing SKU).
  const isNewToDb = !linkedSku && title.trim().length >= 5 && dupes.length === 0 && !!brand.trim();

  // Editing any identity field of a linked entry unlinks it — the shared record can't be
  // edited from here; your corrected facts become a fresh (server-de-duped) entry.
  const unlink = () => { setLinkedSku(null); setRefImage(null); setLinkedEst(0); };

  // Condition resets with the category — the vocabularies don't share ids (DV8-10).
  const changeCat = (id: string) => {
    setCat(id); setScale(""); setScaleOther(""); setSize(""); setBrand(""); setBrandIsOther(false);
    setTcgLang(""); setTcgFormat(""); setCond(""); setGrader("PSA"); setGraderOther(""); setGrade(""); setCertNo("");
    unlink();
  };

  // Tapping a de-dup row links the SKU and pre-fills the identity from the DB (v8:
  // "Linked to catalogue — pre-filled from DB").
  const linkDupe = (h: CatalogueHit) => {
    setLinkedSku(h.sku);
    setTitle(h.title);
    setBrand(h.brand);
    setBrandIsOther(!brandQuickChips.includes(h.brand));
    if (h.category) setCat(h.category);
    if (h.scale && h.scale !== "—") {
      if ((CAT_SCALES[h.category ?? cat] ?? []).includes(h.scale)) { setScale(h.scale); setScaleOther(""); }
      else { setScale("Other"); setScaleOther(h.scale); }
    }
    setYear(h.year ?? "");
    setDesc(h.description ?? "");
    setRefImage(h.thumbnail_url ?? null); // inherit the shared cover; upload optional
    setLinkedEst(h.est_retail_price ?? 0);
    setIdOpen(false);
    setDupes([]);
  };

  const miss = {
    // Inheriting the catalogue reference image satisfies the photo requirement (DV6-13).
    photo: photos.length === 0 && !refImage,
    title: !title.trim(),
    brand: !brand.trim(),
    // Identity linked to the DB never blocks on scale — the shared record owns that fact,
    // and the field may be hidden behind the summary card.
    scale: !identityFixed && usesScale && (scale === "Other" ? !scaleOther.trim() : !scale),
    cond: acq === "inhand" && !cond,
    price: canSell && forSale && !price.trim(),
  };
  const invalid = Object.values(miss).some(Boolean);
  const condLabel = (() => {
    if (isGraded) {
      const house = grader === "Other" ? (graderOther.trim() || "Graded") : grader;
      return grade ? `${house} ${grade}` : `${house} graded`;
    }
    return conditionsFor(cat).find((c) => c.id === cond)?.label ?? (acq === "preorder" ? "Pre-order" : "");
  })();
  const displayScale = usesScale ? (scale === "Other" ? scaleOther : scale) : size;

  const rmPhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPhotoPublic((v) => v.filter((_, idx) => idx !== i));
  };
  const togglePhotoPublic = (i: number) => setPhotoPublic((v) => v.map((x, idx) => (idx === i ? !x : x)));
  // Move photo i to the front so it becomes the cover (DV6-13).
  const makeCover = (i: number) => {
    if (i === 0) return;
    setPhotos((p) => { const n = [...p]; const [x] = n.splice(i, 1); n.unshift(x); return n; });
    setPhotoPublic((v) => { const n = [...v]; const [x] = n.splice(i, 1); n.unshift(x); return n; });
  };
  // A new entry's first photo is the mandatory public reference; a listed item's photos are
  // public by nature (it's a public sale); otherwise honor the per-photo toggle (DV6-13).
  const isPhotoPublic = (i: number) => (!linkedSku && i === 0) || forSale || !!photoPublic[i];

  // Return the flow to cold defaults (fresh mode picker) when the page is hidden — this
  // Next version keeps pages mounted (React Activity), so state would otherwise linger.
  const resetForm = () => {
    setStep("pick");
    setAcq("inhand");
    setCat("figures");
    setPhotos([]); setPhotoPublic([]); setRefImage(null);
    setTitle(""); setBrand(""); setBrandIsOther(false); setBrandFocus(false);
    setScale(""); setScaleOther(""); setSize("");
    setTcgLang(""); setTcgFormat("");
    setYear(""); setDesc("");
    setDupes([]); setLinkedSku(null); setLinkedEst(0); setIdOpen(false);
    setCond(""); setPaid(""); setPaidCur("INR");
    setGrader("PSA"); setGraderOther(""); setGrade(""); setCertNo("");
    setPoPrec("month"); setPoDate(""); setPoMonth(""); setPoQuarter(""); setPoYear("2026");
    setPoSeller(""); setPoOrderDate(""); setPoTotal(""); setPoDeposit("");
    setForSale(false); setPrice(""); setPriceCur("INR"); setCondNote("");
    setShipIncl(false); setReturns(false);
    setTried(false); setSubmitting(false); setError(null);
  };

  const submit = async () => {
    // DV8 — invalid submit keeps the CTA tappable and toasts, per v8.
    if (invalid) { setTried(true); fireToast("Fill the required fields marked *"); return; }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const isPreorder = acq === "preorder";
      const item = await api.post<{ id: string; db_new_xp?: number; catalogue_matched?: boolean; add_xp?: number; complete_xp?: number }>("/items", {
        sku: linkedSku ?? undefined,
        // DV8-10 — the stored id from the category's CAT_CONDITIONS vocabulary (in-hand only).
        condition: acq === "inhand" ? (cond || null) : null,
        custom_title: linkedSku ? undefined : title.trim(),
        // DV6-13 — when this add creates a NEW catalogue entry, the first photo is the
        // mandatory public reference image. Ignored server-side if it links to an existing SKU.
        cover_url: linkedSku ? undefined : (photos[0] ?? undefined),
        brand: brand.trim() || null,
        scale: usesScale ? (scale === "Other" ? scaleOther.trim() : scale) : (size.trim() || null),
        release_year: year ? Number(year) : null,
        description: desc.trim() || null,
        category: cat,
        status: isPreorder ? "preorder" : "owned",
        // `value` seeds catalogue.est_retail_price when this add creates a NEW entry;
        // in-hand adds pass what you paid (private).
        value: paid ? Number(paid) * 100 : 0,
        value_currency: paidCur,
        // TCG spec (DV4-01b) + DV8 grading card (condition = Graded drives the flag now).
        tcg_language: cat === "tcg" ? (tcgLang || null) : null,
        tcg_product_type: cat === "tcg" ? (tcgFormat || null) : null,
        tcg_graded: isGraded,
        tcg_grader: isGraded ? (grader === "Other" ? (graderOther.trim() || null) : grader) : null,
        tcg_grade: isGraded ? (grade || null) : null,
        tcg_cert_no: isGraded ? (certNo.trim() || null) : null,
        // pre-order financial layer (DV4-03a)
        preorder_eta: isPreorder ? buildPoEta(poPrec, { date: poDate, monthIdx: poMonth, quarter: poQuarter, year: poYear }) : null,
        preorder_window_precision: isPreorder ? poPrec : null,
        preorder_seller: isPreorder ? (poSeller.trim() || null) : null,
        preorder_ordered_at: isPreorder && poOrderDate ? poOrderDate : null,
        preorder_total: isPreorder && poTotal ? Number(poTotal) * 100 : null,
        preorder_deposit: isPreorder && poDeposit ? Number(poDeposit) * 100 : null,
      });
      // Attach uploaded photos (oldest-first = cover order). Personal photos are private by
      // default (DV6-13); the first photo of a NEW catalogue entry is the shared public reference.
      for (let idx = 0; idx < photos.length; idx++) {
        await api.post(`/items/${item.id}/photos?url=${encodeURIComponent(photos[idx])}${isPhotoPublic(idx) ? "&is_public=true" : ""}`);
      }
      // Surface what the server actually granted (0 when capped or deduped). All toasts
      // share one fixed slot, so later ones are staggered.
      const toasts: [number, string][] = [];
      if (item.add_xp && item.add_xp > 0) toasts.push([item.add_xp, "Added to collection"]);
      if (item.complete_xp && item.complete_xp > 0) toasts.push([item.complete_xp, "Item details complete"]);
      let slot = 0;
      if (item.db_new_xp && item.db_new_xp > 0) { fireXpToast(item.db_new_xp, "XP · added to Scorred DB"); slot = 1; }
      else if (item.catalogue_matched) { fireToast("Linked to an existing Scorred entry — no duplicate created"); slot = 1; }
      toasts.forEach(([xp, label], i) => {
        const delay = (slot + i) * 2400;
        if (delay === 0) fireXpToast(xp, label);
        else setTimeout(() => fireXpToast(xp, label), delay);
      });
      if (slot === 0 && toasts.length === 0) {
        fireToast(isPreorder ? "Pre-order saved to your collection" : "Added to your collection");
      }
      // Listing for sale is a publish action → go straight to the new live listing.
      if (canSell && forSale) {
        const listing = await api.post<{ id: string }>("/listings", {
          item_id: item.id,
          price: Number(price) * 100,
          currency: priceCur,
          condition: cond,
          condition_notes: condNote.trim() || null,
          // DV8 — v8 dropped the "Open to trades" row; always false on new listings.
          trade_willing: false,
          shipping_cost: 0,
          ships_from_city: user?.city ?? null,
          ships_nationwide: true,
          terms: [shipIncl ? "Shipping included" : null, returns ? "Returns accepted" : null].filter(Boolean) as string[],
        });
        router.push(`/listing/${listing.id}`);
        return;
      }
      // DV8 — v8 pops back with a toast; the success interstitial is gone.
      if (window.history.length > 1) router.back();
      else router.push(user ? `/profile/${user.handle}` : "/market");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the item");
      setSubmitting(false);
    }
  };

  // Stale deep links belong to the two purpose-built screens (QA 2026-08-05):
  //   ?mode=intel  -> /add/database   (contribute a catalogue entry)
  //   ?sku=…       -> /add/collection (add YOUR copy of an existing entry)
  useEffect(() => {
    if (preMode === "intel") router.replace("/add/database");
    else if (skuParam) router.replace(`/add/collection?sku=${encodeURIComponent(skuParam)}`);
  }, [preMode, skuParam, router]);

  // ?sku= deep-link fallback (while the redirect above resolves): fetch the entry and land
  // on the form prefilled + linked, same as tapping a de-dup row.
  useEffect(() => {
    if (!skuParam) return;
    let alive = true;
    api.get<CatalogueHit>(`/catalogue/${encodeURIComponent(skuParam)}`)
      .then((h) => { if (alive) linkDupe(h); })
      .catch(() => { if (alive) unlink(); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuParam]);

  // The add flow should start fresh every visit (pages stay mounted via React Activity).
  // Deep-linked entries (?sku / ?mode) are intentional prefilled flows — leave those.
  useLayoutEffect(() => {
    if (skuParam || preMode) return;
    return () => { resetForm(); };
  }, [skuParam, preMode]);

  if (step === "pick") {
    // Close = return to wherever the add flow was opened from (profile, compose, DB page);
    // /market only on a cold/deep-link entry with no in-app history.
    return <ModePicker onPick={(m) => {
      if (m === "intel") { router.push("/add/database"); return; }
      setAcq(m);
      if (m !== "inhand") setForSale(false);
      setStep("form");
    }} onClose={() => (window.history.length > 1 ? router.back() : router.push("/market"))} />;
  }

  const identityCard = identityFixed && (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
        <div style={{ width: 54, height: 54, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
          <ProductPhoto tone="ink" src={refImage ?? undefined} ratio="1/1" rounded={10} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{title || "Untitled item"}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-faint)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {[brand, displayScale || null, year || null].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "9px 2px 0" }}>
        <span style={{ fontSize: 11.5, color: "var(--ink-faint)", flex: 1, lineHeight: 1.45 }}>
          From the Scorred database — details below are about your copy.
        </span>
        <button type="button" onClick={() => setIdOpen((v) => !v)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>
          {idOpen ? "Hide item details" : "Fix item details"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* ?sku= / ?new=1 deep-links came from outside — back leaves the flow;
              otherwise back returns in-flow to the mode picker. */}
          <button onClick={() => (skuParam || isNewEntry || preMode ? router.back() : setStep("pick"))} aria-label="Back" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}>
            <ChevronRight size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Add an item</div>
            {/* Bare category label per v8 (AddListing.jsx:485 subtitle={meta.label}). */}
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{meta.label}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "4px 20px 16px" }}>
        {identityCard}

        {/* Identity — v8 field order: Category → Brand → Scale/TCG/Size → Title(+dedup) → Year.
            Hidden behind the summary card once linked; "Fix item details" reveals it. */}
        {(!identityFixed || idOpen) && (
          <>
            {/* Category — shared CategoryChip (stamp-red active), singular chipLabel (DV8). */}
            <Label>Category</Label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {ADD_CATEGORIES.map((c) => (
                <CategoryChip key={c.id} active={cat === c.id} onClick={() => changeCat(c.id)}>{c.chipLabel}</CategoryChip>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", margin: "9px 2px 0", lineHeight: 1.5 }}>
              The form adapts to the category.
            </div>

            {/* Brand — 6 quick chips + "Other brand" combobox (v8 AddListing.jsx:545-596). */}
            <Label required missing={tried && miss.brand}>Brand</Label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {brandQuickChips.map((b) => (
                <CategoryChip key={b} active={brand === b && !brandIsOther} onClick={() => { setBrand(b); setBrandIsOther(false); setBrandFocus(false); unlink(); }}>{b}</CategoryChip>
              ))}
            </div>
            <div style={{ position: "relative", marginTop: 9 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, height: 42, padding: "0 12px", borderRadius: 11,
                border: `1px solid ${tried && miss.brand && (!brand.trim() || brandIsOther) ? "var(--stamp-red)" : brandIsOther && brand ? "var(--ink)" : "var(--border-strong)"}`,
                background: "var(--paper-soft)",
              }}>
                <Search size={15} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
                <input
                  value={brandIsOther ? brand : ""}
                  onFocus={() => { setBrandIsOther(true); setBrandFocus(true); }}
                  onBlur={() => setTimeout(() => setBrandFocus(false), 150)}
                  onChange={(e) => { setBrand(e.target.value); setBrandIsOther(true); unlink(); }}
                  placeholder="Other brand — search or type..."
                  style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)" }} />
                {brandIsOther && brand && (
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(""); setBrandIsOther(false); unlink(); }} aria-label="Clear brand"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 0 }}>
                    <X size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
              {brandFocus && brandIsOther && (brandMatches.length > 0 || (brand.trim().length > 1 && !exactBrand)) && (
                <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 20, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 11, overflow: "hidden", boxShadow: "var(--shadow-3)", maxHeight: 260, overflowY: "auto" }}>
                  {brandMatches.map((b) => (
                    <button key={b} type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(b); setBrandIsOther(true); setBrandFocus(false); unlink(); }} style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                      padding: "10px 13px", background: "transparent", border: "none", borderBottom: "1px solid var(--border)",
                    }}>
                      <Tag size={14} style={{ color: "var(--ink-faint)" }} />
                      <span style={{ fontSize: 14, color: "var(--ink)" }}>{b}</span>
                    </button>
                  ))}
                  {brand.trim().length > 1 && !exactBrand && (
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(brand.trim()); setBrandIsOther(true); setBrandFocus(false); }} style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                      padding: "10px 13px", background: "var(--verified-teal-soft)", border: "none",
                    }}>
                      <Plus size={14} strokeWidth={2.4} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: "var(--verified-teal)", fontWeight: 600 }}>Add &ldquo;{brand.trim()}&rdquo; as a new brand</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Scale (or TCG spec / Size for designer) */}
            {usesScale ? (
              <>
                <Label required missing={tried && miss.scale}>Scale</Label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {scales.map((s) => (
                    <CategoryChip key={s} active={scale === s} onClick={() => { setScale(s); unlink(); }}>{s}</CategoryChip>
                  ))}
                  <CategoryChip active={scale === "Other"} onClick={() => { setScale("Other"); unlink(); }}>+ Other</CategoryChip>
                </div>
                {scale === "Other" && (
                  <input value={scaleOther} onChange={(e) => { setScaleOther(e.target.value); unlink(); }} placeholder="e.g. 1/20, non-scale" style={{ ...fieldStyle, height: 42, fontSize: 14.5, marginTop: 9, borderColor: tried && miss.scale ? "var(--stamp-red)" : "var(--border-strong)" }} />
                )}
              </>
            ) : cat === "tcg" ? (
              <>
                <Label hint="optional">Language / Print</Label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {TCG_LANGUAGES.map((l) => (
                    <CategoryChip key={l} active={tcgLang === l} onClick={() => setTcgLang(tcgLang === l ? "" : l)}>{l}</CategoryChip>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>EN and JP are the most common prints — always specify.</div>

                <Label hint="optional">Product type</Label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {TCG_PRODUCT_TYPES.map((f) => (
                    <CategoryChip key={f} active={tcgFormat === f} onClick={() => setTcgFormat(tcgFormat === f ? "" : f)}>{f}</CategoryChip>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Label hint="optional">Size</Label>
                <input value={size} onChange={(e) => { setSize(e.target.value); unlink(); }} placeholder="e.g. 400% · 28 cm · 7 inch" style={{ ...fieldStyle, fontSize: 14.5 }} />
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Blind boxes don&rsquo;t use scale — note the height or % size instead.</div>
              </>
            )}

            {/* Title + inline catalogue de-dup (DV8, v8 AddListing.jsx:655-691) */}
            <Label required missing={tried && miss.title}>Title</Label>
            <input value={title} onChange={(e) => { setTitle(e.target.value); unlink(); }} placeholder={meta.titleEg} style={{ ...fieldStyle, borderColor: tried && miss.title ? "var(--stamp-red)" : "var(--border-strong)" }} />
            {!linkedSku && title.trim().length >= 3 && dupes.length > 0 && (
              <div style={{ marginTop: 7, borderRadius: 11, border: `1px solid ${strongMatch ? "var(--grail-gold)" : "var(--border-strong)"}`, overflow: "hidden", background: "var(--paper)" }}>
                <div style={{ padding: "7px 11px", background: strongMatch ? "var(--grail-gold-soft)" : "var(--bone)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
                  {strongMatch
                    ? <Info size={12} style={{ color: "var(--grail-gold-deep)", flexShrink: 0 }} />
                    : <Search size={12} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />}
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: strongMatch ? "var(--grail-gold-deep)" : "var(--ink-soft)" }}>
                    {strongMatch ? "Possible duplicate — is this the same item?" : "Similar items already in catalogue"}
                  </span>
                </div>
                {dupes.map((m, i) => (
                  <button key={m.sku} type="button" onMouseDown={(e) => { e.preventDefault(); linkDupe(m); }} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
                    padding: "9px 11px", background: "transparent", border: "none",
                    borderBottom: i < dupes.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ width: 34, height: 34, flexShrink: 0 }}>
                      <ProductPhoto tone="ink" src={m.thumbnail_url ?? undefined} ratio="1/1" rounded={7} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 1 }}>
                        {m.brand}{m.scale && m.scale !== "—" ? ` · ${m.scale}` : ""}
                        {m.pending && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--grail-gold-deep)", background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 4, padding: "1px 5px" }}>Pending verification</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isNewToDb && (
              <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 9, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)" }}>
                <Sparkles size={13} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--verified-teal)", fontWeight: 600 }}>New to Scorred DB — you&rsquo;ll earn +50 XP as first contributor</span>
              </div>
            )}

            <Label hint="optional">Release year</Label>
            <input value={year} onChange={(e) => { setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)); unlink(); }} inputMode="numeric" placeholder="e.g. 2022" style={{ ...fieldStyle, height: 42, fontSize: 14.5, fontFamily: "var(--font-mono)" }} />
          </>
        )}

        {/* v8 linked strip WITH the unlink X (AddListing.jsx:683-689). */}
        {linkedSku && (
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 9, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)" }}>
            <Check size={13} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--verified-teal)", fontWeight: 600 }}>Linked to catalogue — pre-filled from DB</span>
            <button type="button" onClick={unlink} aria-label="Unlink from catalogue" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", padding: 0, display: "flex", marginLeft: "auto" }}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Photos — v8 72px tile grid (AddListing.jsx:706-737); per-photo Public/Private +
            Set cover are ours and stay (privacy load-bearing), restyled into the grid. */}
        <Label required missing={tried && miss.photo} hint={photos.length ? `${photos.length} added` : "first = cover"}>Photos</Label>
        {refImage && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 10, borderRadius: 12, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", marginBottom: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={refImage} ratio="1/1" rounded={9} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--verified-teal)" }}>Using the catalogue image</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2, lineHeight: 1.45 }}>It&rsquo;s the shared cover for this item — no need to upload. Your own photos below stay private by default.</div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 4 }}>
          {photos.map((url, i) => (
            <div key={url} style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={url} ratio="1/1" rounded={10} />
              {i === 0 ? (
                <span title={!linkedSku ? "Cover — the shared public reference image for a new entry" : "Cover photo"} style={{ position: "absolute", bottom: 6, left: 6, background: "var(--ink)", color: "var(--paper)", fontWeight: 700, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 5px", borderRadius: 4 }}>
                  Cover
                </span>
              ) : (
                <>
                  <button type="button" onClick={() => togglePhotoPublic(i)} title={isPhotoPublic(i) ? "Shared to the catalogue — tap to make private" : "Private to you — tap to share to the catalogue"} style={{
                    position: "absolute", bottom: 5, left: 5, display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer",
                    background: isPhotoPublic(i) ? "var(--verified-teal)" : "rgba(15,23,42,0.72)", color: "var(--paper)",
                    fontWeight: 700, fontSize: 8, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 5px", borderRadius: 4, border: "none",
                  }}>
                    {isPhotoPublic(i) ? <><Eye size={8} /> Public</> : "Private"}
                  </button>
                  <button type="button" onClick={() => makeCover(i)} title="Make this the cover" style={{
                    position: "absolute", top: 5, left: 5, cursor: "pointer",
                    background: "rgba(15,23,42,0.72)", color: "var(--paper)", border: "none",
                    fontWeight: 700, fontSize: 8, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 5px", borderRadius: 4,
                  }}>Set cover</button>
                </>
              )}
              <button type="button" onClick={() => rmPhoto(i)} aria-label="Remove photo" style={{
                position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", cursor: "pointer",
                background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          ))}
          {photos.length < photoMax && (
            <ImageUploader
              tile
              bad={tried && miss.photo}
              multiple
              maxFiles={photoMax - photos.length}
              onUpload={(url) => { setPhotos((p) => [...p, url]); setPhotoPublic((v) => [...v, false]); }}
              label="Add"
            />
          )}
        </div>
        {!refImage && (
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "8px 2px 0", lineHeight: 1.5 }}>
            The <b style={{ color: "var(--ink)" }}>first photo is the cover</b> — it&rsquo;s public and represents this item in the Scorred catalogue. Your other photos stay private unless you flip them to Public.
          </div>
        )}

        <Label hint="optional">Description</Label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="What makes this one special? Accessories, edition, where you got it…" style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", fontSize: 14.5 }} />

        {/* In-hand: condition — v8 wrapping chips + one hint line below (AddListing.jsx:745-764). */}
        {acq === "inhand" && (
          <>
            <Label required missing={tried && miss.cond}>Condition</Label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {conditionsFor(cat).map((c) => {
                const on = cond === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                    display: "inline-flex", alignItems: "center", padding: "8px 13px", borderRadius: 10, cursor: "pointer",
                    background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                    border: `1px solid ${on ? "var(--ink)" : tried && miss.cond ? "var(--stamp-red)" : "var(--border-strong)"}`,
                    fontFamily: "var(--font-body)", fontWeight: on ? 700 : 500, fontSize: 13, whiteSpace: "nowrap", lineHeight: 1,
                  }}>{c.label}</button>
                );
              })}
            </div>
            {(() => {
              const picked = conditionsFor(cat).find((c) => c.id === cond);
              return picked?.hint ? <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>{picked.hint}</div> : null;
            })()}

            {/* DV8 grading details — tcg + Graded (AddListing.jsx:765-789). */}
            {isGraded && (
              <div style={{ marginTop: 12, padding: 13, borderRadius: 13, border: "1px solid var(--border-strong)", background: "var(--bone)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Grading details</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                  {GRADERS.map((g) => (
                    <CategoryChip key={g} active={grader === g} onClick={() => setGrader(g)}>{g}</CategoryChip>
                  ))}
                </div>
                {grader === "Other" && (
                  <input value={graderOther} onChange={(e) => setGraderOther(e.target.value.slice(0, 24))} placeholder="Grading company"
                    style={{ width: "100%", boxSizing: "border-box", marginTop: 10, height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }} />
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <div style={{ width: 96, flexShrink: 0 }}>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 5 }}>Grade</div>
                    <input value={grade} onChange={(e) => setGrade(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))} inputMode="decimal" placeholder="10"
                      style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--ink)", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 5 }}>Cert number</div>
                    <input value={certNo} onChange={(e) => setCertNo(e.target.value.toUpperCase())} placeholder="e.g. 78412095"
                      style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: "0.03em", color: "var(--ink)", outline: "none" }} />
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9, lineHeight: 1.45 }}>Buyers can verify the slab on the grader&rsquo;s site with this number.</div>
              </div>
            )}

            <Label hint="optional · private">What you paid</Label>
            <MoneyField value={paid} onChange={setPaid} cur={paidCur} onCur={setPaidCur} placeholder="Purchase price" />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Only you see this.</div>
          </>
        )}

        {/* Pre-order details — moved DOWN below the copy facts, per v8 (AddListing.jsx:797). */}
        {acq === "preorder" && (
          <div style={{ marginTop: 16, background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 14, padding: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
              <Clock size={16} style={{ color: "var(--grail-gold-deep)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--grail-gold-deep)" }}>Pre-order details</span>
            </div>

            <SectionLabel>Release window</SectionLabel>
            <div style={{ marginTop: 9 }}>
              <ReleaseWindowPicker prec={poPrec} onPrec={setPoPrec} date={poDate} onDate={setPoDate}
                monthIdx={poMonth} onMonth={setPoMonth} quarter={poQuarter} onQuarter={setPoQuarter} year={poYear} onYear={setPoYear} />
            </div>

            <div style={{ marginTop: 14 }}><SectionLabel>Seller / Store</SectionLabel></div>
            <input value={poSeller} onChange={(e) => setPoSeller(e.target.value)} placeholder="e.g. BBToyStore, Bangalore"
              style={{ ...fieldStyle, marginTop: 9, background: "var(--paper)", fontSize: 14.5 }} />

            <div style={{ display: "flex", gap: 11, marginTop: 14 }}>
              <div style={{ flex: 1 }}>
                <SectionLabel>Order date</SectionLabel>
                <input type="date" value={poOrderDate} onChange={(e) => setPoOrderDate(e.target.value)}
                  style={{ ...fieldStyle, marginTop: 9, background: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 13 }} />
              </div>
              <div style={{ flex: 1 }}>
                <SectionLabel>Total price (₹)</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 6, height: 46, marginTop: 9, padding: "0 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                  <input value={poTotal} onChange={(e) => setPoTotal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}><SectionLabel>Deposit paid (₹)</SectionLabel></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 46, marginTop: 9, padding: "0 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
              <input value={poDeposit} onChange={(e) => setPoDeposit(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--grail-gold)" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Balance due</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--stamp-red)" }}>₹{poBalance.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {/* For sale — in-hand items only */}
        {canSell ? (
          <div style={{ marginTop: 24, borderRadius: 16, border: `1px solid ${forSale ? "var(--stamp-red)" : "var(--border)"}`, background: forSale ? "var(--stamp-red-soft)" : "var(--paper-soft)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 15 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: forSale ? "var(--stamp-red)" : "var(--bone-deep)", color: forSale ? "var(--paper)" : "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Tag size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>List for sale</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>Show it in the Market — goes live instantly.</div>
              </div>
              <Toggle on={forSale} onClick={() => setForSale((v) => !v)} />
            </div>

            {forSale && (
              <div style={{ padding: "2px 15px 16px", borderTop: "1px solid var(--stamp-red)" }}>
                <Label required missing={tried && miss.price}>Asking price</Label>
                {/* DV8 — MRP anchor from the linked entry's est_retail_price, inside the field. */}
                <MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} bad={tried && miss.price} placeholder="Your price" big
                  trailing={linkedEst > 0 ? `MRP ~${formatMoney(linkedEst)}` : undefined} />

                <Label hint="optional">Condition notes</Label>
                <textarea value={condNote} onChange={(e) => setCondNote(e.target.value)} rows={2} placeholder="Box wear, paint, joints, what's included…" style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", fontSize: 14.5, background: "var(--paper)" }} />

                {/* Exactly two toggle rows — v8 dropped "Open to trades" (AddListing.jsx:876-879). */}
                <div style={{ marginTop: 12 }}>
                  {[
                    { k: "ship", title: "Shipping included", sub: "Price covers delivery — no extra at checkout", on: shipIncl, set: () => setShipIncl((v) => !v) },
                    { k: "ret", title: "Returns accepted", sub: "Buyer can return within a short window", on: returns, set: () => setReturns((v) => !v) },
                  ].map((row, i, arr) => (
                    <div key={row.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{row.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>{row.sub}</div>
                      </div>
                      <Toggle on={row.on} onClick={row.set} />
                    </div>
                  ))}
                </div>

                {/* Live market preview */}
                <Label>Market preview</Label>
                <div style={{ display: "flex", gap: 11, alignItems: "center", padding: 10, borderRadius: 13, background: "var(--paper)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 56, height: 56, flexShrink: 0 }}>
                    <ProductPhoto tone="ink" src={photos[0] ?? refImage ?? undefined} ratio="1/1" rounded={9} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title.trim() || "Your item title"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{symOf(priceCur)} {price ? Number(price).toLocaleString("en-IN") : "—"}</span>
                      {condLabel && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: "var(--bone)", color: "var(--ink-mute)", fontWeight: 600 }}>{condLabel}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 13, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                  <Shield size={15} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
                  <span>Listing goes live now. Add clear photos so buyers know exactly what they&rsquo;re getting.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 24, display: "flex", gap: 11, alignItems: "flex-start", padding: 15, borderRadius: 16, border: "1px solid var(--border)", background: "var(--paper-soft)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: "var(--bone-deep)", color: "var(--ink-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Tag size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Selling is off for pre-orders</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3, lineHeight: 1.45 }}>List it on the Market once it&rsquo;s in hand. For now it&rsquo;s saved to your collection as a pre-order.</div>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 16, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}
      </div>

      {/* ONE sticky footer CTA (DV8) — primary red only when listing for sale, else dark.
          Sits above the fixed BottomNav below lg. */}
      <div
        className="sticky z-10 bg-[var(--paper)] border-t border-[var(--border)] bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-0"
        style={{ padding: "11px 20px", marginTop: 6 }}
      >
        <button onClick={submit} disabled={submitting} type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          height: 48, borderRadius: 12, border: "none",
          background: forSale ? "var(--stamp-red)" : "var(--ink)", color: "var(--paper)",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
          cursor: submitting ? "wait" : "pointer", opacity: invalid ? 0.5 : 1,
        }}>
          {forSale ? <Tag size={18} /> : <PlusCircle size={18} />}
          {submitting ? "Saving…" : forSale ? "List in the Market" : "Add to my collection"}
        </button>
      </div>
    </div>
  );
}

// useSearchParams must sit under a Suspense boundary for the production build
// (missing-suspense-with-csr-bailout) — same pattern as /search.
export default function AddListingPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[680px]" style={{ padding: 20 }} />}>
      <AddListingPageInner />
    </Suspense>
  );
}
