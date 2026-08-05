/**
 * Home-feed restore snapshot (issue #6).
 *
 * When you open a post and come back, the feed should resume where you left off —
 * same posts, same tab, same scroll — instead of refetching page 1 and jumping to the
 * top. The feed writes a snapshot to sessionStorage on leave and rehydrates from it on
 * the next mount, within a 5-minute TTL.
 *
 * Lives here rather than inside the feed page for two reasons:
 *  1. **Anything that publishes must be able to invalidate it.** A snapshot is only
 *     correct for "I came BACK to the feed" — it knows nothing about *why* you left. If
 *     you left to write a post, restoring the pre-post list means your own new post is
 *     invisible until the TTL lapses (founder QA 2026-08-05: "I posted just now but it's
 *     not reflecting anywhere"). Publishers call `invalidateFeedSnapshot()`.
 *  2. It keeps the sessionStorage read out of the feed component's render path — see
 *     the hydration note in the page.
 */

export const FEED_SNAPSHOT_KEY = "feed:snapshot";
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;
export const MAX_SNAPSHOT_POSTS = 100;

export interface FeedSnapshot<TPost = unknown, TTab extends string = string> {
  tab: TTab;
  posts: TPost[];
  page: number;
  hasMore: boolean;
  scrollTop: number;
  ts: number;
}

/** The stored snapshot, or null when there is none / it's stale / it's unreadable. */
export function readFeedSnapshot<TPost = unknown, TTab extends string = string>():
  FeedSnapshot<TPost, TTab> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FEED_SNAPSHOT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as FeedSnapshot<TPost, TTab>;
    if (!s.posts?.length || Date.now() - s.ts > SNAPSHOT_TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeFeedSnapshot<TPost, TTab extends string>(s: FeedSnapshot<TPost, TTab>): void {
  try {
    sessionStorage.setItem(FEED_SNAPSHOT_KEY, JSON.stringify(s));
  } catch {
    /* quota / serialization — just skip the restore next time */
  }
}

/**
 * Drop the snapshot so the next visit to /feed fetches fresh.
 *
 * Call this after ANYTHING that should change what the top of the feed looks like —
 * publishing a post is the obvious one. Cheap and safe to call when no snapshot exists.
 */
export function invalidateFeedSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FEED_SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Update ONE post inside the stored snapshot, in place.
 *
 * QA 2026-08-05 §3 — the snapshot freezes engagement counts at the moment you left the
 * feed. Like a post on its own page and come back and the restored card still showed the
 * old count (typically 0), while the post's page showed the truth. Invalidating the
 * whole snapshot would fix the number but throw away the scroll position and list that
 * make the restore worth having, so patch the one row instead.
 */
export function patchFeedSnapshotPost(
  postId: string,
  patch: Record<string, unknown>,
): void {
  const s = readFeedSnapshot<Record<string, unknown>>();
  if (!s) return;
  const i = s.posts.findIndex((p) => p?.id === postId);
  if (i === -1) return;
  s.posts[i] = { ...s.posts[i], ...patch };
  writeFeedSnapshot(s);
}
