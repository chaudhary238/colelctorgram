"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import { ADD_CATEGORIES, formatMoney } from "@/lib/catalog";

interface CatalogueEntry {
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
  is_verified: boolean;
  status: string; // "live" | "removed"
  submitted_by_handle: string | null;
  created_at: string | null;
}

interface ListResponse {
  total: number;
  page: number;
  limit: number;
  items: CatalogueEntry[];
}

type StatusFilter = "all" | "live" | "removed";
type ApprovalFilter = "all" | "approved" | "pending";

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  ADD_CATEGORIES.map((c) => [c.id, c.label]),
);

export default function CatalogueAdminPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [approval, setApproval] = useState<ApprovalFilter>("all");
  const [items, setItems] = useState<CatalogueEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (status !== "all") params.set("status", status);
    if (approval !== "all") params.set("approval", approval);
    params.set("limit", "60");
    setLoading(true);
    return api.get<ListResponse>(`/admin/catalogue?${params.toString()}`)
      .then((d) => { setItems(d?.items ?? []); setTotal(d?.total ?? 0); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [q, category, status, approval]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => { if (!cancelled) load(); }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [load]);

  return (
    <div style={{ maxWidth: 1040 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Catalogue management</h1>
      <p style={{ color: "var(--ink-faint)", fontSize: 14, margin: "0 0 20px" }}>
        Browse every catalogue entry — click one to verify, edit, or take it down. {total > 0 && <span style={{ fontFamily: "var(--font-mono)" }}>{total} total</span>}
      </p>

      {/* category filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Chip active={category === null} onClick={() => setCategory(null)}>All categories</Chip>
        {ADD_CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</Chip>
        ))}
      </div>

      {/* search + status/approval filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, brand, or SKU…"
            style={{ width: "100%", height: 40, padding: "0 12px 0 36px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <Segmented<StatusFilter> value={status} onChange={setStatus} options={[["all", "All"], ["live", "Live"], ["removed", "Removed"]]} />
        <Segmented<ApprovalFilter> value={approval} onChange={setApproval} options={[["all", "Any"], ["approved", "Approved"], ["pending", "Pending"]]} />
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--stamp-red)", marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>Loading…</div>}
      {!loading && items.length === 0 && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "20px 0" }}>No catalogue entries match.</div>}

      {/* 3-column grid — big thumbnails so the image reads clearly */}
      <div className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {items.map((e) => {
          const removed = e.status === "removed";
          return (
            <Link key={e.sku} href={`/admin/catalogue/${encodeURIComponent(e.sku)}`}
              style={{ textDecoration: "none", color: "inherit", display: "block", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: removed ? "var(--stamp-red-soft)" : "var(--paper-soft)", opacity: removed ? 0.85 : 1 }}
              className="cat-card">
              {/* image */}
              <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {e.thumbnail_url
                  ? <img src={e.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>no image</span>}
                {/* badges over image */}
                <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {e.is_verified && <Badge color="var(--verified-teal)" icon={<BadgeCheck size={11} />}>Scorred Verified</Badge>}
                  {!e.is_approved && <Badge color="var(--grail-gold-deep)">Pending</Badge>}
                  {removed && <Badge color="var(--stamp-red)">Removed</Badge>}
                </div>
              </div>
              {/* meta */}
              <div style={{ padding: "11px 13px 13px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{e.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {[e.brand, CAT_LABEL[e.category] ?? e.category].filter(Boolean).join(" · ")}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
                  {formatMoney(e.est_retail_price)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .cat-card { transition: box-shadow .15s, transform .15s; }
        .cat-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.10); transform: translateY(-2px); }
        @media (max-width: 900px) { .cat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
      border: `1px solid ${active ? "var(--ink)" : "var(--border-strong)"}`,
      background: active ? "var(--ink)" : "var(--paper)", color: active ? "var(--paper)" : "var(--ink-mute)" }}>
      {children}
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
      {options.map(([v, label], i) => (
        <button key={v} onClick={() => onChange(v)}
          style={{ padding: "9px 13px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
            border: "none", borderLeft: i ? "1px solid var(--border)" : "none",
            background: value === v ? "var(--ink)" : "var(--paper)", color: value === v ? "var(--paper)" : "var(--ink-mute)" }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 6px", borderRadius: 5, background: color, color: "var(--paper)" }}>
      {icon}{children}
    </span>
  );
}
