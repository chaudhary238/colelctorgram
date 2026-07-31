// Which mobile chrome shows on which route (R-04/R-05).
//
// Pushed/detail screens render their OWN top header (back + title), so the global
// MobileAppBar steps aside there to avoid a stacked double-header. The BottomNav
// only steps aside where it would collide with a fixed bottom CTA bar or a focused
// input flow — a back-header + bottom tabs is fine (the Instagram post-detail model).

// The 5 primary tab HOME screens. The global AppBar (Create/Wordmark/Search/
// Messages/Bell) is that tab chrome — it shows here and NOWHERE else. Every
// pushed/overlay screen (details, create flows, search/inbox/notifications,
// settings/stash/rewards, other people's profiles) owns its own top header, so
// the AppBar would only double it up. BottomNav still handles tab-switching there.
// DV7-02 — Database replaced Events as the 5th tab; /events is now a pushed screen
// reached from the AppBar calendar icon, so it owns its own back header (and is NOT
// a tab root any more).
const TAB_ROOTS = ["/feed", "/market", "/db", "/community", "/profile"];

// BottomNav hides on detail pages with a fixed bottom CTA bar (would stack) +
// focused input flows where the tabs just get in the way. It STAYS on browsing
// details (post, other profiles, community detail) — back-header + bottom tabs is
// the Instagram post-detail model.
const BOTTOMNAV_HIDE_PREFIX = ["/item/", "/listing/", "/db/", "/compose", "/add", "/chat/", "/onboarding"];
const isEventDetail = (p: string) => /^\/events\/(?!new$)[^/]+/.test(p); // has the RSVP CTA bar

export function hideAppBar(pathname: string): boolean {
  return !TAB_ROOTS.includes(pathname);
}

export function hideBottomNav(pathname: string): boolean {
  return BOTTOMNAV_HIDE_PREFIX.some((p) => pathname.startsWith(p)) || isEventDetail(pathname);
}
