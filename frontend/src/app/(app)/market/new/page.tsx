"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Tag, PlusCircle, Shield, Clock, Plus, Check, Eye, ChevronRight, Search, Sparkles, Info, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { fireXpToast, fireToast } from "@/components/gamification";
import { SectionLabel, ProductPhoto, CategoryChip } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyField, ReleaseWindowPicker } from "@/components/forms";
import {
  ADD_CATEGORIES, CAT_SCALES, CAT_BRANDS, CAT_META, symOf, buildPoEta,
  TCG_LANGUAGES, TCG_PRODUCT_TYPES, TCG_GRADERS, type PoPrecision,
} from "@/lib/catalog";

type AcqMode = "inhand" | "preorder" | "intel";

interface CatalogueHit {
  sku: string; title: string; brand: string; category: string;
  scale?: string | null; thumbnail_url: string | null;
  year?: string | null; description?: string | null;
  pending?: boolean; score?: number | null; is_official?: boolean;
}

// v6 "What are you adding?" mode picker (design_v6/app/AddListing.jsx → AcqModePicker).
const ACQ_MODES: {
  id: AcqMode; label: string; desc: string; detail: string;
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

function ModePicker({ onPick, onClose }: { onPick: (m: AcqMode) => void; onClose: () => void }) {
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

// DV6-13 — search-first step: find the item in the shared catalogue before adding. Picking a
// hit links the SKU (you inherit its reference image); "Add new" opens the full form.
function SearchStep({ onPick, onAddNew, onBack }: { onPick: (h: CatalogueHit) => void; onAddNew: () => void; onBack: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CatalogueHit[]>([]);
  const [loading, setLoading] = useState(false);
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (deb.current) clearTimeout(deb.current);
    const query = q.trim();
    deb.current = setTimeout(async () => {
      if (query.length < 3) { setHits([]); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await api.get<{ hits: CatalogueHit[] }>(`/catalogue/search?q=${encodeURIComponent(query)}`);
        setHits(data.hits.slice(0, 12));
      } catch { setHits([]); } finally { setLoading(false); }
    }, 280);
    return () => { if (deb.current) clearTimeout(deb.current); };
  }, [q]);

  const typed = q.trim().length >= 3;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}>
            <ChevronRight size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Find it in the catalogue</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Search first so we don&rsquo;t create a duplicate</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 14px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
          <Search size={18} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or brand…"
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)" }} />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 0 }}>
              <X size={15} />
            </button>
          )}
        </div>

        {typed && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {loading && hits.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-faint)", padding: "8px 2px" }}>Searching…</div>}
            {hits.map((h) => (
              <button key={h.sku} type="button" onClick={() => onPick(h)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
                background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12, padding: 10,
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <ProductPhoto tone="ink" src={h.thumbnail_url ?? undefined} ratio="1/1" rounded={8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{h.brand}{h.scale && h.scale !== "—" ? ` · ${h.scale}` : ""}</span>
                    {h.is_official
                      ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "var(--verified-teal)" }}><ShieldCheck size={10} />Official</span>
                      : h.pending
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: "var(--grail-gold-deep)" }}>Pending review</span>
                        : null}
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} />
              </button>
            ))}
            {!loading && hits.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--ink-faint)", padding: "8px 2px" }}>No matches in the catalogue.</div>
            )}
          </div>
        )}

        {/* Can't find it → add new (full form). The first photo you add becomes the shared reference. */}
        <button type="button" onClick={onAddNew} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, marginTop: 16,
          borderRadius: 12, border: "1px dashed var(--verified-teal)", background: "var(--verified-teal-soft)",
          color: "var(--verified-teal)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
        }}>
          <Plus size={17} />
          {typed ? `Can’t find it — add “${q.trim()}” as new` : "Not in the catalogue? Add it new"}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
          Adding new needs one photo — it becomes the shared reference and earns you <b style={{ color: "var(--verified-teal)" }}>+50 XP</b>.
        </div>
      </div>
    </div>
  );
}

