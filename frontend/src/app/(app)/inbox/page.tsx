"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Avatar, VerifyBadge, Money } from "@/components/ui";

interface ThreadUser {
  id: string;
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  tier: string;
  rating: number;
  deals_count: number;
}

interface ThreadListing {
  id: string;
  title: string;
  price: number;
  status: string;
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

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <div className="w-full max-w-[680px] flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.025em", margin: 0 }}>Messages</h1>
            {totalUnread > 0 && (
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 1 }}>{totalUnread} unread</div>
            )}
          </div>
          <button style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "transparent", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>
            New message
          </button>
        </div>
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
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={thread.other_user?.name ?? "?"} size={48} verified={thread.other_user?.tier === "top_seller"} />
                  {thread.unread > 0 && (
                    <span style={{ position: "absolute", bottom: -2, right: -2, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "var(--stamp-red)", color: "var(--paper)", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--paper)" }}>
                      {thread.unread}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{thread.other_user?.name ?? "Unknown"}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-faint)", marginLeft: "auto" }}>{timeAgo(thread.last_message_at)}</span>
                  </div>
                  {thread.listing && (
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-mono)", margin: "2px 0" }}>
                      re: {thread.listing.title.slice(0, 32)}{thread.listing.title.length > 32 ? "…" : ""} · <Money value={Math.round(thread.listing.price / 100)} />
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: thread.unread > 0 ? "var(--ink)" : "var(--ink-faint)", fontWeight: thread.unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {thread.last_message ?? "No messages yet"}
                  </div>
                </div>
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
