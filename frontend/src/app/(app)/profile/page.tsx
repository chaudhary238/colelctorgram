"use client";

import { useUser } from "@/lib/auth-context";
import { UserProfile } from "@/components/UserProfile";

export default function OwnProfilePage() {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return null;

  return <UserProfile handle={user.handle} isOwn={true} />;
}
