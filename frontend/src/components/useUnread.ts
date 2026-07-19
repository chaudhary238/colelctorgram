"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Live unread counts for messages + notifications, refetched on route change.
 * Shared by the desktop Sidebar and the mobile AppBar so both chrome surfaces
 * show the same badge numbers (R-03: AppBar reuses Sidebar's live counts).
 */
export function useUnread() {
  const pathname = usePathname();
  const [unread, setUnread] = useState<{ msgs: number; notifs: number }>({ msgs: 0, notifs: 0 });
  useEffect(() => {
    Promise.all([
      api.get<{ unread: number }[]>("/threads").catch(() => []),
      api.get<{ is_read: boolean }[]>("/notifications").catch(() => []),
    ]).then(([threads, notifs]) => {
      setUnread({
        msgs: threads.reduce((s, t) => s + (t.unread || 0), 0),
        notifs: notifs.filter((n) => !n.is_read).length,
      });
    });
  }, [pathname]);
  return unread;
}
