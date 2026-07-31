"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Bookmark, Settings, Shield, ChevronRight, X, Pencil } from "lucide-react";
import { useUser } from "@/lib/auth-context";

/**
 * Mobile account drawer (R-02 follow-up) — the "your stuff" destinations that
 * don't fit the 5-tab bottom bar. Opened by the `≡` button on the Profile
 * screen (Instagram/Threads pattern), so Profile stays a first-class bottom tab
 * while Stash + Settings (+ Admin, if any) live one tap under it. Desktop keeps
 * these in the Sidebar; this is mobile-only chrome (`lg:hidden`).
 */
type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  sub?: string;
};

export function MobileMenuDrawer({ open, onClose, onEditProfile }: { open: boolean; onClose: () => void; onEditProfile?: () => void }) {
  const { user } = useUser();
  const pathname = usePathname();

  // Close on route change (a link was tapped) and on Escape; lock body scroll while open.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const items: Item[] = [
    { href: "/saved", label: "Stash", icon: Bookmark, sub: "Saved posts & items" },
    { href: "/settings", label: "Settings", icon: Settings, sub: "Account & privacy" },
    ...(user?.is_admin ? [{ href: "/admin", label: "Admin console", icon: Shield } as Item] : []),
  ];

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 200ms" }}
      />
      {/* Panel — slides in from the right */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed top-0 right-0 z-50 h-full w-[82%] max-w-[320px] bg-[var(--paper)] shadow-2xl flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 250ms var(--ease-out, cubic-bezier(0.16,1,0.3,1))",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <span className="font-semibold text-[16px] text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Menu
          </span>
          <button onClick={onClose} aria-label="Close" className="flex items-center justify-center w-9 h-9 rounded-xl active:bg-[var(--bone)]">
            <X size={20} />
          </button>
        </div>

        {/* Destinations */}
        <nav className="flex flex-col py-2">
          {/* DV7-01 — v7 dropped the profile's "Edit profile" button (the avatar tap opens
              the sheet), so the drawer carries the labelled action too rather than leaving
              it to a discover-by-tapping affordance. A callback, not a Link: the sheet is
              owned by the profile screen we're already on. */}
          {onEditProfile && (
            <button
              onClick={() => { onClose(); onEditProfile(); }}
              className="flex items-center gap-4 px-5 py-3.5 text-left active:bg-[var(--bone)]"
            >
              <Pencil size={22} strokeWidth={1.9} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] text-[var(--ink)]">Edit profile</span>
                <span className="block text-[12px] text-[var(--ink-faint)] truncate">Name, bio, city &amp; photo</span>
              </span>
              <ChevronRight size={18} className="text-[var(--ink-ghost)]" />
            </button>
          )}
          {items.map(({ href, label, icon: Icon, sub }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-4 px-5 py-3.5 active:bg-[var(--bone)]"
              >
                <Icon size={22} strokeWidth={active ? 2.3 : 1.9} />
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15px] text-[var(--ink)] ${active ? "font-semibold" : ""}`}>{label}</span>
                  {sub && <span className="block text-[12px] text-[var(--ink-faint)] truncate">{sub}</span>}
                </span>
                <ChevronRight size={18} className="text-[var(--ink-ghost)]" />
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
