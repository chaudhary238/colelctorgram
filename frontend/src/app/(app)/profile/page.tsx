"use client";

import { useUser } from "@/lib/auth-context";
import { UserProfile } from "@/components/UserProfile";

export default function OwnProfilePage() {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="flex justify-start px-5">
      <div className="w-full max-w-[680px] min-h-screen border-x border-[var(--border)]">
        <UserProfile handle={user.handle} isOwn={true} />
      </div>
    </div>
  );
}
