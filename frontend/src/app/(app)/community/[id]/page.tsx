"use client";

import { useEffect, useState } from "react";
import type React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2, Shield, Globe, Check, Settings2, UserPlus, Clock, Plus, X } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { api } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { ApiPost } from "@/components/cards";
import { Avatar, Segmented, SectionLabel, EmptyNote, Button, toneVar } from "@/components/ui";
import { PostCard, PostImages } from "@/components/cards";
import { fireToast } from "@/components/gamification";
import { timeAgo } from "@/lib/utils";

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
  status: string; // pending | approved | … (a pending community only loads for founder/site-admin)
  admins: CommunityAdmin[];
}

// Community post payloads carry the author's role in THIS community (DV8-14).
type CommunityPost = ApiPost & { author_role?: "admin" | "mod" | null };

// GET /communities/{id}/my-posts — the caller's pending + declined posts here (#21).
interface MyPendingPost {
  id: string;
  type: string;
  title: string | null;
  body: string;
  images: string[];
  status: string; // pending | declined
  decline_reason: string | null;
  declined_at: string | null;
  created_at: string;
}

type Tab = "posts" | "members" | "pending" | "about";

/* ⚖ Guidelines acceptance persists per community in localStorage so it survives
   reloads (v8 keeps it in app state per community); a server-side column is a
   future backend addition. Existing members auto-pass (they predate the gate). */
