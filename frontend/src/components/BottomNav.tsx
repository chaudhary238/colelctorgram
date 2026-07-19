"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Users, Calendar, User } from "lucide-react";
import { hideBottomNav } from "@/lib/mobileChrome";

/**
 * Mobile bottom tab bar (design_v6 Chrome.jsx BottomNav — R-02).
 * The 5 BRD-IA tabs EXACTLY: Home · Market · Community · Events · Profile.
 * Search, Create, Messages, Notifications live in the MobileAppBar. Stash +
 * Settings live behind the `≡` menu on the Profile screen (MobileMenuDrawer) —
 * Profile stays a first-class thumb-reachable tab (Instagram/Threads pattern).
 * Active Home renders the white seal in a red pill (v6). Shown only below `lg`;
 * desktop keeps the Sidebar. Safe-area-inset-bottom pad for the home indicator (R-04).
 */
type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
};
const TABS: Tab[] = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/market", label: "Market", icon: ShoppingBag },
  { href: "/community", label: "Community", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  if (hideBottomNav(pathname)) return null;
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-[var(--paper)]"
      style={{
        boxShadow: "0 -1px 0 var(--border), 0 -8px 32px rgba(0,0,0,0.07)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch px-1 pt-2 pb-0.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isHome = href === "/feed";
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center gap-[3px] px-0.5 pt-1 pb-0.5"
            >
              <span
                className="flex items-center justify-center h-8 rounded-2xl transition-all duration-200"
                style={{
                  width: active ? 56 : 44,
                  background: active ? "var(--stamp-red)" : "transparent",
                  boxShadow: active ? "0 2px 12px rgba(255,36,66,0.3)" : "none",
                }}
              >
                {active && isHome ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/brand/icon-crop-white.png" width={21} height={21} alt="" style={{ objectFit: "contain", display: "block" }} />
                ) : (
                  <Icon size={20} strokeWidth={active ? 2.3 : 1.7} color={active ? "#fff" : "var(--slate-400)"} />
                )}
              </span>
              <span
                className="text-[10px] leading-none"
                style={{
                  fontWeight: active ? 700 : 400,
                  color: active ? "var(--stamp-red)" : "var(--slate-400)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
