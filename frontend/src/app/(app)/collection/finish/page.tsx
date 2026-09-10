"use client";

/**
 * Finish your items — batch-complete flow for quick-added items (DV8-03, ported from
 * design_v8 app/CompleteItems.jsx).
 *
 * Quick-add (the "+" on a Database tile) creates an item with no condition and no price.
 * This screen loads MY incomplete items and shows ONE at a time: a fixed catalogue card,
 * category-specific condition chips (CAT_CONDITIONS — options are {id,label,hint} OBJECTS;
 * render `.label`, the v8 crash fix), and a price input. Pre-orders swap condition for a
 * structured ETA window (Month / Quarter / Year / Not announced) plus the total, so the
 * PO calendar can still bucket them. Two fields per item on purpose — finishing 6 items
 * should take under a minute; anything else belongs on the item page.
 *
 * `?item=<id>` is single-item edit mode (the profile tile's gold "Add price →" marker):
 * save that one item, then router.back().
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel, Tag } from "@/components/ui";
import { fireToast, fireXpToast } from "@/components/gamification";
import { conditionsFor, conditionLabel, buildPoEta, MONTH_FULL, PO_MONTHS, PO_YEARS, type PoPrecision } from "@/lib/catalog";

interface CollectionItem {
  id: string;
  sku: string | null;
  custom_title: string | null;
  title?: string | null;
  brand?: string | null;
  release_year?: number | null;
  status: string;
  condition?: string | null;
  value: number | null; // paise
  is_complete?: boolean;
  image_url?: string | null;
  preorder_eta?: string | null;
  // DV8 §6#35 — owner-only structured pre-order facts, so a `?item=` single edit
  // seeds the window/deposit instead of silently discarding them on save.
  preorder_window_precision?: string | null;
  preorder_total?: number | null;   // paise
  preorder_deposit?: number | null; // paise
  // v8 CompleteItems.jsx:95 — the catalogue anchor for the price placeholder (paise).
  est_value?: number | null;
}

/* SKU → category/tone — same mapping the profile grid uses (no catalogue join yet). */
const SKU_CAT: Record<string, { key: string; label: string; tone: string }> = {
  FIG: { key: "figures", label: "Action Figures", tone: "red" },
  KIT: { key: "kits", label: "Kits & Lego", tone: "forest" },
  DSN: { key: "designer", label: "Designer & Blind Boxes", tone: "plum" },
  DCS: { key: "diecast", label: "Diecast", tone: "teal" },
  TCG: { key: "tcg", label: "Trading Cards", tone: "gold" },
};
function catForItem(it: CollectionItem) {
  const m = (it.sku ?? "").match(/SKU-([A-Z]+)-/);
  return (m && SKU_CAT[m[1]]) || { key: "figures", label: "Other", tone: "bone" };
}
const titleOf = (it: CollectionItem) => it.title || it.custom_title || it.sku || "Item";

/* The per-item draft. `price`/`deposit` are RUPEES as typed; converted to paise on
   save. For pre-orders `price` is the order total. */
