"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { PostImages, type ApiCommunity } from "@/components/cards";
import { Avatar, Segmented, SectionLabel, EmptyNote, PostTypeTag } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { timeAgo } from "@/lib/utils";

interface CommunityDetail extends ApiCommunity {
  member_role: string | null;
  banner_url?: string | null;
  avatar_url?: string | null;
  admins: { handle: string; name: string; avatar_url: string | null; role: string }[];
}
interface JoinRequest { handle: string; name: string; avatar_url: string | null; vouches: number; }
interface PendingPost { id: string; handle: string; name: string; avatar_url: string | null; type: string; body: string; images: string[]; created_at: string; }
interface Member { handle: string; name: string; avatar_url: string | null; role: string; }

type Tab = "requests" | "posts" | "members" | "settings";

// DV8 design pass — v8's rules cap is ONE budget of 900 characters TOTAL (the
// server enforces the same; the old 10×140 ladder is gone). Mirrors community/new.
const RULES_TOTAL_MAX_CHARS = 900;
function ruleLinesOf(text: string): string[] {
  return text.split("\n").map((r) => r.trim()).filter(Boolean);
}

// DELETE /communities/{id}/members/{handle} now REQUIRES a JSON body {reason}
// (422 without) — api.delete can't carry one, so this mirrors apiFetch's auth
// header + error shape for this single call.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
async function deleteWithBody(path: string, body: unknown): Promise<void> {
  const token = typeof window === "undefined" ? null : localStorage.getItem("ch_access_token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
}

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

/* v8 ManageStat — centred tile, mono 22 figure, uppercase micro-label. */
function Stat({ n, label, accent }: { n: number; label: string; accent: string }) {
  return (
    <div style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: accent, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 5 }}>{label}</div>
    </div>
  );
}

/* v8 RoleBadge — "Founder" renders as "Admin" everywhere (DV8-15; the API still
   says founder), and the admin badge is stamp-red, not ink. */
function memberRoleChip(role: string) {
  if (role === "member") return null;
  const admin = role === "founder" || role === "admin";
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 6, background: admin ? "var(--stamp-red)" : "var(--bone-deep)", color: admin ? "var(--paper)" : "var(--ink-mute)", fontWeight: 700, flexShrink: 0 }}>
      {admin ? "admin" : role}
    </span>
  );
}

