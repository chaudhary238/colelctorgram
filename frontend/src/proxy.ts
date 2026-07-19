import { NextRequest, NextResponse } from "next/server";

// Always-public prefixes: auth pages, Next internals, and static assets served
// from /public (brand logos, svgs). Static assets MUST bypass the auth redirect,
// otherwise an unauthenticated splash/auth page can't load the logo (307 → /auth).
// PWA assets are public too: the browser fetches the manifest/SW/icons (sometimes
// cookieless, and the offline page loads when unreachable) — a 307 here breaks install.
const PUBLIC_PREFIXES = [
  "/auth", "/_next", "/favicon.ico", "/brand",
  "/manifest.webmanifest", "/sw.js", "/offline.html", "/icon-", "/apple-touch-icon",
];

// Auth pages that make no sense with a live session — bounce to /feed. NOT the
// whole /auth tree: /auth/verify is reached WITH a session (signup issues tokens
// before the OTP step), and /auth/reset comes from an email link that must work
// regardless of login state.
const GUEST_ONLY = ["/auth", "/auth/signin", "/auth/signup"];

// Signature verification needs the backend secret and belongs to the API; here we
// only decode the JWT payload to drop sessions that are expired or malformed, so
// stale cookies get a clean redirect to /auth instead of a flash of the app shell.
function sessionLooksAlive(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = sessionLooksAlive(req.cookies.get("ch_refresh_token")?.value);

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (hasSession && GUEST_ONLY.includes(pathname)) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return NextResponse.next();
  }

  if (hasSession) return NextResponse.next();

  // Dead or missing session → clear the stale cookie on the way to /auth so the
  // next request doesn't re-run the decode.
  const res = NextResponse.redirect(new URL("/auth", req.url));
  if (req.cookies.get("ch_refresh_token")) res.cookies.delete("ch_refresh_token");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
