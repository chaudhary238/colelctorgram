"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Tag, PlusCircle, Shield, Clock, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { Segmented, SectionLabel, ProductPhoto, CategoryChip } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyField, ReleaseWindowPicker } from "@/components/forms";
import {
  ADD_CATEGORIES, CAT_SCALES, CAT_BRANDS, CAT_META, symOf, buildPoEta,
  TCG_LANGUAGES, TCG_PRODUCT_TYPES, TCG_GRADERS, type PoPrecision,
} from "@/lib/catalog";

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

  const [cat, setCat] = useState("figures");
  const [photos, setPhotos] = useState<string[]>([]);
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

  // acquisition
  const [acq, setAcq] = useState<"inhand" | "preorder">("inhand");
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
  const canSell = acq === "inhand"; // pre-orders can't be listed yet

  const brandList = CAT_BRANDS[cat] ?? CAT_BRANDS.figures;
  const brandMatches = useMemo(() => {
    const q = brand.trim().toLowerCase();
    if (!q) return brandList.slice(0, 6);
    return brandList.filter((b) => b.toLowerCase().includes(q)).slice(0, 6);
  }, [brand, brandList]);
  const exactBrand = brandList.some((b) => b.toLowerCase() === brand.trim().toLowerCase());

  const changeCat = (id: string) => { setCat(id); setScale(""); setScaleOther(""); setSize(""); setTcgLang(""); setTcgFormat(""); setTcgGraded(false); setTcgGrade(""); };
  const changeAcq = (mode: string) => { setAcq(mode as "inhand" | "preorder"); if (mode === "preorder") setForSale(false); };

  const miss = {
    photo: photos.length === 0,
    title: !title.trim(),
    brand: !brand.trim(),
    scale: usesScale && (scale === "Other" ? !scaleOther.trim() : !scale),
    cond: acq === "inhand" && !cond,
    price: canSell && forSale && !price.trim(),
  };
  const invalid = Object.values(miss).some(Boolean);
  const condLabel = CONDITIONS.find((c) => c.id === cond)?.label ?? (acq === "preorder" ? "Pre-order" : "");

  const rmPhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (invalid) { setTried(true); return; }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const isPreorder = acq === "preorder";
      const item = await api.post<{ id: string }>("/items", {
        custom_title: title.trim(),
        brand: brand.trim() || null,
        scale: usesScale ? (scale === "Other" ? scaleOther.trim() : scale) : (size.trim() || null),
        release_year: year ? Number(year) : null,
        description: desc.trim() || null,
        category: cat,
        status: isPreorder ? "preorder" : "owned",
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
      // Attach uploaded photos (oldest-first = cover order). url is a query param.
      for (const url of photos) {
        await api.post(`/items/${item.id}/photos?url=${encodeURIComponent(url)}`);
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

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/market" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <X size={18} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Add an item</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{meta.label}</div>
          </div>
          <button onClick={submit} disabled={submitting} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: invalid ? "var(--bone)" : forSale ? "var(--stamp-red)" : "var(--ink)", color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "Saving…" : forSale ? "List" : "Add"}
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

        {/* Photos */}
        <Label required missing={tried && miss.photo} hint={photos.length ? `${photos.length} added · first = cover` : "first = cover"}>Photos</Label>
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 11 }}>
            {photos.map((url, i) => (
              <div key={i} style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                <ProductPhoto tone="ink" src={url} ratio="1/1" rounded={13} />
                {i === 0 && (
                  <span style={{ position: "absolute", bottom: 6, left: 6, background: "var(--ink)", color: "var(--paper)", fontWeight: 700, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 5px", borderRadius: 4 }}>Cover</span>
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
        {photos.length < 8 && (
          // Key by count so each add remounts a fresh, empty uploader (it keeps its own preview).
          <ImageUploader key={photos.length} onUpload={(url) => setPhotos((p) => [...p, url])} label={photos.length ? "Add another photo" : "Add a photo"} />
        )}

        {/* Title */}
        <Label required missing={tried && miss.title}>Title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={meta.titleEg} style={{ ...fieldStyle, borderColor: tried && miss.title ? "var(--stamp-red)" : "var(--border-strong)" }} />

        {/* Brand (autocomplete) */}
        <Label required missing={tried && miss.brand}>Brand</Label>
        <div style={{ position: "relative" }}>
          <input value={brand} onChange={(e) => { setBrand(e.target.value); setBrandFocus(true); }}
            onFocus={() => setBrandFocus(true)} onBlur={() => setTimeout(() => setBrandFocus(false), 120)}
            placeholder={`Start typing — ${meta.brandEg}`} style={{ ...fieldStyle, borderColor: tried && miss.brand ? "var(--stamp-red)" : "var(--border-strong)" }} />
          {brandFocus && (brandMatches.length > 0 || (brand.trim() && !exactBrand)) && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "var(--paper)", border: "1px solid var(--border-strong)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-3)" }}>
              {brand.trim() && !exactBrand && (
                <button type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(brand.trim()); setBrandFocus(false); }} style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "11px 13px", background: "transparent", border: "none", borderBottom: brandMatches.length ? "1px solid var(--border)" : "none",
                }}>
                  <Plus size={15} strokeWidth={2.4} style={{ color: "var(--stamp-red)" }} />
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>Use &ldquo;<b>{brand.trim()}</b>&rdquo;</span>
                </button>
              )}
              {brandMatches.map((b, i) => (
                <button key={b} type="button" onMouseDown={(e) => { e.preventDefault(); setBrand(b); setBrandFocus(false); }} style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "11px 13px", background: brand.trim().toLowerCase() === b.toLowerCase() ? "var(--bone)" : "transparent",
                  border: "none", borderBottom: i < brandMatches.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <Tag size={14} style={{ color: "var(--ink-faint)" }} />
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>{b}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scale (or Size for designer) */}
        {usesScale ? (
          <>
            <Label required missing={tried && miss.scale}>Scale</Label>
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

        <Label hint="optional">Release year</Label>
        <input value={year} onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} inputMode="numeric" placeholder="e.g. 2022" style={{ ...fieldStyle, height: 42, fontSize: 14.5, fontFamily: "var(--font-mono)" }} />

        <Label hint="optional">Description</Label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="What makes this one special? Accessories, edition, where you got it…" style={{ ...fieldStyle, height: "auto", padding: "11px 13px", lineHeight: 1.5, resize: "none", fontSize: 14.5 }} />

        {/* Acquisition */}
        <Label>How did you get it?</Label>
        <Segmented value={acq} onChange={changeAcq} options={[{ id: "inhand", label: "In hand" }, { id: "preorder", label: "Pre-order" }]} />

        {acq === "inhand" ? (
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
                    <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${on ? "var(--paper)" : "var(--border-strong)"}`, background: on ? "var(--paper)" : "transparent" }}>
                      {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink)" }} />}
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
        ) : (
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

        <button onClick={submit} disabled={submitting} type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
          height: 48, marginTop: 22, borderRadius: 12, border: "none",
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
