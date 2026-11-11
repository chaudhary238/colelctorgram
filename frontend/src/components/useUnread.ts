"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSecondaryReady } from "@/lib/loadOrder";
import { useRealtime } from "@/lib/realtime";

type Unread = { msgs: number; notifs: number };

// One shared count for every badge. The desktop Sidebar and the mobile AppBar are both
// mounted at every width (CSS hides one), so per-hook fetching doubled /threads and
// /notifications on every page (founder 2026-11-11). Now concurrent callers share one
// in-flight request, and route-change refetches within 1.5s collapse into one.
let shared: Unread = { msgs: 0, notifs: 0 };
const listeners = new Set<(u: Unread) => void>();
let inflight: Promise<void> | null = null;
let lastAt = 0;

function refetch(force = false) {
  if (inflight) return inflight;
  if (!force && Date.now() - lastAt < 1500) return Promise.resolve();
  inflight = Promise.all([
    api.get<{ unread: number }[]>("/threads").catch(() => []),
    api.get<{ is_read: boolean }[]>("/notifications").catch(() => []),
  ]).then(([threads, notifs]) => {
    shared = {
      msgs: threads.reduce((s, t) => s + (t.unread || 0), 0),
      notifs: notifs.filter((n) => !n.is_read).length,
    };
    lastAt = Date.now();
    listeners.forEach((fn) => fn(shared));
  }).finally(() => { inflight = null; });
  return inflight;
}

/**
 * Live unread counts for messages + notifications — refetched on route change
 * AND pushed via the realtime socket (message.new / notification.push), so the
 * badges move without navigation. Shared by the desktop Sidebar and the mobile
 * AppBar so both chrome surfaces show the same numbers (R-03). Badges are
 * secondary: on the feed they wait for the first page of posts.
 */
export function useUnread() {
  const pathname = usePathname();
  const ready = useSecondaryReady();
  const [unread, setUnread] = useState<Unread>(shared);

  useEffect(() => {
    listeners.add(setUnread);
    return () => { listeners.delete(setUnread); };
  }, []);
  useEffect(() => { if (ready) refetch(); }, [pathname, ready]);
  useRealtime((e) => {
    if (e.event === "message.new" || e.event === "notification.push" || e.event === "reconnect") refetch(true);
  });

  return unread;
}