interface Draft {
  cond: string;
  price: string;
  deposit: string;
  prec: PoPrecision;
  monthIdx: string;
  quarter: string;
  year: string;
}
function draftFromItem(it: CollectionItem | undefined): Draft {
  // v8 draftFromItem (:134-146) — seed EVERYTHING the row already knows, so a
  // `?item=` single edit of a pre-order can't discard its window/deposit on save.
  // The eta string parses back by precision: "Mar 2026" (month), "Q2 2026"
  // (quarter), "2026" (year); TBD carries no date.
  let prec: PoPrecision = "month";
  let monthIdx = "";
  let quarter = "";
  let year = ""; // empty → the "Year" placeholder option, never a pre-picked 2026 (§6#38)
  if (it?.status === "preorder") {
    const stored = it.preorder_window_precision as PoPrecision | undefined;
    // The finish chips carry no "date" precision — an exact date edits as its month.
    prec = !stored || stored === "date" ? "month" : stored;
    const eta = it.preorder_eta ?? "";
    if (prec === "month") {
      const m = /([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(eta); // "Mar 2026" / "12 Mar 2026"
      if (m) {
        const idx = PO_MONTHS.findIndex((x) => x === m[1]);
        if (idx >= 0) monthIdx = String(idx);
        year = m[2];
      }
    } else if (prec === "quarter") {
      const m = /Q([1-4])(?:\s+(\d{4}))?/.exec(eta);
      if (m) { quarter = m[1]; year = m[2] ?? ""; }
    } else if (prec === "year") {
      const m = /(\d{4})/.exec(eta);
      if (m) year = m[1];
    }
  }
  const paise = it?.status === "preorder" ? (it.preorder_total ?? it.value) : it?.value;
  return {
    cond: it?.condition ?? "",
    price: paise ? String(Math.round(paise / 100)) : "",
    deposit: it?.preorder_deposit ? String(Math.round(it.preorder_deposit / 100)) : "",
    prec,
    monthIdx,
    quarter,
    year,
  };
}
function draftReady(it: CollectionItem, d: Draft): boolean {
  const hasPrice = !!d.price && parseInt(d.price, 10) > 0;
  if (it.status !== "preorder") return !!d.cond && hasPrice;
  const dateOk =
    d.prec === "tbd" ? true
    : d.prec === "quarter" ? !!d.quarter && !!d.year
    : d.prec === "year" ? !!d.year
    : d.monthIdx !== "" && !!d.year; // month
  return dateOk && hasPrice;
}

const fieldStyle: React.CSSProperties = {
  boxSizing: "border-box", height: 46, padding: "0 13px", borderRadius: 11,
  border: "1px solid var(--border-strong)", background: "var(--paper)",
  fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15, color: "var(--ink)", outline: "none",
};

/* `small` = the v8 pre-order precision chip (8px/12px, 12.5) vs the condition chip (9px/13px, 13). */
function ChipButton({ on, onClick, small = false, children }: { on: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: small ? "8px 12px" : "9px 13px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-body)",
      fontSize: small ? 12.5 : 13, fontWeight: on ? 700 : 500, whiteSpace: "nowrap",
      border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
      background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink-mute)",
    }}>
      {children}
    </button>
  );
}

