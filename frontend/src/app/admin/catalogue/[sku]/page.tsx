"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, Trash2, RotateCcw, Users, Star } from "lucide-react";
import { api } from "@/lib/api";
import { ImageUploader } from "@/components/ImageUploader";
import { ADD_CATEGORIES, CAT_SCALES, formatMoney } from "@/lib/catalog";

interface CatalogueDetail {
  sku: string;
  title: string;
  brand: string;
  category: string;
  scale: string | null;
  year: string | null;
  description: string | null;
  est_retail_price: number;
  thumbnail_url: string | null;
  is_approved: boolean;
  is_official: boolean;
  status: string; // "live" | "removed"
  submitted_by_handle: string | null;
  collectors_count: number;
  wishlists_count: number;
  created_at: string | null;
  updated_at: string | null;
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function CatalogueDetailPage() {
  const params = useParams<{ sku: string }>();
  const sku = decodeURIComponent(params.sku);

  const [entry, setEntry] = useState<CatalogueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // editable form
  const [form, setForm] = useState({
    title: "", brand: "", category: "figures", scale: "", year: "",
    description: "", priceRupees: "", thumbnail_url: "",
  });

  const hydrate = (e: CatalogueDetail) => {
    setEntry(e);
    setForm({
      title: e.title,
      brand: e.brand,
      category: e.category,
      scale: e.scale ?? "",
      year: e.year ?? "",
      description: e.description ?? "",
      priceRupees: String(Math.round(e.est_retail_price / 100)),
      thumbnail_url: e.thumbnail_url ?? "",
    });
  };

  const load = useCallback(() => {
    setLoading(true);
    api.get<CatalogueDetail>(`/admin/catalogue/${encodeURIComponent(sku)}`)
      .then((e) => hydrate(e))
      .catch((err) => setError(err instanceof Error ? err.message : "Not found"))
      .finally(() => setLoading(false));
  }, [sku]);

  // Defer the fetch (which flips loading state) out of the synchronous effect body.
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };
  const scales = CAT_SCALES[form.category];

