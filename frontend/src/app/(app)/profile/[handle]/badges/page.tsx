"use client";

/* Trophy Case (Rewards & Badge System v3, §9.19) — First Start + league badges,
 * featured badge, stats, grid, how-it-works, empty state. Always public; reached
 * from a profile's badge shelf. */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Info, Download, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button, SectionLabel } from "@/components/ui";
import {
  SeasonBadge, FirstStartTile, BadgeSheet, BADGE_TIER, BADGE_KIND,
  type TrophyCaseData, type SeasonBadgeT, type FirstStart, type FeedBadgeT,
} from "@/components/gamification";

/* §9.19 P2 — shareable badge card. Renders the badge to an offscreen canvas and
 * shares it (Web Share API with files) or downloads a PNG. CSS-var colours are
 * resolved at runtime so gold/silver/bronze/finalist all export faithfully. */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function resolveColor(c: string): string {
  const m = c.match(/^var\((--[\w-]+)\)$/);
  return m ? (cssVar(m[1]) || "#888888") : c;
}
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx[i === 0 ? "moveTo" : "lineTo"](cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
async function exportBadge(badge: SeasonBadgeT) {
  const m = BADGE_TIER[badge.tier] ?? BADGE_TIER.finalist;
  const k = BADGE_KIND[badge.kind] ?? BADGE_KIND.weekly;
  const W = 640, H = 800, S = 2;
  const cv = document.createElement("canvas");
  cv.width = W * S; cv.height = H * S;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.scale(S, S);
  const disp = cssVar("--font-display") || "system-ui";
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = 252, r = 132;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = resolveColor(m.fill); ctx.fill();
  ctx.lineWidth = 16; ctx.strokeStyle = resolveColor(m.ring); ctx.stroke();
  drawStar(ctx, cx, cy, 60, 26, resolveColor(m.ink));
  ctx.textAlign = "center";
  ctx.fillStyle = "#1A1A1A"; ctx.font = `800 40px ${disp}, system-ui, sans-serif`;
  ctx.fillText(badge.title, cx, 472);
  ctx.fillStyle = "#6B7280"; ctx.font = "500 22px system-ui, sans-serif";
  ctx.fillText(`${k.label} · ${badge.period} · ${m.label}`, cx, 512);
  ctx.fillStyle = resolveColor("var(--verified-teal)"); ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText(`+${badge.bonus_xp} bonus XP`, cx, 596);
  ctx.fillStyle = resolveColor("var(--stamp-red)"); ctx.font = `800 26px ${disp}, system-ui, sans-serif`;
  ctx.fillText("CollectorHub", cx, 742);
  cv.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `badge-${badge.period.replace(/\s+/g, "-")}.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: badge.title }); return; } catch { /* cancelled — fall through to download */ }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// A First Start badge rendered as a FeedBadge descriptor for the shared BadgeSheet.
function fsBadge(fs: FirstStart): FeedBadgeT {
  return { kind: "first_start", code: fs.id, name: fs.name, emoji: fs.emoji };
}

export default function BadgesPage() {
  const router = useRouter();
  const { handle } = useParams<{ handle: string }>();
  const [d, setD] = useState<TrophyCaseData | null>(null);
  const [selected, setSelected] = useState<SeasonBadgeT | null>(null);
  const [fsOpen, setFsOpen] = useState(false);
  useEffect(() => { api.get<TrophyCaseData>(`/users/${handle}/badges`).then(setD).catch(() => setD(null)); }, [handle]);

  const first = d?.user.name.split(" ")[0] ?? "";
  const fs = d?.first_start ?? null;
  const totalCount = (d?.count ?? 0) + (fs ? 1 : 0);
  const topSeason = d?.badges[0];

  return (
    <div className="w-full max-w-[600px] min-h-screen border-r border-[var(--border)]">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ display: "flex", padding: 4, marginLeft: -4, cursor: "pointer", color: "var(--ink-soft)" }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Badges</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{d ? (d.is_me ? "Your trophy case" : `${first}’s trophy case`) : ""}</div>
        </div>
      </div>

      {!d ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Loading…</div>
      ) : (
        <div style={{ padding: 16 }}>
          {totalCount === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--ink-faint)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-ghost)" }}>
                  <Trophy size={26} />
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>No badges yet</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{d.is_me ? "Finish in the weekly league to earn your first badge." : `${first} hasn’t placed in a league yet.`}</div>
              {d.is_me && <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}><Button size="sm" variant="dark" icon={<Trophy size={15} />} onClick={() => router.push("/leaderboard")}>See leaderboard</Button></div>}
            </div>
          ) : (
            <>
              {/* featured badge — First Start takes precedence (v3 §2.1/§3) */}
              {fs ? (
                <button onClick={() => setFsOpen(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", padding: "22px 16px", borderRadius: 18, border: "1px solid var(--border)", background: "var(--paper-soft)", cursor: "pointer" }}>
                  <FirstStartTile code={fs.id} size={76} />
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, letterSpacing: "-0.01em", marginTop: 13 }}>{fs.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>Permanent badge · never expires</div>
                  <div style={{ display: "flex", gap: 18, marginTop: 16 }}>
                    <Stat n={totalCount} label="Badges" />
                    <div style={{ width: 1, background: "var(--border)" }} />
                    <Stat n={d.bonus_xp_total} label="Bonus XP" />
                  </div>
                </button>
              ) : topSeason && (() => {
                const m = BADGE_TIER[topSeason.tier] ?? BADGE_TIER.finalist;
                const k = BADGE_KIND[topSeason.kind] ?? BADGE_KIND.weekly;
                return (
                  <button onClick={() => setSelected(topSeason)} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", padding: "22px 16px", borderRadius: 18, border: "1px solid var(--border)", background: "var(--paper-soft)", cursor: "pointer" }}>
                    <SeasonBadge badge={topSeason} size={76} />
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, letterSpacing: "-0.01em", marginTop: 13 }}>{topSeason.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>{k.label} · {topSeason.period} · {m.label}</div>
                    <div style={{ display: "flex", gap: 18, marginTop: 16 }}>
                      <Stat n={totalCount} label="Badges" />
                      <div style={{ width: 1, background: "var(--border)" }} />
                      <Stat n={d.bonus_xp_total} label="Bonus XP" />
                    </div>
                  </button>
                );
              })()}

              {/* all badges grid */}
              <div style={{ marginTop: 22 }}><SectionLabel>All badges</SectionLabel></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 11 }}>
                {fs && (
                  <button onClick={() => setFsOpen(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--paper-soft)", cursor: "pointer" }}>
                    <FirstStartTile code={fs.id} size={48} />
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginTop: 10 }}>{fs.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>Permanent badge</div>
                    <div style={{ marginTop: 9, fontSize: 11, fontWeight: 700, color: "var(--verified-teal)" }}>Never expires</div>
                  </button>
                )}
                {d.badges.map((b) => {
                  const k = BADGE_KIND[b.kind] ?? BADGE_KIND.weekly;
                  return (
                    <button key={b.id} onClick={() => setSelected(b)} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--paper-soft)", cursor: "pointer" }}>
                      <SeasonBadge badge={b} size={48} />
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginTop: 10 }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>{k.label} · {b.period}</div>
                      <div style={{ marginTop: 9, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--verified-teal)" }}>+{b.bonus_xp} XP</div>
                    </button>
                  );
                })}
              </div>

              {/* how it works */}
              <div style={{ marginTop: 22, padding: "14px 15px", borderRadius: 14, background: "var(--bone)", display: "flex", gap: 11 }}>
                <Info size={17} style={{ color: "var(--ink-mute)", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
                  First Start badges are permanent and manually assigned to founding members and earliest collectors. League badges are earned when the weekly league ends — the top 3 take gold, silver &amp; bronze; everyone in the top 10 earns a finalist badge. Standings reset each week; your badges are permanent.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {selected && <SeasonBadgeModal badge={selected} onClose={() => setSelected(null)} />}
      {fsOpen && fs && <BadgeSheet badge={fsBadge(fs)} onClose={() => setFsOpen(false)} />}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>{n.toLocaleString("en-IN")}</div>
      <div style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.06em", marginTop: 2, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function SeasonBadgeModal({ badge, onClose }: { badge: SeasonBadgeT; onClose: () => void }) {
  const m = BADGE_TIER[badge.tier] ?? BADGE_TIER.finalist;
  const k = BADGE_KIND[badge.kind] ?? BADGE_KIND.weekly;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(15,23,42,0.55)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "34px 24px 24px", borderRadius: 22, background: "var(--paper)", boxShadow: "var(--shadow-3)" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, display: "flex", padding: 6, cursor: "pointer", color: "var(--ink-faint)", background: "none", border: "none" }}>
          <X size={20} />
        </button>
        <SeasonBadge badge={badge} size={104} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 23, letterSpacing: "-0.01em", marginTop: 16 }}>{badge.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 4 }}>{k.label} · {badge.period}</div>
        <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: m.ring, border: `1px solid ${m.ring}`, borderRadius: 999, padding: "3px 10px" }}>{m.label}</div>
        <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--verified-teal)" }}>+{badge.bonus_xp} bonus XP</div>
        <Button variant="dark" icon={<Download size={15} />} onClick={() => exportBadge(badge)} style={{ marginTop: 20, width: "100%", justifyContent: "center" }}>Save image</Button>
      </div>
    </div>
  );
}
