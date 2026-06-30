"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { ApiCommunity } from "@/components/cards";
import { Avatar, Segmented, SectionLabel, EmptyNote, PostTypeTag } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

interface CommunityDetail extends ApiCommunity {
  member_role: string | null;
  admins: { handle: string; name: string; avatar_url: string | null; role: string }[];
}
interface JoinRequest { handle: string; name: string; avatar_url: string | null; tier: string; deals: number; vouches: number; }
interface PendingPost { id: string; handle: string; name: string; avatar_url: string | null; type: string; body: string; images: string[]; created_at: string; }
interface Member { handle: string; name: string; avatar_url: string | null; tier: string; role: string; }

type Tab = "requests" | "posts" | "members" | "settings";

function RadioRow({ title, sub, on, onClick }: { title: string; sub: string; on: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} type="button" style={{
      display: "flex", alignItems: "flex-start", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
      padding: "12px 13px", borderRadius: 12, border: `1.5px solid ${on ? "var(--ink)" : "var(--border-strong)"}`,
      background: on ? "var(--bone)" : "var(--paper-soft)",
    }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${on ? "var(--ink)" : "var(--border-strong)"}` }}>
        {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink)" }} />}
      </span>
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink-faint)", marginTop: 2, lineHeight: 1.4 }}>{sub}</span>
      </span>
    </button>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent: string }) {
  return (
    <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "11px 13px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: accent }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 1 }}>{label}</div>
    </div>
  );
}

export default function CommunityManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("requests");

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [pending, setPending] = useState<PendingPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // Settings (local, saved via PATCH)
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [posting, setPosting] = useState<"open" | "approval">("open");
  const [savingSettings, setSavingSettings] = useState(false);

  const isFounder = community?.member_role === "founder";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await api.get<CommunityDetail>(`/communities/${id}`);
        if (!active) return;
        if (c.member_role !== "founder" && c.member_role !== "mod") { setDenied(true); return; }
        setCommunity(c);
        setPrivacy(c.is_invite_only ? "private" : "public");
        setPosting(c.post_mode === "approval" ? "approval" : "open");
        const [reqs, pend, mems] = await Promise.all([
          api.get<JoinRequest[]>(`/communities/${id}/requests`).catch(() => []),
          api.get<PendingPost[]>(`/communities/${id}/pending-posts`).catch(() => []),
          api.get<Member[]>(`/communities/${id}/members`).catch(() => []),
        ]);
        if (!active) return;
        setRequests(reqs ?? []); setPending(pend ?? []); setMembers(mems ?? []);
      } catch {
        if (active) setDenied(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const actReq = async (handle: string, action: "approve" | "reject") => {
    if (busy) return; setBusy(handle);
    try {
      await api.post(`/communities/${id}/requests/${handle}/${action}`);
      setRequests((r) => r.filter((x) => x.handle !== handle));
      if (action === "approve" && community) setCommunity({ ...community, member_count: community.member_count + 1 });
    } finally { setBusy(null); }
  };

  const actPost = async (postId: string, action: "approve" | "reject") => {
    if (busy) return; setBusy(postId);
    try {
      await api.post(`/communities/${id}/posts/${postId}/${action}`);
      setPending((p) => p.filter((x) => x.id !== postId));
    } finally { setBusy(null); }
  };

  const toggleMod = async (m: Member) => {
    if (busy) return; setBusy(m.handle);
    const next = m.role === "mod" ? "member" : "mod";
    try {
      await api.patch(`/communities/${id}/members/${m.handle}/role?role=${next}`);
      setMembers((ms) => ms.map((x) => x.handle === m.handle ? { ...x, role: next } : x));
    } finally { setBusy(null); }
  };

  const removeMember = async (m: Member) => {
    if (busy) return; setBusy(m.handle);
    try {
      await api.delete(`/communities/${id}/members/${m.handle}`);
      setMembers((ms) => ms.filter((x) => x.handle !== m.handle));
      if (community) setCommunity({ ...community, member_count: Math.max(0, community.member_count - 1) });
    } finally { setBusy(null); }
  };

  const saveSettings = async (next: { privacy?: "public" | "private"; posting?: "open" | "approval" }) => {
    setSavingSettings(true);
    const p = next.privacy ?? privacy;
    const post = next.posting ?? posting;
    if (next.privacy) setPrivacy(next.privacy);
    if (next.posting) setPosting(next.posting);
    try {
      await api.patch(`/communities/${id}`, { is_invite_only: p === "private", post_mode: post });
    } finally { setSavingSettings(false); }
  };

  const archive = async () => {
    if (!confirm("Archive this community? It will be hidden from everyone.")) return;
    await api.post(`/communities/${id}/archive`);
    router.push("/community");
  };

  if (denied) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <EmptyNote>You don&rsquo;t manage this community.</EmptyNote>
        <Link href={`/community/${id}`} style={{ color: "var(--stamp-red)", fontSize: 14, fontWeight: 600 }}>Back to community</Link>
      </div>
    );
  }
  if (loading || !community) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ height: 64, borderRadius: 12, background: "var(--bone)", marginBottom: 12 }} />
        <div style={{ height: 200, borderRadius: 12, background: "var(--bone)" }} />
      </div>
    );
  }

  const tabs = [
    { id: "requests", label: requests.length ? `Requests ${requests.length}` : "Requests" },
    { id: "posts", label: pending.length ? `Posts ${pending.length}` : "Posts" },
    { id: "members", label: "Members" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-10">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/community/${id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Manage community</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{community.name}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "14px 20px 4px" }}>
        <Stat n={community.member_count} label="Members" accent="var(--ink)" />
        <Stat n={requests.length} label="Requests" accent={requests.length ? "var(--stamp-red)" : "var(--ink-mute)"} />
        <Stat n={pending.length} label="To review" accent={pending.length ? "var(--grail-gold-deep)" : "var(--ink-mute)"} />
      </div>

      <div style={{ position: "sticky", top: 56, zIndex: 9, background: "var(--paper)", padding: "12px 20px 10px", borderBottom: "1px solid var(--border)" }}>
        <Segmented value={tab} onChange={(v) => setTab(v as Tab)} options={tabs} />
      </div>

      <div style={{ padding: "16px 20px" }}>
        {tab === "requests" && (
          community.is_invite_only ? (
            requests.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {requests.map((r) => (
                  <div key={r.handle} style={{ display: "flex", alignItems: "center", gap: 11, padding: 11, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13 }}>
                    <Avatar name={r.name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{r.handle} · {r.deals} deals · {r.vouches} vouches</div>
                    </div>
                    <button onClick={() => actReq(r.handle, "reject")} disabled={busy === r.handle} aria-label="Decline" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--ink-mute)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={15} /></button>
                    <button onClick={() => actReq(r.handle, "approve")} disabled={busy === r.handle} aria-label="Approve" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--forest)", background: "var(--forest)", color: "var(--paper)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={16} /></button>
                  </div>
                ))}
              </div>
            ) : <EmptyNote>No pending join requests.</EmptyNote>
          ) : (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 13, background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              <Globe size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--ink-faint)" }} />
              This is a <b style={{ margin: "0 3px" }}>public</b> community — anyone can join instantly, so there are no requests to approve. Switch to private in Settings to review members.
            </div>
          )
        )}

        {tab === "posts" && (
          pending.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {pending.map((p) => (
                <div key={p.id} style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px 0" }}>
                    <Avatar name={p.name} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>@{p.handle} · {timeAgo(p.created_at)}</div>
                    </div>
                    <PostTypeTag type={(p.type === "poll" ? "discussion" : p.type) as "showcase" | "discussion" | "review"} />
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, padding: "10px 13px 12px" }}>{p.body}</div>
                  <div style={{ display: "flex", gap: 9, padding: "0 13px 13px" }}>
                    <button onClick={() => actPost(p.id, "reject")} disabled={busy === p.id} style={{ flex: 1, height: 38, borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Decline</button>
                    <button onClick={() => actPost(p.id, "approve")} disabled={busy === p.id} style={{ flex: 1, height: 38, borderRadius: 9, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Approve</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyNote>Nothing waiting for review. {posting === "open" ? "Posts publish instantly here." : ""}</EmptyNote>
        )}

        {tab === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => {
              const founderRow = m.role === "founder";
              return (
                <div key={m.handle} style={{ display: "flex", alignItems: "center", gap: 11, padding: 10, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13 }}>
                  <Avatar name={m.name} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                      {m.role !== "member" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 6, background: founderRow ? "var(--ink)" : "var(--bone-deep)", color: founderRow ? "var(--paper)" : "var(--ink-mute)", fontWeight: 700 }}>{m.role}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{m.handle}</div>
                  </div>
                  {!founderRow && isFounder && (
                    <>
                      <button onClick={() => toggleMod(m)} disabled={busy === m.handle} style={{ fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: m.role === "mod" ? "var(--bone)" : "var(--paper)", color: "var(--ink-soft)", cursor: "pointer", whiteSpace: "nowrap" }}>{m.role === "mod" ? "Remove mod" : "Make mod"}</button>
                      <button onClick={() => removeMember(m)} disabled={busy === m.handle} aria-label="Remove member" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--stamp-red)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={14} /></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "settings" && (
          <div>
            <SectionLabel>Privacy</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "11px 0 20px" }}>
              <RadioRow title="Public" sub="Anyone can find and join instantly" on={privacy === "public"} onClick={() => saveSettings({ privacy: "public" })} />
              <RadioRow title="Private" sub="People request to join — you approve them" on={privacy === "private"} onClick={() => saveSettings({ privacy: "private" })} />
            </div>

            <SectionLabel>Who can post</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "11px 0 20px" }}>
              <RadioRow title="Anyone can post" sub="Members post freely" on={posting === "open"} onClick={() => saveSettings({ posting: "open" })} />
              <RadioRow title="Admin-approved" sub="Posts are reviewed before they show" on={posting === "approval"} onClick={() => saveSettings({ posting: "approval" })} />
            </div>
            {savingSettings && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 14 }}>Saving…</div>}

            <SectionLabel>Rules</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "11px 0 14px" }}>
              {(community.rules.length ? community.rules : ["No rules set yet."]).map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 11 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>{r}</span>
                </div>
              ))}
            </div>

            {isFounder && (
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                <button onClick={archive} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 46, borderRadius: 12, border: "1px solid var(--stamp-red)", background: "transparent", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  <X size={16} />Archive community
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
