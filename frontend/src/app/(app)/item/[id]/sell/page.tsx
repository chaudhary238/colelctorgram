"use client";

/**
 * List an item you ALREADY own for sale.
 *
 * QA 2026-08-05 §7 — "Sell / Trade this item" used to deep-link into the ADD flow
 * (`/add/catalogue?sku=…&sell=1`). That flow's job is to create an Item, so listing
 * something already on your shelf minted a SECOND copy of it: the listing went live, but
 * "Owned" now showed the figure twice. (Verified in the data: SKU-DSN-001 ×3.)
 *
 * The backend was never the problem — `POST /listings` takes an `item_id`, checks you own
 * it and that its status is "owned", and creates the listing against that row. So this
 * screen collects only what a listing needs (price, condition, terms) and posts it
 * against the existing item. No Item is created, so no duplicate is possible.
 *
 * NOTE: a collector CAN legitimately own two of the same SKU (a spare, or sealed + a
 * loose one), so this is deliberately fixed in the flow rather than with a unique
 * constraint on (user_id, sku) — that constraint would block real double ownership.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tag, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel } from "@/components/ui";
import { MoneyField } from "@/components/forms";
import { symOf } from "@/lib/catalog";

interface SellItem {
  id: string;
  title?: string | null;
  custom_title: string | null;
  sku: string | null;
  status: string;
  is_listed: boolean;
  image_url?: string | null;
  value?: number;
}

// Same four grades as the add form / market filters (QA 11.3).
const CONDITIONS = [
  { id: "sealed_misb", label: "Sealed", sub: "Factory sealed, never opened" },
  { id: "mint", label: "MIB", sub: "Mint in box" },
  { id: "like_new", label: "BIB", sub: "Box in box / outer shipper kept" },
  { id: "good", label: "Loose", sub: "Out of box / displayed" },
];

export default function SellItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<SellItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [price, setPrice] = useState("");
  const [cur, setCur] = useState("INR");
  const [cond, setCond] = useState("");
  const [condNote, setCondNote] = useState("");
  const [shipIncl, setShipIncl] = useState(false);
  const [returns, setReturns] = useState(false);
  const [trade, setTrade] = useState(false);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get<SellItem>(`/items/${id}`)
      .then((d) => { if (alive) setItem(d); })
      .catch(() => { if (alive) setError("Couldn't load that item."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const title = item?.title || item?.custom_title || item?.sku || "Item";
  const missPrice = !price || Number(price) <= 0;
  const missCond = !cond;
  const invalid = missPrice || missCond;

  async function publish() {
    if (invalid) { setTried(true); return; }
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the listing");
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
      <div style={{ height: 22, width: "50%", borderRadius: 6, background: "var(--bone)" }} />
    </div>;
  }

  // Guard rails matching the API: only an item you own, and only once.
  const blocked = !item ? "That item could not be found."
    : item.status !== "owned" ? "Only items you own can be listed — a pre-order can be listed once it arrives."
    : item.is_listed ? "This item is already listed in the Market."
    : null;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback={`/item/${id}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>List for sale</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          </div>
          {!blocked && (
            <button onClick={publish} disabled={saving} style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: invalid ? "var(--bone)" : "var(--stamp-red)", color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13.5, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Listing…" : "List"}
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
          {/* The item being listed — makes it unmistakable that this lists THAT copy,
              rather than adding another one. */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 11, borderRadius: 13, background: "var(--paper-soft)", border: "1px solid var(--border)", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, flexShrink: 0 }}>
              <ProductPhoto tone="ink" src={item?.image_url ?? undefined} ratio="1/1" rounded={9} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                From your collection{item?.sku ? ` · ${item.sku}` : ""}
              </div>
            </div>
          </div>

          <SectionLabel>Asking price</SectionLabel>
          <div style={{ marginTop: 9 }}>
            <MoneyField value={price} onChange={setPrice} cur={cur} onCur={setCur} bad={tried && missPrice} placeholder="Your price" big />
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
            <SectionLabel>Condition</SectionLabel>
            {tried && missCond && <span style={{ fontSize: 11, color: "var(--stamp-red)" }}>Required</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9 }}>
            {CONDITIONS.map((c) => {
              const on = cond === c.id;
              return (
                <button key={c.id} type="button" onClick={() => setCond(c.id)} style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "11px 13px", borderRadius: 11, background: on ? "var(--ink)" : "var(--paper-soft)",
                  border: `1px solid ${on ? "var(--ink)" : tried && missCond ? "var(--stamp-red)" : "var(--border-strong)"}`,
                }}>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: on ? "var(--paper)" : "var(--ink)" }}>{c.label}</span>
                    <span style={{ fontSize: 11.5, color: on ? "rgba(244,239,230,0.7)" : "var(--ink-faint)", marginTop: 1 }}>{c.sub}</span>
                  </span>
                </button>
              );
            })}
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

          {error && <div style={{ marginTop: 12, fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

          <button onClick={publish} disabled={saving} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, marginTop: 20, borderRadius: 13, border: "none", background: invalid ? "var(--bone)" : "var(--stamp-red)", color: invalid ? "var(--ink-ghost)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: saving ? "wait" : "pointer" }}>
            <Tag size={17} />
            {saving ? "Listing…" : `List for ${symOf(cur)} ${price ? Number(price).toLocaleString("en-IN") : "—"}`}
          </button>
        </div>
      )}
    </div>
  );
}