// v8 member-row control metrics — role segments and Remove share the same 32px pill.
const pillBase: React.CSSProperties = {
  height: 32, fontSize: 11.5, fontWeight: 600, padding: "0 12px",
  fontFamily: "var(--font-body)", cursor: "pointer", whiteSpace: "nowrap",
};

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

  // Member removal now requires a reason ({reason} body — DV8-14).
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  // Settings (admin only, saved via PATCH)
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [posting, setPosting] = useState<"open" | "approval">("open");
  const [savingSettings, setSavingSettings] = useState(false);
  // Full details editor (DV8-14): rename / description / rules / photos.
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Only the community ADMIN (API role: founder) edits settings / removes people;
  // mods approve requests and posts (DV8-14 permission split).
  const isAdmin = community?.member_role === "founder";

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
        setName(c.name);
        setDesc(c.description ?? c.short_desc ?? "");
        setRulesText((c.rules ?? []).join("\n"));
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

  const setRole = async (m: Member, role: "member" | "mod") => {
    if (busy || m.role === role) return; setBusy(m.handle);
    try {
      await api.patch(`/communities/${id}/members/${m.handle}/role?role=${role}`);
      setMembers((ms) => ms.map((x) => x.handle === m.handle ? { ...x, role } : x));
    } finally { setBusy(null); }
  };

  const confirmRemove = async () => {
    const handle = removeTarget;
    const reason = removeReason.trim();
    if (!handle || !reason || busy) return;
    setBusy(handle);
    try {
      await deleteWithBody(`/communities/${id}/members/${handle}`, { reason });
      setMembers((ms) => ms.filter((x) => x.handle !== handle));
      setCommunity((c) => c ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c);
      setRemoveTarget(null);
      setRemoveReason("");
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

  // Photos save on upload — one PATCH per uploaded image.
  const savePhoto = async (field: "banner_url" | "avatar_url", url: string) => {
    await api.patch(`/communities/${id}`, { [field]: url }).catch(() => null);
    setCommunity((c) => c ? { ...c, [field]: url } : c);
  };

  // Rules cap — same 900-char total budget as the create form; Save blocked while over.
  const ruleLines = ruleLinesOf(rulesText);
  const rulesChars = ruleLines.reduce((s, r) => s + r.length, 0);
  const rulesInvalid = rulesChars > RULES_TOTAL_MAX_CHARS;
  const detailsInvalid = !name.trim() || rulesInvalid;

  const saveDetails = async () => {
    if (savingDetails || detailsInvalid) return;
    setSavingDetails(true);
    setDetailsError(null);
    setDetailsSaved(false);
    try {
      await api.patch(`/communities/${id}`, {
        name: name.trim(),
        description: desc.trim(),
        rules: ruleLines,
      });
      setCommunity((c) => c ? { ...c, name: name.trim(), description: desc.trim(), rules: ruleLines } : c);
      setDetailsSaved(true);
    } catch (e) {
      // A 409 duplicate-name comes back as the error detail — shown inline by the name field.
      setDetailsError(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setSavingDetails(false);
    }
  };

  const deleteCommunity = async () => {
    if (!community) return;
    if (!window.confirm(`Delete ${community.name}? This removes it for everyone — it can't be undone.`)) return;
    try {
      await api.delete(`/communities/${id}`);
      router.push("/community");
    } catch (e) {
      setDetailsError(e instanceof Error ? e.message : "Could not delete community");
    }
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

  // Mods see the approve tabs only — Settings is admin territory (DV8-14).
  const tabs = [
    { id: "requests", label: requests.length ? `Requests ${requests.length}` : "Requests" },
    { id: "posts", label: pending.length ? `Posts ${pending.length}` : "Posts" },
    { id: "members", label: "Members" },
    ...(isAdmin ? [{ id: "settings", label: "Settings" }] : []),
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
        {!isAdmin && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 12px", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 11, fontSize: 12, color: "var(--ink-mute)", marginBottom: 14, lineHeight: 1.45 }}>
            <Shield size={14} style={{ flexShrink: 0 }} />
            You&rsquo;re a mod here — you can approve requests and posts. Removing members/posts and editing community settings needs an admin.
          </div>
        )}

        {/* JOIN REQUESTS — the queue is universal now: joining is gated for public
            communities too (DV8-14), so no more "public = no requests" empty state. */}
        {tab === "requests" && (
          requests.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {requests.map((r) => (
                <div key={r.handle} style={{ display: "flex", alignItems: "center", gap: 11, padding: 11, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13 }}>
                  {/* Requester links through to their profile so admins can vet them (DV8-14). */}
                  <Link href={`/profile/${r.handle}`} style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, textDecoration: "none" }}>
                    <Avatar name={r.name} photo={r.avatar_url} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{r.handle} · {r.vouches} vouches</div>
                    </div>
                  </Link>
                  <button onClick={(e) => { e.stopPropagation(); actReq(r.handle, "reject"); }} disabled={busy === r.handle} aria-label="Decline" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--ink-mute)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={15} strokeWidth={2.4} /></button>
                  <button onClick={(e) => { e.stopPropagation(); actReq(r.handle, "approve"); }} disabled={busy === r.handle} aria-label="Approve" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--forest)", background: "var(--forest)", color: "var(--paper)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={16} strokeWidth={2.6} /></button>
                </div>
              ))}
            </div>
          ) : <EmptyNote>No pending join requests.</EmptyNote>
        )}

        {tab === "posts" && (
          pending.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {pending.map((p) => (
                /* Whole card clicks through to /post/{id} to review in full (DV8-14). */
                <div
                  key={p.id}
                  onClick={() => router.push(`/post/${p.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(`/post/${p.id}`); }}
                  role="button"
                  tabIndex={0}
                  style={{ background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px 0" }}>
                    {/* v8 header clicks through to the author's profile; the card body still opens the post. */}
                    <Link href={`/profile/${p.handle}`} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                      <Avatar name={p.name} photo={p.avatar_url} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>@{p.handle} · {timeAgo(p.created_at)}</div>
                      </div>
                    </Link>
                    <PostTypeTag type={(p.type === "poll" ? "discussion" : p.type) as "showcase" | "discussion" | "review"} />
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, padding: "10px 13px 0" }}>{p.body}</div>
                  {p.images.length > 0 && (
                    <div style={{ padding: "10px 13px 0" }}><PostImages images={p.images} /></div>
                  )}
                  {/* v8 Button sm pair — Decline is the bone secondary with red ink; Approve is dark with the check. */}
                  <div style={{ display: "flex", gap: 9, padding: "12px 13px 13px" }}>
                    <button onClick={(e) => { e.stopPropagation(); actPost(p.id, "reject"); }} disabled={busy === p.id} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 34, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bone)", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Decline</button>
                    <button onClick={(e) => { e.stopPropagation(); actPost(p.id, "approve"); }} disabled={busy === p.id} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 34, borderRadius: 9, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}><Check size={15} />Approve</button>
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
              const removing = removeTarget === m.handle;
              return (
                <div key={m.handle} style={{ display: "flex", flexDirection: "column", gap: 9, padding: 10, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13 }}>
                  {/* v8 member header links to the profile; badge sits at the end of the name line. */}
                  <Link href={`/profile/${m.handle}`} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textDecoration: "none", color: "inherit" }}>
                    <Avatar name={m.name} photo={m.avatar_url} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{m.name}</span>
                        {memberRoleChip(m.role)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{m.handle}</div>
                    </div>
                  </Link>
                  {/* v8 second row — Role picker under its micro-label, Remove pill bottom-right,
                      both the same 32px control. (Only member/mod here — the API has no
                      grantable admin role; the founder IS the admin.) */}
                  {!founderRow && isAdmin && (
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 6 }}>Role</div>
                        <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 9, overflow: "hidden" }}>
                          {(["member", "mod"] as const).map((role, i) => {
                            const on = m.role === role;
                            return (
                              <button key={role} onClick={() => setRole(m, role)} disabled={busy === m.handle} style={{
                                ...pillBase, border: "none", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none",
                                background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink-soft)",
                              }}>{role === "mod" ? "Mod" : "Member"}</button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => { setRemoveTarget(removing ? null : m.handle); setRemoveReason(""); }} disabled={busy === m.handle} style={{
                        ...pillBase, borderRadius: 9, border: "1px solid var(--stamp-red)", background: removing ? "var(--stamp-red)" : "var(--paper)", color: removing ? "var(--paper)" : "var(--stamp-red)",
                      }}>Remove member</button>
                    </div>
                  )}
                  {/* Removal needs a reason — sent as the {reason} body (DV8-14). */}
                  {removing && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--stamp-red-deep)", marginBottom: 7 }}>Remove @{m.handle} — why?</div>
                      <textarea
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value.slice(0, 300))}
                        rows={3}
                        autoFocus
                        placeholder="e.g. Repeated rule violations, spam, harassment…"
                        style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "vertical" }}
                      />
                      <div style={{ fontSize: 11, color: "var(--ink-faint)", textAlign: "right", margin: "4px 0 8px" }}>{removeReason.length}/300</div>
                      <div style={{ display: "flex", gap: 9 }}>
                        <button onClick={() => { setRemoveTarget(null); setRemoveReason(""); }} style={{ flex: 1, height: 36, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        <button onClick={confirmRemove} disabled={!removeReason.trim() || busy === m.handle} style={{ flex: 1, height: 36, borderRadius: 9, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: removeReason.trim() ? "pointer" : "default", opacity: removeReason.trim() ? 1 : 0.5 }}>Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SETTINGS — the full editor, admin only (DV8-14). */}
        {tab === "settings" && isAdmin && (
          <div>
            {/* v8 section order — Privacy, Who can post, then the details editor. */}
            <SectionLabel>Privacy</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "11px 0 20px" }}>
              {/* Joining is gated everywhere now — public only controls discovery (DV8-14). */}
              <RadioRow title="Public" sub="Anyone can find it — join requests still need your approval" on={privacy === "public"} onClick={() => saveSettings({ privacy: "public" })} />
              <RadioRow title="Private" sub="Hidden from discovery — people join by request or invite" on={privacy === "private"} onClick={() => saveSettings({ privacy: "private" })} />
            </div>

            <SectionLabel>Who can post</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "11px 0 20px" }}>
              <RadioRow title="Anyone can post" sub="Members post freely" on={posting === "open"} onClick={() => saveSettings({ posting: "open" })} />
              <RadioRow title="Admin-approved" sub="Posts are reviewed before they show" on={posting === "approval"} onClick={() => saveSettings({ posting: "approval" })} />
            </div>
            {savingSettings && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 14 }}>Saving…</div>}

            {/* Details editor — v8's EditCommunitySheet fields (Photos, name, description,
                rules) rendered inline; we have no overlay sheet here. */}
            <SectionLabel>Photos</SectionLabel>
            <div style={{ margin: "10px 0 20px" }}>
              <ImageUploader onUpload={(url) => savePhoto("banner_url", url)} previewUrl={community.banner_url ?? undefined} label="Add a banner image" />
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginTop: 10 }}>
                <div style={{ width: 148, flexShrink: 0 }}>
                  <ImageUploader onUpload={(url) => savePhoto("avatar_url", url)} previewUrl={community.avatar_url ?? undefined} label="Add a photo" />
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.5, paddingTop: 6 }}>
                  Square photo — shown on the community tile. Photos save as soon as they upload.
                </div>
              </div>
            </div>

            <SectionLabel>Community name</SectionLabel>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setDetailsError(null); setDetailsSaved(false); }}
              style={{ width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px", borderRadius: 11, border: `1px solid ${detailsError ? "var(--stamp-red)" : "var(--border-strong)"}`, background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none", margin: detailsError ? "10px 0 0" : "10px 0 20px" }}
            />
            {/* A 409 duplicate-name comes back as the error detail — shown inline by the field. */}
            {detailsError && <div style={{ fontSize: 12.5, color: "var(--stamp-red)", margin: "6px 0 20px" }}>{detailsError}</div>}

            <SectionLabel>Description</SectionLabel>
            <textarea
              value={desc}
              onChange={(e) => { setDesc(e.target.value.slice(0, 140)); setDetailsSaved(false); }}
              rows={2}
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", resize: "none", margin: "10px 0 20px" }}
            />

            <SectionLabel>Community rules</SectionLabel>
            <textarea
              value={rulesText}
              onChange={(e) => { setRulesText(e.target.value); setDetailsSaved(false); }}
              rows={7}
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 11, border: `1px solid ${rulesInvalid ? "var(--stamp-red)" : "var(--border-strong)"}`, background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none", resize: "vertical", margin: "10px 0 4px" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: rulesInvalid ? "var(--stamp-red)" : "var(--ink-faint)", lineHeight: 1.5 }}>
              <span>
                {rulesInvalid && `Rules must be ${RULES_TOTAL_MAX_CHARS} characters or fewer in total.`}
              </span>
              <span style={{ flexShrink: 0 }}>{rulesChars}/{RULES_TOTAL_MAX_CHARS}</span>
            </div>

            {/* v8's sheet saves via a small primary Save button — same control, inline. */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              {detailsSaved && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--forest)", fontSize: 12.5, fontWeight: 600 }}>
                  <Check size={14} /> Saved.
                </span>
              )}
              <button onClick={saveDetails} disabled={savingDetails || detailsInvalid} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34,
                padding: "0 14px", borderRadius: 9, border: "1px solid var(--stamp-red)",
                background: "var(--stamp-red)", color: "var(--paper)",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, lineHeight: 1,
                cursor: savingDetails || detailsInvalid ? "not-allowed" : "pointer", opacity: savingDetails || detailsInvalid ? 0.4 : 1,
              }}>
                {savingDetails ? "Saving…" : "Save"}
              </button>
            </div>

            {/* v8 destructive treatment — secondary block button in stamp-red. Our API only
                deletes (no close/pause), and the confirm is the browser dialog. */}
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
              <button onClick={deleteCommunity} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 52, borderRadius: 14, border: "1px solid var(--stamp-red)", background: "var(--bone)", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, lineHeight: 1, cursor: "pointer" }}>
                <X size={16} strokeWidth={2.4} />Delete community
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
