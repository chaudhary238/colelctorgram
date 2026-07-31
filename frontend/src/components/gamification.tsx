"use client";

/* ──────────────────────────────────────────────────────────────────────────
 * Gamification UI (Rewards & Badge System v3, §9.17–9.19) — web port of the
 * design Rewards screens. Mechanics + numbers come from the backend
 * (/rewards, /users/{h}/rank|badges); this module owns only the visual tokens,
 * keyed by the ids the API returns.
 *
 * v3 = two badge types: First Start (permanent, team-assigned — Founding Member /
 * Early Believer / Pioneer) and XP/Season (rank badge + weekly league badges).
 * The archetype / contribution-mix system and the monthly board were removed.
 * ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Box, Sparkles, Medal, Gem, Flame, Crown, Star, Camera, Heart,
  User, Shield, Calendar, MessageCircle, Gift, Zap, Database,
  ChevronRight, Trophy, X, Settings, type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

/* ── API payload types ──────────────────────────────────────────────────── */
export interface TierInfo { id: string; name: string; at: number }
export interface RankProgress { tier: TierInfo; next: TierInfo | null; index: number; total: number; pct: number; need: number }
export interface FirstStart { id: string; name: string; emoji: string; frame: boolean; description: string }
/* The single badge shown next to an author in feed/leaderboard (v3 §3). */
export interface FeedBadgeT { kind: "first_start" | "rank"; code: string; name: string; emoji: string | null }
export interface EarnAction { id: string; label: string; xp: number; icon: string; freq: string; cap: number | null; progress?: { done: number; total: number } }
export interface RewardsSummary {
  xp: number; xp_week: number; rank: RankProgress; earn_actions: EarnAction[];
  checkin: { claimed: boolean; xp: number; streak: number };
  referral: { code: string; count: number; xp: number };
}
export interface RankCardData {
  xp: number; xp_week: number; rank: RankProgress; first_start: FirstStart | null;
  user: { handle: string; name: string; avatar_url: string | null }; is_me: boolean;
}
export interface LbRow {
  key: string; handle: string; name: string; avatar_url: string | null;
  points: number; tier_id: string; tier_name: string; badge: FeedBadgeT; is_me: boolean;
}
export interface Standing { rank: number; points: number; tier_id: string; tier_name: string; badge: FeedBadgeT }
export interface SeasonBadgeT { id: string; tier: string; kind: string; period: string; title: string; bonus_xp: number }
export interface TrophyCaseData { first_start: FirstStart | null; count: number; bonus_xp_total: number; badges: SeasonBadgeT[]; user: { handle: string; name: string; avatar_url: string | null }; is_me: boolean }

/* ── Rank ladder (mirrors REWARD_TIERS in services/gamification.py) ──────── */
export const REWARD_TIERS: TierInfo[] = [
  { id: "rookie", name: "Rookie", at: 0 },
  { id: "hunter", name: "Hunter", at: 300 },
  { id: "collector", name: "Collector", at: 1000 },
  { id: "curator", name: "Curator", at: 3000 },
  { id: "archivist", name: "Archivist", at: 7500 },
  { id: "legend", name: "Legend", at: 15000 },
  { id: "icon", name: "Icon", at: 30000 },
];
export function rankOf(xp: number): TierInfo {
  let t = REWARD_TIERS[0];
  for (const r of REWARD_TIERS) if (xp >= r.at) t = r;
  return t;
}

/* ── Visual tokens (keyed by API ids) ───────────────────────────────────── */
export const TIER_VIS: Record<string, { color: string; Icon: LucideIcon }> = {
  rookie:    { color: "var(--ink-mute)",        Icon: Box },
  hunter:    { color: "var(--forest)",          Icon: Sparkles },
  collector: { color: "var(--verified-teal)",   Icon: Medal },
  curator:   { color: "var(--plum)",            Icon: Gem },
  archivist: { color: "var(--grail-gold-deep)", Icon: Flame },
  legend:    { color: "var(--stamp-red)",       Icon: Crown },
  icon:      { color: "var(--ink)",             Icon: Star },
};
/* First Start badge tokens (v3 §6.1). `frame` mirrors the backend — Pioneer &
   Early Believer get the gold avatar frame; Founding Member keeps the pill. */
