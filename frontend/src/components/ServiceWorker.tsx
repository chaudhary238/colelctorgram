"use client";

import { useEffect } from "react";

/**
 * Registers the lean PWA service worker (P-03). Only in production + when the
 * browser supports it. The SW gives an installable app-shell + a branded offline
 * page; it does NOT do web-push (that's the Expo app's job).
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.error("SW registration failed:", err);
      });
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
