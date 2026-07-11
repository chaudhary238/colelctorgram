"use client";

import { use } from "react";
import { useUser } from "@/lib/auth-context";
import { UserProfile } from "@/components/UserProfile";

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
        <UserProfile handle={handle} isOwn={isOwn} />
      </div>
    </div>
  );
}
