"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

/* Shared client for the API's WebSocket (`/ws`). One socket serves every
   subscriber (chat thread, inbox, unread badges); it connects on the first
   subscribe, reconnects with backoff, and closes when the last unmounts.

   Server events: message.new, notification.push. On top of those this module
   emits a synthetic `reconnect` after any re-established connection —
   subscribers treat it as "refetch what you missed while offline". */

// /ws lives at the API ROOT — NEXT_PUBLIC_API_URL carries the /v1 REST prefix,
// so strip it (and http→ws) or we dial /v1/ws, which never connects.
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL = API.replace(/\/v1\/?$/, "").replace(/^http/, "ws") + "/ws";

export type RealtimeEvent = { event: string; data: Record<string, unknown> };
type Listener = (e: RealtimeEvent) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let attempts = 0;
let everConnected = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let watchingVisibility = false;

function emit(e: RealtimeEvent) {
  listeners.forEach((l) => l(e));
}

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function connect() {
  if (socket || listeners.size === 0) return;
  const token = localStorage.getItem("ch_access_token");
  if (!token) return; // guest — nothing to stream

  const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
  socket = ws;

  ws.onopen = () => {
    attempts = 0;
    // Not on the first connect — mount-time fetches already have fresh data.
    if (everConnected) emit({ event: "reconnect", data: {} });
    everConnected = true;
  };
  ws.onmessage = (m) => {
    try {
      emit(JSON.parse(m.data));
    } catch {
      /* malformed frame — drop */
    }
  };
  ws.onerror = () => ws.close();
  ws.onclose = (ev) => {
    if (socket !== ws) return; // superseded by a newer socket
    socket = null;
    if (listeners.size === 0) return;
    // 1008 = server rejected the token. Any authed GET runs the refresh flow
    // in api.ts, so the retry below picks a fresh token out of localStorage.
    if (ev.code === 1008) api.get("/notifications?limit=1").catch(() => {});
    clearRetry();
    retryTimer = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempts++));
  };
}

function onVisible() {
  // Waking a backgrounded tab: skip the remaining backoff and dial now.
  if (document.visibilityState === "visible" && !socket) {
    clearRetry();
    attempts = 0;
    connect();
  }
}

function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  if (!watchingVisibility && typeof document !== "undefined") {
    watchingVisibility = true;
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
  }
  connect();
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      clearRetry();
      socket?.close();
      socket = null;
    }
  };
}

/** Subscribe to realtime events for this component's lifetime. The latest
    `fn` is always the one invoked — no useCallback needed at call sites. */
export function useRealtime(fn: Listener) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => subscribe((e) => ref.current(e)), []);
}
