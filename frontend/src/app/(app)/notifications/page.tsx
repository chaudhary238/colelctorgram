"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageCircle, Repeat2, Shield, UserPlus, Heart, Calendar, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui";

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

interface Thread {
  id: string;
  unread: number;
}

const KIND_META: Record<string, { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string }> = {
  wishlist:  { icon: Bell,         color: "var(--verified-teal)" },
  deal:      { icon: Repeat2,      color: "var(--stamp-red)" },
  vouch:     { icon: Shield,       color: "var(--forest)" },
  follow:    { icon: UserPlus,     color: "var(--plum)" },
  like:      { icon: Heart,        color: "var(--stamp-red)" },
  community: { icon: Bell,         color: "var(--ink-mute)" },
  event:     { icon: Calendar,     color: "var(--plum)" },
  preorder:  { icon: Clock,        color: "var(--grail-gold-deep)" },
};

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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ApiNotification[]>("/notifications?limit=50"),
      api.get<Thread[]>("/threads"),
    ])
      .then(([n, t]) => {
        setNotifications(n ?? []);
        setThreads(t ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

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

      <Link href="/inbox" style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 20px 4px", background: "var(--ink)", color: "var(--paper)", borderRadius: 13, padding: "12px 14px", textDecoration: "none" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(244,239,230,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MessageCircle size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Messages</div>
          <div style={{ fontSize: 12, color: "rgba(244,239,230,0.65)" }}>{threads.length} conversations · {totalUnread} unread</div>
        </div>
        {totalUnread > 0 && (
          <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {totalUnread}
          </span>
        )}
      </Link>

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
          : notifications.length === 0
            ? <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-faint)" }}>No notifications yet.</div>
            : notifications.map((n) => {
                const m = KIND_META[n.kind] ?? KIND_META.community;
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
