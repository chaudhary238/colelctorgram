"use client";

// Activity — design feedback round 1 (DF-13), v3 restyle (M19 DF-32), v7 merge (DV7-05).
//
// DV7-05: Messages moved back IN. The header now has one bell for one combined inbox,
// and this screen splits it with two segments — Activity (the notification feed, 5
// category cards: Likes · Follows · Replies · Vouch · Other) and DMs (the thread list
// that /inbox renders). Both lists stay MOUNTED and toggle with `display`, so switching
// segments preserves scroll position and the read state each list arrived with.
//
// v3 SQUARE icon-only tiles fill with the category colour when active; tapping one
// filters the activity list below. Rows show the ACTOR avatar + @handle when the
// notification was user-triggered, else the category icon.
// v3 marks all read on OPEN (no button) — the bell badge clears on visit.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Shield, UserPlus, Heart, LayoutGrid, X } from "lucide-react";
import { Avatar, CategoryChip, Money } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

// Thread shape from GET /threads — same rows /inbox renders (DV7-05).
interface Thread {
  id: string;
  other_user: { id: string; handle: string | null; name: string | null; avatar_url: string | null } | null;
  listing: { id: string; title: string; price: number; status: string } | null;
  last_message: string | null;
  last_message_at: string;
  unread: number;
}

interface ApiNotification {
  id: string;
  kind: string;
  body: string | null;
  actor: { handle: string; name: string; avatar_url: string | null } | null;
  ref_type: string | null;
  ref_id: string | null;
  is_read: boolean;
  created_at: string;
}

