"use client";

/* Leaderboard (Rewards & Badge System v3, §9.18) — Weekly + Lifetime boards,
 * reset clock, season-prize callout, 2-1-3 podium, sticky own-standing bar,
 * ranked list. Reached from the profile rank card / Rewards screen. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Gift } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui";
import {
  FilterChip, TIER_VIS, FeedBadge, resetInfo,
  Clock, TrendingUp, type LbRow, type Standing,
} from "@/components/gamification";

const MEDALS = ["var(--grail-gold)", "#A6A8AC", "#C08552"];
const fmt = (n: number) => n.toLocaleString("en-IN");

interface Board { rows: LbRow[]; me: Standing | null; key: string }

export default function LeaderboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("week");
  const [board, setBoard] = useState<Board | null>(null);

  const qs = `period=${period}`;
  useEffect(() => {
    let alive = true;
    api.get<Board>(`/rewards/leaderboard?${qs}`)
      .then((b) => { if (alive) setBoard({ ...b, key: qs }); })
      .catch(() => { if (alive) setBoard({ rows: [], me: null, key: qs }); });
    return () => { alive = false; };
  }, [qs]);

  // Board is "ready" only when it matches the current filter (avoids a stale flash).
  const ready = board?.key === qs;
  const rows = ready ? board!.rows : [];
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const ri = resetInfo(period);
  const showSeason = period === "week";
  const periodLabel = period === "week" ? "this week" : "all-time";
  const dotColor = (r: { tier_id: string }) => (TIER_VIS[r.tier_id] ?? TIER_VIS.rookie).color;

  return (
    <div className="w-full max-w-[680px] min-h-screen border-r border-[var(--border)]">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ display: "flex", padding: 4, marginLeft: -4, cursor: "pointer", color: "var(--ink-soft)" }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Leaderboard</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Top collectors</div>
        </div>
      </div>

      {/* filters — Weekly / Lifetime (v3 §9) */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {[{ id: "week", label: "Weekly" }, { id: "all", label: "Lifetime" }].map((o) => (
            <FilterChip key={o.id} active={period === o.id} onClick={() => setPeriod(o.id)}>{o.label}</FilterChip>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, fontSize: 11.5, color: ri.soon ? "var(--stamp-red)" : "var(--ink-faint)" }}>
          <Clock size={13} strokeWidth={2} />
          <span>{ri.label}</span>
        </div>
      </div>

      {!ready ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Loading…</div>
      ) : (
        <>
          {/* season prize */}
          {showSeason && (
            <div style={{ margin: "0 16px", display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 14, background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--grail-gold)", color: "#5A3D00" }}>
                <Gift size={17} strokeWidth={2.1} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Win a badge when the week ends</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 1 }}>Top 3 earn a permanent badge + up to 300 bonus XP toward your rank</div>
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--ink-faint)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Be the first</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>No one has placed on this board yet.</div>
            </div>
          ) : (
            <>
              {/* podium 2 / 1 / 3 */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14, padding: "22px 16px 8px" }}>
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((r) => {
                  const rank = rows.indexOf(r) + 1;
                  const first = rank === 1;
                  const medal = MEDALS[rank - 1];
                  return (
                    <button key={r.key} onClick={() => router.push(`/profile/${r.handle}`)} style={{
                      flex: 1, maxWidth: 108, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ borderRadius: "50%", padding: 3, background: medal }}>
                          <Avatar name={r.name} size={first ? 68 : 54} photo={r.avatar_url} />
                        </div>
                        <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 23, height: 23, borderRadius: "50%", background: medal, color: rank === 1 ? "var(--ink)" : "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{["🥇", "🥈", "🥉"][rank - 1]}</div>
                      </div>
                      <div style={{ marginTop: 7, fontSize: 13, fontWeight: 700, color: "var(--ink)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.is_me ? "You" : r.name.split(" ")[0]}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: dotColor(r) }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{fmt(r.points)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* your standing */}
              {board!.me && (
                <div style={{ margin: "12px 16px 6px", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 13, background: "var(--ink)", color: "var(--paper)" }}>
                  <TrendingUp size={18} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>You’re <b style={{ fontFamily: "var(--font-mono)" }}>#{board!.me.rank}</b> {periodLabel}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14 }}>{fmt(board!.me.points)} <span style={{ fontSize: 10, opacity: 0.7 }}>XP</span></span>
                </div>
              )}

              {/* ranks 4+ */}
              <div style={{ padding: "4px 0 24px" }}>
                {rest.map((r) => {
                  const rank = rows.indexOf(r) + 1;
                  const bg = r.is_me ? "var(--verified-teal-soft)" : "transparent";
                  return (
                    <div key={r.key} role="button" tabIndex={0}
                      onClick={() => router.push(`/profile/${r.handle}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/profile/${r.handle}`); } }}
                      style={{
                      display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", cursor: "pointer",
                      background: bg, border: "none", borderBottom: "1px solid var(--border)", padding: "11px 16px" }}>
                      <span style={{ width: 24, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: r.is_me ? "var(--verified-teal)" : "var(--ink-faint)" }}>{rank}</span>
                      <Avatar name={r.name} size={40} photo={r.avatar_url} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.is_me ? "You" : r.name}</span>
                          <FeedBadge badge={r.badge} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: dotColor(r) }} />
                          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{r.tier_name}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14.5, color: "var(--ink)", fontFeatureSettings: '"tnum" 1' }}>{fmt(r.points)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
