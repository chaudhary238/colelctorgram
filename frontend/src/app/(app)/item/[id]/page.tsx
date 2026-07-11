"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Bell, Tag, Trash2, Pencil, Eye, ShieldCheck, Flag, Star } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { ReportCatalogueSheet } from "@/components/ReportCatalogueSheet";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { VerifyBadge, ProductPhoto, SectionLabel } from "@/components/ui";
import { ReleaseWindowPicker } from "@/components/forms";
import { formatMoney, buildPoEta, type PoPrecision } from "@/lib/catalog";

interface ApiItem {
  id: string;
  user_id: string;
  sku: string | null;
  custom_title: string | null;
  status: string;
  verify_tier: string;
  value: number;
  value_currency?: string;
  is_listed: boolean;
  photo_count: number;
  images?: string[];
  preorder_ordered_at: string | null;
  preorder_eta: string | null;
  preorder_window_precision?: string | null;
  preorder_seller?: string | null;
  preorder_total?: number | null;
  preorder_deposit?: number | null;
  privacy: string;
  created_at: string;
  owner_handle?: string | null;
  owner_name?: string | null;
  catalogue_is_official?: boolean;
  // viewer's wishlist state for this item's identity (Star toggle, taxonomy 2026-07-11)
  is_wishlisted?: boolean;
}

// DV4-04: remove-from-collection reasons (design_v4 ItemDetail "Remove from collection?" sheet).
const REMOVE_REASONS: { id: string; label: string }[] = [
  { id: "sold", label: "Sold offline" },
  { id: "traded", label: "Traded offline" },
  { id: "lost", label: "Lost" },
  { id: "broken", label: "Broken or damaged" },
  { id: "gifted", label: "Gifted to someone" },
  { id: "other", label: "Other reason" },
];

const STATUS_LABEL: Record<string, string> = {
  owned: "In collection",
  wishlist: "Wishlist",
  preorder: "Pre-order",
  intel: "DB Contribution",
};

const TONES = ["teal", "plum", "forest", "gold", "red", "ink"];

function PoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-mute)", fontWeight: accent ? 600 : 400 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: accent ? 700 : 600, fontSize: accent ? 15 : 13, color: accent ? "var(--stamp-red)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}

// DV4-04: "Remove from collection?" reason sheet.

