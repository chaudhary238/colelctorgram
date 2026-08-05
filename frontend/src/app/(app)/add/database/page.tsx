"use client";

/**
 * Add to database — contribute a NEW entry to the shared Scorred catalogue.
 *
 * A faithful port of design_v7's `ContributeItemForm` (app/ExploreView.jsx). Founder,
 * 2026-08-05: "design_v7 is simpler". It is — six fields and nothing else:
 *
 *     Title* · Category · Brand* · Scale + Year · Estimated value · Photos*
 *
 * This used to be `mode=intel` inside `/add/catalogue`, a form shared with the In-hand
 * and Pre-order flows. Sharing it meant a contributor also met Description, the TCG
 * spec block (language / product type / graded / grader / grade), scale CHIPS with an
 * "Other" escape hatch, and per-photo public/private toggles — none of which exist in
 * v7, and none of which describe a catalogue record. Those fields still belong to
 * adding YOUR copy of something, so they stay on `/add/catalogue`; they just don't
 * belong here. Splitting the two also simplifies that file rather than adding another
 * `isIntel &&` branch to it.
 *
 * Losing the rich form is SAFE because de-duplication is enforced SERVER-side:
 * `services/catalogue.resolve_or_create` fuzzy-matches the title and auto-links to an
 * existing SKU above its HIGH threshold, so a plain text input cannot mint a duplicate
 * (DV6-12). The brand input keeps a `<datalist>` for the same reason — one field, as in
 * v7, but suggesting the canonical spelling so the catalogue doesn't collect
 * "Hot Toys" / "hot toys" / "HotToys".
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Clock, PlusCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ProductPhoto, SectionLabel } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { fireXpToast } from "@/components/gamification";
import { ADD_CATEGORIES, CAT_BRANDS } from "@/lib/catalog";

const DB_NEW_XP = 50;      // EARN_RULES.db_new — keep in step with the backend
const PHOTO_MAX = 6;       // v7: "At least 1 required · up to 6"

const field = (bad: boolean): React.CSSProperties => ({
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px", borderRadius: 11,
  border: `1px solid ${bad ? "var(--stamp-red)" : "var(--border-strong)"}`,
  background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 15,
  color: "var(--ink)", outline: "none",
});

/** Section label with the required asterisk + inline "Required" once submit was tried. */
function Req({ children, missing, tried }: { children: React.ReactNode; missing: boolean; tried: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
      <SectionLabel>{children}</SectionLabel>
      <span style={{ color: missing && tried ? "var(--stamp-red)" : "var(--ink-ghost)", fontSize: 13, fontWeight: 700 }}>*</span>
      {missing && tried && <span style={{ fontSize: 11, color: "var(--stamp-red)", marginLeft: "auto" }}>Required</span>}
    </div>
  );
}