const GUIDELINES_KEY_PREFIX = "scorred:guidelinesAccepted:";
function readGuidelinesAccepted(communityId: string): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(GUIDELINES_KEY_PREFIX + communityId) === "1"; } catch { return false; }
}

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
  const [myPending, setMyPending] = useState<MyPendingPost[]>([]); // #21 — your posts in review here
  const [tab, setTab] = useState<Tab>("posts");
  const [joinState, setJoinState] = useState<string>("none"); // member | requested | none
  const joined = joinState === "member";
  const [joinBusy, setJoinBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0); // join requests + posts awaiting review (admin only)
  // v8 leave flow — null | confirm | promote (last admin picks a successor) | sole
  const [leaveStep, setLeaveStep] = useState<null | "confirm" | "promote" | "sole">(null);
  const [succHandle, setSuccHandle] = useState<string | null>(null);
  const [succMembers, setSuccMembers] = useState<{ handle: string; name: string; avatar_url: string | null; role: string }[] | null>(null);
  const [succBusy, setSuccBusy] = useState(false);

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
        fireToast("Request withdrawn"); // v8 Cards.jsx:711
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
      // v8 Cards.jsx:711-716 — announce what actually happened.
      if (next === "member") {
        setCommunity((c) => c ? { ...c, member_count: c.member_count + 1 } : c);
        fireToast(`Joined ${community.name}`);
      } else {
        fireToast("Request sent — an admin will review it");
      }
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
      fireToast("Post removed"); // v8 CommunityDetail.jsx:239
      const p = await api.get<CommunityPost[]>(`/communities/${id}/posts?limit=10`);
      setPosts(p ?? []);
      setCommunity((c) => c ? { ...c, post_count: Math.max(0, c.post_count - 1) } : c);
    } catch (e) {
      console.error(e);
    }
  }

  // #21 — a declined row's Dismiss (author-only server-side); the tab collapses
  // back to Posts once the queue empties.
  async function dismissDeclined(postId: string) {
    try {
      await api.delete(`/communities/${id}/posts/${postId}/declined`);
      const next = myPending.filter((p) => p.id !== postId);
      setMyPending(next);
      if (next.length === 0 && tab === "pending") setTab("posts");
    } catch (e) {
      console.error(e);
    }
  }

  // #23 — accepting is a real event now: persisted per community + toast (v8 :229,300).
  function acceptGuidelines() {
    setAccepted(true);
    try { localStorage.setItem(GUIDELINES_KEY_PREFIX + id, "1"); } catch { /* ignore */ }
    fireToast("Guidelines accepted — you can post now");
  }

  // v8 leave flow (updated CommunityDetail) — a plain member confirms; the LAST
  // full admin must first hand the community to a successor; a sole member is
  // pointed at Close instead. (v8's own Leave buttons hide for admins, which
  // orphans its promote branch — we surface the foot link to every joined role.)
  function confirmLeave() {
    if (!community) return;
    const fullAdmin = community.member_role === "founder" || community.member_role === "admin";
    const otherAdmins = community.admins.filter((a) => (a.role === "founder" || a.role === "admin") && a.handle !== user?.handle);
    if (!fullAdmin || otherAdmins.length > 0) { setLeaveStep("confirm"); return; }
    if (community.member_count > 1) {
      setSuccHandle(null);
      setSuccMembers(null);
      setLeaveStep("promote");
      api.get<{ handle: string; name: string; avatar_url: string | null; role: string }[]>(`/communities/${id}/members`)
        .then((ms) => setSuccMembers((ms ?? []).filter((m) => m.handle !== user?.handle)))
        .catch(() => setSuccMembers([]));
    } else {
      setLeaveStep("sole");
    }
  }
  function doLeave() {
    setLeaveStep(null);
    toggleJoin();
  }
  // v8 confirmSuccessionAndLeave — promote, then leave, one toast.
  async function promoteAndLeave() {
    if (!succHandle || succBusy || !community) return;
    setSuccBusy(true);
    try {
      await api.patch(`/communities/${id}/members/${succHandle}/role?role=admin`);
      setLeaveStep(null);
      await toggleJoin();
      fireToast(`Left ${community.name} — @${succHandle} is now Admin`);
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Couldn't hand over — try again");
    } finally {
      setSuccBusy(false);
    }
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
        // ⚖ Existing members auto-pass the guidelines gate; a fresh acceptance is
        // remembered per community in localStorage (#23 — server column later).
        setAccepted(c.is_member || readGuidelinesAccepted(id));
        setPosts(p ?? []);
        setMembers(m ?? []);
        setMyPending([]); // stale rows from a previous community clear before the refetch
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // #21 — members also carry their own review queue here: pending + declined posts.
  const isJoinedMember = community?.is_member ?? false;
  useEffect(() => {
    if (!isJoinedMember) return;
    let active = true;
    api.get<MyPendingPost[]>(`/communities/${id}/my-posts`)
      .then((ps) => { if (active) setMyPending(ps ?? []); })
      .catch(() => { /* tab simply doesn't render */ });
    return () => { active = false; };
  }, [isJoinedMember, id]);

  // Admins see a "Manage · N" badge counting pending join requests + posts to review (v3 parity).
  const isModView = community?.member_role === "founder" || community?.member_role === "admin" || community?.member_role === "mod";
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

  const tone = toneVar(community.tone || "plum");
  const approval = community.post_mode === "approval";
  const isMod = isModView;
  const isPrivate = community.is_invite_only;
  const locked = isPrivate && !joined && !isMod;
  // #20 — pending platform review blocks ALL activity; the API only serves a
  // pending community to its founder or a site admin, everyone else 404s.
  const pendingReview = community.status === "pending";
  // DV8 close — a closed community is frozen: no joins, no composer (server
  // enforces both); members keep read access. Reopen lives in Manage → Settings.
  const closed = community.status === "closed";
  const founder = community.admins.find((a) => a.role === "founder");
  const requested = joinState === "requested";
  const hasBanner = !!community.banner_url;
  const hasPhoto = !!community.avatar_url;

  // Header CTA (DV8-14/15): admins & mods get Manage; a joined member gets Leave
  // (confirm-guarded — rejoining needs approval again); everyone else gets the gated
  // Join, which flips to a withdrawable "Requested" once the API queues it.
  // v8 :132 — the header's requested CTA is the short "Requested"; the long
  // "tap to withdraw" copy lives only on the locked preview (v8 :212).
  let joinCtaLabel = "Join";
  if (requested) joinCtaLabel = "Requested";
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
      /* v8 :136 — Leave carries the close glyph. */
      <Button size="sm" variant="secondary" icon={<X size={15} />} onClick={confirmLeave} disabled={joinBusy}>
        Leave
      </Button>
    );
  } else if (pendingReview || closed) {
    headerCta = null; // v8 :130 — no join CTA while awaiting review; closed takes no joins either
  } else {
    headerCta = (
      <Button size="sm" variant={requested ? "secondary" : "dark"} onClick={toggleJoin} disabled={joinBusy}>
        {joinCtaLabel}
      </Button>
    );
  }

  // v8 :82-90 — locked previews and pending-review both collapse the tab bar to a
  // single "Rules" tab; the member's own review queue adds a "Pending n" segment.
  const realTabs: { id: Tab; label: string }[] = locked || pendingReview
    ? [{ id: "about", label: "Rules" }]
    : [
        { id: "posts", label: "Posts" },
        { id: "members", label: "Members" },
        ...(joined && myPending.length > 0 ? [{ id: "pending" as Tab, label: `Pending ${myPending.length}` }] : []),
        { id: "about", label: "Rules" },
      ];
  const activeTab: Tab = locked || pendingReview
    ? "about"
    : tab === "pending" && (!joined || myPending.length === 0) ? "posts" : tab;

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

        {/* v8 :141-143 — your role badge sits beside the name (admin red / mod bone;
            founder displays Admin), replacing the old "You're an admin" pill. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 4px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", margin: 0 }}>{community.name}</h1>
          {community.member_role && community.member_role !== "member" && <RoleChip role={community.member_role} />}
        </div>
        {/* v8 :145 — the sub-line is the short description when one exists. */}
        <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>{community.short_desc || community.description}</div>

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

        {/* privacy + posting badges (v8 :155-172) — pending review swaps the posting
            chip for the gold "Pending platform review" chip. */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--bone)", border: "1px solid var(--border-strong)" }}>
            {isPrivate ? <Shield size={13} style={{ color: "var(--ink-mute)" }} /> : <Globe size={13} style={{ color: "var(--ink-mute)" }} />}
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>{isPrivate ? "Private" : "Public"}</span>
          </span>
          {!pendingReview && !closed && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: approval ? "var(--grail-gold-soft)" : "var(--forest-soft)", border: `1px solid ${approval ? "var(--grail-gold)" : "var(--forest)"}` }}>
              {approval ? <Shield size={13} style={{ color: "var(--grail-gold-deep)" }} /> : <Check size={13} style={{ color: "var(--forest)" }} />}
              <span style={{ fontSize: 11.5, fontWeight: 600, color: approval ? "var(--grail-gold-deep)" : "var(--forest)" }}>{approval ? "Posts reviewed" : "Open posting"}</span>
            </span>
          )}
          {/* DV8 close — the posting chip yields to a neutral "Closed" chip (posting is frozen). */}
          {closed && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--bone)", border: "1px solid var(--border-strong)" }}>
              <X size={13} style={{ color: "var(--ink-mute)" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>Closed</span>
            </span>
          )}
          {pendingReview && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)" }}>
              <Clock size={13} style={{ color: "var(--grail-gold-deep)" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--grail-gold-deep)" }}>Pending platform review</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs — always rendered: locked previews and pending review keep the bar with
          the single "Rules" segment (v8 :82-90,176-178). */}
      <div style={{ position: "sticky", top: 56, zIndex: 9, background: "var(--paper)", padding: "16px 20px 10px", marginTop: 14, borderBottom: "1px solid var(--border)" }}>
        <Segmented value={activeTab} onChange={(v) => setTab(v as Tab)} options={realTabs} />
      </div>

      {pendingReview ? (
        /* #20 — PENDING PLATFORM REVIEW blocks all activity (v8 :166-199). */
        <div style={{ padding: "20px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "8px 0 20px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--grail-gold-deep)", marginBottom: 12 }}>
              <Clock size={24} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>Awaiting platform review</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-faint)", marginTop: 6, maxWidth: 300, lineHeight: 1.55 }}>
              New communities are checked before they go live — no posts, joins or activity happen until it&rsquo;s approved. You&rsquo;ll be notified.
            </div>
            {isMod && (
              <div style={{ marginTop: 16 }}>
                <Link href={`/community/${id}/manage`} style={{ textDecoration: "none" }}>
                  <Button size="sm" variant="secondary" icon={<Settings2 size={15} />}>Manage community</Button>
                </Link>
              </div>
            )}
          </div>
          <RulesAndAdmins community={community} />
        </div>
      ) : locked ? (
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
          {activeTab === "posts" ? (
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
                    <Button size="sm" variant="dark" onClick={acceptGuidelines}>Accept &amp; continue</Button>
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
                        canModerate={community.member_role === "founder" || community.member_role === "admin" || !!user?.is_admin}
                        onRemove={(reason) => removePost(p.id, reason)}
                      />
                    ))
                  : <EmptyNote>Quiet so far — be the first to post.</EmptyNote>}
              </div>
            </div>
          ) : activeTab === "pending" ? (
            /* #21 — YOUR review queue here (v8 :243-267): pending posts wait in gold;
               declined ones turn red, show the mod's reason and offer Dismiss. */
            <div style={{ padding: "14px 20px" }}>
              <SectionLabel>Your posts awaiting review</SectionLabel>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "8px 2px 14px", lineHeight: 1.5 }}>
                These aren&rsquo;t visible to the community yet. Once approved, they&rsquo;ll publish and clear from here automatically.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myPending.map((p) => {
                  const declined = p.status === "declined";
                  return (
                    <div key={p.id} style={{ background: "var(--paper-soft)", border: `1px solid ${declined ? "var(--stamp-red)" : "var(--border)"}`, borderRadius: 14, padding: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: declined ? "var(--stamp-red-soft)" : "var(--grail-gold-soft)", color: declined ? "var(--stamp-red)" : "var(--grail-gold-deep)" }}>
                          {declined ? <X size={11} /> : <Clock size={11} />}
                          {declined ? "Declined" : "Pending review"}
                        </span>
                        <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{timeAgo(p.created_at)}</span>
                      </div>
                      {p.title && <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.title}</div>}
                      <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{p.body}</div>
                      {p.images.length > 0 && <div style={{ marginTop: 10 }}><PostImages images={p.images} /></div>}
                      {declined && (
                        <>
                          {p.decline_reason && <div style={{ fontSize: 12, color: "var(--stamp-red)", marginTop: 8 }}>Reason: {p.decline_reason}</div>}
                          <button
                            type="button"
                            onClick={() => dismissDeclined(p.id)}
                            style={{ marginTop: 10, background: "none", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 11px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-mute)", fontWeight: 600 }}
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === "members" ? (
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
              {joined && (
                <button
                  type="button"
                  onClick={confirmLeave}
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
                <Button variant="primary" size="block" style={{ marginTop: 16 }} onClick={() => { acceptGuidelines(); setTab("posts"); }}>
                  Accept guidelines
                </Button>
              )}
              {accepted && (
                /* v8 :306 — plain check stroke 2.4, not the circled glyph. */
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "var(--forest)", fontSize: 13, fontWeight: 600 }}>
                  <Check size={16} strokeWidth={2.4} />You&rsquo;ve accepted these guidelines.
                </div>
              )}
              {/* v8 (CommunityDetail.jsx:292-294) — same red exit link under the rules. */}
              {joined && (
                <button
                  type="button"
                  onClick={confirmLeave}
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
          {activeTab === "posts" && joined && accepted && !closed && (
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
      {leaveStep === "confirm" && (
        <>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setLeaveStep(null)}
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
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1, justifyContent: "center" }} disabled={joinBusy} onClick={doLeave}>Leave</Button>
            </div>
          </div>
        </>
      )}

      {/* v8 leave flow 'promote' — the last full admin hands the community over first. */}
      {leaveStep === "promote" && community && (
        <>
          <button type="button" aria-label="Cancel" onClick={() => setLeaveStep(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140, border: "none", cursor: "default" }} />
          <div style={{
            position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 141,
            width: "min(calc(100% - 40px), 380px)", background: "var(--paper)", borderRadius: 18, padding: 20,
            boxShadow: "var(--shadow-2)", boxSizing: "border-box", maxHeight: "76vh", overflowY: "auto",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Pick a new admin before you leave</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 6 }}>
              You&rsquo;re the only admin left. Every community needs someone managing it, so choose a member to make Admin.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {succMembers === null && <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Loading members…</div>}
              {succMembers?.map((m) => {
                const on = succHandle === m.handle;
                return (
                  <button key={m.handle} type="button" onClick={() => setSuccHandle(m.handle)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: 10, cursor: "pointer",
                    background: on ? "var(--bone)" : "var(--paper-soft)", border: `1.5px solid ${on ? "var(--ink)" : "var(--border)"}`, borderRadius: 13,
                  }}>
                    <Avatar name={m.name} photo={m.avatar_url} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>@{m.handle}</div>
                    </div>
                    {m.role !== "member" && <RoleChip role={m.role} />}
                    {on && <Check size={16} style={{ color: "var(--ink)", flexShrink: 0 }} />}
                  </button>
                );
              })}
              {succMembers?.length === 0 && <EmptyNote>No other members to promote.</EmptyNote>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" disabled={!succHandle || succBusy} style={{ flex: 1, justifyContent: "center", opacity: succHandle ? 1 : 0.5 }} onClick={promoteAndLeave}>
                Promote &amp; leave
              </Button>
            </div>
          </div>
        </>
      )}

      {/* v8 leave flow 'sole' — nobody to hand it to; Close lives in Manage → settings. */}
      {leaveStep === "sole" && community && (
        <>
          <button type="button" aria-label="Cancel" onClick={() => setLeaveStep(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140, border: "none", cursor: "default" }} />
          <div style={{
            position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 141,
            width: "min(calc(100% - 40px), 380px)", background: "var(--paper)", borderRadius: 18, padding: 20,
            boxShadow: "var(--shadow-2)", boxSizing: "border-box",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>You&rsquo;re the only member</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 6 }}>
              There&rsquo;s no one to hand this community to. Leaving isn&rsquo;t available — close the community instead if you&rsquo;re done with it.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setLeaveStep(null); window.location.href = `/community/${id}/manage`; }}>
                Go to settings
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
