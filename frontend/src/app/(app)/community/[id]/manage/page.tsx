"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Camera, Check, Clock, Image as ImageIcon, Pencil, X, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { PostImages, type ApiCommunity } from "@/components/cards";
import { Avatar, Button, Segmented, SectionLabel, EmptyNote, PostTypeTag } from "@/components/ui";
import { fireToast } from "@/components/gamification";
import { useUser } from "@/lib/auth-context";
import { timeAgo } from "@/lib/utils";

interface CommunityDetail extends ApiCommunity {
  member_role: string | null;
  banner_url?: string | null;
  avatar_url?: string | null;
  admins: { handle: string; name: string; avatar_url: string | null; role: string }[];
}
interface JoinRequest { handle: string; name: string; avatar_url: string | null; vouches: number; }
interface PendingPost { id: string; handle: string; name: string; avatar_url: string | null; type: string; title: string | null; body: string; images: string[]; created_at: string; }
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

/* v8 ManageStat (:124-126) — centred tile, mono 22 figure, uppercase micro-label;
   each tile is a button that jumps to its segment. */
function Stat({ n, label, accent, onClick }: { n: number; label: string; accent: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ flex: 1, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, padding: "12px 10px", textAlign: "center", cursor: "pointer", fontFamily: "var(--font-body)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: accent, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 5 }}>{label}</div>
    </button>
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
  const { user } = useUser();
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
  // v8 :36/:41 — member controls hide behind the pencil; role changes confirm first.
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [roleChange, setRoleChange] = useState<{ handle: string; role: "member" | "mod" | "admin"; label: string } | null>(null);
  // #36 (v8 :34-35) — declining a post collects the mod's reason inline on the card.
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  // v8 :38-39 — the details editor and the close/delete flow live in overlay sheets.
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  // v8 :24,:330-390 — leave flow: confirm | promote (last admin picks a successor) | sole.
  const [leaveStep, setLeaveStep] = useState<null | "confirm" | "promote" | "sole">(null);
  const [succHandle, setSuccHandle] = useState<string | null>(null);
  const [leaveBusy, setLeaveBusy] = useState(false);
  // ⚖ Reopen is our addition — v8's close had no way back short of delete; the
  // status column makes the undo cheap, so a closed community gets a one-tap reopen.
  const [reopening, setReopening] = useState(false);

  // Settings (admin only, saved via PATCH)
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [posting, setPosting] = useState<"open" | "approval">("open");
  const [savingSettings, setSavingSettings] = useState(false);
  // Full details editor (DV8-14): rename / description / rules / photos.
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // v8 roleCanFullAdmin (data.jsx :1152) — the founder OR any granted Admin edits
  // settings and manages members; mods approve requests and posts only.
  const isAdmin = community?.member_role === "founder" || community?.member_role === "admin";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await api.get<CommunityDetail>(`/communities/${id}`);
        if (!active) return;
        if (c.member_role !== "founder" && c.member_role !== "admin" && c.member_role !== "mod") { setDenied(true); return; }
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
      // v8 :65-66 — every verdict is announced.
      fireToast(action === "approve" ? `@${handle} approved` : `@${handle} declined`);
    } finally { setBusy(null); }
  };

  const approvePost = async (postId: string) => {
    if (busy) return; setBusy(postId);
    try {
      await api.post(`/communities/${id}/posts/${postId}/approve`);
      setPending((p) => p.filter((x) => x.id !== postId));
      fireToast("Post approved & published"); // v8 :206
    } finally { setBusy(null); }
  };

  // #36 (v8 :193-233) — Decline first opens the inline reason collector; only
  // "Confirm decline" fires the request. POST reject REQUIRES {reason} (422 blank).
  const confirmDecline = async (post: PendingPost) => {
    const reason = declineReason.trim();
    if (busy || !reason) return;
    setBusy(post.id);
    try {
      await api.post(`/communities/${id}/posts/${post.id}/reject`, { reason });
      setPending((p) => p.filter((x) => x.id !== post.id));
      fireToast(`@${post.handle} declined`);
      setDecliningId(null);
      setDeclineReason("");
    } finally { setBusy(null); }
  };

  // v8 :73 — role changes confirm first, then toast "@handle is now X".
  const confirmRoleChange = async () => {
    const rc = roleChange;
    if (!rc || busy) return;
    setBusy(rc.handle);
    try {
      await api.patch(`/communities/${id}/members/${rc.handle}/role?role=${rc.role}`);
      setMembers((ms) => ms.map((x) => x.handle === rc.handle ? { ...x, role: rc.role } : x));
      fireToast(`@${rc.handle} is now ${rc.label}`);
      setRoleChange(null);
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
      fireToast(`@${handle} removed`);
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
      // #37 (v8 :301-308) — each settings change announces itself.
      if (next.privacy) fireToast(next.privacy === "public" ? "Community is now public" : "Community is now private");
      if (next.posting) fireToast(next.posting === "open" ? "Members can post freely" : "Posts will be reviewed");
    } finally { setSavingSettings(false); }
  };

  // Photos save on upload — one PATCH per uploaded image.
  const savePhoto = async (field: "banner_url" | "avatar_url", url: string) => {
    await api.patch(`/communities/${id}`, { [field]: url }).catch(() => null);
    setCommunity((c) => c ? { ...c, [field]: url } : c);
  };

  // Rules cap (#39) — same 900-char total budget as the create form, counted on the
  // RAW text (newlines included) and hard-sliced as you type, exactly like create.
  const ruleLines = ruleLinesOf(rulesText);
  const rulesChars = rulesText.length;
  const rulesInvalid = rulesChars > RULES_TOTAL_MAX_CHARS;
  // #39 — description is required now, like the create form (v8 EditCommunitySheet :411).
  const detailsInvalid = !name.trim() || !desc.trim() || rulesInvalid;

  // v8 :397-446 — the sheet opens on the SAVED values, so drafts from an earlier
  // abandoned edit don't leak back in (v8 mounts its sheet fresh each time).
  const openEdit = () => {
    if (!community) return;
    setName(community.name);
    setDesc(community.description ?? community.short_desc ?? "");
    setRulesText((community.rules ?? []).join("\n"));
    setDetailsError(null);
    setEditOpen(true);
  };

  const saveDetails = async () => {
    if (savingDetails) return;
    // v8 :411 — an invalid draft toasts and keeps the sheet open.
    if (detailsInvalid) { fireToast("Check the name, description and rules length"); return; }
    setSavingDetails(true);
    setDetailsError(null);
    try {
      await api.patch(`/communities/${id}`, {
        name: name.trim(),
        description: desc.trim(),
        rules: ruleLines,
      });
      setCommunity((c) => c ? { ...c, name: name.trim(), description: desc.trim(), rules: ruleLines } : c);
      fireToast("Community details updated"); // v8 :418
      setEditOpen(false);
    } catch (e) {
      // A 409 duplicate-name comes back as the error detail — shown inline by the name field.
      setDetailsError(e instanceof Error ? e.message : "Could not save changes");
    } finally {
      setSavingDetails(false);
    }
  };

  // v8 :49-63 — leave flow entry. A sole member has no one to hand over to; the
  // ONLY full admin must promote a successor first; everyone else just confirms.
  const otherMembers = members.filter((m) => m.handle !== user?.handle);
  const openLeaveFlow = () => {
    if (members.length <= 1) { setLeaveStep("sole"); return; }
    const otherAdmins = otherMembers.filter((m) => m.role === "founder" || m.role === "admin");
    if (isAdmin && otherAdmins.length === 0) { setSuccHandle(null); setLeaveStep("promote"); return; }
    setLeaveStep("confirm");
  };
  const doLeave = async () => {
    if (leaveBusy || !community) return;
    setLeaveBusy(true);
    try {
      await api.delete(`/communities/${id}/join`);
      setLeaveStep(null);
      fireToast(`Left ${community.name}`);
      router.push("/community");
    } catch (e) {
      // 409 — the server refuses the LAST full admin (roster drift); its message says so.
      fireToast(e instanceof Error && e.message ? e.message : "Couldn't leave — try again");
      setLeaveBusy(false);
    }
  };
  // v8 confirmSuccessionAndLeave (:55-63) — promote, then leave, one toast.
  const promoteAndLeave = async () => {
    if (!succHandle || leaveBusy || !community) return;
    setLeaveBusy(true);
    try {
      await api.patch(`/communities/${id}/members/${succHandle}/role?role=admin`);
      await api.delete(`/communities/${id}/join`);
      setLeaveStep(null);
      fireToast(`Left ${community.name} — @${succHandle} is now Admin`);
      router.push("/community");
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Couldn't hand over — try again");
      setLeaveBusy(false);
    }
  };

  // ⚖ Reopen (our addition — see the reopening state note): POST reopen, then
  // refetch so the closed banner clears with the server as the source of truth.
  const reopenCommunity = async () => {
    if (reopening || !community) return;
    setReopening(true);
    try {
      await api.post(`/communities/${id}/reopen`);
      fireToast(`${community.name} reopened`);
      const c = await api.get<CommunityDetail>(`/communities/${id}`);
      setCommunity(c);
    } catch (e) {
      fireToast(e instanceof Error && e.message ? e.message : "Couldn't reopen — try again");
    } finally {
      setReopening(false);
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
      {/* v8 :88-100 — role changes confirm in a centred dialog before applying */}
      {roleChange && (
        <>
          <div onClick={() => setRoleChange(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140 }} />
          <div style={{ position: "fixed", left: 20, right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 141, maxWidth: 440, margin: "0 auto", background: "var(--paper)", borderRadius: 18, padding: 20, boxShadow: "var(--shadow-2)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Change role to {roleChange.label}?</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 6 }}>
              @{roleChange.handle} will {roleChange.role !== "member" ? `become a ${roleChange.label}` : "lose their moderation role"} in {community.name}.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={() => setRoleChange(null)} style={{ flex: 1, height: 42, borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--bone)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={confirmRoleChange} disabled={busy === roleChange.handle} style={{ flex: 1, height: 42, borderRadius: 12, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Confirm</button>
            </div>
          </div>
        </>
      )}
      {/* v8 :101-111 — removal reason collected in its own sheet, kept in the mod log */}
      {removeTarget && (
        <>
          <div onClick={() => { setRemoveTarget(null); setRemoveReason(""); }} style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140 }} />
          <div style={{ position: "fixed", left: 20, right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 141, maxWidth: 440, margin: "0 auto", background: "var(--paper)", borderRadius: 18, padding: 16, boxShadow: "var(--shadow-2)" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Remove @{removeTarget}</span>
              <button type="button" onClick={() => { setRemoveTarget(null); setRemoveReason(""); }} aria-label="Close" style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ink-mute)", marginBottom: 12, lineHeight: 1.5 }}>Give a reason — it helps the member understand why they were removed, and is kept in the moderation log.</div>
            <textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value.slice(0, 300))}
              rows={4}
              autoFocus
              placeholder="e.g. Repeated rule violations, spam, off-platform trade dispute…"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", resize: "vertical" }}
            />
            <div style={{ fontSize: 11, color: "var(--ink-faint)", textAlign: "right", margin: "5px 0 16px" }}>{removeReason.length}/300</div>
            <button type="button" onClick={confirmRemove} disabled={!removeReason.trim() || busy === removeTarget} style={{ width: "100%", height: 46, borderRadius: 13, border: "none", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, cursor: removeReason.trim() ? "pointer" : "default", opacity: removeReason.trim() ? 1 : 0.5 }}>Remove member</button>
          </div>
        </>
      )}
      {/* v8 :86 EditCommunitySheet — rename / photos / description / rules in a sheet. */}
      {editOpen && (
        <EditCommunitySheet
          community={community}
          name={name}
          desc={desc}
          rulesText={rulesText}
          detailsError={detailsError}
          saving={savingDetails}
          onNameChange={(v) => { setName(v); setDetailsError(null); }}
          onDescChange={setDesc}
          onRulesChange={setRulesText}
          onSave={saveDetails}
          onClose={() => setEditOpen(false)}
          onPhotoUploaded={savePhoto}
        />
      )}
      {/* v8 :87 CloseCommunitySheet — close (hide + freeze) or permanently delete. */}
      {closeOpen && <CloseCommunitySheet community={community} onClose={() => setCloseOpen(false)} />}
      {/* v8 :330-341 — leave confirm, centred modal card. */}
      {leaveStep === "confirm" && (
        <>
          <button type="button" aria-label="Cancel" onClick={() => setLeaveStep(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(20,17,15,0.4)", zIndex: 140, border: "none", cursor: "default" }} />
          <div style={{
            position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 141,
            width: "min(calc(100% - 40px), 380px)", background: "var(--paper)", borderRadius: 18, padding: 20,
            boxShadow: "var(--shadow-2)", boxSizing: "border-box",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Leave {community.name}?</div>
            {/* Gated-rejoin copy (ours — joins queue for approval), matching the detail page. */}
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 6 }}>
              You can ask to rejoin anytime, but you&rsquo;ll lose your role and any unread activity here.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" style={{ flex: 1, justifyContent: "center" }} disabled={leaveBusy} onClick={doLeave}>Leave</Button>
            </div>
          </div>
        </>
      )}
      {/* v8 :343-378 — the last full admin hands the community over before leaving. */}
      {leaveStep === "promote" && (
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
              {otherMembers.map((m) => {
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
                    {memberRoleChip(m.role)}
                    {on && <Check size={16} style={{ color: "var(--ink)", flexShrink: 0 }} />}
                  </button>
                );
              })}
              {otherMembers.length === 0 && <EmptyNote>No other members to promote.</EmptyNote>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveStep(null)}>Cancel</Button>
              <Button variant="destructive" disabled={!succHandle || leaveBusy} style={{ flex: 1, justifyContent: "center", opacity: succHandle ? 1 : 0.5 }} onClick={promoteAndLeave}>
                Promote &amp; leave
              </Button>
            </div>
          </div>
        </>
      )}
      {/* v8 :379-390 — sole member: nothing to hand over, point at close/delete. */}
      {leaveStep === "sole" && (
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
              There&rsquo;s no one to hand this community to. Close or delete it below instead if you&rsquo;re done with it.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Button variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setLeaveStep(null)}>Got it</Button>
            </div>
          </div>
        </>
      )}
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* A history POP, not a push — the old Link href={detail} stacked a fresh
              detail entry, so detail's own back then returned HERE (a loop). */}
          <BackButton fallback={`/community/${id}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Manage community</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{community.name}</div>
          </div>
        </div>
      </div>

      {/* #31 (v8 :113-120) — a pending community still lets its admin edit details,
          but nothing else moves until the platform approves it. */}
      {community.status === "pending" && (
        <div style={{ margin: "14px 20px 0", display: "flex", gap: 9, alignItems: "flex-start", padding: 13, background: "var(--grail-gold-soft)", border: "1px solid var(--grail-gold)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          <Clock size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--grail-gold-deep)" }} />
          <div>This community is awaiting platform review — no member or post activity yet. You can still edit its details below.</div>
        </div>
      )}

      {/* #32 (v8 :124-126) — the stat tiles jump to their segment. */}
      <div style={{ display: "flex", gap: 10, padding: "14px 20px 4px" }}>
        <Stat n={community.member_count} label="Members" accent="var(--ink)" onClick={() => setTab("members")} />
        <Stat n={requests.length} label="Requests" accent={requests.length ? "var(--stamp-red)" : "var(--ink-mute)"} onClick={() => setTab("requests")} />
        <Stat n={pending.length} label="To review" accent={pending.length ? "var(--grail-gold-deep)" : "var(--ink-mute)"} onClick={() => setTab("posts")} />
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
                  <div style={{ padding: "10px 13px 0" }}>
                    {/* #35 (v8 :187) — the queue card leads with the post title when present. */}
                    {p.title && <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{p.title}</div>}
                    <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55 }}>{p.body}</div>
                  </div>
                  {p.images.length > 0 && (
                    <div style={{ padding: "10px 13px 0" }}><PostImages images={p.images} /></div>
                  )}
                  {decliningId === p.id ? (
                    /* #36 (v8 :193-202) — the decline reason collector, inline on the card.
                       stopPropagation everywhere: the card itself click-throughs to the post. */
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                      style={{ padding: "10px 13px 13px", cursor: "default" }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--stamp-red-deep)", marginBottom: 7 }}>Decline this post — why?</div>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value.slice(0, 200))}
                        rows={2}
                        autoFocus
                        placeholder="e.g. Off-topic, breaks community rules…"
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--paper)", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none" }}
                      />
                      <div style={{ display: "flex", gap: 9, marginTop: 9 }}>
                        <button onClick={() => { setDecliningId(null); setDeclineReason(""); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 34, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bone)", color: "var(--ink-soft)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        <button onClick={() => confirmDecline(p)} disabled={busy === p.id || !declineReason.trim()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 34, borderRadius: 9, border: "1px solid var(--stamp-red)", background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: declineReason.trim() ? "pointer" : "default", opacity: declineReason.trim() ? 1 : 0.5 }}>Confirm decline</button>
                      </div>
                    </div>
                  ) : (
                    /* v8 Button sm pair — Decline is the bone secondary with red ink; Approve is dark with the check. */
                    <div style={{ display: "flex", gap: 9, padding: "12px 13px 13px" }}>
                      <button onClick={(e) => { e.stopPropagation(); setDecliningId(p.id); setDeclineReason(""); }} disabled={busy === p.id} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 34, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--bone)", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Decline</button>
                      <button onClick={(e) => { e.stopPropagation(); approvePost(p.id); }} disabled={busy === p.id} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 34, borderRadius: 9, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}><Check size={15} />Approve</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <EmptyNote>Nothing waiting for review. {posting === "open" ? "Posts publish instantly here." : ""}</EmptyNote>
        )}

        {tab === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => {
              // v8 :253 canEdit — any full admin edits everyone but themselves;
              // the founder's row stays untouchable (server enforces it too).
              const canEdit = isAdmin && m.role !== "founder" && m.handle !== user?.handle;
              const isOpen = expandedMember === m.handle;
              return (
                <div key={m.handle} style={{ display: "flex", flexDirection: "column", gap: 9, padding: 10, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link href={`/profile/${m.handle}`} style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                      <Avatar name={m.name} photo={m.avatar_url} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>@{m.handle}</div>
                      </div>
                    </Link>
                    {memberRoleChip(m.role)}
                    {/* v8 :267 — controls hide behind a 28×28 pencil (ink-filled while open) */}
                    {canEdit && (
                      <button type="button" onClick={() => setExpandedMember(isOpen ? null : m.handle)} aria-label="Edit member" style={{
                        width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-strong)",
                        background: isOpen ? "var(--ink)" : "var(--paper)", color: isOpen ? "var(--paper)" : "var(--ink-mute)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                  {/* v8 :272-289 — expanded: ROLE segmented Member|Mod|Admin (changes confirm
                      first) + red-outline Remove, both 32px controls. */}
                  {canEdit && isOpen && (
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 6 }}>Role</div>
                        <div style={{ display: "inline-flex", border: "1px solid var(--border-strong)", borderRadius: 9, overflow: "hidden" }}>
                          {([{ id: "member", label: "Member" }, { id: "mod", label: "Mod" }, { id: "admin", label: "Admin" }] as const).map((r, i) => {
                            const on = m.role === r.id;
                            return (
                              <button key={r.id} type="button" disabled={busy === m.handle}
                                onClick={() => { if (!on) setRoleChange({ handle: m.handle, role: r.id, label: r.label }); }}
                                style={{
                                  ...pillBase, border: "none", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none",
                                  background: on ? "var(--ink)" : "var(--paper)", color: on ? "var(--paper)" : "var(--ink-soft)",
                                }}>{r.label}</button>
                            );
                          })}
                        </div>
                      </div>
                      <button type="button" onClick={() => { setRemoveTarget(m.handle); setRemoveReason(""); }} disabled={busy === m.handle} style={{
                        ...pillBase, borderRadius: 9, border: "1px solid var(--stamp-red)", background: "var(--paper)", color: "var(--stamp-red)",
                      }}>Remove member</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* v8 :324-328 — a NON-admin mod has no Settings tab, so their exit sits at
            the foot of Members instead (admins leave from Settings). */}
        {tab === "members" && !isAdmin && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <Button variant="secondary" size="block" icon={<X size={16} strokeWidth={2.4} />} onClick={openLeaveFlow}>Leave community</Button>
          </div>
        )}

        {/* SETTINGS — the full editor, admin only (DV8-14). */}
        {tab === "settings" && isAdmin && (
          <div>
            {/* ⚖ CLOSED state — reopen is our addition: v8's close had no way back short
                of delete, but our status column makes the undo cheap, so we surface it. */}
            {community.status === "closed" && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 13, background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                  <X size={15} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 1, color: "var(--ink-mute)" }} />
                  <div>This community is closed — hidden from discovery and posting is frozen. Members keep read access.</div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button variant="primary" size="block" disabled={reopening} onClick={reopenCommunity}>
                    {reopening ? "Reopening…" : "Reopen community"}
                  </Button>
                </div>
              </div>
            )}

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

            {/* v8 :311-314 — details editing lives behind ONE door into the sheet. */}
            <SectionLabel>Community details</SectionLabel>
            <div style={{ margin: "11px 0 14px" }}>
              <Button variant="secondary" size="block" icon={<Pencil size={16} />} onClick={openEdit}>Rename, photos &amp; rules</Button>
            </div>

            {/* v8 :316-321 — destructive foot: close/delete behind the red-outline door,
                then the admin's own exit. */}
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
              <Button variant="secondary" size="block" style={{ color: "var(--stamp-red)", borderColor: "var(--stamp-red)" }} icon={<X size={16} strokeWidth={2.4} />} onClick={() => setCloseOpen(true)}>
                Close or delete community
              </Button>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" size="block" icon={<X size={16} strokeWidth={2.4} />} onClick={openLeaveFlow}>Leave community</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Overlay sheet chrome (v8 OverlayShell) ─────────────────────────────────
   Dim backdrop + paper panel: full-height sheet on mobile, centred ~560 card on
   desktop. Header row = display title · optional trailing action · X close. */
function SheetShell({ title, trailing, onClose, children }: {
  title: string;
  trailing?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 140 }}>
      <div role="presentation" className="absolute inset-0" style={{ background: "rgba(20,17,15,0.4)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-[560px] bg-[var(--paper)] sm:rounded-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh]" style={{ boxShadow: "var(--shadow-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          {trailing}
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--ink-mute)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1" style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

/* R2 presign response — same contract EditProfileSheet / ImageUploader use. */
interface UploadUrlResponse { upload_url: string; public_url: string }

/* v8 EditCommunitySheet (:397-446) — rename / photos / description / rules.
   Draft state lives on the page (so the dup-name 409 highlights the field);
   photos persist as soon as they upload, text persists on Save. */
function EditCommunitySheet({
  community, name, desc, rulesText, detailsError, saving,
  onNameChange, onDescChange, onRulesChange, onSave, onClose, onPhotoUploaded,
}: {
  community: CommunityDetail;
  name: string;
  desc: string;
  rulesText: string;
  detailsError: string | null;
  saving: boolean;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onRulesChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  onPhotoUploaded: (field: "banner_url" | "avatar_url", url: string) => Promise<void>;
}) {
  const bannerRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"banner_url" | "avatar_url" | null>(null);
  const rulesChars = rulesText.length;
  const banner = community.banner_url;
  const photo = community.avatar_url;

  // Same presign → PUT → PATCH flow as EditProfileSheet (grep /media/upload-url);
  // the photo persists immediately via the page's savePhoto, exactly as before.
  const pickImg = async (e: React.ChangeEvent<HTMLInputElement>, field: "banner_url" | "avatar_url") => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !file.type.startsWith("image/") || uploading) return;
    setUploading(field);
    try {
      const meta = await api.post<UploadUrlResponse>(
        `/media/upload-url?prefix=uploads&content_type=${encodeURIComponent(file.type)}`
      );
      const res = await fetch(meta.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error(`Storage rejected the upload (HTTP ${res.status})`);
      await onPhotoUploaded(field, meta.public_url);
    } catch (err) {
      fireToast(err instanceof Error && err.message ? err.message : "Upload failed — try again");
    } finally {
      setUploading(null);
    }
  };

  return (
    <SheetShell
      title="Edit community"
      onClose={onClose}
      trailing={<Button size="sm" variant="primary" disabled={saving} onClick={onSave}>{saving ? "Saving…" : "Save"}</Button>}
    >
      <SectionLabel>Photos</SectionLabel>
      {/* v8 :425-436 — banner block with the square photo button overlapping its
          bottom-left corner (hence the 30px bottom margin). */}
      <div style={{ position: "relative", margin: "10px 0 30px" }}>
        <div style={{ position: "relative", height: 92, borderRadius: 13, overflow: "hidden", background: banner ? `center/cover url(${banner})` : "var(--bone)", border: "1px solid var(--border-strong)" }}>
          <input ref={bannerRef} type="file" accept="image/*" hidden onChange={(e) => pickImg(e, "banner_url")} />
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={uploading !== null}
            style={{ position: "absolute", inset: 0, width: "100%", border: "none", background: banner ? "rgba(20,17,15,0.28)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: banner ? "#fff" : "var(--ink-mute)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5 }}
          >
            <ImageIcon size={16} />
            {uploading === "banner_url" ? "Uploading…" : banner ? "Change banner" : "Add a banner image"}
          </button>
        </div>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => pickImg(e, "avatar_url")} />
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          disabled={uploading !== null}
          aria-label={photo ? "Change photo" : "Add a photo"}
          style={{ position: "absolute", left: 14, bottom: -26, width: 60, height: 60, borderRadius: 16, border: "3px solid var(--paper)", cursor: "pointer", background: photo ? `center/cover url(${photo})` : "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", opacity: uploading === "avatar_url" ? 0.6 : 1 }}
        >
          {!photo && <Camera size={18} />}
        </button>
      </div>

      <SectionLabel>Community name</SectionLabel>
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", height: 46, padding: "0 13px", borderRadius: 11, border: `1px solid ${detailsError ? "var(--stamp-red)" : "var(--border-strong)"}`, background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", outline: "none", margin: detailsError ? "10px 0 0" : "10px 0 20px" }}
      />
      {/* A 409 duplicate-name comes back as the error detail — shown inline by the field. */}
      {detailsError && <div style={{ fontSize: 12.5, color: "var(--stamp-red)", margin: "6px 0 20px" }}>{detailsError}</div>}

      <SectionLabel>Description</SectionLabel>
      <textarea
        value={desc}
        onChange={(e) => onDescChange(e.target.value.slice(0, 140))}
        rows={2}
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none", resize: "none", margin: "10px 0 20px" }}
      />

      <SectionLabel>Community rules</SectionLabel>
      {/* #39 — the budget counts RAW characters (newlines included) and the field
          hard-slices at the cap, exactly like community/new. */}
      <textarea
        value={rulesText}
        onChange={(e) => onRulesChange(e.target.value.slice(0, RULES_TOTAL_MAX_CHARS))}
        rows={7}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 11, border: `1px solid ${rulesChars >= RULES_TOTAL_MAX_CHARS ? "var(--stamp-red)" : "var(--border-strong)"}`, background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)", outline: "none", resize: "vertical", margin: "10px 0 4px" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: rulesChars >= RULES_TOTAL_MAX_CHARS ? "var(--stamp-red)" : "var(--ink-faint)", lineHeight: 1.5 }}>
        <span>One rule per line.</span>
        <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)" }}>{rulesChars}/{RULES_TOTAL_MAX_CHARS}</span>
      </div>
    </SheetShell>
  );
}

/* v8 CloseCommunitySheet (:450-480) — close (hide from discovery + freeze posting,
   members keep read access) or permanently delete; delete re-confirms by typing
   the community's name. Both land back on the community index. */
function CloseCommunitySheet({ community, onClose }: { community: CommunityDetail; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"close" | "delete">("close");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = mode === "close" || confirmText.trim().toLowerCase() === community.name.trim().toLowerCase();

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      if (mode === "close") {
        await api.post(`/communities/${community.id}/close`);
        fireToast(`${community.name} closed — hidden from discovery`);
      } else {
        await api.delete(`/communities/${community.id}`);
        fireToast(`${community.name} deleted`);
      }
      router.push("/community");
    } catch (e) {
      setBusy(false);
      fireToast(e instanceof Error && e.message ? e.message : "Something went wrong — try again");
    }
  };

  return (
    <SheetShell title="Close or delete community" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        <RadioRow title="Close community" sub="Hides it from discovery and freezes posting — members keep read access" on={mode === "close"} onClick={() => setMode("close")} />
        <RadioRow title="Delete permanently" sub="Removes all posts, members and history. Cannot be undone." on={mode === "delete"} onClick={() => setMode("delete")} />
      </div>
      {mode === "delete" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginBottom: 8 }}>Type <b style={{ color: "var(--ink)" }}>{community.name}</b> to confirm.</div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={community.name}
            autoFocus
            style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid var(--stamp-red)", background: "var(--paper-soft)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", outline: "none" }}
          />
        </div>
      )}
      {/* v8 :475 — the CTA stays clickable but sits at half opacity until ready. */}
      <Button size="block" variant="primary" disabled={busy} style={{ opacity: ready && !busy ? 1 : 0.5 }} onClick={submit}>
        {busy ? (mode === "close" ? "Closing…" : "Deleting…") : mode === "close" ? "Close community" : "Permanently delete"}
      </Button>
    </SheetShell>
  );
}
