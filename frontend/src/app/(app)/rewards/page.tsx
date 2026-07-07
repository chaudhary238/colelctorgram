"use client";

/* Rewards screen (Rewards & Badge System v3, §9.17) — hero, daily check-in,
 * ways to earn, rank ladder. Reached from the profile rank card's "Earn points". */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Flame, Gift, Copy } from "lucide-react";
import { api } from "@/lib/api";
import { Button, SectionLabel } from "@/components/ui";
import {
  TierBadge, EarnRow, TIER_VIS, REWARD_TIERS,
  type RewardsSummary, Trophy, Zap,
} from "@/components/gamification";

const fmt = (n: number) => n.toLocaleString("en-IN");

// DV6-02 — earn-action deep links. Each lands on the surface where the action is
// actually performed: refer → the referral dashboard; profile → your own profile;
// db_new → your collection (where "Add to collection" submits new catalogue items);
// showcase/review deep-link straight into the composer (skipping the Create
// chooser); vouch → your Following list (who you can vouch for).
const EARN_LINK: Record<string, string> = {
  refer: "/refer",
  profile: "/profile",
  db_new: "/market/new",
  showcase: "/compose?type=post",
  review: "/compose?type=review",
  rsvp: "/events",
  comment: "/feed",
  like: "/feed",
  vouch: "/search",
};

