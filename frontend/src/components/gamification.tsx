"use client";

/* ──────────────────────────────────────────────────────────────────────────
 * Gamification UI (BRD v1.4 §8.12, §9.17–9.19) — web port of design Rewards.jsx.
 * Mechanics + numbers come from the backend (/rewards, /users/{h}/rank|badges);
 * this module owns only the visual tokens, keyed by the ids the API returns.
 * ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Sparkles, Medal, Gem, Flame, Crown, Camera, Heart, ArrowLeftRight,
  User, Star, Shield, Calendar, MessageCircle, Gift, Zap, Lock,
  ChevronRight, Trophy, type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

/* ── API payload types ──────────────────────────────────────────────────── */
export interface TierInfo { id: string; name: string; at: number; perk: string }
export interface Archetype { id: string; name: string; label: string }
export interface RankProgress { tier: TierInfo; next: TierInfo | null; index: number; total: number; pct: number; need: number }
export interface MixRow { dimension: string; label: string; archetype: string; points: number; pct: number }
export interface EarnAction { id: string; label: string; xp: number; icon: string; freq: string; progress?: { done: number; total: number } }
export interface RewardsSummary {
  xp: number; xp_week: number; xp_month: number; rank: RankProgress;
  archetype: Archetype; contrib_mix: MixRow[]; earn_actions: EarnAction[];
  checkin: { claimed: boolean; xp: number; streak: number };
  referral: { code: string; count: number; xp: number };
}
export interface RankCardData {
  xp: number; xp_week: number; rank: RankProgress; archetype: Archetype;
  contrib_mix?: MixRow[]; user: { handle: string; name: string; avatar_url: string | null }; is_me: boolean;
}
export interface LbRow {
  key: string; handle: string; name: string; avatar_url: string | null;
  points: number; tier_id: string; tier_name: string; archetype: Archetype; is_me: boolean;
}
export interface Standing { rank: number; points: number; tier_id: string; tier_name: string; archetype: Archetype }
export interface SeasonBadgeT { id: string; tier: string; kind: string; period: string; title: string; bonus_xp: number }
export interface TrophyCaseData { count: number; bonus_xp_total: number; badges: SeasonBadgeT[]; user: { handle: string; name: string; avatar_url: string | null }; is_me: boolean }

/* ── Visual tokens (keyed by API ids) ───────────────────────────────────── */
export const TIER_VIS: Record<string, { color: string; Icon: LucideIcon }> = {
  rookie:    { color: "var(--ink-mute)",        Icon: Box },
  fan:       { color: "var(--forest)",          Icon: Sparkles },
  collector: { color: "var(--verified-teal)",   Icon: Medal },
  pro:       { color: "var(--plum)",            Icon: Gem },
  expert:    { color: "var(--grail-gold-deep)", Icon: Flame },
  legend:    { color: "var(--stamp-red)",       Icon: Crown },
};
export const ARCHE_VIS: Record<string, { color: string; Icon: LucideIcon; blurb: string }> = {
  posts:      { color: "var(--plum)",            Icon: Camera,         blurb: "Shares the most builds & photos" },
  social:     { color: "var(--stamp-red)",       Icon: Heart,          blurb: "Likes, comments & lifts the community" },
  collection: { color: "var(--verified-teal)",   Icon: Gem,            blurb: "Catalogs & verifies the deepest shelf" },
  market:     { color: "var(--grail-gold-deep)", Icon: ArrowLeftRight, blurb: "Most active in deals & trades" },
};
const EARN_ICON: Record<string, LucideIcon> = {
  profile: User, refer: Gift, item: Box, showcase: Camera, review: Star,
  vouch: Shield, rsvp: Calendar, comment: MessageCircle, like: Heart, checkin: Zap,
};
export const BADGE_TIER: Record<string, { fill: string; ink: string; ring: string; label: string }> = {
  gold:     { fill: "#F0C04A", ink: "#5A3D00", ring: "#CE991C", label: "1st place" },
  silver:   { fill: "#C6CCD4", ink: "#3D434C", ring: "#9BA3AD", label: "2nd place" },
  bronze:   { fill: "#D49A66", ink: "#4A2C12", ring: "#B27B43", label: "3rd place" },
  finalist: { fill: "var(--bone)", ink: "var(--verified-teal)", ring: "var(--verified-teal)", label: "Top 10" },
};
export const BADGE_KIND: Record<string, { Icon: LucideIcon; label: string }> = {
  weekly:     { Icon: Medal,         label: "Weekly league" },
  monthly:    { Icon: Trophy,        label: "Monthly league" },
  market:     { Icon: ArrowLeftRight, label: "Trader season" },
  social:     { Icon: Heart,         label: "Connector season" },
  posts:      { Icon: Camera,        label: "Showcaser season" },
  collection: { Icon: Gem,           label: "Archivist season" },
};
export const MEDALS = ["var(--grail-gold)", "#A6A8AC", "#C08552"];