export const FIRST_START_VIS: Record<string, { color: string; emoji: string; label: string }> = {
  founding:       { color: "var(--ink)",       emoji: "⭐", label: "Founding Member" },
  early_believer: { color: "var(--forest)",    emoji: "🌱", label: "Early Believer" },
  pioneer:        { color: "var(--plum)",      emoji: "🔥", label: "Pioneer" },
};
const EARN_ICON: Record<string, LucideIcon> = {
  profile: User, refer: Gift, db_new: Database, showcase: Camera, review: Star,
  vouch: Shield, rsvp: Calendar, comment: MessageCircle, like: Heart, checkin: Zap,
};
/* Season-badge emoji medals by tier (v6 DV6-02 — replaces the Lucide Medal). */
export const TIER_MEDAL: Record<string, string> = {
  gold: "🥇", silver: "🥈", bronze: "🥉", finalist: "🏅",
};
export const BADGE_TIER: Record<string, { fill: string; ink: string; ring: string; label: string }> = {
  gold:     { fill: "#F0C04A", ink: "#5A3D00", ring: "#CE991C", label: "1st place" },
  silver:   { fill: "#C6CCD4", ink: "#3D434C", ring: "#9BA3AD", label: "2nd place" },
  bronze:   { fill: "#D49A66", ink: "#4A2C12", ring: "#B27B43", label: "3rd place" },
  finalist: { fill: "var(--bone)", ink: "var(--verified-teal)", ring: "var(--verified-teal)", label: "Top 10" },
};
/* v3 §9 — the weekly league is the only badge-minting cycle. */
export const BADGE_KIND: Record<string, { Icon: LucideIcon; label: string }> = {
  weekly: { Icon: Medal, label: "Weekly league" },
};
export const MEDALS = ["var(--grail-gold)", "#A6A8AC", "#C08552"];

/* Gold avatar frame (v3 §2.2). */
export const FRAME_GOLD = "#E8A33D";
export const FRAME_HALO = "#FEF3C7";

const fmt = (n: number) => n.toLocaleString("en-IN");

/* ── fireXpToast — imperative "+N XP" toast (v6 DV6-04) ──────────────────────
   Appended to <body> so it outlives a client-side route change (e.g. compose
   navigates to /feed right after publishing). No provider wiring needed. */
export function fireXpToast(xp: number, label = "XP earned") {
  if (typeof document === "undefined" || xp <= 0) return;
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText = [
    "position:fixed", "left:50%", "bottom:28px", "transform:translateX(-50%) translateY(8px)",
    "z-index:80", "display:flex", "align-items:center", "gap:8px",
    "padding:10px 16px", "border-radius:999px", "background:var(--ink)", "color:var(--paper)",
    "font-family:var(--font-body)", "font-size:13.5px", "font-weight:600",
    "box-shadow:var(--shadow-3)", "opacity:0", "transition:opacity 200ms ease, transform 200ms ease",
    "pointer-events:none",
  ].join(";");
  el.innerHTML = `<span style="font-family:var(--font-mono);font-weight:800;color:var(--grail-gold)">+${xp}</span><span>${label}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)"; });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(() => el.remove(), 250);
  }, 1900);
}

/* ── fireToast — plain imperative toast (no XP styling); same lifecycle as fireXpToast.
   Used e.g. when a free-text add is auto-linked to an existing catalogue entry (DV6-12). */
export function fireToast(message: string) {
  if (typeof document === "undefined" || !message) return;
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText = [
    "position:fixed", "left:50%", "bottom:28px", "transform:translateX(-50%) translateY(8px)",
    "z-index:80", "display:flex", "align-items:center", "gap:8px",
    "padding:10px 16px", "border-radius:999px", "background:var(--ink)", "color:var(--paper)",
    "font-family:var(--font-body)", "font-size:13.5px", "font-weight:600",
    "box-shadow:var(--shadow-3)", "opacity:0", "transition:opacity 200ms ease, transform 200ms ease",
    "pointer-events:none", "max-width:min(90vw,360px)", "text-align:center",
  ].join(";");
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)"; });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(() => el.remove(), 250);
  }, 2200);
}

/* ── TierBadge — coloured rank tile (rounded square) ────────────────────── */
export function TierBadge({ tierId, size = 40, locked = false }: { tierId: string; size?: number; locked?: boolean }) {
  const t = TIER_VIS[tierId] ?? TIER_VIS.rookie;
  const Icon = t.Icon;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: locked ? "var(--bone)" : t.color, color: locked ? "var(--ink-ghost)" : "var(--paper)",
      boxShadow: locked ? "none" : `0 2px 8px ${t.color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
    }}>
      {!locked && <span style={{ position: "absolute", top: "-30%", left: "-10%", width: "70%", height: "70%", borderRadius: "50%", background: "rgba(255,255,255,0.28)", filter: "blur(2px)" }} />}
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} style={{ position: "relative", opacity: locked ? 0.5 : 1 }} />
    </div>
  );
}

