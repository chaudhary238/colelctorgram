"use client";

/* Refer a friend (v6 DV6-05) — port of design_v6/app/ReferView.jsx. Hero card,
 * Invited/Joined/XP stats, share link + copy/share, how-it-works, invites list.
 * Data from GET /users/me/referrals. The +150 XP credits the inviter when the
 * invitee adds their first collection item. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Gift, Link2, Copy, Check, Share2 } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, Button, SectionLabel } from "@/components/ui";

interface ReferralRow { handle: string; name: string; avatar_url: string | null; status: "joined" | "pending"; xp: number }
interface ReferralData { code: string; invited: number; joined: number; xp_earned: number; reward_xp: number; referrals: ReferralRow[] }

const STEPS = [
  "Share your referral link with a collector friend",
  "They sign up using your link",
  "They add their first item to their collection",
  "You instantly earn +150 XP — no limit on referrals",
];

export default function ReferPage() {
  const router = useRouter();
  const [d, setD] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { api.get<ReferralData>("/users/me/referrals").then(setD).catch(() => setD(null)); }, []);

  const link = d ? `${window.location.origin}/auth/signup?ref=${encodeURIComponent(d.code)}` : "";

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — no-op */ }
  }

  async function share() {
    if (!link) return;
    if (navigator.share) {
      try { await navigator.share({ title: "Join me on Scorred", text: "Track, trade & network on Scorred.", url: link }); return; } catch { /* cancelled */ }
    }
    copy();
  }

  return (
    <div className="w-full max-w-[680px] min-h-screen border-r border-[var(--border)]">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ display: "flex", padding: 4, marginLeft: -4, cursor: "pointer", color: "var(--ink-soft)" }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Refer a friend</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>+150 XP per referral</div>
        </div>
      </div>

      {!d ? (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)" }}>Loading…</div>
      ) : (
        <div style={{ padding: 16 }}>
          {/* Hero card */}
          <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "var(--paper-soft)", marginBottom: 16 }}>
            <div style={{ background: "var(--stamp-red)", padding: "24px 20px 20px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Gift size={28} style={{ color: "#fff" }} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: "-0.02em" }}>Invite collectors</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)", marginTop: 6, lineHeight: 1.5 }}>
                You earn <b style={{ color: "#fff" }}>+150 XP</b> for every friend who joins and adds their first item.
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {[
                { n: d.invited, label: "Invited", mono: false },
                { n: d.joined, label: "Joined", mono: false },
                { n: d.xp_earned, label: "XP earned", mono: true },
              ].map(({ n, label, mono }, i) => (
                <div key={label} style={{ flex: 1, textAlign: "center", padding: "14px 0", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--ink)", letterSpacing: "-0.02em" }}>{n}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Referral link */}
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Your referral link</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 11, background: "var(--bone)", border: "1px solid var(--border)" }}>
                <Link2 size={15} style={{ color: "var(--ink-mute)", flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.code}</span>
                <button onClick={copy} style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 8, background: copied ? "var(--verified-teal)" : "var(--ink)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <Button variant="dark" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} icon={<Share2 size={17} />} onClick={share}>
                Share invite link
              </Button>
            </div>
          </div>

          {/* How it works */}
          <div style={{ padding: "14px 15px", borderRadius: 14, background: "var(--bone)", border: "1px solid var(--border)", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>How it works</div>
            {STEPS.map((text, i) => (
              <div key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i === STEPS.length - 1 ? 0 : 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "var(--stamp-red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 12 }}>{i + 1}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, paddingTop: 3 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Invites sent */}
          {d.referrals.length > 0 && (
            <>
              <div style={{ marginBottom: 10 }}><SectionLabel>Invites sent</SectionLabel></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {d.referrals.map((r) => (
                  <div key={r.handle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 13, border: "1px solid var(--border)", background: "var(--paper-soft)" }}>
                    <Avatar name={r.name} size={38} photo={r.avatar_url} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 1 }}>@{r.handle}</div>
                    </div>
                    {r.status === "joined" ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--verified-teal)", background: "var(--verified-teal-soft)", border: "1px solid var(--verified-teal)", borderRadius: 999, padding: "2px 8px" }}>Joined</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--verified-teal)" }}>+{r.xp} XP</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px" }}>Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
