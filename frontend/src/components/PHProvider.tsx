"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function PHProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialised = useRef(false);

  useEffect(() => {
    if (!PH_KEY || initialised.current) return;
    posthog.init(PH_KEY, {
      api_host: PH_HOST,
      capture_pageview: false, // we capture manually below
      persistence: "localStorage",
    });
    initialised.current = true;
  }, []);

  // Page-view on every route change
  useEffect(() => {
    if (!PH_KEY || !initialised.current) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return <>{children}</>;
}
