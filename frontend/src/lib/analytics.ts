// Beta feature analytics (GA4). Off unless NEXT_PUBLIC_GA_ID is set AND the
// signed-in account is tracked (/users/me `analytics`, decided server-side; seed
// personas never are). Every user carries an `account_type` user property —
// "tester" (the beta cohort) or "team" (founders/QA) — so reports filter to testers.
// Feature-only: page views carry a readable screen name + bottom-nav tab, plus a
// handful of feature events. Identity is our internal user id — never the email.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type Tab = "Home" | "Market" | "Database" | "Community" | "My Space" | "Other";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let enabled = false;

/** Queue-based gtag bootstrap (what Google's snippet does inline): calls made
 *  before gtag.js finishes loading sit in dataLayer and replay once it's up. */
export function initAnalytics(userId: string, accountType: string) {
  if (enabled || !GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js reads the Arguments object itself, not a copied array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("set", "user_properties", { account_type: accountType });
  // Page views are sent manually (trackPageView) so each carries a screen name.
  window.gtag("config", GA_ID, { send_page_view: false, user_id: userId });
  enabled = true;
}

export function track(event: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  if (!enabled) return;
  window.gtag?.("event", event, params);
}

// Route → readable screen + the bottom-nav tab it belongs to. Ids/handles are
// collapsed so "Listing detail" is one row in GA4, not one per listing.
const SCREENS: [RegExp, string, Tab][] = [
  [/^\/feed$/, "Home feed", "Home"],
  [/^\/post\/[^/]+$/, "Post detail", "Home"],
  [/^\/market$/, "Market", "Market"],
  [/^\/listing\/[^/]+$/, "Listing detail", "Market"],
  [/^\/item\/[^/]+\/sell$/, "Sell item", "Market"],
  [/^\/db$/, "Database", "Database"],
  [/^\/db\/[^/]+\/people$/, "Database item owners", "Database"],
  [/^\/db\/[^/]+$/, "Database item", "Database"],
  [/^\/community$/, "Communities", "Community"],
  [/^\/community\/new$/, "Create community", "Community"],
  [/^\/community\/[^/]+\/manage$/, "Manage community", "Community"],
  [/^\/community\/[^/]+$/, "Community detail", "Community"],
  [/^\/profile$/, "My Space", "My Space"],
  [/^\/item\/[^/]+$/, "Collection item", "My Space"],
  [/^\/collection\/finish$/, "Finish collection item", "My Space"],
  [/^\/saved$/, "Saved", "My Space"],
  [/^\/profile\/[^/]+\/badges$/, "Profile badges", "Other"],
  [/^\/profile\/[^/]+$/, "User profile", "Other"],
  [/^\/add\/catalogue$/, "Add item", "Other"],
  [/^\/add\/collection$/, "Add from database", "Other"],
  [/^\/add\/database$/, "Add database entry", "Other"],
  [/^\/compose$/, "Compose post", "Other"],
  [/^\/search$/, "Search", "Other"],
  [/^\/events$/, "Events", "Other"],
  [/^\/events\/new$/, "Create event", "Other"],
  [/^\/events\/[^/]+\/manage$/, "Manage event", "Other"],
  [/^\/events\/[^/]+$/, "Event detail", "Other"],
  [/^\/inbox$/, "Inbox", "Other"],
  [/^\/chat\/[^/]+$/, "Chat", "Other"],
  [/^\/notifications$/, "Notifications", "Other"],
  [/^\/rewards$/, "Rewards", "Other"],
  [/^\/leaderboard$/, "Leaderboard", "Other"],
  [/^\/refer$/, "Refer", "Other"],
  [/^\/settings(\/.*)?$/, "Settings", "Other"],
  [/^\/onboarding$/, "Onboarding", "Other"],
];

export function screenFor(pathname: string): { screen_name: string; tab: Tab } {
  const hit = SCREENS.find(([re]) => re.test(pathname));
  return hit ? { screen_name: hit[1], tab: hit[2] } : { screen_name: pathname, tab: "Other" };
}

export function trackPageView(pathname: string) {
  track("page_view", {
    ...screenFor(pathname),
    // Path only — query strings (?q=, ?ref=) stay out of page reports.
    page_location: window.location.origin + pathname,
  });
}
