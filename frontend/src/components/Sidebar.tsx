"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, ShoppingBag, Users, Calendar,
  Bell, PlusCircle, Settings, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SealMark } from "@/components/ui";

const NAV = [
  { href: "/feed",      label: "Home",       icon: Home,       badge: 0 },
  { href: "/search",    label: "Search",     icon: Search,     badge: 0 },
  { href: "/market",    label: "Market",     icon: ShoppingBag, badge: 0 },
  { href: "/community", label: "Community",  icon: Users,      badge: 0 },
  { href: "/events",    label: "Events",     icon: Calendar,   badge: 0 },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
  { href: "/compose",   label: "Create",     icon: PlusCircle, badge: 0 },
  { href: "/profile",   label: "Profile",    icon: User,       badge: 0 },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-xl px-3 py-[11px] transition-colors duration-100 group",
        "text-[var(--ink)] hover:bg-[var(--bone)]",
        active && "font-semibold"
      )}
    >
      <span className="relative shrink-0">
        <Icon size={25} strokeWidth={active ? 2.4 : 1.8} />
        {badge ? (
          <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--stamp-red)] text-white text-[10px] font-bold font-mono flex items-center justify-center border-[1.5px] border-[var(--paper)]">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="ch-nav-label text-base leading-none whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="ch-sidebar shrink-0 h-screen flex flex-col border-r border-[var(--border)] bg-[var(--paper)] py-6 px-3.5"
      style={{ width: 245 }}
    >
      {/* Wordmark */}
      <Link
        href="/feed"
        className="flex items-center gap-2.5 px-3 pt-1.5 pb-1 mb-[22px]"
      >
        <SealMark size={30} />
        <span
          className="ch-nav-label text-[23px] font-extrabold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.035em" }}
        >
          CollectorHub
        </span>
      </Link>

      <div className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon, badge }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            badge={badge || undefined}
            active={pathname === href || (href !== "/" && pathname.startsWith(href))}
          />
        ))}
      </div>

      <NavItem href="/settings" label="Settings" icon={Settings} />
    </nav>
  );
}