// Condition ladder → canonical listing condition keys (CONDITION_LABEL in cards.tsx).
const CONDITIONS = [
  { id: "sealed_misb", label: "Sealed", sub: "Factory sealed, never opened" },
  { id: "mint", label: "MIB", sub: "Mint in box" },
  { id: "like_new", label: "BIB", sub: "Box in box / outer shipper kept" },
  { id: "good", label: "Loose", sub: "Out of box / displayed" },
];

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

export default function AddListingPage() {
  const router = useRouter();
  const { user } = useUser();

  // v6 mode picker (DV6-10). ?mode= or ?sku= (catalogue Sell) skip straight to the form.
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const preMode = params?.get("mode");
  const hasSku = !!params?.get("sku");
  const initAcq: AcqMode = preMode === "preorder" || preMode === "intel" ? preMode : "inhand";
  const [acq, setAcq] = useState<AcqMode>(initAcq);
  // DV6-13 — flow is pick (mode) → search (find in catalogue) → form. ?mode/?sku deep-links skip ahead.
  const [step, setStep] = useState<"pick" | "search" | "form">(hasSku ? "form" : preMode ? "search" : "pick");

  const [cat, setCat] = useState("figures");
  const [photos, setPhotos] = useState<string[]>([]);
  // DV6-13 — per-photo "share to catalogue" visibility (parallel to photos). Private by default.
  const [photoPublic, setPhotoPublic] = useState<boolean[]>([]);
  // DV6-13 — when you pick an existing item you inherit its shared reference image (shown as the
  // cover; no upload required). Cleared once you're adding a brand-new entry.
  const [refImage, setRefImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [brandFocus, setBrandFocus] = useState(false);
  const [scale, setScale] = useState("");
  const [scaleOther, setScaleOther] = useState("");
  const [size, setSize] = useState("");
  // TCG-specific (DV4-01b)
  const [tcgLang, setTcgLang] = useState("");
  const [tcgFormat, setTcgFormat] = useState("");
  const [tcgGraded, setTcgGraded] = useState(false);
  const [tcgGrader, setTcgGrader] = useState<string>("PSA");
  const [tcgGrade, setTcgGrade] = useState("");
  const [year, setYear] = useState("");
  const [desc, setDesc] = useState("");

  // catalogue search-select on Title (DV6-12) — debounced fuzzy search filtered by
  // category + brand + scale; results include pending community entries.
  const [dupes, setDupes] = useState<CatalogueHit[]>([]);
  const [linkedSku, setLinkedSku] = useState<string | null>(params?.get("sku") ?? null);
  const dupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Brand dropdown = canonical CAT_BRANDS ∪ distinct catalogue brands for the category (DV6-12).
  const [catBrands, setCatBrands] = useState<string[]>([]);

  // acquisition
  const [cond, setCond] = useState("");
  const [paid, setPaid] = useState("");
  const [paidCur, setPaidCur] = useState("INR");
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

  // for sale
  const [forSale, setForSale] = useState(false);
  const [price, setPrice] = useState("");
  const [priceCur, setPriceCur] = useState("INR");
  const [condNote, setCondNote] = useState("");
  const [shipIncl, setShipIncl] = useState(false);
  const [returns, setReturns] = useState(false);
  const [trade, setTrade] = useState(false);

  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scales = CAT_SCALES[cat];
  const usesScale = !!scales;
  const meta = CAT_META[cat] ?? CAT_META.figures;
  const isIntel = acq === "intel"; // DB Contribution — unowned, no condition/sale
  const canSell = acq === "inhand"; // pre-orders & DB contributions can't be listed
  const photoMax = 4; // DV6-13 — up to 4 personal photos per item

  const brandList = useMemo(() => {
    const canonical = CAT_BRANDS[cat] ?? CAT_BRANDS.figures;
    const seen = new Set(canonical.map((b) => b.toLowerCase()));
    const extra = catBrands.filter((b) => !seen.has(b.toLowerCase()));
    return [...canonical, ...extra];
  }, [cat, catBrands]);
  const brandMatches = useMemo(() => {
    const q = brand.trim().toLowerCase();
    if (!q) return brandList.slice(0, 8);
    return brandList.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
  }, [brand, brandList]);
  const exactBrand = brandList.some((b) => b.toLowerCase() === brand.trim().toLowerCase());
  const scaleFilter = usesScale && scale && scale !== "Other" ? scale : "";

  // Brand suggestions: pull the catalogue's distinct brands for the category (DV6-12).
  useEffect(() => {
    let alive = true;
    api.get<{ brands: string[] }>(`/catalogue/brands?category=${encodeURIComponent(cat)}`)
      .then((d) => { if (alive) setCatBrands(d.brands || []); })
      .catch(() => { if (alive) setCatBrands([]); });
    return () => { alive = false; };
  }, [cat]);

  // Central-catalogue search-select (DV6-12): fuzzy search as the title is typed, filtered
  // by category + brand + scale. All state writes live inside the debounced timeout so none
  // run synchronously in the effect body.
  useEffect(() => {
    if (dupDebounce.current) clearTimeout(dupDebounce.current);
    const q = title.trim();
    const brandF = brand.trim();
    dupDebounce.current = setTimeout(async () => {
      if (linkedSku || q.length < 3) { setDupes([]); return; }
      try {
        const qs = new URLSearchParams({ q, category: cat });
        if (brandF) qs.set("brand", brandF);
        if (scaleFilter) qs.set("scale", scaleFilter);
        const data = await api.get<{ hits: CatalogueHit[] }>(`/catalogue/search?${qs.toString()}`);
        setDupes(data.hits.slice(0, 5));
      } catch { setDupes([]); }
    }, 300);
    return () => { if (dupDebounce.current) clearTimeout(dupDebounce.current); };
  }, [title, cat, brand, scaleFilter, linkedSku]);
  // "New to Scorred DB" → +50 XP as first contributor (only when not linked to an existing SKU).
  const isNewToDb = !linkedSku && title.trim().length >= 5 && dupes.length === 0 && !!brand.trim();

  const changeCat = (id: string) => { setCat(id); setScale(""); setScaleOther(""); setSize(""); setBrand(""); setTcgLang(""); setTcgFormat(""); setTcgGraded(false); setTcgGrade(""); };
  const linkDupe = (h: CatalogueHit) => { setTitle(h.title); setBrand(h.brand); setLinkedSku(h.sku); setDupes([]); };

  const miss = {
    // Inheriting the catalogue reference image satisfies the photo requirement (DV6-13).
    photo: photos.length === 0 && !refImage,
    title: !title.trim(),
    brand: !brand.trim(),
    scale: !isIntel && usesScale && (scale === "Other" ? !scaleOther.trim() : !scale),
    cond: acq === "inhand" && !cond,
    price: canSell && forSale && !price.trim(),
  };
  const invalid = Object.values(miss).some(Boolean);
  const condLabel = CONDITIONS.find((c) => c.id === cond)?.label ?? (acq === "preorder" ? "Pre-order" : "");

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

  const submit = async () => {
    if (invalid) { setTried(true); return; }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const isPreorder = acq === "preorder";
      // DB Contribution → unowned catalogue seed stored with its own `intel` status (matches the
      // design + DECISIONS 2026-07-03; keeps it out of owned/wishlist/preorder tabs). `status` is a
      // free String(16) — no migration. The backend awards +50 XP `db_new` for any free-text item.
      const status = isIntel ? "intel" : isPreorder ? "preorder" : "owned";
      const item = await api.post<{ id: string; db_new_xp?: number; catalogue_matched?: boolean }>("/items", {
        sku: linkedSku ?? undefined,
        custom_title: linkedSku ? undefined : title.trim(),
        // DV6-13 — when this add creates a NEW catalogue entry, the first photo is the
        // mandatory public reference image. Ignored server-side if it links to an existing SKU.
        cover_url: linkedSku ? undefined : (photos[0] ?? undefined),
        brand: brand.trim() || null,
        scale: usesScale ? (scale === "Other" ? scaleOther.trim() : scale) : (size.trim() || null),
        release_year: year ? Number(year) : null,
        description: desc.trim() || null,
        category: cat,
        status,
        value: paid ? Number(paid) * 100 : 0,
        value_currency: paidCur,
        // TCG spec (DV4-01b)
        tcg_language: cat === "tcg" ? (tcgLang || null) : null,
        tcg_product_type: cat === "tcg" ? (tcgFormat || null) : null,
        tcg_graded: cat === "tcg" ? tcgGraded : false,
        tcg_grader: cat === "tcg" && tcgGraded ? tcgGrader : null,
        tcg_grade: cat === "tcg" && tcgGraded ? (tcgGrade || null) : null,
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
      // DV6-10b — surface the +50 XP when this was the first contribution to the shared DB;
      // DV6-12 — otherwise, if the server auto-linked a free-text add to an existing catalogue
      // entry, tell the user (no duplicate was created, so no XP).
      if (item.db_new_xp && item.db_new_xp > 0) fireXpToast(item.db_new_xp, "XP · added to Scorred DB");
      else if (item.catalogue_matched) fireToast("Linked to an existing Scorred entry — no duplicate created");
      if (isIntel) {
        router.push(user ? `/profile/${user.handle}` : "/market");
        return;
      }
      if (canSell && forSale) {
        const listing = await api.post<{ id: string }>("/listings", {
          item_id: item.id,
          price: Number(price) * 100,
          currency: priceCur,
          condition: cond,
          condition_notes: condNote.trim() || null,
          trade_willing: trade,
          shipping_cost: 0,
          ships_from_city: user?.city ?? null,
          ships_nationwide: true,
          terms: [shipIncl ? "Shipping included" : null, returns ? "Returns accepted" : null].filter(Boolean) as string[],
        });
        router.push(`/listing/${listing.id}`);
      } else {
        router.push(user ? `/profile/${user.handle}` : "/market");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the item");
      setSubmitting(false);
    }
  };

  // DV6-13 — picking a catalogue hit at the search step pre-fills the form and links the SKU
  // (you inherit its shared reference image; no upload required).
  const prefillFromHit = (h: CatalogueHit) => {
    setLinkedSku(h.sku);
    setTitle(h.title);
    setBrand(h.brand);
    if (h.category) setCat(h.category);
    if (h.scale && h.scale !== "—") setScale(h.scale);
    setYear(h.year ?? "");
    setDesc(h.description ?? "");
    setRefImage(h.thumbnail_url ?? null);  // inherit the shared cover; upload optional
    setDupes([]);
    setStep("form");
  };

  if (step === "pick") {
    return <ModePicker onPick={(m) => { setAcq(m); if (m !== "inhand") setForSale(false); setStep("search"); }} onClose={() => router.push("/market")} />;
  }

  if (step === "search") {
    return (
      <SearchStep
        onPick={prefillFromHit}
        onAddNew={() => { setLinkedSku(null); setRefImage(null); setStep("form"); }}
        onBack={() => setStep("pick")}
      />
    );
  }

  const mode = ACQ_MODES.find((m) => m.id === acq)!;
  const headerAccent = forSale ? "var(--stamp-red)" : isIntel ? "var(--verified-teal)" : "var(--ink)";

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setStep(hasSku ? "pick" : "search")} aria-label="Back to search" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)", background: "transparent", cursor: "pointer" }}>
            <ChevronRight size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>{isIntel ? "DB Contribution" : "Add an item"}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{mode.label} · {meta.label}</div>
          </div>
          <button onClick={submit} disabled={submitting} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: invalid ? "var(--bone)" : headerAccent, color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "Saving…" : isIntel ? "Contribute" : forSale ? "List" : "Add"}
          </button>
        </div>
      </div>

      <div style={{ padding: "4px 20px 16px" }}>
        {/* Category */}
        <Label>Category</Label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {ADD_CATEGORIES.map((c) => {
            const on = cat === c.id;
            return (
              <button key={c.id} type="button" onClick={() => changeCat(c.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, lineHeight: 1,
              }}>
                {c.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)", margin: "9px 2px 0", lineHeight: 1.5 }}>
          The form adapts to the category — scale, brands and condition are tuned for {meta.label.toLowerCase()}s.
        </div>

        {/* Brand — single searchable dropdown (DV6-12): canonical ∪ catalogue brands; no chips */}
        <Label required missing={tried && miss.brand}>Brand</Label>
        <div style={{ position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 13px", borderRadius: 11,
            border: `1px solid ${tried && miss.brand ? "var(--stamp-red)" : "var(--border-strong)"}`,
            background: "var(--paper-soft)",
          }}>
            <Search size={15} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
            <input
              value={brand}
              onFocus={() => setBrandFocus(true)}
              onBlur={() => setTimeout(() => setBrandFocus(false), 150)}
              onChange={(e) => { setBrand(e.target.value); setBrandFocus(true); }}
              placeholder={`Search or type — ${meta.brandEg}`}
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)" }} />
            {brand && (
              <button type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(""); }} aria-label="Clear brand"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", display: "flex", padding: 0 }}>
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
          {brandFocus && (brandMatches.length > 0 || (brand.trim().length > 1 && !exactBrand)) && (
            <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 20, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 11, overflow: "hidden", boxShadow: "var(--shadow-3)", maxHeight: 260, overflowY: "auto" }}>
              {brandMatches.map((b) => (
                <button key={b} type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(b); setBrandFocus(false); }} style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "10px 13px", background: brand.trim().toLowerCase() === b.toLowerCase() ? "var(--bone)" : "transparent",
                  border: "none", borderBottom: "1px solid var(--border)",
                }}>
                  <Tag size={14} style={{ color: "var(--ink-faint)" }} />
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>{b}</span>
                </button>
              ))}
              {brand.trim().length > 1 && !exactBrand && (
                <button type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(brand.trim()); setBrandFocus(false); }} style={{
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

        {/* Scale (or Size for designer) */}
        {usesScale ? (
          <>
            <Label required={!isIntel} missing={tried && miss.scale}>Scale</Label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {scales!.map((s) => {
                const on = scale === s;
                return (
                  <button key={s} type="button" onClick={() => setScale(s)} style={{
                    padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600,
                    background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                    border: `1px solid ${on ? "var(--ink)" : tried && miss.scale ? "var(--stamp-red)" : "var(--border-strong)"}`,
                  }}>{s}</button>
                );
              })}
              <button type="button" onClick={() => setScale("Other")} style={{
                padding: "7px 13px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: scale === "Other" ? "var(--ink)" : "var(--paper-soft)", color: scale === "Other" ? "var(--paper)" : "var(--ink)",
                border: `1px solid ${scale === "Other" ? "var(--ink)" : "var(--border-strong)"}`,
              }}>+ Other</button>
            </div>
            {scale === "Other" && (
              <input value={scaleOther} onChange={(e) => setScaleOther(e.target.value)} placeholder="e.g. 1/20, non-scale" style={{ ...fieldStyle, height: 42, fontSize: 14.5, marginTop: 9, borderColor: tried && miss.scale ? "var(--stamp-red)" : "var(--border-strong)" }} />
            )}
          </>
        ) : cat === "tcg" ? (
          <>
            {/* TCG: language/print + product type + optional graded (DV4-01b) */}
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

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 1px", marginTop: 10, borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Graded card</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>PSA / BGS / CGC professional grade</div>
              </div>
              <button type="button" onClick={() => setTcgGraded((v) => !v)} aria-pressed={tcgGraded} style={{
                width: 46, height: 27, borderRadius: 999, flexShrink: 0, cursor: "pointer", position: "relative",
                border: "none", background: tcgGraded ? "var(--forest)" : "var(--bone-deep)", transition: "background 160ms",
              }}>
                <span style={{ position: "absolute", top: 3, left: tcgGraded ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms" }} />
              </button>
            </div>
            {tcgGraded && (
              <div style={{ marginTop: 12, display: "flex", gap: 9, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Label>Grading company</Label>
                  <div style={{ display: "flex", gap: 7 }}>
                    {TCG_GRADERS.map((g) => (
                      <CategoryChip key={g} active={tcgGrader === g} onClick={() => setTcgGrader(g)}>{g}</CategoryChip>
                    ))}
                  </div>
                </div>
                <div style={{ width: 88 }}>
                  <Label>Grade</Label>
                  <input value={tcgGrade} onChange={(e) => setTcgGrade(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))} inputMode="decimal" placeholder="e.g. 9"
                    style={{ ...fieldStyle, height: 40, fontSize: 16, fontFamily: "var(--font-mono)", fontWeight: 700, textAlign: "center" }} />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Label hint="optional">Size</Label>
            <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 400% · 28 cm · 7 inch" style={{ ...fieldStyle, fontSize: 14.5 }} />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Blind boxes don&rsquo;t use scale — note the height or % size instead.</div>
          </>
        )}

        {/* Title */}
        <Label required missing={tried && miss.title}>Title</Label>
        <input value={title} onChange={(e) => { setTitle(e.target.value); setLinkedSku(null); setRefImage(null); }} placeholder={meta.titleEg} style={{ ...fieldStyle, borderColor: tried && miss.title ? "var(--stamp-red)" : "var(--border-strong)" }} />
        {/* Central-catalogue search results — tap to link instead of creating a duplicate (DV6-12) */}
        {!linkedSku && dupes.length > 0 && (
          <div style={{ marginTop: 7, borderRadius: 11, border: "1px solid var(--border-strong)", overflow: "hidden", background: "var(--paper)" }}>
            <div style={{ padding: "7px 11px", background: "var(--bone)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
              <Search size={12} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>Already in Scorred — tap to link (don&rsquo;t create a duplicate)</span>
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
                    {m.pending && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--grail-gold-deep)", background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 4, padding: "1px 5px" }}>Pending review</span>}
                  </div>
                </div>
                <Plus size={16} style={{ color: "var(--stamp-red)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
        {linkedSku && (
          <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 9, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)" }}>
            <Check size={13} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--verified-teal)", fontWeight: 600 }}>Linked to catalogue — pre-filled from the Scorred DB</span>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setLinkedSku(null); setRefImage(null); }} aria-label="Unlink" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", padding: 0, display: "flex", marginLeft: "auto" }}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )}
        {isNewToDb && (
          <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 9, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)" }}>
            <Sparkles size={13} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--verified-teal)", fontWeight: 600 }}>New to Scorred DB — you&rsquo;ll earn +50 XP as first contributor</span>
          </div>
        )}

        <Label hint="optional">Release year</Label>
        <input value={year} onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} inputMode="numeric" placeholder="e.g. 2022" style={{ ...fieldStyle, height: 42, fontSize: 14.5, fontFamily: "var(--font-mono)" }} />

        {/* Photos */}
        <Label required missing={tried && miss.photo} hint={refImage ? "your own — optional" : photos.length ? `${photos.length} added · first = cover` : "min 1 · up to 4"}>Photos</Label>
        {/* DV6-13 — inherited catalogue reference (shown when you picked an existing item) */}
        {refImage && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 10, borderRadius: 12, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", marginBottom: 11 }}>
            <div style={{ width: 56, height: 56, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={refImage} ratio="1/1" rounded={9} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--verified-teal)" }}>Using the catalogue image</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2, lineHeight: 1.45 }}>It&rsquo;s the shared cover for this item — no need to upload. Add your own photos below if you like (private by default).</div>
            </div>
          </div>
        )}
        {isIntel && photos.length === 0 && (
          <div style={{ display: "flex", gap: 8, padding: "9px 12px", borderRadius: 10, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", marginBottom: 11 }}>
            <Info size={14} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: "var(--verified-teal)", lineHeight: 1.45 }}>Add at least 1 photo — official images help verify the item in the Scorred DB.</span>
          </div>
        )}
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 11 }}>
            {photos.map((url, i) => (
              <div key={i} style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                <ProductPhoto tone="ink" src={url} ratio="1/1" rounded={13} />
                {/* DV6-13 — visibility chip. New-entry cover is the mandatory public reference (locked). */}
                {!linkedSku && i === 0 ? (
                  <span title="Shared reference image — required to add a new item" style={{ position: "absolute", bottom: 6, left: 6, display: "inline-flex", alignItems: "center", gap: 3, background: "var(--verified-teal)", color: "var(--paper)", fontWeight: 700, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 5px", borderRadius: 4 }}>
                    <Eye size={9} /> Cover
                  </span>
                ) : (
                  <button type="button" onClick={() => togglePhotoPublic(i)} title={isPhotoPublic(i) ? "Shared to the catalogue — tap to make private" : "Private to you — tap to share to the catalogue"} style={{
                    position: "absolute", bottom: 6, left: 6, display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer",
                    background: isPhotoPublic(i) ? "var(--verified-teal)" : "rgba(15,23,42,0.72)", color: "var(--paper)",
                    fontWeight: 700, fontSize: 9, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 6px", borderRadius: 4, border: "none",
                  }}>
                    {isPhotoPublic(i) ? <><Eye size={9} /> Public</> : "Private"}
                  </button>
                )}
                {/* Set-as-cover (DV6-13) — non-cover photos only */}
                {i !== 0 && (
                  <button type="button" onClick={() => makeCover(i)} title="Make this the cover" style={{
                    position: "absolute", top: 6, left: 6, cursor: "pointer",
                    background: "rgba(15,23,42,0.72)", color: "var(--paper)", border: "none",
                    fontWeight: 700, fontSize: 9, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 6px", borderRadius: 4,
                  }}>Set cover</button>
                )}
                <button type="button" onClick={() => rmPhoto(i)} aria-label="Remove photo" style={{
                  position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", cursor: "pointer",
                  background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < photoMax && (
          <ImageUploader
            multiple
            maxFiles={photoMax - photos.length}
            onUpload={(url) => { setPhotos((p) => [...p, url]); setPhotoPublic((v) => [...v, false]); }}
            label={photos.length ? `Add more (up to ${photoMax - photos.length})` : `Add photos — pick up to ${photoMax} at once`}
          />
        )}
        {/* Cover note (DV6-13) — only when this add owns the cover (a brand-new entry) */}
        {!refImage && (
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "8px 2px 0", lineHeight: 1.5 }}>
            The <b style={{ color: "var(--ink)" }}>first photo is the cover</b> — it&rsquo;s <b style={{ color: "var(--verified-teal)" }}>public</b> and represents this item in the Scorred catalogue. Tap <b>Set cover</b> on any photo to change it. Your other photos stay private unless you tap <b>Private → Public</b>.
          </div>
        )}

        <Label hint="optional">Description</Label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="What makes this one special? Accessories, edition, where you got it…" style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", fontSize: 14.5 }} />

        {/* Acquisition — mode is chosen upfront in the picker (DV6-10). Condition is In-hand only. */}
        {acq === "inhand" && (
          <>
            <Label required missing={tried && miss.cond}>Condition</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {CONDITIONS.map((c) => {
                const on = cond === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                    display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
                    padding: "11px 13px", borderRadius: 11, background: on ? "var(--ink)" : "var(--paper-soft)",
                    border: `1px solid ${on ? "var(--ink)" : tried && miss.cond ? "var(--stamp-red)" : "var(--border-strong)"}`,
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: on ? "rgba(255,255,255,0.15)" : "var(--bone-deep)", color: on ? "var(--paper)" : "var(--ink-faint)" }}>
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: on ? "var(--paper)" : "var(--ink)" }}>{c.label}</span>
                      <span style={{ fontSize: 11.5, color: on ? "rgba(244,239,230,0.7)" : "var(--ink-faint)", marginTop: 1 }}>{c.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Label hint="optional · private">What you paid</Label>
            <MoneyField value={paid} onChange={setPaid} cur={paidCur} onCur={setPaidCur} placeholder="Purchase price" />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Only you see this — it helps track your collection&rsquo;s value.</div>
          </>
        )}
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

            <div style={{ marginTop: 14 }}><SectionLabel>Ordered from (seller)</SectionLabel></div>
            <input value={poSeller} onChange={(e) => setPoSeller(e.target.value)} placeholder="Store, distributor or seller name"
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
              <button type="button" onClick={() => setForSale((v) => !v)} aria-pressed={forSale} style={{
                width: 46, height: 27, borderRadius: 999, flexShrink: 0, cursor: "pointer", position: "relative",
                border: "none", background: forSale ? "var(--stamp-red)" : "var(--bone-deep)", transition: "background 160ms",
              }}>
                <span style={{ position: "absolute", top: 3, left: forSale ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms" }} />
              </button>
            </div>

            {forSale && (
              <div style={{ padding: "2px 15px 16px", borderTop: "1px solid var(--stamp-red)" }}>
                <Label required missing={tried && miss.price}>Asking price</Label>
                <MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} bad={tried && miss.price} placeholder="Your price" big />

                <Label hint="optional">Condition notes</Label>
                <textarea value={condNote} onChange={(e) => setCondNote(e.target.value)} rows={2} placeholder="Box wear, paint, joints, what's included…" style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", fontSize: 14.5, background: "var(--paper)" }} />

                <div style={{ marginTop: 12 }}>
                  {[
                    { k: "ship", title: "Shipping included", sub: "Price covers delivery — no extra at checkout", on: shipIncl, set: () => setShipIncl((v) => !v) },
                    { k: "ret", title: "Returns accepted", sub: "Buyer can return within a short window", on: returns, set: () => setReturns((v) => !v) },
                    { k: "trade", title: "Open to trades", sub: "Buyers can propose an item swap", on: trade, set: () => setTrade((v) => !v) },
                  ].map((row, i, arr) => (
                    <div key={row.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{row.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>{row.sub}</div>
                      </div>
                      <button type="button" onClick={row.set} aria-pressed={row.on} style={{ width: 46, height: 27, borderRadius: 999, flexShrink: 0, cursor: "pointer", position: "relative", border: "none", background: row.on ? "var(--ink)" : "var(--bone-deep)", transition: "background 160ms" }}>
                        <span style={{ position: "absolute", top: 3, left: row.on ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms" }} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Live market preview */}
                <Label>Market preview</Label>
                <div style={{ display: "flex", gap: 11, alignItems: "center", padding: 10, borderRadius: 13, background: "var(--paper)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 56, height: 56, flexShrink: 0 }}>
                    <ProductPhoto tone="ink" src={photos[0]} ratio="1/1" rounded={9} />
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
                  <span>Listing goes live now. Add a <b style={{ color: "var(--verified-teal)" }}>verified in-app photo</b> later to earn the Verified badge and rank higher in search.</span>
                </div>
              </div>
            )}
          </div>
        ) : acq === "preorder" ? (
          <div style={{ marginTop: 24, display: "flex", gap: 11, alignItems: "flex-start", padding: 15, borderRadius: 16, border: "1px solid var(--border)", background: "var(--paper-soft)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: "var(--bone-deep)", color: "var(--ink-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Tag size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Selling is off for pre-orders</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3, lineHeight: 1.45 }}>List it on the Market once it&rsquo;s in hand. For now it&rsquo;s saved to your collection as a pre-order.</div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24, display: "flex", gap: 11, alignItems: "flex-start", padding: 15, borderRadius: 16, border: "1px solid var(--verified-teal)", background: "var(--verified-teal-soft)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Eye size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Thanks for helping the community</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.45 }}>This won&rsquo;t claim ownership — it just adds the item to the Scorred DB so others can track, wishlist and discover it.</div>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 16, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

        <button onClick={submit} disabled={submitting} type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          height: 48, marginTop: 22, borderRadius: 12, border: "none",
          background: forSale ? "var(--stamp-red)" : isIntel ? "var(--verified-teal)" : "var(--ink)", color: "var(--paper)",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
          cursor: submitting ? "wait" : "pointer", opacity: invalid ? 0.5 : 1,
        }}>
          {isIntel ? <Eye size={18} /> : forSale ? <Tag size={18} /> : <PlusCircle size={18} />}
          {submitting ? "Saving…" : isIntel ? "Contribute to DB" : forSale ? "List in the Market" : "Add to my collection"}
        </button>
      </div>
    </div>
  );
}
