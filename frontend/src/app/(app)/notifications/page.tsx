"use client";

// Notifications — design feedback round 1 (DF-13):
// Messages moved out (header/sidebar Messages entry). 5 category cards —
// Likes · Follows · Replies · Vouch (renamed from Trust) · Other (catch-all) —
// tapping one filters the activity list below; Clear resets.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell, MessageCircle, Repeat2, Shield, UserPlus, Heart,
  Calendar, Clock, LayoutGrid,
} from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo, cn } from "@/lib/utils";

interface ApiNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  ref_type: string | null;
  ref_id: string | null;
  is_read: boolean;
  created_at: string;
}

type NotifMeta = { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string };

const KIND_META: Record<string, NotifMeta> = {
  wishlist:  { icon: Bell,           color: "var(--verified-teal)" },
  deal:      { icon: Repeat2,        color: "var(--stamp-red)" },
  vouch:     { icon: Shield,         color: "var(--forest)" },
  follow:    { icon: UserPlus,       color: "var(--plum)" },
  like:      { icon: Heart,          color: "var(--stamp-red)" },
  comment:   { icon: MessageCircle,  color: "var(--plum)" },
  community: { icon: Bell,           color: "var(--ink-mute)" },
  event:     { icon: Calendar,       color: "var(--plum)" },
  preorder:  { icon: Clock,          color: "var(--grail-gold-deep)" },
};

// Backend kinds carry suffixes (wishlist_match, preorder_reminder_7d, …) —
// match on the leading token so the icon/colour resolve correctly.
function metaFor(kind: string): NotifMeta {
  if (kind.startsWith("wishlist")) return KIND_META.wishlist;
  if (kind.startsWith("preorder")) return KIND_META.preorder;
  return KIND_META[kind] ?? KIND_META.community;
}

// 5 categories (DF-13): 4 typed + "Other" catch-all so nothing falls through.
const CATEGORIES = [
  { id: "likes",   label: "Likes",   icon: Heart,         color: "var(--stamp-red)" },
  { id: "follows", label: "Follows", icon: UserPlus,      color: "var(--plum)" },
  { id: "replies", label: "Replies", icon: MessageCircle, color: "var(--plum)" },
  { id: "vouch",   label: "Vouch",   icon: Shield,        color: "var(--forest)" },
  { id: "other",   label: "Other",   icon: LayoutGrid,    color: "var(--ink-mute)" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

function categoryOf(kind: string): CategoryId {
  if (kind === "like") return "likes";
  if (kind === "follow") return "follows";
  if (kind === "comment") return "replies";
  if (kind === "vouch") return "vouch";
  return "other"; // deal, wishlist*, event, preorder*, community, …
}

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiNotification[]>("/notifications?limit=50")
      .then((n) => setNotifications(n ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  const markAllRead = () => {
    api.patch("/notifications/read-all").catch(console.error);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = (id: string) => {
    api.patch(`/notifications/${id}/read`).catch(console.error);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.025em", margin: 0 }}>Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--stamp-red)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* category cards (DF-13) */}
      <div className="grid grid-cols-5 gap-2" style={{ padding: "14px 20px 4px" }}>
        {CATEGORIES.map((c) => {
          const on = selected === c.id;
          const count = unreadByCategory[c.id];
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(on ? null : c.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-[13px] border py-3 px-1 cursor-pointer transition-colors",
                on
                  ? "border-[var(--ink)] bg-[var(--bone)]"
                  : "border-[var(--border)] bg-[var(--paper-soft)] hover:border-[var(--ink-ghost)]"
              )}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--bone)", color: c.color }}
              >
                <Icon size={18} />
              </span>
              <span className="text-[11.5px] font-semibold text-[var(--ink)]">{c.label}</span>
              {count > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--stamp-red)] text-white text-[10px] font-bold font-mono flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* filter state row */}
      {selected && (
        <div className="flex items-center justify-between" style={{ padding: "10px 20px 0" }}>
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            {CATEGORIES.find((c) => c.id === selected)?.label}
          </span>
          <button
            onClick={() => setSelected(null)}
            className="text-[12.5px] font-semibold text-[var(--stamp-red)] bg-transparent border-none cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

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
                const m = metaFor(n.kind);
                return (
                  <Link
                    key={n.id}
                    href={refHref(n.ref_type, n.ref_id)}
                    onClick={() => markRead(n.id)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textDecoration: "none", borderBottom: "1px solid var(--border)", padding: "13px 0" }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--bone)", color: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <m.icon size={20} />
                      </div>
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 19, height: 19, borderRadius: "50%", background: m.color, color: "var(--paper)", border: "2px solid var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <m.icon size={10} />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                      <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.45 }}>
                        <b style={{ color: "var(--ink)", fontWeight: 600 }}>{n.title} </b>
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
  );
}
