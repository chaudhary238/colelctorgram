"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth-context";

/**
 * Client-side gate for the /admin console. Non-admins are bounced to /feed.
 * This is a UX gate only — every /admin/* API route is independently enforced
 * server-side via get_current_admin (403).
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const allowed = !loading && Boolean(user?.is_admin);

  useEffect(() => {
    if (!loading && !user?.is_admin) router.replace("/feed");
  }, [loading, user, router]);

  // Render nothing while the session loads or the redirect is in flight so the
  // console shell never flashes for non-admins.
  if (!allowed) return null;

  return <>{children}</>;
}