function FinishItemsInner() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const singleId = useSearchParams().get("item");

  // Snapshot the queue on first load — saving would otherwise shrink the list under
  // the user's feet mid-flow. A single-item route is edit mode: that copy is always
  // included, whether or not it currently has gaps.
  const [queue, setQueue] = useState<CollectionItem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(0);
  const [draft, setDraft] = useState<Draft>(draftFromItem(undefined));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userLoading || !user) return;
    let alive = true;
    api.get<{ items: CollectionItem[] }>(`/users/${user.handle}/collection`)
      .then((d) => {
        if (!alive) return;
        const mine = d.items.filter((i) => i.status === "owned" || i.status === "preorder");
        const q = singleId
          ? mine.filter((i) => i.id === singleId)
          : mine.filter((i) => i.is_complete === false);
        setQueue(q);
        setDraft(draftFromItem(q[0]));
      })
      .catch(() => { if (alive) setQueue([]); });
    return () => { alive = false; };
    // Deliberately NOT re-run on saves — the queue is a snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user?.handle, singleId]);

  if (userLoading || queue === null) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ height: 86, borderRadius: 14, background: "var(--bone)" }} />
        <div style={{ height: 46, borderRadius: 11, background: "var(--bone)", marginTop: 18 }} />
      </div>
    );
  }

  const finished = idx >= queue.length;

  // Nothing to finish (or the whole batch is done) — the “complete” state.
  if (queue.length === 0 || (finished && !singleId)) {
    return (
      <div className="w-full flex flex-col pb-10">
        {/* v8 gives this state a DetailHeader too — "Nothing to finish". */}
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BackButton fallback="/profile" />
            {/* v8 DetailHeader type — 19/700 display title. */}
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em" }}>
              {done > 0 ? "Finish your items" : "Nothing to finish"}
            </div>
          </div>
        </div>
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <Check size={30} style={{ color: "var(--forest)", margin: "0 auto" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, marginTop: 12 }}>
            {done > 0 ? `${done} item${done === 1 ? "" : "s"} completed` : "Every item has its details"}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 6, lineHeight: 1.5 }}>
            Your portfolio value is public and counting everything you own.
          </div>
          <div style={{ marginTop: 22 }}>
            <button
              onClick={() => router.back()}
              style={{ width: "100%", height: 52, padding: "0 22px", borderRadius: 14, border: "1px solid var(--ink)", cursor: "pointer", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, lineHeight: 1 }}
            >
              Back to my collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const item = queue[Math.min(idx, queue.length - 1)];
  const c = catForItem(item);
  const isPo = item.status === "preorder";
  const conds = conditionsFor(c.key);
  const selected = conds.find((x) => x.id === draft.cond);
  const last = idx >= queue.length - 1;
  const ready = draftReady(item, draft);

  const advance = () => {
    setDraft(draftFromItem(queue[idx + 1]));
    setIdx((i) => i + 1);
  };

  async function commit() {
    if (!ready || saving) return;
    setSaving(true);
    const paise = (parseInt(draft.price, 10) || 0) * 100;
    try {
      const res = await api.patch<{ complete_xp?: number; listing_synced?: boolean }>(`/items/${item.id}`, isPo
        ? {
            preorder_eta: buildPoEta(draft.prec, { monthIdx: draft.monthIdx, quarter: draft.quarter, year: draft.year }),
            preorder_window_precision: draft.prec,
            preorder_total: paise,
            value: paise,
            // Optional — only sent when set (PATCH is exclude_none; blank ≠ clear).
            ...(draft.deposit ? { preorder_deposit: (parseInt(draft.deposit, 10) || 0) * 100 } : {}),
          }
        : { condition: draft.cond, value: paise });
      let slot = 0;
      if (res?.complete_xp && res.complete_xp > 0) { fireXpToast(res.complete_xp, "Item details complete"); slot = 1; }
      // v8 CompleteItems.jsx:193-204 — a corrected condition moved onto the LIVE
      // listing too (server-side sync); say so, or the market silently disagreeing
      // with the shelf reads as dishonesty. Staggered when an XP toast holds the slot.
      if (!isPo && res?.listing_synced) {
        const label = conditionLabel(draft.cond, c.key) ?? draft.cond;
        const fire = () => fireToast("Saved", `Your listing now says ${label} too`);
        if (slot > 0) setTimeout(fire, 2400); else fire();
      }
      setDone((n) => n + 1);
      if (singleId) { router.back(); return; }
      advance();
    } catch {
      fireToast("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full flex flex-col">
      {/* header */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/profile" />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* v8 DetailHeader type (Chrome.jsx:83-110) — 19/700 title, 12 faint subtitle. */}
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em" }}>
              {singleId ? "Item details" : "Finish your items"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {singleId ? titleOf(item) : `${idx + 1} of ${queue.length} · +20 XP each`}
            </div>
          </div>
        </div>
      </div>

      {/* progress — the unfinished bar is the pull */}
      {!singleId && (
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ height: 5, borderRadius: 3, background: "var(--bone)", overflow: "hidden" }}>
            <div style={{ width: `${(done / Math.max(queue.length, 1)) * 100}%`, height: "100%", background: "var(--forest)", borderRadius: 3, transition: "width 240ms" }} />
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px 0" }}>
        {/* fixed catalogue card — what you're describing, not editable here */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, marginBottom: 20 }}>
          <div style={{ width: 62, height: 62, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
            <ProductPhoto tone={c.tone} src={item.image_url ?? undefined} ratio="1/1" rounded={0} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* v8 always stamps the status tag — Owned as well as Pre-order. */}
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <Tag kind={isPo ? "po" : "default"}>{isPo ? "Pre-order" : "Owned"}</Tag>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titleOf(item)}</div>
            {/* v8 :242 — brand · release year, never the category. */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
              {[item.brand, item.release_year != null ? String(item.release_year) : null].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        {/* condition — category-specific vocabulary; options are OBJECTS, render .label */}
        {!isPo && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel>Condition</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
              {conds.map((opt) => (
                <ChipButton key={opt.id} on={draft.cond === opt.id} onClick={() => setDraft((d) => ({ ...d, cond: opt.id }))}>
                  {opt.label}
                </ChipButton>
              ))}
            </div>
            {selected?.hint && (
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 7 }}>{selected.hint}</div>
            )}
          </div>
        )}

        {/* pre-order: structured ETA window (patterns copied from EditPreorderSheet, not
            imported) — stored structurally so the PO calendar can bucket it. */}
        {isPo && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel>Expected release</SectionLabel>
            <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
              {([["month", "Month"], ["quarter", "Quarter"], ["year", "Year"], ["tbd", "Not announced"]] as [PoPrecision, string][]).map(([id, label]) => (
                <ChipButton key={id} small on={draft.prec === id} onClick={() => setDraft((d) => ({ ...d, prec: id }))}>
                  {label}
                </ChipButton>
              ))}
            </div>
            {draft.prec !== "tbd" && (
              <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                {draft.prec === "month" && (
                  <select
                    value={draft.monthIdx}
                    onChange={(e) => setDraft((d) => ({ ...d, monthIdx: e.target.value }))}
                    aria-label="Month"
                    style={{ ...fieldStyle, flex: 1, cursor: "pointer" }}
                  >
                    <option value="">Month</option>
                    {/* v8 :71 — FULL month names in the select; storage stays short via buildPoEta. */}
                    {MONTH_FULL.map((m, i) => <option key={m} value={String(i)}>{m}</option>)}
                  </select>
                )}
                {draft.prec === "quarter" && (
                  <select
                    value={draft.quarter}
                    onChange={(e) => setDraft((d) => ({ ...d, quarter: e.target.value }))}
                    aria-label="Quarter"
                    style={{ ...fieldStyle, flex: 1, cursor: "pointer" }}
                  >
                    <option value="">Quarter</option>
                    {["1", "2", "3", "4"].map((q) => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                )}
                <select
                  value={draft.year}
                  onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
                  aria-label="Year"
                  style={{ ...fieldStyle, width: 110, cursor: "pointer" }}
                >
                  <option value="">Year</option>
                  {PO_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* price — rupees in the field, paise on the wire */}
        <div>
          <SectionLabel>{isPo ? "Total price" : "What you paid"}</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 13px", marginTop: 9, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "var(--ink-faint)" }}>₹</span>
            <input
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value.replace(/[^0-9]/g, "") }))}
              inputMode="numeric"
              // v8 :95 — the catalogue est anchors the placeholder when known.
              placeholder={item.est_value ? String(Math.round(item.est_value / 100)) : "0"}
              aria-label={isPo ? "Total price in rupees" : "What you paid in rupees"}
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>
            Only you ever see this — it powers your portfolio value.
          </div>
        </div>

        {/* Deposit is optional, but it's what makes "balance due" real on a pre-order (v8). */}
        {isPo && (
          <div style={{ marginTop: 18 }}>
            <SectionLabel>Deposit paid <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--ink-faint)" }}>· optional</span></SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 13px", marginTop: 9, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "var(--ink-faint)" }}>₹</span>
              <input
                value={draft.deposit}
                onChange={(e) => setDraft((d) => ({ ...d, deposit: e.target.value.replace(/[^0-9]/g, "") }))}
                inputMode="numeric"
                placeholder="0"
                aria-label="Deposit paid in rupees"
                style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* actions — v8 keeps these in a pinned footer under a hairline */}
      <div style={{ position: "sticky", bottom: 0, marginTop: 24, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={commit}
          disabled={!ready || saving}
          style={{
            width: "100%", height: 52, borderRadius: 14, border: "1px solid var(--ink)",
            cursor: !ready || saving ? "not-allowed" : "pointer",
            background: "var(--ink)", color: "var(--paper)", opacity: !ready || saving ? 0.4 : 1,
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, lineHeight: 1,
          }}
        >
          {saving ? "Saving…" : singleId ? "Save" : last ? "Save & finish" : "Save & next"}
        </button>
        {!singleId && !last && (
          <button
            type="button"
            onClick={advance}
            style={{ height: 40, borderRadius: 11, border: "none", background: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, color: "var(--ink-faint)" }}
          >
            Skip this one
          </button>
        )}
      </div>
    </div>
  );
}

// useSearchParams must sit under a Suspense boundary for the production build
// (missing-suspense-with-csr-bailout) — same pattern as /search and /add/*.
export default function FinishItemsPage() {
  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <Suspense fallback={<div style={{ padding: 20 }} />}>
        <FinishItemsInner />
      </Suspense>
    </div>
  );
}