const fmt = (n: number) => n.toLocaleString("en-IN");

/* ── TierBadge — coloured rank tile (or padlock when locked) ─────────────── */
export function TierBadge({ tierId, size = 40, locked = false }: { tierId: string; size?: number; locked?: boolean }) {
  const t = TIER_VIS[tierId] ?? TIER_VIS.rookie;
  const Icon = locked ? Lock : t.Icon;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: locked ? "var(--bone)" : t.color, color: locked ? "var(--ink-ghost)" : "var(--paper)",
      boxShadow: locked ? "none" : `0 2px 8px ${t.color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
    }}>
      {!locked && <span style={{ position: "absolute", top: "-30%", left: "-10%", width: "70%", height: "70%", borderRadius: "50%", background: "rgba(255,255,255,0.28)", filter: "blur(2px)" }} />}
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} style={{ position: "relative" }} />
    </div>
  );
}

/* ── SeasonBadge — circular metal medallion ─────────────────────────────── */
export function SeasonBadge({ badge, size = 40 }: { badge: SeasonBadgeT; size?: number }) {
  const m = BADGE_TIER[badge.tier] ?? BADGE_TIER.finalist;
  const k = BADGE_KIND[badge.kind] ?? BADGE_KIND.weekly;
  const Icon = k.Icon;
  return (
    <div title={`${badge.title} · ${badge.period}`} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center", background: m.fill, color: m.ink,
      boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.055)}px ${m.ring}, 0 1px 5px ${m.ring}55`,
    }}>
      <span style={{ position: "absolute", top: "8%", left: "14%", width: "46%", height: "38%", borderRadius: "50%", background: "rgba(255,255,255,0.4)", filter: "blur(1px)" }} />
      <Icon size={Math.round(size * 0.46)} strokeWidth={2.2} style={{ position: "relative" }} />
    </div>
  );
}

/* ── TopSeasonBadge — the user's #1 badge as an avatar-corner medallion ──── */
/* v4 ProfileView renders topBadge(u)=badgesOf(u)[0] at the avatar's bottom-right
   for everyone (incl. own profile). Self-fetches like BadgeShelf; null when none. */
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

/* ── ArchetypeChip — "what they contribute" pill ────────────────────────── */
export function ArchetypeChip({ archetype, size = "md" }: { archetype: Archetype; size?: "sm" | "md" }) {
  const v = ARCHE_VIS[archetype.id] ?? ARCHE_VIS.social;
  const sm = size === "sm";
  const Icon = v.Icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: sm ? 4 : 5, padding: sm ? "2px 7px 2px 5px" : "3px 9px 3px 6px", borderRadius: 999, background: "var(--bone)", border: `1px solid ${v.color}33` }}>
      <span style={{ width: sm ? 15 : 18, height: sm ? 15 : 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: v.color, color: "var(--paper)" }}>
        <Icon size={sm ? 9 : 11} strokeWidth={2.2} />
      </span>
      <span style={{ fontSize: sm ? 11 : 12, fontWeight: 700, color: v.color, letterSpacing: "0.01em" }}>{archetype.name}</span>
    </span>
  );
}

