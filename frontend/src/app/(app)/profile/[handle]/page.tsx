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

  return <UserProfile handle={handle} isOwn={isOwn} />;
}
