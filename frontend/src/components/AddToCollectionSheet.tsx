"use client";

import { useEffect, useRef, useState } from "react";
import { X, Search, Plus, ScanLine, Camera, Check, Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Segmented, SectionLabel, CategoryChip, ProductPhoto } from "@/components/ui";
import { fireXpToast } from "@/components/gamification";
import { ImageUploader } from "@/components/ImageUploader";
import { ReleaseWindowPicker } from "@/components/forms";
import { ADD_CATEGORIES, buildPoEta, type PoPrecision } from "@/lib/catalog";

interface CatalogueHit {
  sku: string;
  title: string;
  brand: string;
  category: string;
  scale?: string | null;
  year?: string | null;
  est_retail_price?: number;
  thumbnail_url: string | null;
}

type ItemStatus = "owned" | "wishlist" | "preorder";

interface AddToCollectionSheetProps {
  onClose: () => void;
  onAdded: () => void;
  // When opened from a catalogue result (e.g. Search), skip the search view and
  // jump straight to the pre-filled form for this SKU.
  initialPick?: CatalogueHit;
}

// Generic brand / scale options for the add form (design_v4 AddToCollection — not
// category-aware here, unlike the richer market AddListing form). "+ Others" → free text.
const BRAND_OPTIONS = ["Hot Toys", "Bandai", "LEGO", "Pop Mart", "Sideshow", "Tomica", "Mini GT", "McFarlane"];
// v4 AddToCollection uses the global SCALES list (data.jsx) verbatim — not the
// category-aware CAT_SCALES of the market AddListing form. Kept in lockstep with v4.
const SCALE_OPTIONS = ["1/4", "1/6", "1/10", "1/12", "1/64", "1/100", "1:300"];

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px", borderRadius: 11,
  border: "1px solid var(--border-strong)", background: "var(--paper-soft)",
  fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none",
};