/* ── EarnRow — a single "way to earn" ───────────────────────────────────── */
export function EarnRow({ action, onClick }: { action: EarnAction; onClick?: () => void }) {
  const Icon = EARN_ICON[action.icon] ?? Zap;
  const sub = action.freq === "once"
    ? (action.progress ? `${action.progress.done}/${action.progress.total} steps done` : "One-time")
    : action.freq === "daily" ? "Once a day" : "Repeatable";
  // §9.17 P2 — earn-action deep links: a row with a target is tappable and routes
  // to the surface where the action is performed (compose, events, …).
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
 * GM-15: another user's card shows rank + archetype but not contribution mix. */
export function RewardCard({ handle, isMe }: { handle: string; isMe: boolean }) {
  const router = useRouter();
  const [d, setD] = useState<RankCardData | null>(null);
  useEffect(() => {
    api.get<RankCardData>(`/users/${handle}/rank`).then(setD).catch(() => setD(null));
  }, [handle]);
  if (!d) return null;

  const { tier, next, pct, need, index, total } = d.rank;
  const tcolor = (TIER_VIS[tier.id] ?? TIER_VIS.rookie).color;
  return (
    <div style={{ marginTop: 14, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px 12px" }}>
        <TierBadge tierId={tier.id} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>{tier.name}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.06em" }}>RANK {index + 1}/{total}</span>
          </div>
          <div style={{ marginTop: 5 }}><ArchetypeChip archetype={d.archetype} size="sm" /></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--ink)", fontFeatureSettings: '"tnum" 1', lineHeight: 1 }}>{fmt(d.xp)}</div>
          <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.1em", marginTop: 3 }}>XP</div>
        </div>
      </div>
      <div style={{ padding: "0 15px 13px" }}>
        <div style={{ height: 8, borderRadius: 999, background: "var(--bone)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: tcolor, borderRadius: 999, transition: "width 320ms var(--ease-out)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 7, fontSize: 11.5 }}>
          <span style={{ color: "var(--ink-faint)" }}>
            {next
              ? <><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{fmt(need)} XP</b> to {next.name}</>
              : <span style={{ color: tcolor, fontWeight: 600 }}>Top rank reached</span>}
          </span>
          <span style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>+{d.xp_week} this week</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 15px 15px" }}>
        {isMe && (
          <Button size="sm" variant="dark" style={{ flex: 1, justifyContent: "center" }} icon={<Zap size={15} />}
            onClick={() => router.push("/rewards")}>Earn points</Button>
        )}
        <Button size="sm" variant={isMe ? "secondary" : "dark"} style={{ flex: 1, justifyContent: "center" }} icon={<Trophy size={15} />}
          onClick={() => router.push("/leaderboard")}>Leaderboard</Button>
      </div>
    </div>
  );
}

/* ── BadgeShelf — overlapping season badges on the profile header (GM-14) ── */
export function BadgeShelf({ handle, style }: { handle: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const [d, setD] = useState<TrophyCaseData | null>(null);
  useEffect(() => {
    api.get<TrophyCaseData>(`/users/${handle}/badges`).then(setD).catch(() => setD(null));
  }, [handle]);
  if (!d || d.count === 0) return null;
  const shown = d.badges.slice(0, 4);
  return (
    <button onClick={() => router.push(`/profile/${handle}/badges`)} style={{
      display: "inline-flex", alignItems: "center", gap: 8, marginTop: 9, padding: "4px 9px 4px 4px",
      background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 999, cursor: "pointer", ...style }}>
      <span style={{ display: "flex" }}>
        {shown.map((b, i) => (
          <span key={b.id} style={{ marginLeft: i ? -9 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--paper-soft)" }}>
            <SeasonBadge badge={b} size={24} />
          </span>
        ))}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{d.count} badge{d.count > 1 ? "s" : ""}</span>
      <ChevronRight size={14} style={{ color: "var(--ink-ghost)" }} />
    </button>
  );
}

/* ── resetInfo — leaderboard reset clock (GM-09) ────────────────────────── */
export function resetInfo(mode: string, period: string): { label: string; soon: boolean } {
  if (mode !== "xp" || period === "all") {
    return { label: "Lifetime total — never resets", soon: false };
  }
  const now = new Date();
  if (period === "week") {
    const d = (8 - now.getDay()) % 7 || 7; // days until next Monday
    return { label: `Resets Monday · in ${d} day${d > 1 ? "s" : ""}`, soon: d <= 1 };
  }
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const d = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  const mn = end.toLocaleString("en-US", { month: "short" });
  return { label: `Resets ${mn} 1 · in ${d} day${d > 1 ? "s" : ""}`, soon: d <= 2 };
}

/* Re-exports so pages can pull these icons from one place */
export { Clock, TrendingUp, Trophy, Zap } from "lucide-react";