// 5 categories (DF-13): 4 typed + "Other" catch-all so nothing falls through.
// Colours/icons match v3 NOTIF_CATS (DF-32): the category drives both the card
// tile AND each row's kind badge (v3 has no richer per-kind icon set).
const CATEGORIES = [
  { id: "likes",   label: "Likes",   icon: Heart,         color: "var(--stamp-red)" },
  { id: "follows", label: "Follows", icon: UserPlus,      color: "var(--plum)" },
  { id: "replies", label: "Replies", icon: MessageCircle, color: "var(--verified-teal)" },
  { id: "vouch",   label: "Vouch",   icon: Shield,        color: "var(--forest)" },
  { id: "other",   label: "Other",   icon: LayoutGrid,    color: "var(--grail-gold-deep)" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

function categoryOf(kind: string): CategoryId {
  if (kind === "like") return "likes";
  if (kind === "follow") return "follows";
  if (kind === "comment") return "replies";
  if (kind === "vouch") return "vouch";
  return "other"; // deal, wishlist*, event, preorder*, community, …
}

const catMeta = (kind: string) => CATEGORIES.find((c) => c.id === categoryOf(kind))!;

function refHref(refType: string | null, refId: string | null): string {
  if (!refType || !refId) return "#";
  switch (refType) {
    case "listing":   return `/listing/${refId}`;
    case "chat":      return `/chat/${refId}`;
    case "profile":   return `/profile/${refId}`;
    case "post":      return `/post/${refId}`;
    case "community": return `/community/${refId}`;
    case "event":     return `/events/${refId}`;
    default:          return "#";
  }
}

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [loading, setLoading] = useState(true);
  const [seg, setSeg] = useState<"activity" | "dms">("activity");
  const [threads, setThreads] = useState<Thread[] | null>(null);

  // v3: load the feed, then mark everything read on OPEN so the bell badge
  // clears. We keep each row's fetched is_read for THIS view so the unread
  // dots / category counts still reflect what was new when you arrived.
  useEffect(() => {
    api.get<ApiNotification[]>("/notifications?limit=50")
      .then((n) => setNotifications(n ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
    api.patch("/notifications/read-all").catch(console.error);
  }, []);

  // DMs load alongside, not on segment switch: the DMs count has to be right in the
  // segment label before you ever tap it. Threads keep their own unread — reading a
  // DM happens in the thread, so nothing is marked read here (DV7-05).
  useEffect(() => {
    api.get<Thread[]>("/threads").then((t) => setThreads(t ?? [])).catch(() => setThreads([]));
  }, []);

  const dmUnread = (threads ?? []).reduce((s, t) => s + (t.unread || 0), 0);
  const activityUnread = notifications.filter((n) => !n.is_read).length;

  const unreadByCategory = useMemo(() => {
    const counts: Record<CategoryId, number> = { likes: 0, follows: 0, replies: 0, vouch: 0, other: 0 };
    for (const n of notifications) {
      if (!n.is_read) counts[categoryOf(n.kind)]++;
    }
    return counts;
  }, [notifications]);

  const visible = useMemo(
    () => selected ? notifications.filter((n) => categoryOf(n.kind) === selected) : notifications,
    [notifications, selected]
  );

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--slate-200)]" style={{ padding: "12px 20px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.025em", margin: 0 }}>Activity</h1>
      </div>

      {/* DV7-05 segments — each label carries its own unread count */}
      <div style={{ display: "flex", gap: 7, padding: "12px 20px 0" }}>
        <CategoryChip active={seg === "activity"} onClick={() => setSeg("activity")}>
          Activity{activityUnread ? ` ${activityUnread}` : ""}
        </CategoryChip>
        <CategoryChip active={seg === "dms"} onClick={() => setSeg("dms")}>
          DMs{dmUnread ? ` ${dmUnread}` : ""}
        </CategoryChip>
      </div>

      {/* ── DMs ── kept mounted so switching back restores scroll (DV7-05) */}
      <div style={{ display: seg === "dms" ? "block" : "none", padding: "10px 0 24px" }}>
        {threads === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "13px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--bone)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "50%", height: 12, borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
                  <div style={{ width: "80%", height: 10, borderRadius: 6, background: "var(--bone)" }} />
                </div>
              </div>
            ))
          : threads.length === 0
            ? <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-faint)", fontSize: 14 }}>
                No messages yet. Find something you like on the market and message the seller.
              </div>
            : threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/chat/${t.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none", borderBottom: "1px solid var(--border)", padding: "13px 20px" }}
                >
                  <Avatar name={t.other_user?.name ?? "?"} photo={t.other_user?.avatar_url} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.other_user?.name ?? "Unknown"}
                    </div>
                    {t.listing && (
                      <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", margin: "2px 0" }}>
                        re: {t.listing.title.slice(0, 32)}{t.listing.title.length > 32 ? "…" : ""} · <Money value={Math.round(t.listing.price / 100)} />
                      </div>
                    )}
                    <div style={{ fontSize: 13, marginTop: 2, color: t.unread > 0 ? "var(--ink)" : "var(--ink-faint)", fontWeight: t.unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.last_message ?? "No messages yet"}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{timeAgo(t.last_message_at)}</div>
                    {t.unread > 0 && (
                      <div style={{ marginTop: 5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        {t.unread}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
      </div>

      {/* ── Activity ── */}
      <div style={{ display: seg === "activity" ? "block" : "none" }}>

      {/* category cards (DF-13) — v3 square icon-only tiles (DF-32) */}
      <div className="grid grid-cols-5 gap-2.5" style={{ padding: "14px 20px 12px" }}>
        {CATEGORIES.map((c) => {
          const on = selected === c.id;
          const count = unreadByCategory[c.id];
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(on ? null : c.id)}
              aria-label={c.label}
              title={c.label}
              style={{
                position: "relative", aspectRatio: "1 / 1", borderRadius: 15, cursor: "pointer",
                border: `1.5px solid ${on ? c.color : "var(--border)"}`,
                background: on ? c.color : "var(--paper-soft)",
                color: on ? "var(--paper)" : c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: on ? "none" : "var(--shadow-1)", transition: "all 130ms",
              }}
            >
              <Icon size={23} strokeWidth={2} />
              {count > 0 && (
                <span
                  style={{
                    position: "absolute", top: -6, right: -6, minWidth: 19, height: 19, padding: "0 5px",
                    borderRadius: 999, background: on ? "var(--paper)" : c.color, color: on ? c.color : "var(--paper)",
                    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--paper)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* activity divider (v3): always-on "All activity" / "Recent {label}" + inline Clear */}
      <div className="flex items-center" style={{ gap: 10, padding: "6px 20px 4px" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: selected ? CATEGORIES.find((c) => c.id === selected)!.color : "var(--ink-faint)",
          }}
        >
          {selected ? `Recent ${CATEGORIES.find((c) => c.id === selected)!.label}` : "All activity"}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-[12px] font-semibold text-[var(--ink-faint)] bg-transparent border-none cursor-pointer p-0"
          >
            <X size={13} strokeWidth={2.5} /> Clear
          </button>
        )}
      </div>

      <div style={{ padding: "10px 20px 24px" }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--bone)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "70%", height: 12, borderRadius: 6, background: "var(--bone)", marginBottom: 6 }} />
                  <div style={{ width: "40%", height: 10, borderRadius: 6, background: "var(--bone)" }} />
                </div>
              </div>
            ))
          : visible.length === 0
            ? <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-faint)" }}>
                {selected ? `No ${CATEGORIES.find((c) => c.id === selected)?.label.toLowerCase()} notifications yet.` : "No notifications yet."}
              </div>
            : visible.map((n) => {
                const m = catMeta(n.kind);
                const Badge = m.icon;
                return (
                  <Link
                    key={n.id}
                    href={refHref(n.ref_type, n.ref_id)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textDecoration: "none", borderBottom: "1px solid var(--border)", padding: "13px 0" }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {n.actor ? (
                        <Avatar name={n.actor.name} photo={n.actor.avatar_url} size={42} />
                      ) : (
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--bone)", color: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Badge size={20} />
                        </div>
                      )}
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 19, height: 19, borderRadius: "50%", background: m.color, color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Badge size={10} />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                      <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.45 }}>
                        {n.actor && <b style={{ color: "var(--ink)", fontWeight: 600 }}>@{n.actor.handle} </b>}
                        {n.body}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--stamp-red)", flexShrink: 0, marginTop: 6 }} />
                    )}
                  </Link>
                );
              })}
      </div>
      </div>
    </div>
  );
}
