"use client";

/**
 * DV8-12 — "Edit item": ONE page for edit / list, not three.
 *
 * Formerly "List for sale" only (QA 2026-08-05 §7 — it posts the listing against the
 * EXISTING item so no duplicate copy is ever minted; that stays). Per design_v8
 * (CHANGELOG 2026-08-19 §1) it now also saves the copy's own facts — condition and
 * what you paid — via PATCH /items/{id}, with a "List for sale" toggle:
 *   · toggle ON  → create the listing (existing POST /listings flow) / keep it if live
 *   · toggle OFF → just save the item fields; on an ALREADY-LISTED item it closes the
 *     live listing first (PATCH /listings/{listing_id} {status:"closed"}, DV8-17 — the
 *     item payload now carries listing_id, so the toggle is no longer locked ON)
 * Pre-orders keep their separate editor (ETA/deposit on the item page) — they can't
 * be listed anyway.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tag, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel } from "@/components/ui";
import { MoneyField } from "@/components/forms";
import { fireToast, fireXpToast } from "@/components/gamification";
import { symOf } from "@/lib/catalog";

interface SellItem {
  id: string;
  title?: string | null;
  custom_title: string | null;
  sku: string | null;
  status: string;
  is_listed: boolean;
  listing_id?: string | null; // present when listed — lets the toggle close it
  image_url?: string | null;
  condition?: string | null;
  value?: number | null;
  value_currency?: string;
  complete_xp?: number;
}

// Same four grades as the add form / market filters (QA 11.3). The id is what the
// item and the listing both store (CONDITION_LABEL in ItemPageBody maps it back).
const CONDITIONS = [
  { id: "sealed_misb", label: "Sealed", sub: "Factory sealed, never opened" },
  { id: "mint", label: "MIB", sub: "Mint in box" },
  { id: "like_new", label: "BIB", sub: "Box in box / outer shipper kept" },
  { id: "good", label: "Loose", sub: "Out of box / displayed" },
];

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item facts (saved via PATCH /items/{id})
  const [cond, setCond] = useState("");
  const [paid, setPaid] = useState("");        // what you paid, rupees
  const [cur, setCur] = useState("INR");
  // Listing terms (POST /listings when the toggle is on and nothing is live yet)
  const [sell, setSell] = useState(false);
  const [price, setPrice] = useState("");      // asking price, rupees
  const [condNote, setCondNote] = useState("");
  const [shipIncl, setShipIncl] = useState(false);
  const [returns, setReturns] = useState(false);
  const [trade, setTrade] = useState(false);
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
        setCur(d.value_currency ?? "INR");
        setSell(d.is_listed);
      })
      .catch(() => { if (alive) setError("Couldn't load that item."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const title = item?.title || item?.custom_title || item?.sku || "Item";
  const alreadyListed = !!item?.is_listed;
  const willList = sell && !alreadyListed;
  // Toggle OFF on a listed item → close the live listing when saving (DV8-17).
  const willUnlist = !sell && alreadyListed && !!item?.listing_id;
  const missPrice = !price || Number(price) <= 0;
  const missCond = !cond;
  // Only listing has hard requirements; a plain save may leave gaps (finish later).
  const invalid = willList && (missPrice || missCond);

  async function save() {
    if (invalid) { setTried(true); return; }
    if (saving || !item) return;
    setSaving(true);
    setError(null);
    try {
      // 0) Toggle switched OFF on a listed item → close the live listing first
      //    (DV8-17; the item payload carries listing_id so this works from here now).
      if (willUnlist && item.listing_id) {
        await api.patch(`/listings/${item.listing_id}`, { status: "closed" });
      }
      // 1) The copy's own facts. PATCH uses exclude_none server-side, so only send
      //    what's set — clearing a field back to empty is not a flow this page has.
      const patch: Record<string, unknown> = {};
      if (cond) patch.condition = cond;
      if (paid && Number(paid) > 0) { patch.value = Number(paid) * 100; patch.value_currency = cur; }
      if (Object.keys(patch).length > 0) {
        const out = await api.patch<SellItem>(`/items/${id}`, patch);
        // DV8 — condition + price landing completes the item: +20 XP, exactly once.
        if ((out.complete_xp ?? 0) > 0) fireXpToast(out.complete_xp as number, "Item complete");
      }
      // 2) The market side. ON → create (or keep the live one); OFF → item fields only
      //    (the already-listed OFF case closed the listing in step 0 above).
      if (willList) {
        const listing = await api.post<{ id: string }>("/listings", {
          item_id: id,                       // ← the EXISTING item; nothing new is created
          price: Number(price) * 100,
          currency: cur,
          condition: cond,
          condition_notes: condNote.trim() || null,
          trade_willing: trade,
          shipping_cost: 0,
          ships_nationwide: true,
          terms: [
            shipIncl ? "Shipping included" : null,
            returns ? "Returns accepted" : null,
          ].filter(Boolean) as string[],
        });
        router.replace(`/listing/${listing.id}`);
        return;
      }
      fireToast(willUnlist ? "Listing closed · item saved" : "Item saved");
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
  const blocked = !item ? "That item could not be found."
    : item.status === "preorder" ? "Pre-orders have their own editor — ETA, deposit and seller live on the item page."
    : item.status !== "owned" ? "Only items you own can be edited here."
    : null;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback={`/item/${id}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Edit item</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          </div>
          {!blocked && (
            <button onClick={save} disabled={saving} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: invalid ? "var(--bone)" : "var(--stamp-red)", color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {blocked ? (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>{blocked}</div>
          <button onClick={() => router.back()} style={{ marginTop: 16, height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Go back
          </button>
        </div>
      ) : (
        <div style={{ padding: "16px 20px" }}>
          {/* The copy being edited — makes it unmistakable that this edits THAT copy,
              rather than adding another one. */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 11, borderRadius: 13, background: "var(--paper-soft)", border: "1px solid var(--border)", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={item?.image_url ?? undefined} ratio="1/1" rounded={9} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>From your collection</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SectionLabel>Condition</SectionLabel>
            {tried && willList && missCond && <span style={{ fontSize: 11, color: "var(--stamp-red)" }}>Required to list</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9 }}>
            {CONDITIONS.map((c) => {
              const on = cond === c.id;
              return (
                <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "11px 13px", borderRadius: 11, background: on ? "var(--ink)" : "var(--paper-soft)",
                  border: `1px solid ${on ? "var(--ink)" : tried && willList && missCond ? "var(--stamp-red)" : "var(--border-strong)"}`,
                }}>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: on ? "var(--paper)" : "var(--ink)" }}>{c.label}</span>
                    <span style={{ fontSize: 11.5, color: on ? "rgba(244,239,230,0.7)" : "var(--ink-faint)", marginTop: 1 }}>{c.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* What you paid — private to you (DV8 §1); completes the item for +20 XP. */}
          <div style={{ marginTop: 20 }}><SectionLabel>What you paid</SectionLabel></div>
          <div style={{ marginTop: 9 }}>
            <MoneyField value={paid} onChange={setPaid} cur={cur} onCur={setCur} placeholder="Price paid" />
          </div>

          {/* ── List for sale toggle (DV8-12) ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, padding: "13px 0", borderTop: "1px solid var(--border)", borderBottom: sell ? "none" : "1px solid var(--border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>List for sale</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>
                {alreadyListed
                  ? "Live on the market — switch off to close the listing when you save."
                  : "Off just saves the item; on puts it on the market when you save."}
              </div>
            </div>
            <button type="button" onClick={() => setSell((v) => !v)} aria-pressed={sell}
              style={{ width: 46, height: 27, borderRadius: 999, flexShrink: 0, cursor: "pointer", position: "relative", border: "none", background: sell ? "var(--ink)" : "var(--bone-deep)", transition: "background 160ms" }}>
              <span style={{ position: "absolute", top: 3, left: sell ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "var(--paper)", transition: "left 160ms" }} />
            </button>
          </div>

          {willList && (
            <>
              <div style={{ marginTop: 16 }}><SectionLabel>Asking price</SectionLabel></div>
              <div style={{ marginTop: 9 }}>
                <MoneyField value={price} onChange={setPrice} cur={cur} onCur={setCur} bad={tried && missPrice} placeholder="Your price" big />
              </div>

              <div style={{ marginTop: 20 }}><SectionLabel>Condition notes</SectionLabel></div>
              <textarea value={condNote} onChange={(e) => setCondNote(e.target.value)} rows={2} placeholder="Box wear, paint, joints, what's included…"
                style={{ width: "100%", boxSizing: "border-box", marginTop: 9, padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", resize: "none", outline: "none" }} />

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

              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                <Shield size={15} style={{ color: "var(--verified-teal)", flexShrink: 0, marginTop: 1 }} />
                <span>This lists the copy already in your collection — it won&rsquo;t add a second one. The listing goes live now.</span>
              </div>
            </>
          )}

          {error && <div style={{ marginTop: 12, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

          <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, marginTop: 20, borderRadius: 13, border: "none", background: invalid ? "var(--bone)" : "var(--stamp-red)", color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: saving ? "wait" : "pointer" }}>
            {willList && <Tag size={17} />}
            {saving
              ? "Saving…"
              : willList
              ? `Save & list for ${symOf(cur)} ${price ? Number(price).toLocaleString("en-IN") : "—"}`
              : willUnlist
              ? "Save & close listing"
              : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