export default function AddToDatabasePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("figures");
  const [brand, setBrand] = useState("");
  const [scale, setScale] = useState("");
  const [year, setYear] = useState("");
  const [est, setEst] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Post-submit state — v7 shows an "Under review" screen, not a redirect.
  const [done, setDone] = useState<{ itemId: string; matched: boolean } | null>(null);

  const missTitle = !title.trim();
  const missBrand = !brand.trim();
  const missPhoto = photos.length < 1;
  const invalid = missTitle || missBrand || missPhoto;

  const brandOptions = useMemo(() => CAT_BRANDS[cat] ?? [], [cat]);

  async function submit() {
    if (invalid) { setTried(true); return; }
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const item = await api.post<{ id: string; db_new_xp?: number; catalogue_matched?: boolean }>("/items", {
        custom_title: title.trim(),
        brand: brand.trim(),
        category: cat,
        scale: scale.trim() || null,
        release_year: year ? Number(year) : null,
        // Seeds catalogue.est_retail_price on a NEW entry (public fact, not a purchase price).
        value: est ? Number(est) * 100 : 0,
        value_currency: "INR",
        // A new catalogue entry REQUIRES a public reference image (DV6-13); the server
        // 400s a coverless create, which is why Photos is a required field here.
        cover_url: photos[0],
        status: "intel",
      });
      for (const url of photos) {
        await api.post(`/items/${item.id}/photos?url=${encodeURIComponent(url)}&is_public=true`);
      }
      if (item.db_new_xp && item.db_new_xp > 0) fireXpToast(item.db_new_xp, "XP · added to Scorred DB");
      setDone({ itemId: item.id, matched: !!item.catalogue_matched });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this item");
    } finally {
      setSaving(false);
    }
  }

  // ── Submitted (v7's "Under review" screen) ──────────────────────────────────
  if (done) {
    return (
      <div className="w-full max-w-[680px] flex flex-col pb-8">
        <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BackButton fallback="/db" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Add to database</span>
          </div>
        </div>
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bone)", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Clock size={26} style={{ color: "var(--ink-faint)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, marginBottom: 6 }}>
            {done.matched ? "Already in the database" : "Added to the database"}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-faint)", lineHeight: 1.55 }}>
            {done.matched ? (
              <>&ldquo;{title}&rdquo; matched an existing entry, so we linked to it instead of creating a duplicate.</>
            ) : (
              <>&ldquo;{title}&rdquo; is in the Scorred database and will be reviewed by the team. You earned{" "}
                <strong style={{ color: "var(--ink)" }}>+{DB_NEW_XP} XP</strong>.</>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 18 }}>Own a copy? Add it to your collection below.</div>
          <button
            onClick={() => router.push(`/item/${done.itemId}`)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 48, marginTop: 18, borderRadius: 13, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            <PlusCircle size={18} /> View the entry
          </button>
          <button
            onClick={() => router.push("/db")}
            style={{ width: "100%", height: 42, marginTop: 8, borderRadius: 12, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/db" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Add to database</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Shared catalogue entry</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <Req missing={missTitle} tried={tried}>Title</Req>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hot Toys MMS601 · Iron Man Mark 85" style={field(missTitle && tried)} />

        <div style={{ marginTop: 18 }}><SectionLabel>Category</SectionLabel></div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
          {ADD_CATEGORIES.map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { setCat(c.id); setBrand(""); }}
                style={{
                  padding: "8px 13px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
                  background: on ? "var(--ink)" : "var(--paper-soft)",
                  color: on ? "var(--paper)" : "var(--ink)",
                  fontFamily: "var(--font-body)", fontWeight: on ? 600 : 500, fontSize: 13, lineHeight: 1,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 18 }}><Req missing={missBrand} tried={tried}>Brand</Req></div>
        <input list="db-brands" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Hot Toys" style={field(missBrand && tried)} />
        <datalist id="db-brands">
          {brandOptions.map((b) => <option key={b} value={b} />)}
        </datalist>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Scale</SectionLabel>
            <input value={scale} onChange={(e) => setScale(e.target.value)} placeholder="1/6, N/A" style={{ ...field(false), marginTop: 9 }} />
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>Year</SectionLabel>
            <input value={year} onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} inputMode="numeric" placeholder="2026" style={{ ...field(false), marginTop: 9, fontFamily: "var(--font-mono)" }} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}><SectionLabel>Estimated value (₹)</SectionLabel></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 13px", marginTop: 9, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 17, color: "var(--ink-faint)" }}>₹</span>
          <input value={est} onChange={(e) => setEst(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Retail / market price"
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }} />
        </div>

        <div style={{ marginTop: 18 }}><Req missing={missPhoto} tried={tried}>Photos</Req></div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 9 }}>
          At least 1 required · up to {PHOTO_MAX}. These are the catalogue&rsquo;s shared reference images.
        </div>
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 11 }}>
            {photos.map((url, i) => (
              <div key={url} style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <ProductPhoto tone="ink" src={url} ratio="1/1" rounded={11} />
                {i === 0 && (
                  <span style={{ position: "absolute", bottom: 4, left: 4, background: "var(--verified-teal)", color: "var(--paper)", fontWeight: 700, fontSize: 8.5, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 5px", borderRadius: 4 }}>
                    Cover
                  </span>
                )}
                <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} aria-label="Remove photo"
                  style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", cursor: "pointer", background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < PHOTO_MAX && (
          <ImageUploader
            multiple
            maxFiles={PHOTO_MAX - photos.length}
            onUpload={(url) => setPhotos((p) => (p.length < PHOTO_MAX ? [...p, url] : p))}
            label={photos.length ? `Add more (up to ${PHOTO_MAX - photos.length})` : "Add photos"}
          />
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
            opacity: invalid ? 0.55 : 1,
          }}
        >
          {saving ? "Adding…" : <><Check size={17} strokeWidth={2.6} />Add to Database · +{DB_NEW_XP} XP</>}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", textAlign: "center", marginTop: 8, lineHeight: 1.45 }}>
          Own a copy? You&rsquo;ll get the option to add it to your collection right after.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14, fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.45 }}>
          <Camera size={14} style={{ flexShrink: 0 }} />
          <span>Entries are reviewed by the Scorred team. Duplicates are merged and their XP reversed.</span>
        </div>
      </div>
    </div>
  );
}