  const save = async () => {
    if (!form.title.trim() || !form.brand.trim()) { setError("Title and brand are required."); return; }
    setBusy(true); setError(null);
    const price = Math.max(0, Math.round(Number(form.priceRupees) || 0)) * 100;
    const body = {
      title: form.title.trim(),
      brand: form.brand.trim(),
      category: form.category,
      scale: form.scale || null,
      year: form.year || null,
      description: form.description.trim() || null,
      est_retail_price: price,
      thumbnail_url: form.thumbnail_url.trim() || null,
    };
    try {
      await api.patch(`/admin/catalogue/${encodeURIComponent(sku)}`, body);
      setEntry((e) => (e ? { ...e, ...body, est_retail_price: price } : e));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  // moderation actions (patch entry state in place)
  const moderate = async (run: () => Promise<void>, next: Partial<CatalogueDetail>) => {
    setBusy(true); setError(null);
    try {
      await run();
      setEntry((e) => (e ? { ...e, ...next } : e));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const approve = () => moderate(() => api.patch(`/admin/catalogue/${encodeURIComponent(sku)}/approve`), { is_approved: true });
  const toggleOfficial = () => moderate(
    () => api.patch(`/admin/catalogue/${encodeURIComponent(sku)}/official?official=${!entry!.is_official}`),
    { is_official: !entry!.is_official, ...(!entry!.is_official && entry!.status === "removed" ? { status: "live" } : {}) },
  );
  const remove = () => moderate(() => api.patch(`/admin/catalogue/${encodeURIComponent(sku)}/remove`), { status: "removed" });
  const restore = () => moderate(() => api.patch(`/admin/catalogue/${encodeURIComponent(sku)}/restore`), { status: "live" });

  if (loading) return <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>;
  if (!entry) return (
    <div style={{ maxWidth: 720 }}>
      <BackLink />
      <div style={{ fontSize: 14, color: "var(--stamp-red)", padding: "20px 0" }}>{error ?? "Entry not found."}</div>
    </div>
  );

  const removed = entry.status === "removed";

  return (
    <div style={{ maxWidth: 860 }}>
      <BackLink />

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 4px", flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 23, letterSpacing: "-0.03em", margin: 0 }}>{entry.title}</h1>
        {entry.is_official && <Badge color="var(--verified-teal)" icon={<BadgeCheck size={11} />}>Official</Badge>}
        {!entry.is_approved && <Badge color="var(--grail-gold-deep)">Pending</Badge>}
        {removed && <Badge color="var(--stamp-red)">Removed</Badge>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginBottom: 20 }}>
        {entry.sku}{entry.submitted_by_handle && <> · submitted by @{entry.submitted_by_handle}</>} · added {fmtDate(entry.created_at)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28, alignItems: "start" }} className="cat-detail-grid">
        {/* left: image + stats + moderation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Label>Image</Label>
            <ImageUploader
              label="Add / replace image"
              previewUrl={form.thumbnail_url || undefined}
              onUpload={(url) => set("thumbnail_url", url)}
            />
            <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>Upload replaces the current image. Remember to Save.</p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Stat icon={<Users size={14} />} label="Collectors" value={entry.collectors_count} />
            <Stat icon={<Star size={14} />} label="Wishlists" value={entry.wishlists_count} />
          </div>

          {/* moderation actions */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, background: "var(--paper-soft)", display: "flex", flexDirection: "column", gap: 9 }}>
            <Label>Moderation</Label>
            {!entry.is_approved && (
              <ActionBtn onClick={approve} disabled={busy} bg="var(--forest)" fg="var(--paper)"><Check size={15} />Approve entry</ActionBtn>
            )}
            <ActionBtn onClick={toggleOfficial} disabled={busy}
              bg={entry.is_official ? "transparent" : "var(--verified-teal)"} fg={entry.is_official ? "var(--ink)" : "var(--paper)"} outline={entry.is_official}>
              <BadgeCheck size={15} />{entry.is_official ? "Remove Official badge" : "Mark as Official"}
            </ActionBtn>
            {removed
              ? <ActionBtn onClick={restore} disabled={busy} bg="var(--forest)" fg="var(--paper)"><RotateCcw size={15} />Restore entry</ActionBtn>
              : <ActionBtn onClick={remove} disabled={busy} bg="var(--stamp-red)" fg="var(--paper)"><Trash2 size={15} />Take down</ActionBtn>}
          </div>
        </div>

        {/* right: edit form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Title"><input value={form.title} onChange={(e) => set("title", e.target.value)} style={inputStyle} /></Field>
          <Field label="Brand"><input value={form.brand} onChange={(e) => set("brand", e.target.value)} style={inputStyle} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Category" style={{ flex: 1 }}>
              <select value={form.category} onChange={(e) => { set("category", e.target.value); set("scale", ""); }} style={inputStyle}>
                {ADD_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Scale" style={{ flex: 1 }}>
              {scales
                ? <select value={form.scale} onChange={(e) => set("scale", e.target.value)} style={inputStyle}>
                    <option value="">—</option>
                    {scales.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                : <input value={form.scale} onChange={(e) => set("scale", e.target.value)} placeholder="n/a" style={inputStyle} />}
            </Field>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Year" style={{ flex: 1 }}><input value={form.year} onChange={(e) => set("year", e.target.value)} style={inputStyle} /></Field>
            <Field label="Est. retail (₹)" style={{ flex: 1 }}>
              <input value={form.priceRupees} inputMode="numeric" onChange={(e) => set("priceRupees", e.target.value.replace(/[^0-9]/g, ""))} style={inputStyle} />
            </Field>
          </div>
          <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} style={{ ...inputStyle, height: "auto", padding: "9px 12px", resize: "vertical" }} /></Field>

          {error && <div style={{ fontSize: 13, color: "var(--stamp-red)" }}>{error}</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <button onClick={save} disabled={busy}
              style={{ height: 40, padding: "0 20px", borderRadius: 10, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            {saved && <span style={{ fontSize: 13, color: "var(--forest)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={15} />Saved</span>}
            <span style={{ fontSize: 12, color: "var(--ink-faint)", marginLeft: "auto" }}>Retail: {formatMoney(entry.est_retail_price)}</span>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 720px) { .cat-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/catalogue" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--ink-mute)", textDecoration: "none" }}>
      <ArrowLeft size={16} />All entries
    </Link>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-mute)", marginBottom: 7 }}>{children}</div>;
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-mute)" }}>{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 11, padding: "10px 12px", background: "var(--paper-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--ink-faint)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{icon}{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 3 }}>{value}</div>
    </div>
  );
}

function ActionBtn({ children, onClick, disabled, bg, fg, outline }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; bg: string; fg: string; outline?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 38, borderRadius: 10, cursor: disabled ? "default" : "pointer",
        border: outline ? "1px solid var(--border-strong)" : "none", background: bg, color: fg,
        fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, opacity: disabled ? 0.6 : 1, width: "100%" }}>
      {children}
    </button>
  );
}

function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 5, background: color, color: "var(--paper)" }}>
      {icon}{children}
    </span>
  );
}
