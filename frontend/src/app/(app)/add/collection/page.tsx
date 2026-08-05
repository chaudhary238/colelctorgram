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
import { Camera, Check, ShieldCheck, Clock, X } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel, Segmented } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { fireToast } from "@/components/gamification";
import { ReleaseWindowPicker } from "@/components/forms";
import { buildPoEta, type PoPrecision } from "@/lib/catalog";

interface Entry {
  sku: string;
  title: string;
  brand: string;
  scale: string | null;
  year: string | null;
  thumbnail_url: string | null;
  est_retail_price: number;
  is_verified?: boolean;
}

// Same four grades as the market filters and the sell form (QA 11.3).
const CONDITIONS = [
  { id: "sealed_misb", label: "Sealed" },
  { id: "mint", label: "MIB" },
  { id: "like_new", label: "BIB" },
  { id: "good", label: "Loose" },
];

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
  const [cond, setCond] = useState("sealed_misb");
  const [paid, setPaid] = useState("");
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

  async function submit() {
    if (saving || !entry) return;
    setSaving(true);
    setError(null);
    try {
      // `sku` carries the identity — no title/brand/category is sent, so this can never
      // create a catalogue entry or a duplicate of one.
      const item = await api.post<{ id: string }>("/items", {
        sku: entry.sku,
        status,
        value: status === "owned" && paid ? Number(paid) * 100 : 0,
        value_currency: "INR",
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
      fireToast(status === "owned" ? "Added to your collection" : "Pre-order saved");
      router.replace(`/item/${item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this item");
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
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
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[entry.brand, entry.scale, entry.sku].filter(Boolean).join(" · ")}
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
              <div style={{ marginTop: 18 }}><SectionLabel>Condition</SectionLabel></div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
                {CONDITIONS.map((c) => {
                  const on = cond === c.id;
                  return (
                    <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                      padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                      border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                      background: on ? "var(--ink)" : "var(--paper-soft)",
                      color: on ? "var(--paper)" : "var(--ink)",
                      fontFamily: "var(--font-body)", fontWeight: on ? 600 : 500, fontSize: 13,
                    }}>{c.label}</button>
                  );
                })}
              </div>

              <div style={{ marginTop: 18 }}><SectionLabel>What you paid (₹)</SectionLabel></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 13px", marginTop: 9, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 17, color: "var(--ink-faint)" }}>₹</span>
                <input value={paid} onChange={(e) => setPaid(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                  style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }} />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Only you see this — it tracks your collection&rsquo;s value.</div>
            </>
          ) : (
            <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: 14, marginTop: 14, display: "flex", flexDirection: "column", gap: 13 }}>
              <div>
                <SectionLabel>Release window</SectionLabel>
                <div style={{ marginTop: 9 }}>
                  <ReleaseWindowPicker prec={poPrec} onPrec={setPoPrec} date={poDate} onDate={setPoDate}
                    monthIdx={poMonth} onMonth={setPoMonth} quarter={poQuarter} onQuarter={setPoQuarter} year={poYear} onYear={setPoYear} />
                </div>
              </div>
              <div>
                <SectionLabel>Ordered from</SectionLabel>
                <input value={poSeller} onChange={(e) => setPoSeller(e.target.value)} placeholder="Store, distributor or seller"
                  style={{ width: "100%", boxSizing: "border-box", height: 42, marginTop: 9, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 11 }}>
                <div style={{ flex: 1 }}>
                  <SectionLabel>Order date</SectionLabel>
                  <input type="date" value={poOrderDate} onChange={(e) => setPoOrderDate(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", height: 42, marginTop: 9, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink)", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <SectionLabel>Total (₹)</SectionLabel>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 42, marginTop: 9, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                    <input value={poTotal} onChange={(e) => setPoTotal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                      style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                  </div>
                </div>
              </div>
              <div>
                <SectionLabel>Deposit paid (₹)</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 6, height: 42, marginTop: 9, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
                  <input value={poDeposit} onChange={(e) => setPoDeposit(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 11, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>Balance due</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--stamp-red)" }}>₹{poBalance.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {error && <div style={{ marginTop: 14, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              height: 50, marginTop: 22, borderRadius: 13, border: "none", cursor: saving ? "wait" : "pointer",
              background: "var(--stamp-red)", color: "var(--paper)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
            }}
          >
            {saving ? "Adding…" : <><Check size={17} strokeWidth={2.6} />Add to {status === "owned" ? "my collection" : "pre-orders"}</>}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.45 }}>
            <Camera size={14} style={{ flexShrink: 0 }} />
            <span>Want to sell it? Add it first, then use <b style={{ color: "var(--ink-soft)" }}>Sell / Trade</b> on the item.</span>
          </div>
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