export default function RewardsPage() {
  const router = useRouter();
  const [d, setD] = useState<RewardsSummary | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyInvite(code: string) {
    const link = `${window.location.origin}/auth/signup?ref=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — no-op */ }
  }

  const [rankUp, setRankUp] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => { api.get<RewardsSummary>("/rewards/me").then(setD).catch(() => setD(null)); }, []);

  // §9.17 P2 — rank-up celebration: fire once when the viewer's rank index has
  // advanced since their last visit (tracked client-side; no backend needed).
  useEffect(() => {
    if (!d) return;
    const KEY = "ch_rank_index";
    const prev = localStorage.getItem(KEY);
    const cur = d.rank.index;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot celebration when fresh rewards data shows a promotion vs. the last-seen rank
    if (prev !== null && cur > Number(prev)) setRankUp({ name: d.rank.tier.name, id: d.rank.tier.id });
    localStorage.setItem(KEY, String(cur));
  }, [d]);

  async function claim() {
    if (!d || d.checkin.claimed || claiming) return;
    setClaiming(true);
    try {
      const res = await api.post<{ granted: boolean; xp: number }>("/rewards/checkin");
      setD((p) => p && ({
        ...p,
        xp: res?.xp ?? p.xp,
        // Claiming today extends the run ending yesterday (or starts a new one).
        checkin: { ...p.checkin, claimed: true, streak: p.checkin.streak + 1 },
      }));
    } finally { setClaiming(false); }
  }

  return (
    <div className="w-full max-w-[600px] min-h-screen border-r border-[var(--border)]">
      <style>{`@keyframes scr-pop-in { 0% { opacity: 0; transform: scale(0.4); } 70% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } } .scr-pop-in { animation: scr-pop-in 400ms cubic-bezier(.34,1.56,.64,1) both; }`}</style>
      {rankUp && <RankUpOverlay tier={rankUp} onClose={() => setRankUp(null)} />}
      <Header title="Rewards" subtitle="Collector XP" onBack={() => router.back()}
        trailing={<Button size="sm" variant="secondary" icon={<Trophy size={15} />} onClick={() => router.push("/leaderboard")}>Ranks</Button>} />

      {!d ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Loading…</div>
      ) : (
        <div style={{ padding: 16 }}>
          {(() => {
            const { tier, next, pct, need, index, total } = d.rank;
            const tcolor = (TIER_VIS[tier.id] ?? TIER_VIS.rookie).color;
            return (
              <>
                {/* hero */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 16px 22px", borderRadius: 18, border: "1px solid var(--border)", background: "var(--paper-soft)" }}>
                  <TierBadge tierId={tier.id} size={66} />
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", marginTop: 12 }}>{tier.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.04em", marginTop: 3 }}>
                    {fmt(d.xp)} XP · RANK {index + 1} OF {total}
                  </div>
                  <div style={{ width: "100%", marginTop: 16 }}>
                    <div style={{ height: 10, borderRadius: 999, background: "var(--bone)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: tcolor, borderRadius: 999, transition: "width 360ms var(--ease-out)" }} />
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 9, lineHeight: 1.5 }}>
                      {next
                        ? <><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{fmt(need)} XP</b> to unlock <b style={{ color: tcolor }}>{next.name}</b></>
                        : "You’ve reached the top rank — Icon."}
                    </div>
                  </div>
                </div>

                {/* daily check-in */}
                <button onClick={claim} disabled={d.checkin.claimed} style={{
                  width: "100%", marginTop: 12, display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 14, textAlign: "left",
                  cursor: d.checkin.claimed ? "default" : "pointer",
                  border: `1px solid ${d.checkin.claimed ? "var(--border)" : "var(--grail-gold)"}`,
                  background: d.checkin.claimed ? "var(--paper-soft)" : "var(--grail-gold-soft)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: d.checkin.claimed ? "var(--bone)" : "var(--grail-gold)", color: d.checkin.claimed ? "var(--ink-faint)" : "var(--ink)" }}>
                    {d.checkin.claimed
                      ? <img className="scr-pop-in" src="/brand/icon-crop.png" width={24} height={24} alt="" style={{ objectFit: "contain", display: "block" }} />
                      : <Zap size={20} strokeWidth={2.2} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{d.checkin.claimed ? "Checked in today" : "Daily check-in"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1 }}>{d.checkin.claimed ? "Come back tomorrow for more" : "Tap to claim today’s bonus"}</div>
                  </div>
                  {d.checkin.streak >= 2 && (
                    <span title={`${d.checkin.streak}-day streak`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: "var(--grail-gold-deep)", background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 999, padding: "3px 8px" }}>
                      <Flame size={13} strokeWidth={2.4} />{d.checkin.streak}
                    </span>
                  )}
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: d.checkin.claimed ? "var(--ink-faint)" : "var(--grail-gold-deep)" }}>+{d.checkin.xp}</span>
                </button>

                {/* refer a friend (GM-05) */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--paper-soft)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bone)", color: "var(--plum)" }}>
                    <Gift size={20} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Refer a friend</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 1 }}>
                      {d.referral.count > 0
                        ? `${d.referral.count} joined · +${d.referral.xp} each`
                        : `+${d.referral.xp} XP when a friend joins`}
                    </div>
                  </div>
                  <button onClick={() => copyInvite(d.referral.code)} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "var(--paper)", background: "var(--ink)", border: "none", borderRadius: 999, padding: "7px 12px", cursor: "pointer" }}>
                    {copied ? <Check size={14} strokeWidth={2.6} /> : <Copy size={14} strokeWidth={2.4} />}{copied ? "Copied" : "Invite"}
                  </button>
                </div>

                {/* ways to earn */}
                <div style={{ marginTop: 24 }}><SectionLabel>Ways to earn</SectionLabel></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 11 }}>
                  {d.earn_actions.map((a) => {
                    const target = EARN_LINK[a.id];
                    const onClick = target ? () => router.push(target) : undefined;
                    return <EarnRow key={a.id} action={a} onClick={onClick} />;
                  })}
                </div>

                {/* rank ladder */}
                <div style={{ marginTop: 24, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <SectionLabel>Rank ladder</SectionLabel>
                  <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Lifetime · never resets</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 11 }}>
                  {REWARD_TIERS.map((t, i) => {
                    const reached = d.xp >= t.at;
                    const current = i === index;
                    const tc = (TIER_VIS[t.id] ?? TIER_VIS.rookie).color;
                    return (
                      <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 13,
                        border: `1.5px solid ${current ? tc : "var(--border)"}`, background: current ? "var(--paper)" : "var(--paper-soft)",
                        opacity: reached || current ? 1 : 0.7 }}>
                        <TierBadge tierId={t.id} size={40} locked={!reached} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{t.name}</span>
                            {current && <span style={{ fontWeight: 700, fontSize: 9.5, letterSpacing: "0.08em", color: tc, border: `1px solid ${tc}`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase" }}>You</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12.5, color: reached ? "var(--ink)" : "var(--ink-faint)" }}>{fmt(t.at)}</div>
                          <div style={{ fontSize: 9.5, color: "var(--ink-ghost)", letterSpacing: "0.08em", marginTop: 2 }}>XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function RankUpOverlay({ tier, onClose }: { tier: { name: string; id: string }; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const a = requestAnimationFrame(() => setShown(true));
    const t = setTimeout(onClose, 3200);
    return () => { cancelAnimationFrame(a); clearTimeout(t); };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.55)", opacity: shown ? 1 : 0, transition: "opacity 240ms var(--ease-out)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "30px 34px", borderRadius: 22, background: "var(--paper)", boxShadow: "var(--shadow-3)", transform: shown ? "scale(1)" : "scale(0.82)", transition: "transform 320ms var(--ease-out)" }}>
        <div style={{ fontSize: 26 }}>✨</div>
        <div style={{ marginTop: 8 }}><TierBadge tierId={tier.id} size={76} /></div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-faint)", textTransform: "uppercase", marginTop: 16 }}>Rank up</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", marginTop: 4 }}>You’re a {tier.name}!</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 6 }}>Tap to keep collecting</div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onBack, trailing }: { title: string; subtitle?: string; onBack: () => void; trailing?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
      <button onClick={onBack} aria-label="Back" style={{ display: "flex", padding: 4, marginLeft: -4, cursor: "pointer", color: "var(--ink-soft)" }}>
        <ChevronLeft size={22} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}
