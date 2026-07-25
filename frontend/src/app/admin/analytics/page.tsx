"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/* Investor-facing growth dashboard. Every number is a live aggregate from our own
   tables (GET /admin/analytics) — nothing fabricated. Charts follow the dataviz
   method: right form per metric, single-series (hue = domain identity), thin marks,
   recessive axes, hover on every plot. DAU/retention is intentionally absent — that
   needs an event stream (PostHog), not a row count, so we don't fake it. */

interface DayCount { date: string; count: number }
interface CumPoint { date: string; total: number }
interface Cohort { label: string; users: number; pct: number }
interface Analytics {
  days: number;
  totals: {
    users: number; posts: number; comments: number; active_listings: number;
    sold_listings: number; listed_value: number; items: number;
    communities: number; events: number; vouches: number;
  };
  growth: { new_users: number; prev_users: number; growth_pct: number | null };
  cumulative_users: CumPoint[];
  signups_per_day: DayCount[];
  posts_per_day: DayCount[];
  interest_cohort: Cohort[];
}

const RED = "var(--stamp-red)";
const TEAL = "var(--verified-teal)";
const FOREST = "var(--forest)";

const nf = new Intl.NumberFormat("en-IN");
function inrCompact(paise: number) {
  const r = paise / 100;
  if (r >= 1e7) return `₹${(r / 1e7).toFixed(2)}Cr`;
  if (r >= 1e5) return `₹${(r / 1e5).toFixed(2)}L`;
  if (r >= 1e3) return `₹${(r / 1e3).toFixed(1)}K`;
  return `₹${nf.format(Math.round(r))}`;
}
function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    api.get<Analytics>(`/admin/analytics?days=${days}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [days]);

  const showLoader = !data;
  const stale = !!data && data.days !== days;  // dim while a range switch is in flight

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", margin: "0 0 4px" }}>Growth &amp; traction</h1>
          <p style={{ color: "var(--ink-faint)", fontSize: 13.5, margin: 0 }}>Live metrics from production · last {days} days</p>
        </div>
        <RangeSelector days={days} onChange={setDays} />
      </div>

      {showLoader && <div style={{ fontSize: 14, color: "var(--ink-faint)", padding: "40px 0" }}>Loading…</div>}

      {data && (
        <div style={{ opacity: stale ? 0.55 : 1, transition: "opacity 150ms" }}>
          {/* ── headline KPIs ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, margin: "22px 0 14px" }}>
            <Kpi label="Total members" value={nf.format(data.totals.users)} accent={RED}
                 delta={data.growth.growth_pct != null ? `${data.growth.growth_pct >= 0 ? "+" : ""}${data.growth.growth_pct}% vs prev ${days}d` : `+${data.growth.new_users} new`}
                 up={(data.growth.growth_pct ?? 0) >= 0} />
            <Kpi label="Listed value (live)" value={inrCompact(data.totals.listed_value)} accent={FOREST}
                 delta={`${nf.format(data.totals.active_listings)} active listings`} />
            <Kpi label="Posts" value={nf.format(data.totals.posts)} accent={TEAL}
                 delta={`${nf.format(data.totals.comments)} comments`} />
            <Kpi label="Items catalogued" value={nf.format(data.totals.items)} accent={RED}
                 delta={`${nf.format(data.totals.vouches)} vouches of trust`} />
          </div>

          {/* secondary stat strip */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
            <Chip label="New this period" value={`+${nf.format(data.growth.new_users)}`} />
            <Chip label="Communities" value={nf.format(data.totals.communities)} />
            <Chip label="Events" value={nf.format(data.totals.events)} />
            <Chip label="Sold" value={nf.format(data.totals.sold_listings)} />
          </div>

          {/* ── cumulative member growth (the story) ── */}
          <Panel title="Member growth" subtitle="cumulative registered members">
            <AreaChart points={data.cumulative_users.map((p) => ({ date: p.date, value: p.total }))} color={RED} />
          </Panel>

          {/* ── daily activity: small multiples (one axis each, never dual) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <Panel title="New signups" subtitle="per day">
              <BarChart data={data.signups_per_day} color={RED} />
            </Panel>
            <Panel title="Posts created" subtitle="per day">
              <BarChart data={data.posts_per_day} color={TEAL} />
            </Panel>
          </div>

          {/* ── category mix ── */}
          <div style={{ marginTop: 16 }}>
            <Panel title="Member interests" subtitle="share of collectors by category">
              <CohortBars cohort={data.interest_cohort} />
            </Panel>
          </div>

          <div style={{ marginTop: 20, padding: "13px 16px", borderRadius: 12, background: "var(--bone)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--ink-mute)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--ink-soft)" }}>Engagement &amp; retention</strong> (DAU/MAU, cohort retention) need an event stream, not row counts — they land when the PostHog key is wired at beta. Everything above is computed live from Postgres.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── range selector ── */
function RangeSelector({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
      {[30, 60, 90].map((d, i) => (
        <button key={d} onClick={() => onChange(d)}
          style={{ padding: "7px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
            border: "none", borderLeft: i ? "1px solid var(--border)" : "none",
            background: days === d ? "var(--ink)" : "var(--paper)", color: days === d ? "var(--paper)" : "var(--ink-mute)" }}>
          {d}d
        </button>
      ))}
    </div>
  );
}

/* ── KPI tile ── */
function Kpi({ label, value, delta, accent, up }: { label: string; value: string; delta: string; accent: string; up?: boolean }) {
  return (
    <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: up === undefined ? "var(--ink-mute)" : up ? "var(--forest)" : "var(--stamp-red)", marginTop: 7, fontWeight: up === undefined ? 400 : 600 }}>{delta}</div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "8px 13px", borderRadius: 10, background: "var(--bone)", border: "1px solid var(--border)" }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{label}</span>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>{title}</span>
        {subtitle && <span style={{ fontSize: 12.5, color: "var(--ink-faint)", marginLeft: 8 }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── area chart (cumulative) — single series, hover crosshair + tooltip ── */
function AreaChart({ points, color }: { points: { date: string; value: number }[]; color: string }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 600, H = 190, padT = 12, padB = 22, padL = 40, padR = 8;
  const n = points.length;
  if (n < 2) return <Empty />;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value));
  const lo = Math.max(0, min - (max - min) * 0.15);
  const x = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - lo) / (max - lo || 1)) * (H - padT - padB);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const ticks = 3;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => lo + ((max - lo) * i) / ticks);
  const a = active != null ? points[active] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}
           onMouseLeave={() => setActive(null)}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">{nf.format(Math.round(v))}</text>
          </g>
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {[0, Math.floor((n - 1) / 2), n - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="10" fill="var(--ink-faint)">{shortDate(points[i].date)}</text>
        ))}
        {a && (
          <g>
            <line x1={x(active!)} y1={padT} x2={x(active!)} y2={H - padB} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={x(active!)} cy={y(a.value)} r="4" fill={color} stroke="var(--paper)" strokeWidth="2" />
          </g>
        )}
        {/* hover bands */}
        {points.map((_, i) => (
          <rect key={i} x={i === 0 ? 0 : (x(i) + x(i - 1)) / 2} y={0}
                width={i === 0 ? x(0) + (x(1) - x(0)) / 2 : i === n - 1 ? (x(n - 1) - x(n - 2)) / 2 + padR : (x(i + 1) - x(i - 1)) / 2}
                height={H} fill="transparent" onMouseEnter={() => setActive(i)} />
        ))}
      </svg>
      {a && (
        <Tooltip leftPct={(x(active!) / W) * 100} topPct={(y(a.value) / H) * 100}>
          <strong>{nf.format(a.value)}</strong> members<br /><span style={{ color: "var(--ink-faint)" }}>{shortDate(a.date)}</span>
        </Tooltip>
      )}
    </div>
  );
}

/* ── bar chart (daily) — single series, per-bar hover ── */
function BarChart({ data, color }: { data: DayCount[]; color: string }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 290, H = 150, padT = 10, padB = 20;
  const n = data.length;
  if (!n) return <Empty />;
  const max = Math.max(...data.map((d) => d.count), 1);
  const gap = n > 45 ? 1 : 2;
  const bw = (W - (n - 1) * gap) / n;
  const bh = (c: number) => Math.max(c > 0 ? 2 : 0, ((c / max) * (H - padT - padB)));
  const a = active != null ? data[active] : null;
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} onMouseLeave={() => setActive(null)}>
        <line x1={0} y1={H - padB} x2={W} y2={H - padB} stroke="var(--border)" strokeWidth="1" />
        {data.map((d, i) => {
          const h = bh(d.count);
          const bx = i * (bw + gap);
          return (
            <g key={i} onMouseEnter={() => setActive(i)}>
              <rect x={bx} y={0} width={bw} height={H} fill="transparent" />
              <rect x={bx} y={H - padB - h} width={bw} height={h} rx={Math.min(3, bw / 2)}
                    fill={color} opacity={active == null || active === i ? 1 : 0.4} />
            </g>
          );
        })}
        <text x={0} y={H - 5} fontSize="9.5" fill="var(--ink-faint)">{shortDate(data[0].date)}</text>
        <text x={W} y={H - 5} textAnchor="end" fontSize="9.5" fill="var(--ink-faint)">{shortDate(data[n - 1].date)}</text>
        <text x={W} y={10} textAnchor="end" fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">peak {max}</text>
      </svg>
      {a && (
        <Tooltip leftPct={((active! * (bw + gap) + bw / 2) / W) * 100} topPct={((H - padB - bh(a.count)) / H) * 100}>
          <strong>{a.count}</strong> {a.count === 1 ? "" : ""}<br /><span style={{ color: "var(--ink-faint)" }}>{shortDate(a.date)}</span>
        </Tooltip>
      )}
    </div>
  );
}

/* ── ranked horizontal bars (interest cohort) ── */
function CohortBars({ cohort }: { cohort: Cohort[] }) {
  if (!cohort.length) return <Empty label="No interest data yet." />;
  const max = Math.max(...cohort.map((c) => c.pct), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {cohort.map((c) => (
        <div key={c.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{c.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-faint)" }}>{nf.format(c.users)} · {c.pct}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: "var(--bone)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(c.pct / max) * 100}%`, background: RED, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Tooltip({ leftPct, topPct, children }: { leftPct: number; topPct: number; children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", left: `${leftPct}%`, top: `${topPct}%`, transform: "translate(-50%, -115%)",
      pointerEvents: "none", background: "var(--ink)", color: "var(--paper)", padding: "6px 9px", borderRadius: 8,
      fontSize: 12, lineHeight: 1.35, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,0.18)", zIndex: 5 }}>
      {children}
    </div>
  );
}

function Empty({ label = "Not enough data yet." }: { label?: string }) {
  return <div style={{ fontSize: 13, color: "var(--ink-faint)", padding: "24px 0", textAlign: "center" }}>{label}</div>;
}
