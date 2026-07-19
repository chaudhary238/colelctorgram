"use client";

import { use } from "react";
import { useUser } from "@/lib/auth-context";
import { UserProfile } from "@/components/UserProfile";
import { BackButton } from "@/components/BackButton";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default function HandleProfilePage({ params }: PageProps) {
  const { handle } = use(params);
  const { user } = useUser();
  const isOwn = user?.handle.toLowerCase() === handle.toLowerCase();

  return (
    <div className="flex justify-start px-5">
      <div className="w-full max-w-[680px] min-h-screen border-x border-[var(--border)]">
        {/* Pushed profile view — no global AppBar on mobile (hideAppBar), so this
            surface owns its back affordance (R-06). Desktop uses the Sidebar. */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 bg-[var(--paper)] border-b border-[var(--border)]" style={{ padding: "10px 12px" }}>
          <BackButton fallback="/feed" />
          <span className="font-mono text-[13px] text-[var(--ink-faint)] truncate">@{handle}</span>
        </div>
        <UserProfile handle={handle} isOwn={isOwn} />
      </div>
    </div>
  );
}
