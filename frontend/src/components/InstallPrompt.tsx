"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

const DISMISS_KEY = "scorred-a2hs-dismissed";

/**
 * iOS "Add to Home Screen" hint (P-04). iOS Safari has no install prompt event,
 * so we show a one-line dismissible banner telling users to use Share → Add to
 * Home Screen. Only on iOS, only when not already installed (standalone), and
 * only until dismissed. Android gets the browser's automatic prompt, so no banner.
 */
export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari legacy flag
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div
      className="lg:hidden flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--bone)]"
      style={{ padding: "9px 14px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" width={26} height={26} alt="" style={{ borderRadius: 6, flexShrink: 0 }} />
      <p className="flex-1 text-[12.5px] leading-snug text-[var(--ink-soft)] m-0">
        Install Scorred — tap <Share size={13} className="inline align-[-2px]" /> Share, then{" "}
        <span className="font-semibold text-[var(--ink)]">Add to Home Screen</span>.
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="flex items-center justify-center w-8 h-8 rounded-lg active:bg-[var(--paper)]">
        <X size={17} />
      </button>
    </div>
  );
}