function RemoveSheet({ reason, setReason, onConfirm, onClose, removing }: {
  reason: string; setReason: (r: string) => void; onConfirm: () => void; onClose: () => void; removing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] p-5">
        <h2 className="font-bold text-base text-[var(--ink)] mb-1" style={{ fontFamily: "var(--font-display)" }}>Remove from collection?</h2>
        <p className="text-xs text-[var(--ink-faint)] mb-4">Tell us why — it helps keep collection value and trade signals accurate.</p>
        <div className="space-y-2">
          {REMOVE_REASONS.map((r) => (
            <button key={r.id} onClick={() => setReason(r.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors"
              style={{ borderColor: reason === r.id ? "var(--stamp-red)" : "var(--border)", background: reason === r.id ? "var(--stamp-red-soft)" : "var(--surface)" }}>
              <span className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: reason === r.id ? "var(--stamp-red)" : "var(--border-strong)", background: reason === r.id ? "var(--stamp-red)" : "transparent" }}>
                {reason === r.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-sm font-medium text-[var(--ink)]">{r.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border-strong)] text-[var(--ink)] font-semibold text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={!reason || removing}
            className="flex-1 h-11 rounded-xl bg-[var(--stamp-red)] text-white font-semibold text-sm disabled:opacity-50">
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// DV4-03b: inline "Edit preorder details" editor → PATCH /items/{id}.
function EditPreorderSheet({ item, onClose, onSaved }: { item: ApiItem; onClose: () => void; onSaved: () => void }) {
  const [prec, setPrec] = useState<PoPrecision>((item.preorder_window_precision as PoPrecision) || "month");
  const [date, setDate] = useState("");
  const [monthIdx, setMonthIdx] = useState("");
  const [quarter, setQuarter] = useState("");
  const [year, setYear] = useState("2026");
  const [seller, setSeller] = useState(item.preorder_seller ?? "");
  const [total, setTotal] = useState(item.preorder_total != null ? String(Math.round(item.preorder_total / 100)) : "");
  const [deposit, setDeposit] = useState(item.preorder_deposit != null ? String(Math.round(item.preorder_deposit / 100)) : "");
  const [saving, setSaving] = useState(false);
  const balance = Math.max(0, (parseInt(total, 10) || 0) - (parseInt(deposit, 10) || 0));

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/items/${item.id}`, {
        preorder_eta: buildPoEta(prec, { date, monthIdx, quarter, year }),
        preorder_window_precision: prec,
        preorder_seller: seller.trim() || null,
        preorder_total: total ? Number(total) * 100 : null,
        preorder_deposit: deposit ? Number(deposit) * 100 : null,
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  const moneyInput = (value: string, set: (v: string) => void, placeholder = "0") => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 44, marginTop: 7, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--ink-faint)" }}>₹</span>
      <input value={value} onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--ink)" }} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[var(--paper)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-4)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 shrink-0">
          <h2 className="font-bold text-base text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>Edit preorder details</h2>
          <button onClick={onClose} className="text-[var(--ink-faint)] hover:text-[var(--ink)] p-1"><ArrowLeft size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4">
          <SectionLabel>Release window</SectionLabel>
          <div style={{ marginTop: 9 }}>
            <ReleaseWindowPicker prec={prec} onPrec={setPrec} date={date} onDate={setDate}
              monthIdx={monthIdx} onMonth={setMonthIdx} quarter={quarter} onQuarter={setQuarter} year={year} onYear={setYear} />
          </div>
          <div style={{ marginTop: 14 }}><SectionLabel>Seller / Store</SectionLabel></div>
          <input value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="e.g. BBToyStore, Bangalore"
            style={{ width: "100%", boxSizing: "border-box", height: 44, marginTop: 7, padding: "0 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--ink)", outline: "none" }} />
          <div style={{ display: "flex", gap: 11, marginTop: 14 }}>
            <div style={{ flex: 1 }}><SectionLabel>Total price (₹)</SectionLabel>{moneyInput(total, setTotal)}</div>
            <div style={{ flex: 1 }}><SectionLabel>Deposit paid (₹)</SectionLabel>{moneyInput(deposit, setDeposit)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Balance due</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--stamp-red)" }}>₹{balance.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
          <button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm disabled:opacity-60">
            {saving ? "Saving…" : "Save preorder details"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [item, setItem] = useState<ApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishAlert, setWishAlert] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [verifyHint, setVerifyHint] = useState(false);
  // remove-from-collection sheet (DV4-04)
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [removing, setRemoving] = useState(false);

  const [reporting, setReporting] = useState(false); // DV6-13 — report this catalogue entry
  // Star = wishlist (taxonomy 2026-07-11) — non-owner only; lands in Saved → Wishlist.
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  async function toggleWishlist() {
    if (!item || wishBusy) return;
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    setWishBusy(true);
    try { await api.post(`/items/${item.id}/wishlist`); }
    catch { setWishlisted(!next); }
    finally { setWishBusy(false); }
  }
  // edit pre-order details (DV4-03b)
  const [poEdit, setPoEdit] = useState(false);

  async function removeItem() {
    if (!item || removing) return;
    setRemoving(true);
    try {
      const qs = removeReason ? `?reason=${encodeURIComponent(removeReason)}` : "";
      await api.delete(`/items/${item.id}${qs}`);
      router.push("/profile");
    } catch (e) {
      console.error(e);
      setRemoving(false);
    }
  }

  async function addToCollection() {
    if (adding || added || !item) return;
    setAdding(true);
    try {
      await api.post("/items", item.sku ? { sku: item.sku } : { custom_title: item.custom_title });
      setAdded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    api.get<ApiItem>(`/items/${id}`)
      .then((i) => { setItem(i); setWishlisted(!!i.is_wishlisted); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !item) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ aspectRatio: "1/1", background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "70%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
      </div>
    );
  }

  const title = item.custom_title ?? item.sku ?? "Item";
  const tone = TONES[parseInt(id, 16) % TONES.length] ?? "teal";
  const isOwned = item.status === "owned";
  const isWish = item.status === "wishlist";
  const isPreorder = item.status === "preorder";
  const isIntel = item.status === "intel"; // DV6-11h — DB Contribution (unowned catalogue seed)
  const isOwnItem = !!user && user.id === item.user_id;

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-20">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/profile" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Item detail</span>
        </div>
      </div>

      {item.images && item.images.length > 0 ? (
        <div style={{ aspectRatio: "1/1", overflow: "hidden", background: "var(--bone)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.images[Math.min(photo, item.images.length - 1)]} alt={item.custom_title ?? "Item photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ) : (
        <ProductPhoto tone={tone} ratio="1/1" rounded={0} label={item.photo_count > 0 ? `${Math.min(photo + 1, item.photo_count)} of ${item.photo_count}` : "catalogue reference"} />
      )}

      {(item.images?.length ?? item.photo_count) > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "12px 0 4px" }}>
          {Array.from({ length: Math.min(item.images?.length ?? item.photo_count, 6) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPhoto(i)}
              aria-label={`Photo ${i + 1}`}
              style={{ width: i === photo ? 18 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer", background: i === photo ? "var(--ink)" : "var(--bone-deep)", transition: "all 160ms" }}
            />
          ))}
        </div>
      )}

      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          <VerifyBadge tier={item.verify_tier} size="lg" />
          {item.status !== "owned" && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: isIntel ? "var(--verified-teal)" : isWish ? "var(--plum)" : "var(--grail-gold)", color: "var(--paper)" }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          )}
          {item.is_listed && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 5, background: "var(--stamp-red)", color: "var(--paper)" }}>
              Listed
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 4px" }}>
          {title}
        </h1>
        {item.sku && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)" }}>SKU {item.sku}</span>
            {/* DV6-13 — Official (admin-blessed) vs Community catalogue entry */}
            {item.catalogue_is_official ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--verified-teal)", background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 5, padding: "1px 7px" }}>
                <ShieldCheck size={11} /> Official
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-mute)", background: "var(--bone)", borderRadius: 5, padding: "1px 7px" }}>Community</span>
            )}
            <button type="button" onClick={() => setReporting(true)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-faint)" }}>
              <Flag size={12} /> Report
            </button>
          </div>
        )}

        {/* DV6-11h — DB Contribution attribution (tap → contributor's profile) */}
        {isIntel && (() => {
          const canTap = !isOwnItem && !!item.owner_handle;
          const who = isOwnItem ? "@you" : item.owner_handle ? `@${item.owner_handle}` : "Scorred";
          return (
            <button
              type="button"
              onClick={() => canTap && router.push(`/profile/${item.owner_handle}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "4px 10px", borderRadius: 999,
                background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)",
                cursor: canTap ? "pointer" : "default",
              }}
            >
              <Eye size={12} style={{ color: "var(--verified-teal)", flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: "var(--verified-teal)", fontWeight: 500 }}>
                DB Contribution by <b style={{ fontWeight: 700 }}>{who}</b>
              </span>
            </button>
          );
        })()}

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {item.value > 0 && (
            <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>
                {isWish ? "Est. market value" : "Est. value"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18 }}>
                {formatMoney(item.value, item.value_currency)}
              </div>
            </div>
          )}
          <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 6 }}>Ownership</div>
            <VerifyBadge tier={item.verify_tier} size="lg" />
          </div>
        </div>

        {isPreorder && (
          <div style={{ background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 13, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--grail-gold-deep)", fontWeight: 600, fontSize: 13.5 }}>
              Pre-order timeline
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
              {item.preorder_ordered_at
                ? `Ordered ${new Date(item.preorder_ordered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : "Ordered"}
              {" · "}
              {item.preorder_eta ? `ETA ${item.preorder_eta}` : "ETA TBD"}
            </div>
            {item.preorder_seller && (
              <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 4 }}>From {item.preorder_seller}</div>
            )}
            {/* Deposit / balance rows (DV4-03b) */}
            {(item.preorder_total != null || item.preorder_deposit != null) && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--grail-gold)", display: "flex", flexDirection: "column", gap: 6 }}>
                {item.preorder_total != null && (
                  <PoRow label="Total price" value={formatMoney(item.preorder_total, item.value_currency)} />
                )}
                <PoRow label="Deposit paid" value={formatMoney(item.preorder_deposit ?? 0, item.value_currency)} />
                <PoRow label="Balance due" value={formatMoney(Math.max(0, (item.preorder_total ?? 0) - (item.preorder_deposit ?? 0)), item.value_currency)} accent />
              </div>
            )}
            <button onClick={() => setPoEdit(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 11, padding: "7px 11px", borderRadius: 9, border: "1px solid var(--grail-gold)", background: "var(--paper)", color: "var(--grail-gold-deep)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
              <Pencil size={13} /> Edit preorder details
            </button>
          </div>
        )}

        {isOwned && item.verify_tier !== "verified" && (
          <button
            onClick={() => setVerifyHint((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", background: "var(--paper-soft)", border: "1px dashed var(--border-strong)", borderRadius: 13, padding: 13, marginBottom: 16, cursor: "pointer" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--verified-teal)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Camera size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Verify ownership in the app to list it</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                {verifyHint
                  ? "Open Scorred on your phone → this item → Verify, then take a live photo plus the challenge shot. Verified items can be listed for sale."
                  : "Ownership photos are captured live in the Scorred app — tap to learn how."}
              </div>
            </div>
          </button>
        )}

        <SectionLabel>About this item</SectionLabel>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)", marginTop: 10, marginBottom: 20 }}>
          {isWish
            ? "On your wishlist — we'll notify you when a seller lists this."
            : isPreorder
            ? "Pre-ordered. We'll notify you when it ships."
            : "In your collection."}
        </div>

        {isOwnItem && (
          <button onClick={() => { setRemoveReason(""); setRemoveOpen(true); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 24, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--ink-mute)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Trash2 size={15} /> Remove from collection
          </button>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 245, right: 0, maxWidth: 680, borderTop: "1px solid var(--border)", background: "var(--paper)", padding: "12px 20px 20px", zIndex: 20 }}>
        {isOwned ? (
          item.is_listed ? (
            <Link href="/market" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 48, borderRadius: 13, background: "var(--bone)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--ink)", textDecoration: "none", gap: 8 }}>
              Manage listing
            </Link>
          ) : (
            // Web can sell (DF-17) — list this item via the market create flow (v3 parity).
            <Link
              href="/add/catalogue"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              <Tag size={18} />Sell / Trade this item
            </Link>
          )
        ) : isWish ? (
          <button onClick={() => setWishAlert((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: wishAlert ? "var(--bone)" : "var(--verified-teal)", color: wishAlert ? "var(--ink)" : "var(--paper)", border: wishAlert ? "1px solid var(--border-strong)" : "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Bell size={17} />
            {wishAlert ? "Alert on" : "Notify when listed"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addToCollection} disabled={adding || added} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, background: added ? "var(--bone)" : "var(--ink)", color: added ? "var(--ink)" : "var(--paper)", border: added ? "1px solid var(--border-strong)" : "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: adding || added ? "default" : "pointer" }}>
              {added ? "Added to collection ✓" : adding ? "Adding…" : "Add to my collection"}
            </button>
            {/* Star = wishlist (icon law 2026-07-11) — someone else's item only */}
            {!isOwnItem && (
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishBusy}
                title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  width: 48, height: 48, borderRadius: 13, flexShrink: 0, cursor: wishBusy ? "wait" : "pointer",
                  border: `1px solid ${wishlisted ? "var(--stamp-red)" : "var(--border-strong)"}`,
                  background: wishlisted ? "var(--stamp-red)" : "var(--paper)",
                  color: wishlisted ? "var(--paper)" : "var(--ink)",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 140ms",
                }}
              >
                <Star size={19} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        )}
      </div>

      {removeOpen && (
        <RemoveSheet reason={removeReason} setReason={setRemoveReason} onConfirm={removeItem} onClose={() => setRemoveOpen(false)} removing={removing} />
      )}
      {reporting && item.sku && (
        <ReportCatalogueSheet sku={item.sku} onClose={() => setReporting(false)} />
      )}
      {poEdit && (
        <EditPreorderSheet item={item} onClose={() => setPoEdit(false)}
          onSaved={() => api.get<ApiItem>(`/items/${id}`).then(setItem).catch(console.error)} />
      )}
    </div>
  );
}
