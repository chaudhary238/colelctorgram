"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Bookmark, Settings, Shield, ChevronRight, X, Pencil,
  Lock, Gift, Zap, Award, Info, LogOut,
} from "lucide-react";
import { clearTokens } from "@/lib/api";
import { useUser } from "@/lib/auth-context";
import { Avatar } from "@/components/ui";

/**
 * Account drawer — the `≡` on My Space (design_v7 ProfileView.jsx, batch 2026-08-09).
 *
 * It started life as mobile-only chrome (the "your stuff" destinations that don't fit the
 * 5-tab bottom bar). v7's latest batch promotes it to the profile's whole account menu and
 * in the same pass DELETES the Refer / Settings squares that used to sit beside the rank
 * card (`Rewards.jsx` — `{isMe && null}`). So it is no longer `lg:hidden`: on desktop the
 * Sidebar carries Settings and Stash, but Refer / Earn points / Badges / Log out have no
 * other home on the profile once those squares are gone, and keeping the drawer phone-only
 * would leave desktop a different flow — the exact thing founder QA rejected on 2026-08-01.
 *
 * Rows follow v7's order. Two are web-only additions: Stash (the web has a saved-items
 * surface the prototype doesn't) and Admin console (staff). v7's "Privacy & visibility" and
 * "Help & support" both dead-end at the settings screen in the prototype; here they deep-link
 * to the sections that already exist, so they aren't duplicates of "Settings & privacy".
 */
type Row = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  sub?: string;
};

export function AccountDrawer({
  open,
  onClose,
  onEditProfile,
}: {
  open: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
}) {
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

  const rows: Row[] = [
    { href: "/saved", label: "Stash", icon: Bookmark, sub: "Saved posts & items" },
    { href: "/settings", label: "Settings & privacy", icon: Settings, sub: "Account, notifications & more" },
    { href: "/settings#privacy", label: "Privacy & visibility", icon: Lock, sub: "Who can see and message you" },
    { href: "/refer", label: "Refer a friend", icon: Gift },
    { href: "/rewards", label: "Earn points", icon: Zap },
    ...(user?.handle ? [{ href: `/profile/${user.handle}/badges`, label: "Badges & trophies", icon: Award } as Row] : []),
    { href: "/settings#support", label: "Help & support", icon: Info },
    ...(user?.is_admin ? [{ href: "/admin", label: "Admin console", icon: Shield } as Row] : []),
  ];

  return (
    <div aria-hidden={!open}>
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
        aria-label="Account menu"
        className="fixed top-0 right-0 z-50 h-full w-[82%] max-w-[320px] bg-[var(--paper)] shadow-2xl flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 250ms var(--ease-out, cubic-bezier(0.16,1,0.3,1))",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Identity header (v7) — the drawer names whose account it is, replacing the
            generic "Menu" title. */}
        <div className="flex items-center gap-3 px-[18px] pt-4 pb-4 border-b border-[var(--border)]">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.name} className="rounded-full object-cover shrink-0" style={{ width: 42, height: 42 }} />
          ) : (
            <Avatar name={user?.name ?? "?"} size={42} />
          )}
          <span className="flex-1 min-w-0">
            <span className="block truncate font-semibold text-[15px] text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
              {user?.name ?? " "}
            </span>
            <span className="block text-[12px] text-[var(--ink-faint)] truncate">@{user?.handle ?? ""}</span>
          </span>
          <button onClick={onClose} aria-label="Close" className="flex items-center justify-center w-8 h-8 rounded-[9px] shrink-0 bg-[var(--paper-soft)] text-[var(--ink-mute)] active:bg-[var(--bone)]">
            <X size={16} />
          </button>
        </div>

        {/* Destinations — scroll here only, so Log out can never be pushed off the
            bottom edge on a short viewport (the pinned-footer rule from QA 2026-08-01). */}
        <nav className="flex flex-col py-1.5 flex-1 min-h-0 overflow-y-auto">
          {/* v7 dropped the profile's "Edit profile" button (the avatar tap opens the
              sheet), so the drawer carries the labelled action too rather than leaving it
              to a discover-by-tapping affordance. A callback, not a Link: the sheet is
              owned by the profile screen we're already on. */}
          {onEditProfile && (
            <button
              onClick={() => { onClose(); onEditProfile(); }}
              className="flex items-center gap-[13px] px-[18px] py-[13px] text-left active:bg-[var(--bone)]"
            >
              <RowIcon icon={Pencil} />
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] font-medium text-[var(--ink)]">Edit profile</span>
                <span className="block text-[12px] text-[var(--ink-faint)] truncate">Name, bio, city &amp; photo</span>
              </span>
              <ChevronRight size={15} className="text-[var(--ink-ghost)] shrink-0" />
            </button>
          )}
          {rows.map(({ href, label, icon, sub }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-[13px] px-[18px] py-[13px] active:bg-[var(--bone)]"
            >
              <RowIcon icon={icon} />
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] font-medium text-[var(--ink)]">{label}</span>
                {sub && <span className="block text-[12px] text-[var(--ink-faint)] truncate">{sub}</span>}
              </span>
              <ChevronRight size={15} className="text-[var(--ink-ghost)] shrink-0" />
            </Link>
          ))}
        </nav>

        {/* Pinned footer — v7 puts Log out here, and until now the web had it only in
            Settings. Same handler the settings row uses. */}
        <div className="shrink-0 border-t border-[var(--border)] py-2.5">
          <button
            onClick={() => { clearTokens(); window.location.assign("/auth/signin"); }}
            className="flex items-center gap-[13px] px-[18px] py-[13px] w-full text-left"
          >
            <span
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] shrink-0"
              style={{ background: "var(--stamp-red-soft)", color: "var(--stamp-red)" }}
            >
              <LogOut size={17} strokeWidth={1.9} />
            </span>
            <span className="text-[14.5px] font-semibold text-[var(--stamp-red)]">Log out</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

/* v7 frames every drawer row's glyph in a 34px soft square — it's what keeps the labels
   on a single optical line when the icons have different widths. */
function RowIcon({ icon: Icon }: { icon: Row["icon"] }) {
  return (
    <span className="flex items-center justify-center w-[34px] h-[34px] rounded-[10px] shrink-0 bg-[var(--paper-soft)] border border-[var(--border)] text-[var(--ink)]">
      <Icon size={17} strokeWidth={1.9} />
    </span>
  );
}