/* ── FirstStartTile — rounded square with emoji (v3 §1: emoji square shape) ─ */
export function FirstStartTile({ code, size = 40 }: { code: string; size?: number }) {
  const v = FIRST_START_VIS[code] ?? FIRST_START_VIS.founding;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: v.color, boxShadow: `0 2px 8px ${v.color}44, inset 0 1px 0 rgba(255,255,255,0.3)`,
      fontSize: Math.round(size * 0.5), lineHeight: 1,
    }}>
      <span>{v.emoji}</span>
    </div>
  );
}

/* ── SeasonBadge — circular metal medallion with an emoji medal (v6 DV6-02) ── */
export function SeasonBadge({ badge, size = 40 }: { badge: SeasonBadgeT; size?: number }) {
  const m = BADGE_TIER[badge.tier] ?? BADGE_TIER.finalist;
  const medal = TIER_MEDAL[badge.tier] ?? "🏅";
  return (
    <div title={`${badge.title} · ${badge.period}`} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center", background: m.fill,
      boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.055)}px ${m.ring}, 0 1px 5px ${m.ring}55`,
    }}>
      <span style={{ position: "absolute", top: "8%", left: "14%", width: "46%", height: "38%", borderRadius: "50%", background: "rgba(255,255,255,0.4)", filter: "blur(1px)" }} />
      <span style={{ position: "relative", fontSize: Math.round(size * 0.55), lineHeight: 1 }}>{medal}</span>
    </div>
  );
}

/* ── AvatarFrame — gold ring for Pioneers & Early Believers (v3 §2.2) ────────
   Self-fetches like the shelf; renders an absolutely-positioned gold ring over
   the profile avatar. Founding Members get no frame (their pill is the treatment).
   Mount inside the avatar's `position:relative` wrapper. */
export function AvatarFrame({ handle }: { handle: string }) {
  const [fs, setFs] = useState<FirstStart | null>(null);
  useEffect(() => {
    api.get<RankCardData>(`/users/${handle}/rank`).then((d) => setFs(d.first_start)).catch(() => setFs(null));
  }, [handle]);
  if (!fs?.frame) return null;
  return (
    <span aria-hidden style={{
      position: "absolute", inset: -4, borderRadius: "50%", pointerEvents: "none",
      border: `3px solid ${FRAME_GOLD}`, boxShadow: `0 0 0 2px ${FRAME_HALO}, 0 0 0 5px ${FRAME_GOLD}`,
    }} />
  );
}

/* ── TopSeasonBadge — the user's #1 season badge as an avatar-corner medallion ──
   Self-fetches like BadgeShelf; null when the user has no league badge yet. */
export function TopSeasonBadge({ handle, size = 26 }: { handle: string; size?: number }) {
  const [badge, setBadge] = useState<SeasonBadgeT | null>(null);
  useEffect(() => {
    api.get<TrophyCaseData>(`/users/${handle}/badges`)
      .then((d) => setBadge(d.badges?.[0] ?? null))
      .catch(() => setBadge(null));
  }, [handle]);
  if (!badge) return null;
  return (
    <span style={{ position: "absolute", right: -4, bottom: -4, borderRadius: "50%", boxShadow: "0 0 0 2.5px var(--paper)" }}>
      <SeasonBadge badge={badge} size={size} />
    </span>
  );
}

/* ── FeedBadge — the ONE badge next to an author name (v3 §2.4/§3/§4) ─────── */
export function FeedBadge({ badge, size = "sm" }: { badge: FeedBadgeT | null | undefined; size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  if (!badge) return null;
  const sm = size === "sm";
  const isFirst = badge.kind === "first_start";
  const color = isFirst
    ? (FIRST_START_VIS[badge.code]?.color ?? "var(--ink)")
    : (TIER_VIS[badge.code]?.color ?? "var(--ink-mute)");
  const Icon = isFirst ? null : (TIER_VIS[badge.code]?.Icon ?? Box);
  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        title={badge.name}
        style={{
          display: "inline-flex", alignItems: "center", gap: sm ? 3 : 4, flexShrink: 0, cursor: "pointer",
          padding: sm ? "1.5px 7px 1.5px 5px" : "3px 9px 3px 6px", borderRadius: 999,
          background: "var(--bone)", border: `1px solid ${color}33`, lineHeight: 1.4,
        }}
      >
        <span style={{ display: "inline-flex", fontSize: sm ? 11 : 13 }}>
          {isFirst ? (badge.emoji ?? "⭐") : Icon && <Icon size={sm ? 11 : 13} strokeWidth={2.3} color={color} />}
        </span>
        <span style={{ fontSize: sm ? 11 : 12.5, fontWeight: 700, color, letterSpacing: "0.01em" }}>{badge.name}</span>
      </button>
      {open && <BadgeSheet badge={badge} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ── BadgeSheet — bottom-sheet explaining a tapped badge (v3 §4) ─────────── */
const FIRST_START_DESC: Record<string, string> = {
  founding: "One of the founding members of Scorred. Permanently and manually assigned — never expires.",
  early_believer: "One of the first collectors to join Scorred. Permanent — never expires.",
  pioneer: "One of the earliest beta collectors on Scorred. Permanent — never expires.",
};
export function BadgeSheet({ badge, onClose }: { badge: FeedBadgeT; onClose: () => void }) {
  const isFirst = badge.kind === "first_start";
  const typeLabel = isFirst ? "Permanent badge" : "Rank badge";
  const desc = isFirst
    ? (FIRST_START_DESC[badge.code] ?? "A permanent First Start badge, manually assigned by the Scorred team.")
    : (() => {
        const t = REWARD_TIERS.find((r) => r.id === badge.code);
        return t ? `Your current rank, earned from ${t.at.toLocaleString("en-IN")}+ lifetime Collector XP. It updates automatically as you level up.` : "Your current collector rank, from lifetime XP.";
      })();
  // Portal to <body>: the feed PostCard applies a CSS transform on hover, which
  // would otherwise trap this position:fixed sheet inside the card (it'd render
  // small, just under the author name, and jump around on resize).
  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(15,23,42,0.5)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "26px 24px 22px", borderTopLeftRadius: 22, borderTopRightRadius: 22, background: "var(--paper)", boxShadow: "var(--shadow-3)" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, display: "flex", padding: 6, cursor: "pointer", color: "var(--ink-faint)", background: "none", border: "none" }}>
          <X size={20} />
        </button>
        {isFirst ? <FirstStartTile code={badge.code} size={76} /> : <TierBadge tierId={badge.code} size={76} />}
        <div style={{ marginTop: 14, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{typeLabel}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em", marginTop: 3 }}>{badge.name}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 10, maxWidth: 340 }}>{desc}</div>
        <Button variant="dark" onClick={onClose} style={{ marginTop: 20, width: "100%", justifyContent: "center" }}>Got it</Button>
      </div>
    </div>,
    document.body
  );
}

/* ── EarnRow — a single "way to earn" ───────────────────────────────────── */
export function EarnRow({ action, onClick }: { action: EarnAction; onClick?: () => void }) {
  const Icon = EARN_ICON[action.icon] ?? Zap;
  const sub = action.freq === "once"
    ? (action.progress ? `${action.progress.done}/${action.progress.total} steps done` : "One-time")
    : action.freq === "daily" ? "Once a day"
    : action.cap ? `Up to ${action.cap}/day` : "Repeatable";
  // Earn-action deep links: a row with a target is tappable and routes to the
  // surface where the action is performed (compose, events, …).
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 13, border: "1px solid var(--border)", background: "var(--paper-soft)", width: "100%", textAlign: "left", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bone)", color: "var(--ink-mute)" }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{action.label}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 1 }}>{sub}</div>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13.5, color: "var(--verified-teal)" }}>+{action.xp}</span>
      {onClick && <ChevronRight size={16} style={{ color: "var(--ink-ghost)", flexShrink: 0, marginLeft: 2 }} />}
    </Tag>
  );
}

/* ── FilterChip — leaderboard sub-filter ────────────────────────────────── */
export function FilterChip({ active, color, icon, onClick, children }: { active?: boolean; color?: string; icon?: React.ReactNode; onClick?: () => void; children: React.ReactNode }) {
  const c = color || "var(--ink)";
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, whiteSpace: "nowrap", cursor: "pointer",
      padding: icon ? "7px 12px 7px 10px" : "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
      border: `1px solid ${active ? c : "var(--border)"}`,
      background: active ? c : "var(--paper)",
      color: active ? "var(--paper)" : "var(--ink-mute)",
    }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ── RewardCard — compact rank card on the profile header (own + others) ──
 * Self-fetches /users/{handle}/rank so profile integration stays a one-liner.
 *
 * design_v7 (DV7-01) tightened this: tier-tinted surface, XP inline in the title row,
 * a slimmer 6px bar, and the CTAs inside the card — it now costs one row of vertical
 * space instead of three, which is what let the v7 profile header lose its separate
 * stat bar. `sideActions` adds the v7 Refer/Settings squares alongside (own profile
 * only — the ContextualRail leaves them off, the Sidebar already carries Settings).
 * The First Start pill moved out: it's a slot in the BadgeShelf next to the name. */
export function RewardCard({ handle, isMe, sideActions = false }: { handle: string; isMe: boolean; sideActions?: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<RankCardData | null>(null);
  useEffect(() => {
    api.get<RankCardData>(`/users/${handle}/rank`).then(setD).catch(() => setD(null));
  }, [handle]);
  if (!d) return null;

  const { tier, next, pct, need } = d.rank;
  const tcolor = (TIER_VIS[tier.id] ?? TIER_VIS.rookie).color;
  return (
    <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "stretch" }}>
      <div
        style={{
          flex: 1, minWidth: 0, borderRadius: 14, padding: "11px 13px",
          background: `color-mix(in oklab, ${tcolor} 12%, var(--paper-soft))`,
          border: `1px solid color-mix(in oklab, ${tcolor} 45%, var(--border))`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TierBadge tierId={tier.id} size={34} />
          <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tier.name}
          </span>
          <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>
            {fmt(d.xp)} <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: "0.08em" }}>XP</span>
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.55)", overflow: "hidden", margin: "8px 0 5px" }}>
          <div style={{ height: "100%", width: pct + "%", background: tcolor, borderRadius: 999, transition: "width 320ms var(--ease-out)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, gap: 8 }}>
          <span style={{ color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {next
              ? <><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{fmt(need)} XP</b> to {next.name}</>
              : <span style={{ color: tcolor, fontWeight: 600 }}>Top rank reached</span>}
          </span>
          <span style={{ color: "var(--ink-soft)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", flexShrink: 0 }}>+{d.xp_week} this week</span>
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          {isMe && (
            <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: "center" }} icon={<Zap size={14} />}
              onClick={() => router.push("/rewards")}>Earn points</Button>
          )}
          <Button size="sm" variant="secondary" style={{ flex: 1, justifyContent: "center", background: "var(--paper)", borderColor: tcolor }} icon={<Trophy size={14} />}
            onClick={() => router.push("/leaderboard")}>Leaderboard</Button>
        </div>
      </div>
      {sideActions && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "stretch" }}>
          <SideAction label="Refer a friend" icon={<Gift size={18} />} onClick={() => router.push("/refer")} />
          <SideAction label="Settings" icon={<Settings size={18} />} onClick={() => router.push("/settings")} />
        </div>
      )}
    </div>
  );
}

function SideAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        flex: 1, width: 52, borderRadius: 13, border: "1px solid var(--border)", background: "var(--paper-soft)",
        color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}
    >
      {icon}
    </button>
  );
}

/* ── BadgeShelf — First Start + season badges on the profile header (v3 §2.1) ── */
export function BadgeShelf({ handle, style }: { handle: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const [d, setD] = useState<TrophyCaseData | null>(null);
  useEffect(() => {
    api.get<TrophyCaseData>(`/users/${handle}/badges`).then(setD).catch(() => setD(null));
  }, [handle]);
  if (!d) return null;
  const fs = d.first_start;
  const total = d.count + (fs ? 1 : 0);
  if (total === 0) return null;
  // v6 (DV6-02) — group season badges by tier with a count; First Start badge
  // takes a priority slot, then the top season tiers. Max 3 shelf slots.
  const slots = groupBadgeSlots(fs, d.badges).slice(0, 3);
  return (
    <button onClick={() => router.push(`/profile/${handle}/badges`)} style={{
      display: "inline-flex", alignItems: "center", gap: 8, marginTop: 9, padding: "4px 9px 4px 4px",
      background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 999, cursor: "pointer", ...style }}>
      <span style={{ display: "flex" }}>
        {slots.map((slot, i) => (
          <span key={slot.key} style={{ marginLeft: i ? -9 : 0, borderRadius: slot.kind === "first" ? 7 : "50%", boxShadow: "0 0 0 2px var(--paper-soft)", position: "relative" }}>
            {slot.kind === "first"
              ? <FirstStartTile code={slot.code} size={24} />
              : <SeasonBadge badge={slot.badge} size={24} />}
            {slot.count > 1 && (
              <span style={{ position: "absolute", top: -4, right: -4, minWidth: 14, height: 14, borderRadius: 999, background: "var(--stamp-red)", color: "#fff", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", border: "1.5px solid var(--paper-soft)", lineHeight: 1 }}>{slot.count}</span>
            )}
          </span>
        ))}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{total} badge{total > 1 ? "s" : ""}</span>
      <ChevronRight size={14} style={{ color: "var(--ink-ghost)" }} />
    </button>
  );
}

/* Group badges into shelf slots: First Start (priority, one slot per badge) then
   season badges collapsed by tier with a count (v6 DV6-02). */
export type BadgeSlot =
  | { key: string; kind: "first"; code: string; count: number }
  | { key: string; kind: "season"; badge: SeasonBadgeT; count: number };
export function groupBadgeSlots(fs: FirstStart | null, badges: SeasonBadgeT[]): BadgeSlot[] {
  const slots: BadgeSlot[] = [];
  if (fs) slots.push({ key: "first-" + fs.id, kind: "first", code: fs.id, count: 1 });
  const byTier = new Map<string, { badge: SeasonBadgeT; count: number }>();
  for (const b of badges) {
    const tier = b.tier || "finalist";
    const g = byTier.get(tier);
    if (g) g.count++;
    else byTier.set(tier, { badge: b, count: 1 });
  }
  for (const [tier, g] of byTier) slots.push({ key: "season-" + tier, kind: "season", badge: g.badge, count: g.count });
  return slots;
}

/* ── resetInfo — leaderboard reset clock (v3 §9) ────────────────────────── */
export function resetInfo(period: string): { label: string; soon: boolean } {
  if (period === "all") {
    return { label: "Lifetime total — never resets", soon: false };
  }
  const now = new Date();
  const d = (8 - now.getDay()) % 7 || 7; // days until next Monday
  return { label: `Resets Monday · in ${d} day${d > 1 ? "s" : ""}`, soon: d <= 1 };
}

/* Re-exports so pages can pull these icons from one place */
export { Clock, TrendingUp, Trophy, Zap } from "lucide-react";