export function AddToCollectionSheet({ onClose, onAdded, initialPick }: AddToCollectionSheetProps) {
  const [view, setView] = useState<"search" | "form">("search");

  // search view
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogueHit[]>([]);
  const [popular, setPopular] = useState<CatalogueHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanHint, setScanHint] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // form view (picked catalogue item OR free-text custom)
  const [picked, setPicked] = useState<CatalogueHit | null>(null);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<string>("figures");
  const [brand, setBrand] = useState("Others");
  const [brandOther, setBrandOther] = useState("");
  const [scale, setScale] = useState("Others");
  const [scaleOther, setScaleOther] = useState("");
  const [desc, setDesc] = useState("");
  const [est, setEst] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState<ItemStatus>("owned");

  // pre-order panel (DV4-03)
  const [poPrec, setPoPrec] = useState<PoPrecision>("month");
  const [poDate, setPoDate] = useState("");
  const [poMonth, setPoMonth] = useState("");
  const [poQuarter, setPoQuarter] = useState("");
  const [poYear, setPoYear] = useState("2026");
  const [poOrderDate, setPoOrderDate] = useState("");
  const [poSeller, setPoSeller] = useState("");
  const [poTotal, setPoTotal] = useState("");
  const [poDeposit, setPoDeposit] = useState("");
  const poBalance = Math.max(0, (parseInt(poTotal, 10) || 0) - (parseInt(poDeposit, 10) || 0));

  const [tried, setTried] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // default "Popular in your interests" suggestions
  useEffect(() => {
    api.get<{ hits: CatalogueHit[] }>("/catalogue/popular")
      .then((d) => setPopular(d.hits))
      .catch(() => setPopular([]));
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setHits([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<{ hits: CatalogueHit[] }>(`/catalogue/search?q=${encodeURIComponent(q)}`);
        setHits(data.hits);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 280);
  }

  function pick(hit: CatalogueHit) {
    setPicked(hit);
    setTitle(hit.title);
    setCat(hit.category || "figures");
    setBrand(BRAND_OPTIONS.includes(hit.brand) ? hit.brand : "Others");
    setBrandOther(BRAND_OPTIONS.includes(hit.brand) ? "" : hit.brand);
    setScale(hit.scale && SCALE_OPTIONS.includes(hit.scale) ? hit.scale : "Others");
    setScaleOther(hit.scale && !SCALE_OPTIONS.includes(hit.scale) ? hit.scale : "");
    setEst(hit.est_retail_price ? String(Math.round(hit.est_retail_price / 100)) : "");
    setView("form");
  }

  // Opened from a catalogue result (Search): land directly on the pre-filled form.
  useEffect(() => {
    if (initialPick) pick(initialPick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickCustom() {
    setPicked(null);
    setTitle("");
    setCat("figures");
    setBrand("Others");
    setBrandOther("");
    setScale("Others");
    setScaleOther("");
    setEst("");
    setView("form");
  }

  const missTitle = !title.trim();
  const missBrand = brand === "Others" && !brandOther.trim();
  const missScale = scale === "Others" && !scaleOther.trim();
  const brandFilled = brand === "Others" ? brandOther.trim().length > 0 : brand.length > 0;
  // v6 (DV6-02) "DB Contribution" — a free-text item (not linked to a catalogue
  // hit) that has a real title + brand is new to the shared DB → +50 XP.
  const isNewToDb = !picked && title.trim().length >= 5 && brandFilled;
  // Photo is the ownership-proof gate — required for OWNED items; optional for wishlist/pre-order.
  const missPhoto = status === "owned" && photos.length === 0;
  const invalid = missTitle || missBrand || missScale || missPhoto;

  async function handleAdd() {
    if (invalid) { setTried(true); setError("Fill the required fields marked *"); return; }
    setAdding(true);
    setError("");
    try {
      const isPreorder = status === "preorder";
      const item = await api.post<{ id: string; db_new_xp?: number }>("/items", {
        sku: picked?.sku ?? undefined,
        custom_title: picked ? undefined : title.trim(),
        brand: brand === "Others" ? brandOther.trim() : brand,
        scale: scale === "Others" ? scaleOther.trim() : scale,
        description: desc.trim() || null,
        category: cat,
        status,
        value: est ? Number(est) * 100 : 0,
        value_currency: "INR",
        preorder_eta: isPreorder ? buildPoEta(poPrec, { date: poDate, monthIdx: poMonth, quarter: poQuarter, year: poYear }) : null,
        preorder_window_precision: isPreorder ? poPrec : null,
        preorder_seller: isPreorder ? (poSeller.trim() || null) : null,
        preorder_ordered_at: isPreorder && poOrderDate ? poOrderDate : null,
        preorder_total: isPreorder && poTotal ? Number(poTotal) * 100 : null,
        preorder_deposit: isPreorder && poDeposit ? Number(poDeposit) * 100 : null,
        // DV6-13 — a free-text add that CREATES a new catalogue entry needs a public
        // reference image (the first photo). Ignored server-side when linking an existing SKU.
        cover_url: picked ? undefined : (photos[0] ?? undefined),
      });
      for (let idx = 0; idx < photos.length; idx++) {
        // First photo of a new entry is the shared public reference; the rest are private.
        const isPublicCover = !picked && idx === 0;
        await api.post(`/items/${item.id}/photos?url=${encodeURIComponent(photos[idx])}${isPublicCover ? "&is_public=true" : ""}`);
      }
      // DV6-02 — surface the +50 XP when this was the first contribution to the DB.
      if (item.db_new_xp && item.db_new_xp > 0) fireXpToast(item.db_new_xp, "XP · added to Scorred DB");
      onAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  // Required-field label (helper, not a component — avoids re-creating during render).
  const reqLabel = (text: string, missing: boolean) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, marginTop: 18 }}>
      <SectionLabel>{text}</SectionLabel>
      <span style={{ color: missing && tried ? "var(--stamp-red)" : "var(--ink-ghost)", fontSize: 13, fontWeight: 700 }}>*</span>
      {missing && tried && <span style={{ fontSize: 11, color: "var(--stamp-red)", marginLeft: "auto", fontWeight: 600 }}>Required</span>}
    </div>
  );

  const statusLabel = status === "wishlist" ? "wishlist" : status === "preorder" ? "pre-orders" : "collection";
  const results = query.trim() ? hits : popular;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 shrink-0">
          {view === "form" && (
            <button onClick={() => setView("search")} className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] mr-1">← Back</button>
          )}
          <h2 className="font-bold text-base text-[var(--ink)] flex-1" style={{ fontFamily: "var(--font-display)" }}>
            Add to collection
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--bone)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Search view ──────────────────────────────────────── */}
        {view === "search" && (
          <div className="overflow-y-auto flex-1 px-4 py-4">
            <div style={{ display: "flex", gap: 9 }}>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] pointer-events-none" />
                <input
                  type="text" value={query} onChange={handleQueryChange} autoFocus
                  placeholder="Search catalogue by name or SKU…"
                  className="w-full pl-9 pr-3 h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--paper-soft)] text-[var(--ink)] text-sm outline-none focus:border-[var(--stamp-red)] transition-colors"
                />
              </div>
              <button
                onClick={() => setScanHint((v) => !v)}
                aria-label="Scan barcode"
                className="w-11 h-11 shrink-0 rounded-xl border border-[var(--border-strong)] bg-[var(--paper-soft)] flex items-center justify-center text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors"
              >
                <ScanLine size={20} />
              </button>
            </div>
            {scanHint && (
              <div className="mt-2 text-xs text-[var(--ink-faint)] leading-relaxed px-1">
                Barcode scanning auto-fills the form — it&rsquo;s available in the Scorred app. On web, search by name/SKU or add it manually below.
              </div>
            )}

            <div className="text-xs text-[var(--ink-faint)] mt-4 mb-2 px-0.5">
              {query.trim() ? `${results.length} catalogue matches` : "Popular in your interests"}
            </div>

            {searching ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-[var(--bone)] animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((hit) => (
                  <button
                    key={hit.sku} onClick={() => pick(hit)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--paper-soft)] hover:bg-[var(--bone)] transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--bone-deep)] overflow-hidden shrink-0 flex items-center justify-center">
                      {hit.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hit.thumbnail_url} alt={hit.title} className="w-full h-full object-cover" />
                      ) : <span className="text-[var(--ink-ghost)] text-xs">img</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)] leading-tight truncate">{hit.title}</p>
                      <p className="text-xs text-[var(--ink-faint)] font-mono mt-0.5">{hit.sku} · {hit.brand}</p>
                    </div>
                    <Plus size={20} className="text-[var(--stamp-red)] shrink-0" />
                  </button>
                ))}
                {query.length > 1 && results.length === 0 && (
                  <p className="text-sm text-[var(--ink-faint)] text-center py-2">No catalogue match — add it yourself below.</p>
                )}
              </div>
            )}

            <button
              onClick={pickCustom}
              className="w-full flex items-center justify-center gap-2 h-11 mt-4 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--ink-mute)] text-sm font-semibold hover:text-[var(--ink)] transition-colors"
            >
              <Sparkles size={15} className="text-[var(--verified-teal)]" />
              Can&rsquo;t find it? Add it to the DB
            </button>
            <p className="text-[11.5px] text-[var(--ink-faint)] leading-relaxed mt-2 px-1 text-center">
              Spotted something new? Share the brand, scale &amp; title so other collectors can track and
              discover it — you earn <b className="text-[var(--verified-teal)]">+50 XP</b> for being first to add it to Scorred.
            </p>
          </div>
        )}

        {/* ── Form view ────────────────────────────────────────── */}
        {view === "form" && (
          <>
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {picked && (
                <div className="mb-1">
                  <ProductPhoto tone="ink" src={picked.thumbnail_url ?? undefined} ratio="3/2" rounded={12} label={picked.sku} />
                </div>
              )}
              <div className="text-xs text-[var(--ink-faint)] mt-2 px-0.5">
                Catalogue pre-fills what it can. Fields marked <b style={{ color: "var(--stamp-red)" }}>*</b> are required.
              </div>

              {/* Title* */}
              {reqLabel("Title", missTitle)}
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title"
                style={{ ...fieldStyle, borderColor: missTitle && tried ? "var(--stamp-red)" : "var(--border-strong)" }} />
              {isNewToDb && (
                <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 9, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)" }}>
                  <Sparkles size={13} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--verified-teal)", fontWeight: 600 }}>New to Scorred DB — you&rsquo;ll earn +50 XP as first contributor</span>
                </div>
              )}

              {/* Category */}
              <div style={{ marginTop: 18 }}><SectionLabel>Category</SectionLabel></div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
                {ADD_CATEGORIES.map((c) => <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</CategoryChip>)}
              </div>

              {/* Brand* */}
              {reqLabel("Brand", missBrand)}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {BRAND_OPTIONS.map((b) => <CategoryChip key={b} active={brand === b} onClick={() => setBrand(b)}>{b}</CategoryChip>)}
                <CategoryChip active={brand === "Others"} onClick={() => setBrand("Others")}>+ Others</CategoryChip>
              </div>
              {brand === "Others" && (
                <input value={brandOther} onChange={(e) => setBrandOther(e.target.value)} placeholder="Type the brand name"
                  style={{ ...fieldStyle, height: 42, fontSize: 14.5, marginTop: 9, borderColor: missBrand && tried ? "var(--stamp-red)" : "var(--border-strong)" }} />
              )}

              {/* Scale* */}
              {reqLabel("Scale", missScale)}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {SCALE_OPTIONS.map((s) => <CategoryChip key={s} active={scale === s} onClick={() => setScale(s)}>{s}</CategoryChip>)}
                <CategoryChip active={scale === "Others"} onClick={() => setScale("Others")}>+ Others</CategoryChip>
              </div>
              {scale === "Others" && (
                <input value={scaleOther} onChange={(e) => setScaleOther(e.target.value)} placeholder="e.g. 1/18, N/A"
                  style={{ ...fieldStyle, height: 42, fontSize: 14.5, marginTop: 9, borderColor: missScale && tried ? "var(--stamp-red)" : "var(--border-strong)" }} />
              )}

              {/* Description / Fun fact */}
              <div style={{ marginTop: 18 }}><SectionLabel>Description / Fun fact</SectionLabel></div>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Optional — what makes this one special?"
                style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", fontSize: 14.5, marginTop: 9 }} />

              {/* Estimated value */}
              <div style={{ marginTop: 18 }}><SectionLabel>Estimated value (INR)</SectionLabel></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", marginTop: 9 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 17, color: "var(--ink-faint)" }}>₹</span>
                <input value={est} onChange={(e) => setEst(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric"
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }} />
              </div>

              {/* Photo* (owned items) */}
              {reqLabel("Photo", missPhoto)}
              {photos.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 13, borderRadius: 13, background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={19} strokeWidth={2.6} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{photos.length} photo{photos.length !== 1 ? "s" : ""} added</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>First photo is the cover</div>
                  </div>
                  <button onClick={() => setPhotos([])} className="text-[var(--ink-faint)] hover:text-[var(--ink)] p-1"><X size={16} /></button>
                </div>
              ) : (
                <div style={{ border: missPhoto && tried ? "1px dashed var(--stamp-red)" : undefined, borderRadius: 13 }}>
                  <ImageUploader onUpload={(url) => setPhotos((p) => [...p, url])} label="Capture or upload a photo" />
                </div>
              )}
              {photos.length > 0 && photos.length < 6 && (
                <div className="mt-2">
                  <ImageUploader key={photos.length} onUpload={(url) => setPhotos((p) => [...p, url])} label="Add another photo" />
                </div>
              )}
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 7 }}>
                In the app, photos are captured live as ownership proof. On web you can upload one.
              </div>

              {/* Status */}
              <div style={{ marginTop: 20, marginBottom: 9 }}><SectionLabel>Status</SectionLabel></div>
              <Segmented<ItemStatus> value={status} onChange={setStatus}
                options={[{ id: "owned", label: "Owned" }, { id: "wishlist", label: "Wishlist" }, { id: "preorder", label: "Pre-order" }]} />

              {status === "preorder" && (
                <div style={{ background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 13, padding: 14, marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
                    <Clock size={16} style={{ color: "var(--grail-gold-deep)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--grail-gold-deep)" }}>Pre-order details</span>
                  </div>

                  <SectionLabel>Order date</SectionLabel>
                  <input type="date" value={poOrderDate} onChange={(e) => setPoOrderDate(e.target.value)}
                    style={{ ...fieldStyle, marginTop: 9, background: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 13 }} />

                  <div style={{ marginTop: 14 }}><SectionLabel>Release window</SectionLabel></div>
                  <div style={{ marginTop: 9 }}>
                    <ReleaseWindowPicker prec={poPrec} onPrec={setPoPrec} date={poDate} onDate={setPoDate}
                      monthIdx={poMonth} onMonth={setPoMonth} quarter={poQuarter} onQuarter={setPoQuarter} year={poYear} onYear={setPoYear} />
                  </div>

                  <div style={{ marginTop: 14 }}><SectionLabel>Seller / Store</SectionLabel></div>
                  <input value={poSeller} onChange={(e) => setPoSeller(e.target.value)} placeholder="e.g. BBToyStore, Bangalore"
                    style={{ ...fieldStyle, marginTop: 9, background: "var(--paper)", fontSize: 14.5 }} />

                  <div style={{ display: "flex", gap: 11, marginTop: 14 }}>
                    <div style={{ flex: 1 }}>
                      <SectionLabel>Total price (₹)</SectionLabel>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 46, marginTop: 9, padding: "0 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                        <input value={poTotal} onChange={(e) => setPoTotal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric"
                          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <SectionLabel>Deposit paid (₹)</SectionLabel>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 46, marginTop: 9, padding: "0 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                        <input value={poDeposit} onChange={(e) => setPoDeposit(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 11, borderTop: "1px solid var(--grail-gold)" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Balance due</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--stamp-red)" }}>₹{poBalance.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-[var(--stamp-red)] mt-3">{error}</p>}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
              <button
                onClick={handleAdd} disabled={adding}
                className="w-full h-11 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm hover:bg-[var(--stamp-red-deep)] transition-colors disabled:opacity-60"
                style={invalid ? { opacity: 0.6 } : undefined}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Camera size={16} />{adding ? "Adding…" : `Add to ${statusLabel}`}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
