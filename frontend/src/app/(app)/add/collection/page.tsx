"use client";

/**
 * Add to collection — add YOUR copy of an entry that already exists in the Scorred DB.
 *
 * Port of design_v7's `AddToCollection.jsx::PickedForm`. Reached from the Database tile's
 * "+", the entry page's "Add to my collection", and anywhere else holding a SKU.
 *
 * It used to deep-link into `/add/catalogue?sku=…`, the three-mode add form. That form's
 * job is to *describe an item* — Category, Brand combobox, Scale chips, Title, Year,
 * Description, per-photo public/private toggles, plus the whole "List for sale" block.
 * None of that applies here: the catalogue already knows what the thing IS, and those
 * fields came back LOCKED, so the screen was mostly read-only pills you had to scroll
 * past (founder QA 2026-08-05: "the form is still old, match with v7").
 *
 * v7's answer, which this follows: the catalogue identity is ONE fixed card at the top,
 * and the form below asks only what's true of *your* copy —
 *
 *     Your photos (optional) · Status (Owned | Pre-order) · Condition · What you paid
 *
 * Selling is deliberately absent: that's `/item/[id]/sell`, which lists the copy you
 * already own instead of minting a second one (QA 2026-08-05 §7).
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, ShieldCheck, Clock, X } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { CategoryChip, ProductPhoto, SectionLabel, Segmented } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { fireToast, fireXpToast } from "@/components/gamification";
import { MoneyField, ReleaseWindowPicker } from "@/components/forms";
import { buildPoEta, conditionsFor, GRADERS, isGradedCondition, type PoPrecision } from "@/lib/catalog";

interface Entry {
  sku: string;
  title: string;
  brand: string;
  category?: string | null;
  scale: string | null;
  year: string | null;
  thumbnail_url: string | null;
  est_retail_price: number;
  is_verified?: boolean;
}

const PHOTO_MAX = 6;

function AddToCollectionInner() {
  const router = useRouter();
  const sku = useSearchParams().get("sku") ?? "";

  const [entry, setEntry] = useState<Entry | null>(null);
  // No `?sku` means there is nothing to fetch, so this never starts in a loading
  // state — deriving it here avoids a synchronous setState inside the effect below.
  const [loading, setLoading] = useState(Boolean(sku));
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState<"owned" | "preorder">("owned");
  // DV8 — condition ids come from the entry's CATEGORY vocabulary (CAT_CONDITIONS).
  // REQUIRED, not seeded: silently defaulting to the first grade let items save with a
  // condition the collector never chose (and the +20 XP "complete" reads unearned).
  const [cond, setCond] = useState("");
  // v8 AddToCollection.jsx:81-85 — grading details appear when a TCG copy is Graded.
  const [grader, setGrader] = useState<string>("PSA");
  const [graderOther, setGraderOther] = useState("");
  const [grade, setGrade] = useState("");
  const [certNo, setCertNo] = useState("");
  const [paid, setPaid] = useState("");
  const [paidCur, setPaidCur] = useState("INR");
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-order tracking (v7 shows these only once Status = Pre-order).
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

  useEffect(() => {
    if (!sku) return;
    let alive = true;
    api.get<Entry>(`/catalogue/${encodeURIComponent(sku)}`)
      .then((d) => { if (alive) setEntry(d); })
      .catch(() => { if (alive) setError("That catalogue entry could not be found."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sku]);

  // DV8 — condition is required for an Owned copy (red * + tried treatment, invalid toast).
  const missCond = status === "owned" && !cond;
  const isGraded = status === "owned" && isGradedCondition(entry?.category, cond);

  async function submit() {
    if (saving || !entry) return;
    if (missCond) { setTried(true); fireToast("Fill the required fields marked *"); return; }
    setSaving(true);
    setError(null);
    try {
      // `sku` carries the identity — no title/brand/category is sent, so this can never
      // create a catalogue entry or a duplicate of one.
      const item = await api.post<{ id: string; add_xp?: number; complete_xp?: number }>("/items", {
        sku: entry.sku,
        status,
        // DV8-10 — the stored id from the category's CAT_CONDITIONS vocabulary.
        condition: status === "owned" ? (cond || null) : null,
        // v8 grading card — only a Graded TCG copy carries slab facts.
        tcg_graded: isGraded,
        tcg_grader: isGraded ? (grader === "Other" ? (graderOther.trim() || null) : grader) : null,
        tcg_grade: isGraded ? (grade || null) : null,
        tcg_cert_no: isGraded ? (certNo.trim() || null) : null,
        value: status === "owned" && paid ? Number(paid) * 100 : 0,
        value_currency: paidCur,
        ...(status === "preorder" ? {
          preorder_eta: buildPoEta(poPrec, { date: poDate, monthIdx: poMonth, quarter: poQuarter, year: poYear }),
          preorder_window_precision: poPrec,
          preorder_seller: poSeller.trim() || null,
          preorder_ordered_at: poOrderDate || null,
          preorder_total: poTotal ? Number(poTotal) * 100 : null,
          preorder_deposit: poDeposit ? Number(poDeposit) * 100 : null,
        } : {}),
      });
      for (const url of photos) {
        await api.post(`/items/${item.id}/photos?url=${encodeURIComponent(url)}`);
      }
      // DV8-02/03 — surface the XP the server actually granted (0 when capped/deduped).
      // fireXpToast/fireToast append to <body>, so they survive the route change below;
      // the second toast is staggered so the two never overlap in the shared slot.
      if (item.add_xp && item.add_xp > 0) fireXpToast(item.add_xp, "Added to collection");
      else fireToast(status === "owned" ? "Added to your collection" : "Pre-order saved");
      if (item.complete_xp && item.complete_xp > 0) {
        const xp = item.complete_xp;
        setTimeout(() => fireXpToast(xp, "Item details complete"), 2400);
      }
      // v8 pops back to the database context after adding (AddToCollection.jsx:118) —
      // the entry page refetches and now reads "In your collection". (v8's pop(2)
      // to the grid was a stale-state workaround its prototype nav needed; ours isn't.)
      router.replace(`/db/${encodeURIComponent(entry.sku)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this item");
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-24">
      {/* Header renders THROUGH the load — the entry arrives from a client fetch, and a
          bare skeleton with no title reads as a broken page for that beat. */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback={sku ? `/db/${encodeURIComponent(sku)}` : "/db"} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Add to collection</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}>
          <div style={{ height: 80, borderRadius: 14, background: "var(--bone)" }} />
          <div style={{ height: 44, borderRadius: 12, background: "var(--bone)", marginTop: 20 }} />
        </div>
      ) : !entry ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--ink-mute)" }}>
            {error ?? (sku ? "Not found." : "No catalogue item was selected.")}
          </div>
          <button onClick={() => router.push("/db")} style={{ marginTop: 16, height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Browse the database
          </button>
        </div>
      ) : (
        <div style={{ padding: 20 }}>
          {/* Catalogue identity — FIXED. These are shared facts; editing them here would
              be editing everyone's record, which is what the locked pills were trying to
              say and saying badly. */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={entry.thumbnail_url ?? undefined} ratio="1/1" rounded={10} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{entry.title}</span>
                {entry.is_verified
                  ? <ShieldCheck size={13} style={{ color: "var(--verified-teal)", flexShrink: 0 }} aria-label="Scorred Verified" />
                  : <Clock size={13} style={{ color: "var(--ink-ghost)", flexShrink: 0 }} aria-label="Pending verification" />}
              </div>
              {/* DV8 — mono meta drops the SKU (v8 PickedForm shows brand · scale only). */}
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[entry.brand, entry.scale && entry.scale !== "—" ? entry.scale : null, entry.year].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "9px 2px 0" }}>
            From the Scorred database — everything below is about your copy.
          </div>

          {/* Your photos — optional, and private by default (DV6-13). */}
          <div style={{ marginTop: 20 }}>
            <SectionLabel>Your photos <span style={{ color: "var(--ink-ghost)", fontWeight: 400 }}>(optional)</span></SectionLabel>
          </div>
          {photos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 9 }}>
              {photos.map((url, i) => (
                <div key={url} style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                  <ProductPhoto tone="ink" src={url} ratio="1/1" rounded={11} />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} aria-label="Remove photo"
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", cursor: "pointer", background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < PHOTO_MAX && (
            <div style={{ marginTop: 9 }}>
              <ImageUploader
                multiple
                maxFiles={PHOTO_MAX - photos.length}
                onUpload={(url) => setPhotos((p) => (p.length < PHOTO_MAX ? [...p, url] : p))}
                label={photos.length ? `Add more (up to ${PHOTO_MAX - photos.length})` : "Add your photos"}
              />
            </div>
          )}
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "8px 2px 0", lineHeight: 1.45 }}>
            Private to you by default — the catalogue already has its own reference image.
          </div>

          {/* Status — replaces the up-front "What are you adding?" mode picker. */}
          <div style={{ margin: "20px 0 9px" }}><SectionLabel>Status</SectionLabel></div>
          <Segmented
            value={status}
            onChange={(v) => setStatus(v as "owned" | "preorder")}
            options={[{ id: "owned", label: "Owned" }, { id: "preorder", label: "Pre-order" }]}
          />

          {status === "owned" ? (
            <>
              {/* DV8 — condition is REQUIRED: red * + inline "Required" + tried red borders. */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18 }}>
                <SectionLabel>Condition</SectionLabel>
                <span style={{ color: tried && missCond ? "var(--stamp-red)" : "var(--ink-ghost)", fontSize: 13, fontWeight: 700 }}>*</span>
                {tried && missCond && <span style={{ fontSize: 11, color: "var(--stamp-red)", marginLeft: "auto", fontWeight: 600 }}>Required</span>}
              </div>
              {/* DV8 — v8 wrapping chips (r10, active --ink fill wt700), hint line BELOW the row.
                  Options are {id,label,hint} objects: render the LABEL, store the id. */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
                {conditionsFor(entry.category).map((c) => {
                  const on = cond === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                      display: "inline-flex", alignItems: "center", padding: "8px 13px", borderRadius: 10, cursor: "pointer",
                      background: on ? "var(--ink)" : "var(--paper-soft)",
                      color: on ? "var(--paper)" : "var(--ink)",
                      border: `1px solid ${on ? "var(--ink)" : tried && missCond ? "var(--stamp-red)" : "var(--border-strong)"}`,
                      fontFamily: "var(--font-body)", fontWeight: on ? 700 : 500, fontSize: 13, whiteSpace: "nowrap", lineHeight: 1,
                    }}>{c.label}</button>
                  );
                })}
              </div>
              {(() => {
                const sel = conditionsFor(entry.category).find((c) => c.id === cond);
                return sel?.hint
                  ? <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>{sel.hint}</div>
                  : null;
              })()}

              {/* v8 grading details card (AddToCollection.jsx:175-199) — TCG + Graded. */}
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
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 9, lineHeight: 1.45 }}>The cert number lets buyers verify the slab on the grader&rsquo;s site.</div>
                </div>
              )}

              {/* DV8 — currency selector joins "What you paid" here too (MoneyField pattern). */}
              <div style={{ marginTop: 18 }}><SectionLabel>What you paid</SectionLabel></div>
              <div style={{ marginTop: 9 }}>
                <MoneyField value={paid} onChange={setPaid} cur={paidCur} onCur={setPaidCur} placeholder="Purchase price" />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Only you see this — it tracks your collection&rsquo;s value.</div>
            </>
          ) : (
            /* DV8 — v8 field order (AddToCollection.jsx:211-278): Order date → Release window →
               Seller/Store → Total | Deposit side-by-side → Balance due; small sentence-case
               labels (11.5 ink-faint), not uppercase SectionLabels. */
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: 14, marginTop: 14, display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Order date</div>
                <input type="date" value={poOrderDate} onChange={(e) => setPoOrderDate(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Release window</div>
                <ReleaseWindowPicker prec={poPrec} onPrec={setPoPrec} date={poDate} onDate={setPoDate}
                  monthIdx={poMonth} onMonth={setPoMonth} quarter={poQuarter} onQuarter={setPoQuarter} year={poYear} onYear={setPoYear} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Seller / Store</div>
                <input value={poSeller} onChange={(e) => setPoSeller(e.target.value)} placeholder="e.g. BBToyStore, Bangalore"
                  style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 11 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Total price</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                    <input value={poTotal} onChange={(e) => setPoTotal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                      style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Deposit paid</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                    <input value={poDeposit} onChange={(e) => setPoDeposit(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                      style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 11, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Balance due</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--stamp-red)" }}>₹{poBalance.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {error && <div style={{ marginTop: 14, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

          {/* DV8 — Info glyph, not Camera (this note has nothing to do with photos). */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 16, fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.45 }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Want to sell it? Add it first, then use <b style={{ color: "var(--ink-soft)" }}>Sell / Trade</b> on the item.</span>
          </div>
        </div>
      )}

      {/* v8 PickedForm keeps the CTA in a sticky FOOTER bar (AddToCollection.jsx:124-129),
          not at the end of the scroll. "Add to Owned" / "Add to Pre-order"; invalid state
          at half opacity but still tappable → toast. */}
      {entry && (
        <div className="ch-cta-bar">
          <button
            onClick={submit}
            disabled={saving}
            type="button"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              height: 48, borderRadius: 13, border: "none", cursor: saving ? "wait" : "pointer",
              background: "var(--stamp-red)", color: "var(--paper)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
              opacity: missCond ? 0.55 : 1,
            }}
          >
            {saving ? "Adding…" : `Add to ${status === "owned" ? "Owned" : "Pre-order"}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddToCollectionPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[680px]" style={{ padding: 20 }} />}>
      <AddToCollectionInner />
    </Suspense>
  );
}
