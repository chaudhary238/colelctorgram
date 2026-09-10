"use client";

/**
 * DV8-12 — "Edit item": ONE page for edit / list, not three.
 *
 * Formerly "List for sale" only (QA 2026-08-05 §7 — it posts the listing against the
 * EXISTING item so no duplicate copy is ever minted; that stays). Per design_v8
 * (CHANGELOG 2026-08-19 §1) it saves the copy's own facts — condition, what you paid,
 * description and photos — via PATCH /items/{id}, with a "List for sale" toggle:
 *   · toggle ON  → create the listing (existing POST /listings flow), or PATCH the
 *     live one's price / condition notes when the item is already listed
 *   · toggle OFF → just save the item fields; on an ALREADY-LISTED item it closes the
 *     live listing first (PATCH /listings/{listing_id} {status:"closed"}, DV8-17)
 * Pre-orders keep their separate editor (ETA/deposit on the item page).
 *
 * DV8 line-by-line parity pass (design_v8 AddListing.jsx, ownedItem branch):
 *   · header subtitle = the CATEGORY label (CAT_META), not the item title (:485)
 *   · v8 section order — identity card → Photos → Description → Condition (+ TCG
 *     grading details) → What you paid → List-for-sale card (:496-902)
 *   · Photos/Condition carry v8's required * + red "Required" after a tried save;
 *     photo hint is "N added" / "first = cover" (:706)
 *   · What you paid = "optional / private" hint + "Only you see this." helper (:790-792)
 *   · List for sale is v8's red-tinted CARD (stamp-red-soft bg, red border, 40px red
 *     tag square) that expands INLINE: Asking price* · Condition notes · Shipping
 *     included / Returns accepted rows · Market preview · shield note (:856-902)
 *   · footer CTA = v8 Button size "block" (52/r14/16) — solid stamp-red + tag icon
 *     "Save & list for sale" when the toggle is ON, ink + plus-circle "Save" when OFF
 *     (:487-492 with shared.jsx Button "primary"/"dark")
 *   · toast copy + navigation match v8's submit (:426-429): back to the item page.
 * Kept deviations: MoneyField currency selector (v8 mock is functionally ₹-first) and
 * condition REQUIRED, never pre-seeded with a default.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tag as TagIcon, Shield, X, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel, Tag, CategoryChip } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { MoneyField } from "@/components/forms";
import { fireToast, fireXpToast } from "@/components/gamification";
import { symOf, conditionsFor, conditionLabel, CAT_META, GRADERS, isGradedCondition } from "@/lib/catalog";

interface SellItem {
  id: string;
  title?: string | null;
  custom_title: string | null;
  sku: string | null;
  status: string;
  is_listed: boolean;
  listing_id?: string | null; // present when listed — edit / close the live listing
  listing_price?: number | null;
  listing_currency?: string | null;
  image_url?: string | null;
  images?: string[];
  photos?: { id: string; url: string }[]; // ids beside urls — per-tile delete (v8 :724)
  brand?: string | null;
  scale?: string | null;
  release_year?: number | null;
  category?: string | null;
  description?: string | null;
  condition?: string | null;
  value?: number | null;
  value_currency?: string;
  complete_xp?: number;
  tcg_graded?: boolean;
  tcg_grader?: string | null;
  tcg_grade?: string | null;
  tcg_cert_no?: string | null;
}

interface ListingPrefill {
  price: number;
  currency: string;
  condition_notes: string | null;
  terms: string[];
}

const PHOTO_MAX = 8; // MAX_ITEM_PHOTOS server-side (DV8)

// v8 label row (design_v8 AddListing.jsx Lbl, :71-80) — SectionLabel + required
// asterisk (red when missing) + right-aligned grey hint, swapped for a red
// "Required" once a save was tried.
function Lbl({ children, required, missing, hint }: {
  children: React.ReactNode; required?: boolean; missing?: boolean; hint?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
      <SectionLabel>{children}</SectionLabel>
      {required && <span style={{ color: missing ? "var(--stamp-red)" : "var(--ink-ghost)", fontSize: 13, fontWeight: 700 }}>*</span>}
      {hint && !missing && <span style={{ fontSize: 11, color: "var(--ink-ghost)", marginLeft: "auto" }}>{hint}</span>}
      {missing && <span style={{ fontSize: 11, color: "var(--stamp-red)", marginLeft: "auto", fontWeight: 600 }}>Required</span>}
    </div>
  );
}

// v8 shared Toggle — ON is FOREST green (design_v8 AddToCollection.jsx:344-353):
// 46×28 pill, 22px paper knob at 3/21, shadow-1.
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} style={{
      width: 46, height: 28, borderRadius: 999, flexShrink: 0, cursor: "pointer", position: "relative",
      border: "none", background: on ? "var(--forest)" : "var(--bone-deep)", transition: "background 160ms",
    }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms", boxShadow: "var(--shadow-1)" }} />
    </button>
  );
}

// v8 ToggleRow (design_v8 AddListing.jsx:108-118).
function ToggleRow({ title, sub, on, onToggle, last }: {
  title: string; sub: string; on: boolean; onToggle: () => void; last?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <Toggle on={on} onClick={onToggle} />
    </div>
  );
}

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();

  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item facts (saved via PATCH /items/{id})
  const [cond, setCond] = useState("");
  const [paid, setPaid] = useState("");         // what you paid, rupees
  const [paidCur, setPaidCur] = useState("INR"); // v8 keeps paid + asking currencies independent (:234/:273)
  const [desc, setDesc] = useState("");
  const [descDirty, setDescDirty] = useState(false);
  // TCG grading details (v8 AddListing.jsx:765-789; PATCH /items tcg_* fields)
  const [grader, setGrader] = useState("PSA");
  const [graderOther, setGraderOther] = useState("");
  const [grade, setGrade] = useState("");
  const [certNo, setCertNo] = useState("");
  // Photos — the item's existing uploads (with ids, so v8 :724's per-tile delete
  // works on them via DELETE /items/{id}/photos/{photo_id}) plus any added here.
  const [photoRows, setPhotoRows] = useState<{ id: string; url: string }[]>([]);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const photos = photoRows.map((p) => p.url);
  // Listing terms (POST /listings when the toggle is on and nothing is live yet)
  const [sell, setSell] = useState(false);
  const [price, setPrice] = useState("");       // asking price, rupees
  const [priceCur, setPriceCur] = useState("INR");
  const [condNote, setCondNote] = useState("");
  const [shipIncl, setShipIncl] = useState(false);
  const [returns, setReturns] = useState(false);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get<SellItem>(`/items/${id}`)
      .then((d) => {
        if (!alive) return;
        setItem(d);
        setCond(d.condition ?? "");
        setPaid(d.value != null && d.value > 0 ? String(Math.round(d.value / 100)) : "");
        setPaidCur(d.value_currency ?? "INR");
        setDesc(d.description ?? "");
        setPhotoRows(d.photos ?? (d.images ?? []).map((url) => ({ id: "", url })));
        // v8 "Sell" entries arrive with the toggle pre-ON (forSale: true, :266) —
        // the manage sheet's "List for sale" row deep-links here with ?list=1.
        setSell(d.is_listed || (!d.is_listed && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("list") === "1"));
        if (d.tcg_grader) {
          if ((GRADERS as readonly string[]).includes(d.tcg_grader)) setGrader(d.tcg_grader);
          else { setGrader("Other"); setGraderOther(d.tcg_grader); }
        }
        setGrade(d.tcg_grade ?? "");
        setCertNo(d.tcg_cert_no ?? "");
        // Already listed → v8 shows the listing terms prefilled inside the open card
        // (editListing branch, :269-289). Seed price from the item payload, then pull
        // condition notes + terms off the live listing itself.
        if (d.is_listed && d.listing_id) {
          if (d.listing_price != null) setPrice(String(Math.round(d.listing_price / 100)));
          if (d.listing_currency) setPriceCur(d.listing_currency);
          api.get<ListingPrefill>(`/listings/${d.listing_id}`)
            .then((l) => {
              if (!alive) return;
              setPrice(l.price ? String(Math.round(l.price / 100)) : "");
              setPriceCur(l.currency ?? "INR");
              setCondNote(l.condition_notes ?? "");
              const terms = l.terms ?? [];
              setShipIncl(terms.includes("Shipping included"));
              setReturns(terms.includes("Returns accepted"));
            })
            .catch(() => {}); // prefill only — the page still works without it
        }
      })
      .catch(() => { if (alive) setError("Couldn't load that item."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const title = item?.title || item?.custom_title || item?.sku || "Item";
  const category = item?.category ?? null;
  // v8 header subtitle is the CATEGORY label — "Action figure" etc. (:485 subtitle={meta.label})
  const catLabel = (CAT_META[category ?? ""] ?? CAT_META.figures).label;
  const conds = conditionsFor(category);
  const isGraded = isGradedCondition(category, cond);
  const alreadyListed = !!item?.is_listed;
  const willList = sell && !alreadyListed;
  const willEditListing = sell && alreadyListed && !!item?.listing_id;
  // Toggle OFF on a listed item → close the live listing when saving (DV8-17).
  const willUnlist = !sell && alreadyListed && !!item?.listing_id;
  const allPhotos = [...photos, ...newPhotos];
  // v8 validation (:351-359): photo + condition always required on an in-hand copy;
  // price only once the List-for-sale toggle is ON.
  const missPhoto = allPhotos.length === 0;
  const missCond = !cond;
  const missPrice = !price || Number(price) <= 0;
  const invalid = missPhoto || missCond || (sell && missPrice);
  // v8 condition display label (:362-369) — a graded slab reads "PSA 9", not "Graded".
  const condLabel = (() => {
    if (!cond) return "";
    if (isGraded) {
      const house = grader === "Other" ? (graderOther.trim() || "Graded") : grader;
      return grade.trim() ? `${house} ${grade.trim()}` : `${house} graded`;
    }
    return conditionLabel(cond, category) ?? cond;
  })();

  async function save() {
    if (invalid) { setTried(true); fireToast("Fill the required fields marked *"); return; }
    if (saving || !item) return;
    setSaving(true);
    setError(null);
    try {
      // 0) Toggle switched OFF on a listed item → close the live listing first (DV8-17).
      if (willUnlist && item.listing_id) {
        await api.patch(`/listings/${item.listing_id}`, { status: "closed" });
      }
      // 1) Photos added on this page — attach before the PATCH so photo_count is fresh.
      for (const url of newPhotos) {
        await api.post(`/items/${item.id}/photos?url=${encodeURIComponent(url)}`);
      }
      // 2) The copy's own facts. PATCH uses exclude_none server-side, so only send
      //    what's set — clearing a field back to empty is not a flow this page has.
      const patch: Record<string, unknown> = {};
      if (cond) patch.condition = cond;
      if (paid && Number(paid) > 0) { patch.value = Number(paid) * 100; patch.value_currency = paidCur; }
      if (descDirty && desc.trim()) patch.description = desc.trim();
      if (category === "tcg" && cond) {
        patch.tcg_graded = isGraded;
        if (isGraded) {
          const house = grader === "Other" ? graderOther.trim() : grader;
          if (house) patch.tcg_grader = house;
          if (grade.trim()) patch.tcg_grade = grade.trim();
          if (certNo.trim()) patch.tcg_cert_no = certNo.trim();
        }
      }
      if (Object.keys(patch).length > 0) {
        const out = await api.patch<SellItem>(`/items/${id}`, patch);
        // DV8 — condition + price landing completes the item: +20 XP, exactly once.
        if ((out.complete_xp ?? 0) > 0) fireXpToast(out.complete_xp as number, "Item complete");
      }
      // 3) The market side. ON → create, or patch the live listing in place (v8
      //    updateListing, :420); OFF → item fields only (already-listed OFF closed
      //    the listing in step 0 above).
      if (willEditListing && item.listing_id) {
        // v8 :407-420 saves every listing term; the API now accepts them all.
        await api.patch(`/listings/${item.listing_id}`, {
          price: Number(price) * 100,
          currency: priceCur,
          condition: cond || undefined,
          condition_notes: condNote.trim() || null,
          terms: [
            shipIncl ? "Shipping included" : null,
            returns ? "Returns accepted" : null,
          ].filter(Boolean) as string[],
        });
      } else if (willList) {
        await api.post<{ id: string }>("/listings", {
          item_id: id,                       // ← the EXISTING item; nothing new is created
          price: Number(price) * 100,
          currency: priceCur,
          condition: cond,
          condition_notes: condNote.trim() || null,
          // DV8 — v8 dropped the "Open to trades" row; always false on new listings.
          trade_willing: false,
          shipping_cost: 0,
          // DV8 — was missing here: sellers' listings had no origin city on this path.
          ships_from_city: user?.city ?? null,
          ships_nationwide: true,
          terms: [
            shipIncl ? "Shipping included" : null,
            returns ? "Returns accepted" : null,
          ].filter(Boolean) as string[],
        });
      }
      // v8 toast copy incl. the two-line subs (:426-429) — then back to the item page.
      if (sell && alreadyListed) fireToast("Listing updated", "Buyers see the new terms right away");
      else if (sell) fireToast("Listed for sale");
      else if (willUnlist) fireToast("Unlisted — stays in your collection", "Relist puts it back at these terms");
      else fireToast("Saved", "Condition, price and photos updated");
      router.replace(`/item/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the item");
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
      <div style={{ height: 22, width: "50%", borderRadius: 6, background: "var(--bone)" }} />
    </div>;
  }

  // Guard rails matching the API: only an in-hand copy is editable here.
  let blocked: string | null = null;
  if (!item) blocked = "That item could not be found.";
  else if (item.status === "preorder") blocked = "Pre-orders have their own editor — ETA, deposit and seller live on the item page.";
  else if (item.status !== "owned") blocked = "Only items you own can be edited here.";

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      {/* v8 DetailHeader (Chrome.jsx:83-117) — 19/700 display title, 12 faint subtitle
          showing the item's CATEGORY, not its title. */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback={`/item/${id}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Edit item</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1 }}>{catLabel}</div>
          </div>
          {/* ONE CTA — the sticky footer below (DV8); the duplicate header Save is gone. */}
        </div>
      </div>

      {blocked ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>{blocked}</div>
          <button type="button" onClick={() => router.back()} style={{ marginTop: 16, height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Go back
          </button>
        </div>
      ) : (
        <>
        <div style={{ padding: "14px 16px 22px" }}>
          {/* v8 identity summary card — 54px photo, 14.5/700 title, mono brand·scale·year
              (design_v8 AddListing.jsx:496-508). It edits THAT copy; nothing new is added. */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
              <div style={{ width: 54, height: 54, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <ProductPhoto tone="ink" src={item?.image_url ?? undefined} ratio="1/1" rounded={10} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-faint)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {[item?.brand, item?.scale && item.scale !== "—" ? item.scale : null, item?.release_year].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            {/* v8 :509-516 — "Fix item details" needs identity fields on PATCH /items; text only until then. */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "9px 2px 0" }}>
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)", flex: 1, lineHeight: 1.45 }}>
                From the Scorred database — details below are about your copy.
              </span>
            </div>
          </div>

          {/* Photos — v8 :705-737. Required, "N added" hint, 72px tiles, grid gap 9.
              Every tile deletes (v8 :724) — existing uploads via the photos API. */}
          <div style={{ marginTop: 22 }}>
            <Lbl required missing={tried && missPhoto} hint={allPhotos.length ? `${allPhotos.length} added` : "first = cover"}>Photos</Lbl>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 4 }}>
            {allPhotos.map((url, i) => (
              <div key={url} style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <ProductPhoto tone="ink" src={url} ratio="1/1" rounded={10} />
                {i === 0 && (
                  <span style={{ position: "absolute", bottom: 6, left: 6, background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 5px", borderRadius: 4 }}>
                    Cover
                  </span>
                )}
                {/* v8 :724 — every tile deletes. Session-queued photos just leave the
                    array; existing uploads hit DELETE (optimistic, restored on failure).
                    Legacy rows without an id (pre-photos-payload cache) keep no X. */}
                {(i >= photos.length || photoRows[i]?.id) && (
                  <button type="button" aria-label="Remove photo" onClick={() => {
                    if (i >= photos.length) { setNewPhotos((p) => p.filter((u) => u !== url)); return; }
                    const row = photoRows[i];
                    setPhotoRows((rows) => rows.filter((r) => r !== row));
                    api.delete(`/items/${id}/photos/${row.id}`).catch(() => {
                      setPhotoRows((rows) => {
                        const next = [...rows]; next.splice(i, 0, row); return next;
                      });
                      fireToast("Couldn't remove that photo");
                    });
                  }} style={{
                    position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", cursor: "pointer",
                    background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <X size={11} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
            {allPhotos.length < PHOTO_MAX && (
              <ImageUploader
                tile
                multiple
                bad={tried && missPhoto}
                maxFiles={PHOTO_MAX - allPhotos.length}
                onUpload={(url) => setNewPhotos((p) => [...p, url])}
                label="Add"
              />
            )}
          </div>

          {/* Description — v8 :739-742; your copy's notes; PATCHes /items/{id}. */}
          <div style={{ marginTop: 18 }}><Lbl hint="optional">Description</Lbl></div>
          <textarea value={desc} onChange={(e) => { setDesc(e.target.value); setDescDirty(true); }} rows={3} placeholder="What makes this one special? Accessories, edition, where you got it..."
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", resize: "none", outline: "none" }} />

          {/* Condition — v8 :744-763. Required always; the category's OWN vocabulary
              (DV8-10). Red asterisk + "Required" + red chip borders once tried. */}
          <div style={{ marginTop: 16 }}>
            <Lbl required missing={tried && missCond}>Condition</Lbl>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {conds.map((c) => {
                const on = cond === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                    display: "inline-flex", alignItems: "center", padding: "8px 13px", borderRadius: 10, cursor: "pointer",
                    background: on ? "var(--ink)" : "var(--paper-soft)", color: on ? "var(--paper)" : "var(--ink)",
                    border: `1px solid ${on ? "var(--ink)" : tried && missCond ? "var(--stamp-red)" : "var(--border-strong)"}`,
                    fontFamily: "var(--font-body)", fontWeight: on ? 700 : 500, fontSize: 13, whiteSpace: "nowrap", lineHeight: 1,
                  }}>{c.label}</button>
                );
              })}
            </div>
            {(() => {
              const picked = conds.find((c) => c.id === cond);
              return picked?.hint ? <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>{picked.hint}</div> : null;
            })()}

            {/* TCG grading details — v8 :765-789 (PSA/BGS/CGC/Other + grade + cert no). */}
            {isGraded && (
              <div style={{ marginTop: 12, padding: 13, borderRadius: 13, border: "1px solid var(--border-strong)", background: "var(--bone)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Grading details</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                  {GRADERS.map((g) => (
                    <CategoryChip key={g} active={grader === g} onClick={() => setGrader(g)}>{g}</CategoryChip>
                  ))}
                </div>
                {grader === "Other" && (
                  <input value={graderOther} onChange={(e) => setGraderOther(e.target.value)} placeholder="Grading company"
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

            {/* What you paid — v8 :790-792: "optional / private" hint, "Only you see
                this." helper; completes the item for +20 XP. */}
            <div style={{ marginTop: 18 }}><Lbl hint="optional / private">What you paid</Lbl></div>
            <MoneyField value={paid} onChange={setPaid} cur={paidCur} onCur={setPaidCur} placeholder="Purchase price" />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "7px 2px 0" }}>Only you see this.</div>
          </div>

          {/* ── List for sale — v8's red-tinted card (:856-902): stamp-red-soft tint,
              red border, 40px red tag square, expands INLINE when ON. ── */}
          <div style={{ marginTop: 24, borderRadius: 16, border: `1px solid ${sell ? "var(--stamp-red)" : "var(--border)"}`, background: sell ? "var(--stamp-red-soft)" : "var(--paper-soft)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 15 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: sell ? "var(--stamp-red)" : "var(--bone-deep)", color: sell ? "var(--paper)" : "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TagIcon size={20} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>List for sale</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>Show it in the Market — goes live instantly.</div>
              </div>
              <Toggle on={sell} onClick={() => setSell((v) => !v)} />
            </div>
            {sell && (
              <div style={{ padding: "2px 15px 16px", borderTop: "1px solid var(--stamp-red)" }}>
                <div style={{ marginTop: 15 }}><Lbl required missing={tried && missPrice}>Asking price</Lbl></div>
                <MoneyField value={price} onChange={setPrice} cur={priceCur} onCur={setPriceCur} bad={tried && missPrice} placeholder="Your price" big />

                <div style={{ marginTop: 16 }}><Lbl hint="optional">Condition notes</Lbl></div>
                <textarea value={condNote} onChange={(e) => setCondNote(e.target.value)} rows={2} placeholder="Box wear, paint, joints, what's included..."
                  style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", resize: "none", outline: "none" }} />

                {/* Exactly two toggle rows — v8 dropped "Open to trades" (:876-879). */}
                <div style={{ marginTop: 8, padding: "0 1px" }}>
                  <ToggleRow title="Shipping included" sub="Price covers delivery" on={shipIncl} onToggle={() => setShipIncl((v) => !v)} />
                  <ToggleRow title="Returns accepted" sub="Buyer can return within a short window" on={returns} onToggle={() => setReturns((v) => !v)} last />
                </div>

                {/* Live market preview (v8 :880-894). */}
                <div style={{ marginTop: 14 }}><SectionLabel>Market preview</SectionLabel></div>
                <div style={{ display: "flex", gap: 11, alignItems: "center", marginTop: 10, padding: 10, borderRadius: 13, background: "var(--paper)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
                    <ProductPhoto tone="ink" src={allPhotos[0] ?? item?.image_url ?? undefined} ratio="1/1" rounded={9} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{symOf(priceCur)} {price ? Number(price).toLocaleString("en-IN") : "—"}</span>
                      {condLabel && <Tag>{condLabel}</Tag>}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 13, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                  <Shield size={15} strokeWidth={1.75} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
                  <span>Listing goes live now. Add clear photos so buyers know exactly what they&rsquo;re getting.</span>
                </div>
              </div>
            )}
          </div>

          {error && <div style={{ marginTop: 12, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}
        </div>

        {/* ONE sticky footer CTA — v8 :487-492: Button size "block" (52 / r14 / 16 /
            600), solid stamp-red + tag-18 "Save & list for sale" when the toggle is
            ON, ink + plus-circle-18 "Save" when OFF; 0.5 opacity while invalid. */}
        <div
          className="sticky z-10 bg-[var(--paper)] border-t border-[var(--border)] bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-0"
          style={{ padding: "11px 16px" }}
        >
          <button onClick={save} disabled={saving} type="button" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 52, padding: "0 22px",
            borderRadius: 14, border: `1px solid ${sell ? "var(--stamp-red)" : "var(--ink)"}`,
            background: sell ? "var(--stamp-red)" : "var(--ink)", color: "var(--paper)",
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, lineHeight: 1, whiteSpace: "nowrap",
            cursor: saving ? "wait" : "pointer", opacity: invalid ? 0.5 : 1,
          }}>
            {sell ? <TagIcon size={18} strokeWidth={1.75} /> : <PlusCircle size={18} strokeWidth={1.75} />}
            {saving ? "Saving…" : sell ? "Save & list for sale" : "Save"}
          </button>
        </div>
        </>
      )}
    </div>
  );
}
