"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

// Load order (founder 2026-11-11: "everything is loading at once"). On the feed, the first
// page of posts is the page's job; secondary pieces — right rail, unread badges, the
// listing/event cards mixed into the feed — wait until it has rendered, so they don't
// compete with it for a phone's connection. Other routes have no primary and never wait.

const PRIMARY_ROUTES = ["/feed"];
const FALLBACK_MS = 2500; // a slow or failed feed must not hold the rest back forever

let primaryReady = false;
const waiters = new Set<() => void>();

/** The feed calls this once its first page (fresh or restored) is on screen. */
export function markPrimaryReady() {
  if (primaryReady) return;
  primaryReady = true;
  waiters.forEach((go) => go());
  waiters.clear();
}

/** True once secondary content may load on this route. */
export function useSecondaryReady(): boolean {
  const pathname = usePathname();
  const waits = PRIMARY_ROUTES.some((p) => pathname.startsWith(p));
  const [ready, setReady] = useState(() => !waits || primaryReady);
  useEffect(() => {
    if (ready) return;
    const go = () => { clearTimeout(timer); waiters.delete(go); setReady(true); };
    const timer = setTimeout(go, FALLBACK_MS);
    waiters.add(go);
    return () => { clearTimeout(timer); waiters.delete(go); };
  }, [ready]);
  return ready;
}

/** matchMedia as state. Server render (and the hydration pass) reports false, so
 *  width-gated components mount only in the browser, and only when they're shown. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
