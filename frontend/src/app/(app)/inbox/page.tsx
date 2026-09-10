"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { BackButton } from "@/components/BackButton";

interface ThreadUser {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  rating: number;
}

interface ThreadListing {
  id: string;
  title: string;
  price: number;
  status: string;
  // v8 Chat.jsx:24-25 — catalogue vs non-catalogue drives the "re:" line's font.
  // GET /threads doesn't serialize this yet (backend-owned); optional until it lands.
  sku?: string | null;
}

interface Thread {
  id: string;
  other_user: ThreadUser | null;
  listing: ThreadListing | null;
  last_message: string | null;
  last_message_at: string;
  unread: number;
}

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Thread[]>("/threads")
      .then((data) => setThreads(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Realtime: any incoming DM (or a reconnect after being offline) re-pulls the
  // thread list so ordering, previews and unread counts stay current.
  useRealtime((e) => {
    if (e.event === "message.new" || e.event === "reconnect") {
      api.get<Thread[]>("/threads").then((data) => setThreads(data ?? [])).catch(() => {});
    }
  });

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      {/* v8 InboxView is a PUSHED screen (Chat.jsx:9, DetailHeader "Messages") — the
          sticky header carries a back affordance (DV8 §10#1); no unread sub, no action.
          BottomNav stays visible on mobile (deliberate — /inbox keeps its tabs). */}
      <div className="sticky top-0 z-10 flex items-center gap-2.5 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "12px 20px" }}>
        <BackButton fallback="/feed" />
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.025em", margin: 0 }}>Messages</h1>
      </div>

      <div style={{ paddingBottom: 24 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "13px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bone)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "50%", height: 12, borderRadius: 6, background: "var(--bone)", marginBottom: 8 }} />
                  <div style={{ width: "80%", height: 10, borderRadius: 6, background: "var(--bone)" }} />
                </div>
              </div>
            ))
          : threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/chat/${thread.id}`}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textDecoration: "none", borderBottom: "1px solid var(--border)", padding: "13px 20px" }}
              >
                <Avatar name={thread.other_user?.name ?? "?"} photo={thread.other_user?.avatar_url} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.other_user?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-faint)", flexShrink: 0 }}>{timeAgo(thread.last_message_at)}</span>
                  </div>
                  {/* v8 (Chat.jsx:24-25) — catalogue rows keep the body font; a
                      NON-catalogue listing (sku === null) renders its custom title in
                      mono. Strict null check: while GET /threads omits `sku`, rows
                      stay body-font instead of mono-ing everything (DV8 §10#3). */}
                  {thread.listing && (
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(thread.listing.sku === null ? { fontFamily: "var(--font-mono)" } : null) }}>
                      re: {thread.listing.title}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: thread.unread > 0 ? "var(--ink)" : "var(--ink-faint)", fontWeight: thread.unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {thread.last_message ?? "No messages yet"}
                  </div>
                </div>
                {/* v8 — 20px red unread pill at the row's far right. */}
                {thread.unread > 0 && (
                  <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {thread.unread}
                  </span>
                )}
              </Link>
            ))}

        {!loading && threads.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-faint)", fontSize: 14 }}>
            No messages yet. Find something you like on the market and message the seller.
          </div>
        )}
      </div>
    </div>
  );
}
