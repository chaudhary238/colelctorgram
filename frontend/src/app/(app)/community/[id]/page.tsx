"use client";

import { useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2, Shield, Globe, CheckCircle2, Check, Settings2, UserPlus, Clock, Plus } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { ApiPost } from "@/components/cards";
import { Avatar, Segmented, SectionLabel, EmptyNote, Button } from "@/components/ui";
import { PostCard } from "@/components/cards";

interface CommunityAdmin {
  handle: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

interface RosterMember {
  handle: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

interface CommunityDetail {
  id: string;
  name: string;
  description: string | null;
  short_desc: string | null;
  tag: string | null;
  category: string;
  tone: string;
  banner_url: string | null; // DV8-14 — uploaded banner (fallback: tone block)
  avatar_url: string | null; // DV8-14 — square photo (fallback: letter tile)
  member_count: number;
  post_count: number;
  recent_post_count: number; // published posts in the last 24h (QA2)
  post_mode: string;
  rules: string[];
  is_invite_only: boolean;
  is_member: boolean;
  member_role: string | null;
  join_state: string; // member | requested | none
  admins: CommunityAdmin[];
}

// Community post payloads carry the author's role in THIS community (DV8-14).
type CommunityPost = ApiPost & { author_role?: "admin" | "mod" | null };

type Tab = "posts" | "members" | "about";

/* "Founder" reads as "Admin" everywhere it renders (DV8-15) — the API still says founder. */
function displayRole(role: string) {
  return role === "founder" ? "admin" : role;
}

/* v8 RoleBadge (CommunityDetail.jsx:7-13) — ADMIN = stamp-red on paper text,
   MOD = bone-deep. Shared chip for rosters and post cards. */
function RoleChip({ role, style }: { role: string; style?: React.CSSProperties }) {
  const admin = role === "founder" || role === "admin";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 6, fontWeight: 700, flexShrink: 0,
      background: admin ? "var(--stamp-red)" : "var(--bone-deep)", color: admin ? "var(--paper)" : "var(--ink-mute)",
      ...style,
    }}>
      {displayRole(role)}
    </span>
  );
}

/* Rules list + admins/mods list — shared by the Rules tab and the private lock (v3 RulesAndAdmins).
   DV8-14 — long lists collapse: past 4 rules, show 4 + "Show all N rules". */
