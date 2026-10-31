"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useUser } from "@/lib/auth-context";
import { GA_ID, initAnalytics, trackPageView } from "@/lib/analytics";

// Loads GA4 only for beta testers (see lib/analytics.ts). Everyone else — signed
// out, staff, seed and QA-copied accounts — never downloads gtag.js at all.
export function Analytics() {
  const { user } = useUser();
  const pathname = usePathname();
  const active = Boolean(GA_ID && user?.analytics);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active || !user) return;
    initAnalytics(user.id);
    setReady(true); // eslint-disable-line react-hooks/set-state-in-effect -- one-shot flip after the external gtag bootstrap
  }, [active, user]);

  useEffect(() => {
    if (ready) trackPageView(pathname);
  }, [ready, pathname]);

  if (!active) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
