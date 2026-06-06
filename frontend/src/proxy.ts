import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/auth", "/_next", "/favicon.ico"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ch_refresh_token has 30-day TTL — presence indicates a live session
  const hasSession = Boolean(req.cookies.get("ch_refresh_token")?.value);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
