import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/auth", "/_next", "/favicon.ico"];

// Surfaces a guest ("Explore as guest", DF-37a) may browse read-only. Everything
// else (compose, settings, inbox, chat, notifications, saved, admin, onboarding,
// own profile) needs a real account → guests are sent to sign up.
const GUEST_PREFIXES = [
  "/feed", "/market", "/search", "/community", "/events", "/listing", "/item", "/post", "/profile",
];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ch_refresh_token has 30-day TTL — presence indicates a live session
  const hasSession = Boolean(req.cookies.get("ch_refresh_token")?.value);
  if (hasSession) return NextResponse.next();

  // Guests may browse the public surfaces; other routes prompt sign-up.
  const isGuest = Boolean(req.cookies.get("ch_guest")?.value);
  if (isGuest && GUEST_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (isGuest) {
    return NextResponse.redirect(new URL("/auth/signup", req.url));
  }

  return NextResponse.redirect(new URL("/auth", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
