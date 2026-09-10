"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";

/**
 * Live unread counts for messages + notifications — refetched on route change
 * AND pushed via the realtime socket (message.new / notification.push), so the
 * badges move without navigation. Shared by the desktop Sidebar and the mobile
 * AppBar so both chrome surfaces show the same numbers (R-03).
 */
export function useUnread() {
  const pathname = usePathname();
  const [unread, setUnread] = useState<{ msgs: number; notifs: number }>({ msgs: 0, notifs: 0 });

  const refetch = useCallback(() => {
    Promise.all([
      api.get<{ unread: number }[]>("/threads").catch(() => []),
      api.get<{ is_read: boolean }[]>("/notifications").catch(() => []),
    ]).then(([threads, notifs]) => {
      setUnread({
        msgs: threads.reduce((s, t) => s + (t.unread || 0), 0),
        notifs: notifs.filter((n) => !n.is_read).length,
      });
    });
  }, []);

  useEffect(refetch, [pathname, refetch]);
  useRealtime((e) => {
    if (e.event === "message.new" || e.event === "notification.push" || e.event === "reconnect") refetch();
  });

  return unread;
}
