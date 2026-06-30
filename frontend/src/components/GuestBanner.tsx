"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isGuest } from "@/lib/api";

// Shown app-wide while "Explore as guest" is active (DF-37a). Resolved after
// mount (cookie is client-only) so SSR/CSR markup matches.
export function GuestBanner() {
  const [guest, setGuest] = useState(false);
  useEffect(() => setGuest(isGuest()), []);
  if (!guest) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{ background: "var(--stamp-red-soft)", color: "var(--stamp-red-deep)", borderBottom: "1px solid var(--border)" }}
    >
      <span className="flex-1 font-medium">You&apos;re browsing as a guest. Sign up to post, save, and message.</span>
      <Link href="/auth/signup" className="font-semibold px-3 py-1 rounded-full" style={{ background: "var(--stamp-red)", color: "#fff" }}>
        Sign up
      </Link>
      <Link href="/auth/signin" className="font-semibold hover:underline">Log in</Link>
    </div>
  );
}
