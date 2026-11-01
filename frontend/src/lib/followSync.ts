/**
 * Keeps every Follow button in step after a follow or unfollow.
 *
 * Follow state is held per component (each post card, the suggestions rail, a profile),
 * and the home feed restores from a sessionStorage snapshot, so a follow made in one
 * place left "+ Follow" showing everywhere else until a full reload (beta bug report,
 * 2026-11-01). Every follow action calls `announceFollow` once the server confirms.
 */
import { patchFeedSnapshotAuthor } from "@/lib/feedSnapshot";

const FOLLOW_EVENT = "scorred:follow";

export interface FollowChange {
  handle: string;
  following: boolean;
}

export function announceFollow(handle: string, following: boolean): void {
  if (typeof window === "undefined") return;
  // The feed isn't mounted when you follow from a profile, so patch what it will restore.
  patchFeedSnapshotAuthor(handle, following);
  window.dispatchEvent(new CustomEvent<FollowChange>(FOLLOW_EVENT, { detail: { handle, following } }));
}

/** Calls `listener` on every follow change; returns the unsubscribe. */
export function onFollowChange(listener: (change: FollowChange) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<FollowChange>).detail);
  window.addEventListener(FOLLOW_EVENT, handler);
  return () => window.removeEventListener(FOLLOW_EVENT, handler);
}
