"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Share2, Shield, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ApiPost } from "@/components/cards";
import { Avatar, Segmented, SectionLabel, EmptyNote } from "@/components/ui";
import { PostCard } from "@/components/cards";

interface CommunityAdmin {
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
  member_count: number;
  post_count: number;
  post_mode: string;
  rules: string[];
  is_invite_only: boolean;
  is_member: boolean;
  member_role: string | null;
  admins: CommunityAdmin[];
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [tab, setTab] = useState<"posts" | "about">("posts");
  const [joined, setJoined] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);

  async function toggleJoin() {
    if (!community || joinBusy) return;
    const next = !joined;
    setJoined(next);             // optimistic
    setJoinBusy(true);
    setCommunity((c) => c ? { ...c, member_count: c.member_count + (next ? 1 : -1) } : c);
    try {
      if (next) await api.post(`/communities/${community.id}/join`);
      else await api.delete(`/communities/${community.id}/join`);
    } catch {
      setJoined(!next);          // revert
      setCommunity((c) => c ? { ...c, member_count: c.member_count + (next ? -1 : 1) } : c);
    } finally {
      setJoinBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/community/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: community?.name ?? "CollectorHub", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1600); }
    } catch { /* cancelled */ }
  }

  useEffect(() => {
    Promise.all([
      api.get<CommunityDetail>(`/communities/${id}`),
      api.get<ApiPost[]>(`/communities/${id}/posts?limit=10`),
    ])
      .then(([c, p]) => {
        setCommunity(c);
        setJoined(c.is_member);
        setAccepted(c.is_member);
        setPosts(p ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
  const founder = community.admins.find((a) => a.role === "founder");

  return (
    <div className="w-full max-w-[680px] flex flex-col pb-8">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/community" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: "var(--ink)" }}>
            <ArrowLeft size={18} />
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", flex: 1 }}>Community</span>
          <button onClick={share} title={shared ? "Link copied" : "Share"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", color: shared ? "var(--stamp-red)" : "var(--ink)", background: "none", cursor: "pointer" }}>
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {/* Banner */}
      <div style={{ height: 132, background: tone, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.18), transparent 55%)" }} />
        <div style={{ position: "absolute", right: -20, bottom: -30, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 150, color: "rgba(255,255,255,0.12)", lineHeight: 1 }}>
          {community.tag ?? "🏷"}
        </div>
      </div>

      {/* Identity row */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: -34 }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: tone, color: "var(--paper)", border: "3px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, flexShrink: 0 }}>
            {community.tag ?? "🏷"}
          </div>
          <div style={{ flex: 1, paddingBottom: 4, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={toggleJoin} disabled={joinBusy} style={{ height: 36, padding: "0 18px", borderRadius: 10, border: `1px solid ${joined ? "var(--border-strong)" : "var(--ink)"}`, background: joined ? "var(--bone)" : "var(--ink)", color: joined ? "var(--ink)" : "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, cursor: joinBusy ? "default" : "pointer" }}>
              {joined ? "Joined" : "Join"}
            </button>
          </div>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, letterSpacing: "-0.025em", margin: "12px 0 4px" }}>{community.name}</h1>
        <div style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>{community.description}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 10, fontSize: 12.5, color: "var(--ink-faint)" }}>
          <span><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{community.member_count.toLocaleString("en-IN")}</b> members</span>
          <span><b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{community.post_count.toLocaleString("en-IN")}</b> posts</span>
          {founder && (
            <span>
              founded by{" "}
              <Link href={`/profile/${founder.handle}`} style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "none" }}>
                @{founder.handle}
              </Link>
            </span>
          )}
        </div>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 10px", borderRadius: 999,
            background: approval ? "var(--grail-gold-soft)" : "var(--forest-soft)",
            border: `1px solid ${approval ? "var(--grail-gold)" : "var(--forest)"}`,
          }}
        >
          {approval ? <Shield size={13} style={{ color: "var(--grail-gold-deep)" }} /> : <CheckCircle2 size={13} style={{ color: "var(--forest)" }} />}
          <span style={{ fontSize: 11.5, fontWeight: 600, color: approval ? "var(--grail-gold-deep)" : "var(--forest)" }}>
            {approval ? "Approval to post" : "Open posting"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "sticky", top: 56, zIndex: 9, background: "var(--paper)", padding: "16px 20px 10px", marginTop: 14, borderBottom: "1px solid var(--border)" }}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as "posts" | "about")}
          options={[{ id: "posts", label: "Posts" }, { id: "about", label: "Rules & info" }]}
        />
      </div>

      {tab === "posts" ? (
        <div>
          {joined && !accepted && (
            <div style={{ margin: "14px 20px 4px", background: "var(--bone)", border: "1px solid var(--border)", borderRadius: 13, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Shield size={17} style={{ color: "var(--ink-mute)" }} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Read the guidelines before posting</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", lineHeight: 1.5, margin: "7px 0 12px" }}>
                {community.name} asks every member to accept its house rules before their first post.
              </div>
              <div style={{ display: "flex", gap: 9 }}>
                <button onClick={() => setTab("about")} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>View rules</button>
                <button onClick={() => setAccepted(true)} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "none", background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Accept & continue</button>
              </div>
            </div>
          )}
          {joined && accepted && (
            <Link href={`/compose?community=${community.id}`} style={{ display: "flex", alignItems: "center", gap: 10, width: "calc(100% - 40px)", margin: "14px 20px 4px", background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px", cursor: "pointer", textAlign: "left", textDecoration: "none" }}>
              <Avatar name="You" size={30} />
              <span style={{ fontSize: 14, color: "var(--ink-faint)" }}>
                {approval ? `Suggest a post to ${community.name} — mods review first` : `Share something with ${community.name}…`}
              </span>
            </Link>
          )}
          <div style={{ marginTop: 8 }}>
            {posts.length > 0
              ? posts.map((p) => <PostCard key={p.id} post={p} />)
              : <EmptyNote>Quiet so far — be the first to post.</EmptyNote>}
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px 20px" }}>
          <SectionLabel>Community rules</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {(community.rules.length > 0 ? community.rules : ["Be respectful and constructive.", "Stay on topic.", "No spam or excessive self-promotion."]).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bone)", color: "var(--ink-mute)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, paddingTop: 1 }}>{r}</div>
              </div>
            ))}
          </div>

          {joined && !accepted && (
            <button onClick={() => { setAccepted(true); setTab("posts"); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 48, marginTop: 16, borderRadius: 13, background: "var(--stamp-red)", color: "var(--paper)", border: "none", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Accept guidelines
            </button>
          )}
          {accepted && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: "var(--forest)", fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={16} />You&rsquo;ve accepted these guidelines.
            </div>
          )}

          <div style={{ marginTop: 24 }}><SectionLabel>Admins & mods</SectionLabel></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {community.admins.map((a) => (
              <Link key={a.handle} href={`/profile/${a.handle}`} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, background: "var(--paper-soft)", border: "1px solid var(--border)", borderRadius: 13, textDecoration: "none" }}>
                <Avatar name={a.name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{a.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>@{a.handle}</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 7, background: a.role === "founder" ? "var(--ink)" : "var(--bone-deep)", color: a.role === "founder" ? "var(--paper)" : "var(--ink-mute)", fontWeight: 700 }}>
                  {a.role}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