const RULES_VISIBLE_CAP = 4;
function RulesAndAdmins({ community }: { community: CommunityDetail }) {
  const [showAllRules, setShowAllRules] = useState(false);
  const rules = showAllRules ? community.rules : community.rules.slice(0, RULES_VISIBLE_CAP);
  return (
    <>
      <SectionLabel>Community rules</SectionLabel>
      {/* QA2 — no default/placeholder rules. Show only what the admin actually added. */}
      {community.rules.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {rules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bone)", color: "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, paddingTop: 1 }}>{r}</div>
            </div>
          ))}
          {community.rules.length > RULES_VISIBLE_CAP && (
            <button
              onClick={() => setShowAllRules((s) => !s)}
              style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink-faint)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}
            >
              {showAllRules ? "Show fewer rules" : `Show all ${community.rules.length} rules`}
            </button>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 10, lineHeight: 1.5 }}>
          No specific rules yet — just keep it respectful and on-topic.
        </div>
      )}

      <div style={{ marginTop: 24 }}><SectionLabel>Admins &amp; mods</SectionLabel></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
        {community.admins.map((a) => (
          <Link key={a.handle} href={`/profile/${a.handle}`} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, textDecoration: "none" }}>
            <Avatar name={a.name} photo={a.avatar_url} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{a.name}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{a.handle}</div>
            </div>
            <RoleChip role={a.role} style={{ fontSize: 10.5, padding: "4px 9px", borderRadius: 7 }} />
          </Link>
        ))}
      </div>
    </>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [joinState, setJoinState] = useState<string>("none"); // member | requested | none
  const joined = joinState === "member";
  const [joinBusy, setJoinBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0); // join requests + posts awaiting review (admin only)
  const [leaveConfirm, setLeaveConfirm] = useState(false); // v8 styled leave modal

  async function toggleJoin() {
    if (!community || joinBusy) return;
    setJoinBusy(true);
    if (joined) {
      // leave
      setJoinState("none");
      setCommunity((c) => c ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c);
      try {
        await api.delete(`/communities/${community.id}/join`);
      } catch {
        setJoinState("member");
        setCommunity((c) => c ? { ...c, member_count: c.member_count + 1 } : c);
      } finally {
        setJoinBusy(false);
      }
      return;
    }
    if (joinState === "requested") {
      // withdraw a pending request
      setJoinState("none");
      try {
        await api.delete(`/communities/${community.id}/join`);
      } catch {
        setJoinState("requested");
      } finally {
        setJoinBusy(false);
      }
      return;
    }
    // DV8-14 — joining is gated for EVERYONE now (public included): the API answers
    // {"join_state":"requested"}. Only site admins skip the queue (they get "member").
    try {
      const res = await api.post<{ join_state?: string }>(`/communities/${community.id}/join`);
      const next = res?.join_state ?? "requested";
      setJoinState(next);
      if (next === "member") setCommunity((c) => c ? { ...c, member_count: c.member_count + 1 } : c);
    } finally {
      setJoinBusy(false);
    }
  }

  // v8 — admin takedown of a published post, with the reason collected on the card.
  // The removal is scoped to THIS community (an orphaned community-only post is
  // deleted server-side); the list refetches so counts and ordering stay honest.
  async function removePost(postId: string, reason: string) {
    try {
      await api.post(`/communities/${id}/posts/${postId}/remove`, { reason });
      const p = await api.get<CommunityPost[]>(`/communities/${id}/posts?limit=10`);
      setPosts(p ?? []);
      setCommunity((c) => c ? { ...c, post_count: Math.max(0, c.post_count - 1) } : c);
    } catch (e) {
      console.error(e);
    }
  }

  // Leave needs a confirm step — rejoining now goes back through admin approval.
  // v8 (CommunityDetail.jsx:297-310) — a styled modal card, not window.confirm.
  function confirmLeave() {
    if (!community) return;
    setLeaveConfirm(true);
  }
  function doLeave() {
    setLeaveConfirm(false);
    toggleJoin();
  }

  async function share() {
    const url = `${window.location.origin}/community/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: community?.name ?? "Scorred", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1600); }
    } catch { /* cancelled */ }
  }

  useEffect(() => {
    Promise.all([
      api.get<CommunityDetail>(`/communities/${id}`),
      api.get<CommunityPost[]>(`/communities/${id}/posts?limit=10`),
      api.get<RosterMember[]>(`/communities/${id}/roster`).catch(() => []),
    ])
      .then(([c, p, m]) => {
        setCommunity(c);
        setJoinState(c.join_state ?? (c.is_member ? "member" : "none"));
        setAccepted(c.is_member);
        setPosts(p ?? []);
        setMembers(m ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Admins see a "Manage · N" badge counting pending join requests + posts to review (v3 parity).
  const isModView = community?.member_role === "founder" || community?.member_role === "mod";
  useEffect(() => {
    if (!community || !isModView) return;
    Promise.all([
      api.get<unknown[]>(`/communities/${community.id}/requests`).catch(() => []),
      api.get<unknown[]>(`/communities/${community.id}/pending-posts`).catch(() => []),
    ]).then(([reqs, pend]) => setPendingCount((reqs?.length ?? 0) + (pend?.length ?? 0)));
  }, [community, isModView]);

  if (loading || !community) {
    return (
      <div className="w-full max-w-[680px]" style={{ padding: 20 }}>
        <div style={{ height: 132, borderRadius: 12, background: "var(--bone)", marginBottom: 16 }} />
        <div style={{ height: 24, width: "50%", borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
        <div style={{ height: 16, width: "80%", borderRadius: 6, background: "var(--bone)" }} />
      </div>
    );
  }

  const rawTone = community.tone || "plum";
  const tone = rawTone.startsWith("var(--") ? rawTone : `var(--${rawTone})`;
  const approval = community.post_mode === "approval";
  const isMod = isModView;
  const isPrivate = community.is_invite_only;
  const locked = isPrivate && !joined && !isMod;
  const founder = community.admins.find((a) => a.role === "founder");
  const requested = joinState === "requested";
  const hasBanner = !!community.banner_url;
  const hasPhoto = !!community.avatar_url;

  // Header CTA (DV8-14/15): admins & mods get Manage; a joined member gets Leave
  // (confirm-guarded — rejoining needs approval again); everyone else gets the gated
  // Join, which flips to a withdrawable "Requested" once the API queues it.
  let joinCtaLabel = "Join";
  if (requested) joinCtaLabel = "Requested — tap to withdraw";
  else if (isPrivate) joinCtaLabel = "Request to join";
  let headerCta: React.ReactNode;
  if (isMod) {
    headerCta = (
      <Link href={`/community/${id}/manage`} style={{ textDecoration: "none" }}>
        {/* v8 (CommunityDetail.jsx:110) — the CTA reads "Manage community · N". */}
        <Button size="sm" variant="secondary" icon={<Settings2 size={15} />}>
          Manage community{pendingCount > 0 ? ` · ${pendingCount}` : ""}
        </Button>
      </Link>
    );
  } else if (joined) {
    headerCta = (
      <Button size="sm" variant="secondary" onClick={confirmLeave} disabled={joinBusy}>
        Leave
      </Button>
    );
  } else {
    headerCta = (
      <Button size="sm" variant={requested ? "secondary" : "dark"} onClick={toggleJoin} disabled={joinBusy}>
        {joinCtaLabel}
      </Button>
    );
  }

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      {/* Web sticky header (DF-33b detail idiom; DF-38 owns the global header) */}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton fallback="/community" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Community</span>
          <button onClick={share} title={shared ? "Link copied" : "Share"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: shared ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {/* Banner — uploaded image when set, else the tone block with the tag watermark (DV8-14) */}
      <div style={{
        height: 132, position: "relative", overflow: "hidden",
        ...(hasBanner
          ? { backgroundImage: `url(${community.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: tone }),
      }}>
        {!hasBanner && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18), transparent 55%)" }} />
            <div style={{ position: "absolute", right: -20, bottom: -30, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 150, color: "rgba(255,255,255,0.12)", lineHeight: 1 }}>
              {community.tag ?? "🏷"}
            </div>
          </>
        )}
      </div>

      {/* Identity row — position:relative + z-index so the avatar paints ABOVE the
          banner. The banner is position:relative (for its decorations), so without
          this the positioned banner would paint over the negative-margin avatar (QA 13.1). */}
      <div style={{ padding: "0 20px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -34 }}>
          {/* Photo tile — uploaded square photo when set, else the letter tile (DV8-14) */}
          <div style={{ width: 76, height: 76, borderRadius: 18, background: hasPhoto ? `center/cover url(${community.avatar_url})` : tone, color: "var(--paper)", border: "3px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, flexShrink: 0 }}>
            {!hasPhoto && (community.tag ?? "🏷")}
          </div>
          <div style={{ flex: 1, paddingBottom: 4, display: "flex", justifyContent: "flex-end", gap: 8 }}>{headerCta}</div>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", margin: "12px 0 4px" }}>{community.name}</h1>
        <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>{community.description}</div>

        {/* meta row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10, fontSize: 12.5, color: "var(--ink-faint)" }}>
          <span><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{community.member_count.toLocaleString("en-IN")}</b> members</span>
          <span><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{community.post_count.toLocaleString("en-IN")}</b> posts</span>
          {/* QA2 — new posts in the last 24h, beside members & posts. */}
          {community.recent_post_count > 0 && (
            <span style={{ color: "var(--stamp-red)", fontWeight: 600 }}>
              <b style={{ fontFamily: "var(--font-mono)" }}>{community.recent_post_count.toLocaleString("en-IN")}</b> new · 24h
            </span>
          )}
          {founder && (
            <span>
              by{" "}
              <Link href={`/profile/${founder.handle}`} style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "none" }}>
                @{founder.handle}
              </Link>
            </span>
          )}
        </div>

        {/* privacy + posting + admin badges */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--bone)", border: "1px solid var(--border-strong)" }}>
            {isPrivate ? <Shield size={13} style={{ color: "var(--ink-mute)" }} /> : <Globe size={13} style={{ color: "var(--ink-mute)" }} />}
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>{isPrivate ? "Private" : "Public"}</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: approval ? "var(--grail-gold-soft)" : "var(--forest-soft)", border: `1px solid ${approval ? "var(--grail-gold)" : "var(--forest)"}` }}>
            {approval ? <Shield size={13} style={{ color: "var(--grail-gold-deep)" }} /> : <Check size={13} style={{ color: "var(--forest)" }} />}
            <span style={{ fontSize: 11.5, fontWeight: 600, color: approval ? "var(--grail-gold-deep)" : "var(--forest)" }}>{approval ? "Posts reviewed" : "Open posting"}</span>
          </span>
          {isMod && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--ink)", border: "1px solid var(--ink)" }}>
              <Shield size={13} style={{ color: "var(--paper)" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--paper)" }}>{community.member_role === "mod" ? "You’re a mod" : "You’re an admin"}</span>
            </span>
          )}
        </div>
      </div>

      {locked ? (
        /* LOCKED private preview */
        <div style={{ padding: "20px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "8px 0 20px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: "var(--bone)", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-mute)", marginBottom: 12 }}>
              <Shield size={24} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>This community is private</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 6, maxWidth: 280, lineHeight: 1.55 }}>
              Posts and members are visible once an admin approves your request to join.
            </div>
            <div style={{ marginTop: 16 }}>
              <Button variant={requested ? "secondary" : "dark"} icon={requested ? <Clock size={17} /> : <UserPlus size={17} />} onClick={toggleJoin} disabled={joinBusy}>
                {requested ? "Request pending — tap to withdraw" : "Request to join"}
              </Button>
            </div>
          </div>
          <RulesAndAdmins community={community} />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ position: "sticky", top: 56, zIndex: 9, background: "var(--paper)", padding: "16px 20px 10px", marginTop: 14, borderBottom: "1px solid var(--border)" }}>
            <Segmented
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              options={[{ id: "posts", label: "Posts" }, { id: "members", label: "Members" }, { id: "about", label: "Rules" }]}
            />
          </div>

          {tab === "posts" ? (
            <div>
              {/* v8 (CommunityDetail.jsx:80-92) — the composer trigger moved to a sticky
                  footer bar (rendered after the tab content below); only the accept-the-
                  guidelines card still leads the list. */}
              {joined && (accepted ? null : (
                <div style={{ margin: "14px 20px 4px", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 13, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Shield size={17} style={{ color: "var(--ink-mute)" }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>Read the guidelines before posting</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)", lineHeight: 1.5, margin: "7px 0 12px" }}>
                    {community.name} asks every member to accept its house rules before their first post.
                  </div>
                  <div style={{ display: "flex", gap: 9 }}>
                    <Button size="sm" variant="secondary" onClick={() => setTab("about")}>View rules</Button>
                    <Button size="sm" variant="dark" onClick={() => setAccepted(true)}>Accept &amp; continue</Button>
                  </div>
                </div>
              ))}
              {!joined && (
                <div style={{ margin: "14px 20px 4px", textAlign: "center", fontSize: 13, color: "var(--ink-faint)", padding: "8px 0" }}>
                  {/* Joining is gated for everyone now, so the gate copy says so (DV8-14). */}
                  Join and get approved to post here.
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                {posts.length > 0
                  ? posts.map((p) => (
                      /* DV8-14/17 — ADMIN/MOD chip renders IN the author row via
                         PostCard's authorRole prop (the absolute overlay hack is gone).
                         v8 — community admins (founder, or site staff) get the trash
                         action + inline removal-reason panel; the endpoint is
                         admin-gated server-side, so mods don't get the affordance. */
                      <PostCard
                        key={p.id}
                        post={p}
                        authorRole={p.author_role ?? null}
                        canModerate={community.member_role === "founder" || !!user?.is_admin}
                        onRemove={(reason) => removePost(p.id, reason)}
                      />
                    ))
                  : <EmptyNote>Quiet so far — be the first to post.</EmptyNote>}
              </div>
            </div>
          ) : tab === "members" ? (
            <div style={{ padding: "14px 20px" }}>
              <SectionLabel>{members.length} members</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {members.map((m) => (
                  <Link key={m.handle} href={`/profile/${m.handle}`} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 10, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, textDecoration: "none" }}>
                    <Avatar name={m.name} photo={m.avatar_url} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{m.name}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{m.handle}</div>
                    </div>
                    {m.role !== "member" && (
                      <RoleChip role={m.role} style={{ fontSize: 10.5, padding: "4px 9px", borderRadius: 7 }} />
                    )}
                  </Link>
                ))}
                {members.length === 0 && <EmptyNote>No members yet.</EmptyNote>}
              </div>
              {/* v8 (CommunityDetail.jsx:275-277) — a member's exit lives at the list's
                  foot as a red text link; admins manage, they don't "leave". */}
              {joined && !isMod && (
                <button
                  type="button"
                  onClick={() => setLeaveConfirm(true)}
                  style={{ marginTop: 20, width: "100%", textAlign: "center", background: "none", border: "none", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13 }}
                >
                  Leave community
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              <RulesAndAdmins community={community} />
              {joined && !accepted && (
                <Button variant="primary" size="block" style={{ marginTop: 16 }} onClick={() => { setAccepted(true); setTab("posts"); }}>
                  Accept guidelines
                </Button>
              )}
              {accepted && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "var(--forest)", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 size={16} />You&rsquo;ve accepted these guidelines.
                </div>
              )}
              {/* v8 (CommunityDetail.jsx:292-294) — same red exit link under the rules. */}
              {joined && !isMod && (
                <button
                  type="button"
                  onClick={() => setLeaveConfirm(true)}
                  style={{ marginTop: 20, width: "100%", textAlign: "center", background: "none", border: "none", cursor: "pointer", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13 }}
                >
                  Leave community
                </button>
              )}
            </div>
          )}

          {/* v8 (CommunityDetail.jsx:80-92) — STICKY FOOTER composer trigger on the
              Posts tab once you're a member who accepted the guidelines: 48px bar with
              a 1.5px ink border on paper, bold ink text, 34px dark rounded + square.
              The bottom offset clears the fixed BottomNav below lg. */}
          {tab === "posts" && joined && accepted && (
            <div
              className="sticky z-20 bottom-[calc(64px+env(safe-area-inset-bottom))] lg:bottom-0"
              style={{ background: "var(--paper)", borderTop: "1px solid var(--slate-200)", padding: "10px 20px", marginTop: 8 }}
            >
              <Link
                href={`/compose?community=${community.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", height: 48,
                  boxSizing: "border-box", padding: "0 8px 0 16px", borderRadius: 14,
                  border: "1.5px solid var(--ink)", background: "var(--paper)",
                  fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)",
                  textAlign: "left", textDecoration: "none",
                }}
              >
                Write something or create a post…
                <span style={{ marginLeft: "auto", width: 34, height: 34, borderRadius: 10, background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Plus size={18} strokeWidth={2.2} />
                </span>
              </Link>
            </div>
          )}
        </>
      )}

      {/* v8 (CommunityDetail.jsx:297-310) — styled leave-confirm modal card. */}
      {leaveConfirm && (
        <>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setLeaveConfirm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140, border: "none", cursor: "default" }}
          />
          <div style={{
            position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 141,
            width: "min(calc(100% - 40px), 380px)", background: "var(--paper)", borderRadius: 18, padding: 20,
            boxShadow: "var(--shadow-2)", boxSizing: "border-box",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
              Leave {community.name}?
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 6 }}>
              {isPrivate
                ? "You'll need to request to join again to get back in."
                : "You can ask to rejoin anytime, but you'll lose your role and any unread activity here."}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveConfirm(false)}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1, justifyContent: "center" }} disabled={joinBusy} onClick={doLeave}>Leave</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
